var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions');
mongoose.promise = Promise;
module.exports = router;
var authChk = function(req, res, next) {
    if (!req.session.user) {
        res.send(false)
    } else {
        next();
    }
}
router.post('/bulkNew', authChk, function(req, res, next) {
    //bulk song add route (for multiple songs)
    console.log(req.body);
    // first, we need to convert the tag properties to an array.
    for(var q=0;q<req.body.length;q++){
        req.body[q].tags=[];
        for (var p=1;p<6;p++){
            req.body[q].tags.push(req.body[q]['tag'+p]);
            delete req.body[q]['tag'+p];
        }
        console.log('Tags for',req.body[q].title,'are',req.body[q].tags)
    }
    mongoose.model('Data').find({}, function(err, data) {
        //find all current 'reusable' song info, and sort it
        var info = {
            artists: [],
            albums: [],
            tags: [],
            genres: []
        }
        //record all of the infobits already recorded in the above arrays
        data.forEach(d => {
            info[d.type].push(d.entry);
        })
        //now we need to find out which infobits are already recorded
        var toRec = [];
        //artist
        for (var s = 0; s < req.body.length; s++) {
            if (req.body[s].artist && info.artists.indexOf(req.body[s].artist) < 0) {
                toRec.push({ type: 'artists', entry: req.body[s].artist })
            }
            //albums
            if (req.body[s].album && info.albums.indexOf(req.body[s].album) < 0) {
                toRec.push({ type: 'albums', entry: req.body[s].album })
            }
            //genres
            if (req.body[s].genre && info.genres.indexOf(req.body[s].genre) < 0) {
                toRec.push({ type: 'genres', entry: req.body[s].genre })
            }
            //tags
            req.body[s].tags.forEach(tg => {
                if (tg && info.tags.indexOf(tg) < 0) {
                    toRec.push({ type: 'tags', entry: tg })
                }
            });
        }
        //now let's excise duplicates
        toRec.forEach((ta,c)=>{
            for(var i=0;i<toRec.length;i++){
                if(c!=i && ta.type==toRec[i].type && ta.entry==toRec[i].entry){
                    toRec.splice(i,1);
                }
            }
        })
        for(i=0;i<toRec.length-1;i++){
            if(toRec[i].type==toRec[toRec.length-1].type && toRec[i].entry==toRec[toRec.length-1].entry){
                toRec.splice(i,1);
            }
        }
        console.log('NEED TO ADD', toRec,'FROM',req.body.length,'SONGS')
        var proms = [];
        console.log(req.body[1])
        toRec.forEach(rc => {
            proms.push(mongoose.model('Data').create(rc));
        })
        req.body.forEach(sg=>{
            proms.push(mongoose.model('Song').create(sg))
        })
        Promise.all(proms).then(pr => {
            console.log('recorded songs and data')
            res.send('done!')
        })
        // mongoose.model('Song').create(req.body, function(err, data) {
        //     console.log('recorded song')
        //     if (err) {
        //         res.send(false)
        //     } else {
        //         res.send(true);
        //     }
        // });
    })
    // res.send('bulkNew worked');
})
router.post('/new', authChk, function(req, res, next) {
    //create a new song!
    var id = Math.floor(Math.random() * 99999999999).toString(32);
    req.body.id = id;
    console.log('SONG', req.body)
    // res.send('no');
    // return false;
    mongoose.model('Data').find({}, function(err, data) {
        //find all current 'reusable' song info, and sort it
        var info = {
            artists: [],
            albums: [],
            tags: [],
            genres: []
        }
        data.forEach(d => {
            info[d.type].push(d.entry);
        })
        //now we need to find out which infobits are already recorded
        var toRec = [];
        //artist
        if (info.artists.indexOf(req.body.artist) < 0) {
            toRec.push({ type: 'artists', entry: req.body.artist })
        }
        //albums
        if (info.albums.indexOf(req.body.album) < 0) {
            toRec.push({ type: 'albums', entry: req.body.album })
        }
        //genres
        if (info.genres.indexOf(req.body.genre) < 0) {
            toRec.push({ type: 'genres', entry: req.body.genre })
        }
        //tags
        req.body.tags.forEach(tg => {
            if (info.tags.indexOf(tg) < 0) {
                toRec.push({ type: 'tags', entry: tg })
            }
        });
        console.log('NEED TO ADD', toRec)
        var proms = [];
        toRec.forEach(rc => {
            proms.push(mongoose.model('Data').create(rc));
        })
        Promise.all(proms).then(pr => {
            console.log('Recorded all dem promisez', pr)
        })
        mongoose.model('Song').create(req.body, function(err, data) {
            console.log('recorded song')
            if (err) {
                res.send(false)
            } else {
                res.send(true);
            }
        });
    })
})
router.get('/all', function(req, res, next) {
    mongoose.model('Song').find({}, function(err, data) {
        if (err) {
            res.send('err')
        } else {
            res.send(data);
        }
    });
})
router.get('/rem/:id', authChk, function(req, res, next) {
    mongoose.model('Song').remove({ id: req.params.id }, function(err, data) {
        res.send('done')
    });
});
router.post('/addInfo', authChk, function(req, res, next) {
    //route to add infobits, without any particular song.
    //expects data in format {artists:[], albums:[],etc..}
    console.log(req.body)
    //first, make sure we at least have an empty array for each item;
    // req.body.artists = req.body.artists.length || [];
    // req.body.genres = req.body.genres.length || [];
    // req.body.albums = req.body.albums.length || [];
    // req.body.tags = req.body.tags.length || [];
    mongoose.model('Data').find({}, function(err, data) {
        //find all current 'reusable' song info, and sort it
        var info = {
            artists: [],
            albums: [],
            tags: [],
            genres: []
        }
        data.forEach(d => {
            info[d.type].push(d.entry);
        })
        console.log(info, req.body);
        //now we need to find out which infobits are already recorded
        var toRec = [];
        //artist
        req.body.artists.forEach(at => {
            console.log(at)
            if (info.artists.indexOf(at) < 0) {
                toRec.push({ type: 'artists', entry: at })
            }
        });
        //albums
        req.body.albums.forEach(ab => {
            if (info.albums.indexOf(ab) < 0) {
                toRec.push({ type: 'albums', entry: ab })
            }
        });
        //genres
        req.body.genres.forEach(ge => {
            if (info.genres.indexOf(ge) < 0) {
                toRec.push({ type: 'genres', entry: ge })
            }
        });
        //tags
        req.body.tags.forEach(tg => {
            if (info.tags.indexOf(tg) < 0) {
                toRec.push({ type: 'tags', entry: tg })
            }
        });
        console.log('NEED TO ADD', toRec)
        var proms = [];
        toRec.forEach(rc => {
            proms.push(mongoose.model('Data').create(rc));
        })
        Promise.all(proms).then(pr => {
            console.log('Recorded all dem promisez', pr)
            res.send('done');
        })
    })
})
router.get('/genres/:s', function(req, res, next) {
    // var arr = ['rock', 'reggae', 'classical', 'screaming cats', 'movietv', 'game', 'industrial', 'dance'].filter(f => {
    //     return f.toLowerCase().indexOf(req.params.s.toLowerCase()) > -1;
    // });
    mongoose.model('Data').find({ 'type': 'genres' }).then(r => {
        res.send(r.map(rt => {
            return rt.entry;
        }).filter(rs => {
            return rs.toLowerCase().indexOf(req.params.s.toLowerCase()) > -1;
        }))
    })
    // res.send(arr)
})

