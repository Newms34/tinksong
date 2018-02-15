var app = angular.module('tinkApp', ['ngMaterial']);
app.controller('tinkCont', function($scope, $http) {
    $scope.refSongs = function() {
        $http.get('/songs/all').then(r => {
            if (r.data == 'err') {
                return false;
            }
            var i=0;
            r.data.forEach(sg=>{
                for(i=0;i<sg.tags.length;i++){
                    sg.tags = sg.tags.filter(sgtg=>{
                        return !!sgtg;
                    })
                }
            })
            $scope.songs = r.data;
            $scope.filtSongs(null);
        })
    }
    $scope.refSongs();
    $scope.reqSong = function(s) {
        $scope.requesting = true;
        $scope.currReqSong = angular.copy(s);
        console.log('user requests song', s)
    }
    $scope.cities = ["Black Citadel", "Lion's Arch", "Rata Sum", "Divinity's Reach", "The Grove", "Hoelbrak"];
    $scope.nct = null;
    $scope.chkAcct = function() {
        if ($scope.nct) {
            clearInterval($scope.nct);
        }
        $scope.nct = setTimeout(function() {
            $scope.nameErr = !$scope.currReqSong.acct.match(/\w*\.\d{4}/);
            $scope.$digest();
        }, 250)
    }
    $scope.doReqSong = function() {
        $scope.requesting = false;
        if ($scope.nameErr || !$scope.currReqSong.acct || !$scope.currReqSong.time) {
            $scope.currReqSong.problem = true;
            $scope.currReqSong.msg = {
                title: "Problem with Request",
                body: "There was an issue with the request! Please double-check your info."
            };
        } else {
            $scope.currReqSong.problem = false;
            $scope.currReqSong.msg = {
                title: "Request sent!",
                body: "Your request has been sent! I'll contact you in game!"
            };
            // send the song req to Tink!
            $http.post('/songs/req', $scope.currReqSong)
                .then(function(r) {
                    console.log(r);
                })
        }
        //user sends request!
    }
    $scope.acceptReqResult = function() {
        $scope.currReqSong.msg = null;
        if ($scope.currReqSong.problem) {
            //there was an issue with the request. Reset the request box so user can try again
            $scope.requesting = true;
        } else {
            $scope.currReqSong = {};
        }
    }
    $scope.cancelReq = function() {
        $scope.currReqSong = {};
        $scope.requesting = false;
    }
    $scope.filtSongs = function(r){
        console.log('RAW SONGS',$scope.songs,r)
        if(!r||r==''||!r.trim()){
            console.log('no filter')
            $scope.songsFilt = angular.copy($scope.songs);
        }else{
            console.log('filter',r)
            $scope.songsFilt = $scope.songs.filter(f=>{
                r=r.toLowerCase();
                console.log('examining song ',f)
                return (f.title && f.title.toLowerCase().indexOf(r)>-1) || (f.genre && f.genre.toLowerCase().indexOf(r)>-1) || (f.album && f.album.toLowerCase().indexOf(r)>-1)|| (f.artist && f.artist.toLowerCase().indexOf(r)>-1)||f.tags.filter(ft=>{
                    return ft && ft.toLowerCase().indexOf(r)>-1;
                }).length;
            })
        }
    }
    
});

