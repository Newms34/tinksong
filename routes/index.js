var express = require('express'),
    router = express.Router(),
    path = require('path'),
    models = require('../models/'),
    session = require('client-sessions'),
    bcrypt = require('bcrypt'),
    tink = {
        u: 'CASHette',
        pr: 'SandBureCrow', //DELET THIS
        p: '$2a$10$TkmXzEON9sHWP8j81vt77OCoV0A936r3L0iTKZeCDFnZOxMilvg32'
    }; //shhhhh!
router.use('/songs', require('./song'));


router.get('/', function(req, res, next) {
    res.sendFile('index.html', { "root": './views' });
});

router.get('/admin', function(req, res, next) {
    res.sendFile('admin.html', { "root": './views' });
});

router.post('/login', function(req, res, next) {
    if (req.body.un == 'CASHette' && bcrypt.compareSync(req.body.pw, tink.p)) {
        req.session.user = 'CASHette';
        res.send(true);
    } else {
        res.send(false);
    }
})
router.get('/logout', function(req, res, next) {
    req.session.destroy();
    res.send('done');
})

router.get('/enc', function(req, res, next) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(tink.pr, salt, function(err, hash) {
            res.send(hash);
        });
    });
})

router.get('/chkLog', function(req, res, next) {
    console.log('checking login', req.session)
    if (req.session && req.session.user && req.session.user == 'CASHette') {
        res.send(true);
    } else {
        res.send(false)
    }
})


module.exports = router;