router.get('/artists/:s', function(req, res, next) {
    // var arr = ['Rolling Stones', 'John Williams', 'Mr. Whiskers', 'Beatles', 'Daft Punk', 'Mozart', 'Beethoven', 'Grandma'].filter(f => {
    //     return f.toLowerCase().indexOf(req.params.s.toLowerCase()) > -1;
    // });
    // res.send(arr)
    mongoose.model('Data').find({ 'type': 'artists' }).then(r => {
        res.send(r.map(rt => {
            return rt.entry;
        }).filter(rs => {
            return rs.toLowerCase().indexOf(req.params.s.toLowerCase()) > -1;
        }))
    })
})

router.get('/tags/:s', function(req, res, next) {
    // var arr = ['awesome', 'fancy', 'boring', 'dramatic', 'funky', 'fresh', 'movie', 'game', 'smol'].filter(f => {
    //     return f.toLowerCase().indexOf(req.params.s.toLowerCase()) > -1;
    // });
    // res.send(arr)
    mongoose.model('Data').find({ 'type': 'tags' }).then(r => {
        res.send(r.map(rt => {
            return rt.entry;
        }).filter(rs => {
            return rs.toLowerCase().indexOf(req.params.s.toLowerCase()) > -1;
        }))
    })
})

router.get('/albums/:s', function(req, res, next) {
    // var arr = ["Bob's greatest hits", "High Tide and Green Grass", "Beethoven Uplugged", "Mozart (explicit content)", "Dank Memes"].filter(f => {
    //     return f.toLowerCase().indexOf(req.params.s.toLowerCase()) > -1;
    // });
    // res.send(arr)
    mongoose.model('Data').find({ 'type': 'albums' }).then(r => {
        res.send(r.map(rt => {
            return rt.entry;
        }).filter(rs => {
            return rs.toLowerCase().indexOf(req.params.s.toLowerCase()) > -1;
        }))
    })
})

router.post('/req', authChk, function(req, res, next) {
    console.log(req.body)
    mongoose.model('Song').findOneAndUpdate({ 'id': req.body.id }, { $inc: { 'reqd': 1 } }, function(errs, r) {
        console.log('song err', errs)
        var newId = Math.floor(Math.random() * 999999999999999).toString(32);
        mongoose.model('Requests').create({
            songId: req.body.id,
            id: newId,
            city: req.body.city,
            time: req.body.time,
            name: req.body.acct
        }, function(errq, data) {
            console.log('request err', errq)
            res.send(errq)
        })
    });
});
router.get('/removeReq/:id', authChk, function(req, res, next) {
    //make sure our only user, tink, is logged in. Only tink can request removal of requests(?!)
    mongoose.model('Requests').remove({ id: req.params.id }, function(err, data) {
        res.send('done')
    });
});

router.get('/allReqs', authChk, function(req, res, next) {
    mongoose.model('Requests').find({}, function(err, data) {
        console.log('REQUEST', err, data)
        res.send(data);
    })
})

router.get('/reset/:id', authChk, function(req, res, next) {
    mongoose.model('Song').update({ 'id': req.params.id }, { 'reqd': 0 }, function(err, data) {
        if (err) {
            res.send('err')
        } else {
            res.send(data);
        }
    });
})