//admin
app.controller('tinkAdmin', function($scope, $http) {
    //make sure user is whom they say
    $scope.verifyUsr = function() {
        console.log('making sure user is Tink')
        $http.get('/chkLog').then(r => {
            console.log('chklog response', r)
            $scope.verified = r.data;
            if (!r.data) {
                var us = prompt('Username?', ''),
                    pw = prompt('Password?', '');
                if (!us || !pw || pw == '' || us == '') {
                    console.log('redirect to home')
                    alert('Missing either password or username')
                    window.location.assign('./')
                } else {
                    $http.post('/login', { un: us, pw: pw }).then(function(r) {
                        if (!r.data) {
                            window.location.reload(); //try again!
                        } else {
                            $scope.verified = true;
                        }
                    })
                }
            }
        })
    };
    $scope.verifyUsr();
    //after this line, user should be Tink
    $scope.refSongs = function() {
        $http.get('/songs/all').then(r => {
            if (r.data == 'err') {
                return false;
            }
            $scope.songs = r.data;
        })
    }
    $scope.refSongs();
    $scope.newSong = {
        tags: []
    };
    $scope.suggested = {};
    //array getter functions
    $scope.getGenres = function(i) {
        if (!i) {
            $scope.suggested.genre = [];
            return false;
        }
        $http.get('/songs/genres/' + i).then(r => {
            $scope.suggested.genre = r.data;
        })
    }
    $scope.getArtists = function(i) {
        if (!i) {
            $scope.suggested.artist = [];
            return false;
        }
        $http.get('/songs/artists/' + i).then(r => {
            $scope.suggested.artist = r.data;
            console.log(r.data, )
        })
    }
    $scope.getAlbums = function(i) {
        if (!i) {
            $scope.suggested.album = [];
            return false;
        }
        $http.get('/songs/albums/' + i).then(r => {
            $scope.suggested.album = r.data;
        })
    }
    $scope.getTags = function(i) {
        if (!i) {
            $scope.suggested.tags = [];
            return false;
        }
        $http.get('/songs/tags/' + i).then(r => {
            $scope.suggested.tags = r.data;
        })
    }
    $scope.acceptSug = function(v, arr) {
        $scope.suggested[arr] = [];
        if (arr != 'tags') {
            $scope.newSong[arr] = v;
        } else {
            $scope.newSong.tags.push(v);
            $scope.candTag = '';
            $scope.$digest();
        }
    }
    $scope.noAdd = false;
    $scope.clearSong = function() {
        $scope.newSong = {
            tags: []
        };
    }
    $scope.chTag = function(dir, t) {
        dir = !!parseInt(dir);
        if (!dir) {
            //remove tag;
            var pos = $scope.newSong.tags.indexOf(t);
            $scope.newSong.tags.splice(pos, 1);
        } else {
            $scope.newSong.tags.push(t);
        }
        $scope.candTag = '';
    }
    $scope.doAddSong = function(s) {
        if (confirm(`Are you sure you wish to add the song ${s.title}?`)) {
            if (!s.title && (!s.album || !s.tags.length || !s.genre||!s.tabs)) {
                alert("Your song has too little info. Please include more!");
                return false;
            }
            console.log('NEW SONG', s);
            // var theSong = angular.copy(s);
            // s.album = $scope.
            $http.post('/songs/new', s)
                .then(r => {
                    //either we get an error back (something went horribly wrong) or a call to refresh the song list (since we just added one)
                    $scope.clearSong();
                    if (!r.data || r.data == 'err') {
                        alert('Error adding song! Sorry!')
                    } else {
                        $scope.refSongs();
                    }
                })
        }
    }
    $scope.showTabs=function(s){
        $scope.cts = {
            title:s.title,
            tabs:s.tabs
        }
        $scope.showingTabs = true;
    }
    $scope.hideTabs = function(){
        $scope.showingTabs=false;
        $scope.$digest();
    }
    $scope.stopProp = function(e){
        
    }
    $scope.removeSong = function(id) {
        if (confirm("Are you sure you wish to remove this song?")) {
            $http.get('/songs/rem/' + id)
                .then(r => {
                    console.log('REMOVED SONG', id)
                    $scope.clearSong();
                    $scope.refSongs(); //in this case, it doesnt REALLY matter whether we're successful or not.
                })
        }
    }
    $scope.getReqs = function() {
        $http.get('/songs/allReqs')
            .then(r => {
                console.log('requests', r)
                var now = new Date().getTime();
                $scope.requests = r.data.filter(f => {
                    return new Date(f.time) > now;
                });
            })
    }
    $scope.getReqs();
    $scope.renderDate = function(r) {
        return new Date(r).toLocaleString()
    }
    $scope.getSongId = function(id) {
        for (var i = 0; i < $scope.songs.length; i++) {
            if ($scope.songs[i].id == id) {
                return $scope.songs[i]
            }
        }
    }
    $scope.removeReq = function(id) {
        if (confirm('Are you absolutely sure you wish to remove this request?')) {
            $http.get('/songs/removeReq/' + id).then(r => {
                $scope.getReqs();
            })
        }
    }
    $scope.scrollTo = function(d) {
        $('html, body').animate({
            scrollTop: $("#"+d).offset().top-50
        }, 200);
    }
})