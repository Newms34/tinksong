var app = angular.module('tinkApp', ['ngMaterial']);
app.controller('tinkCont', function($scope, $http) {
    $scope.refSongs = function() {
        $http.get('/songs/all').then(r => {
            if (r.data == 'err') {
                return false;
            }
            $scope.songs = r.data;
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
            $http.post('/songs/req',$scope.currReqSong)
                .then(function(r){
                    console.log(r);
                })
        }
        //user sends request!
    }
    $scope.acceptReqResult = function(){
        $scope.currReqSong.msg = null;
        if($scope.currReqSong.problem){
            //there was an issue with the request. Reset the request box so user can try again
            $scope.requesting=true;
        }else{
            $scope.currReqSong = {};
        }
    }
    $scope.cancelReq = function(){
        $scope.currReqSong = {};
        $scope.requesting=false;
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
    //array getter functions
    $scope.getGenres = function(i) {
        return $http.get('/songs/genres/' + i).then(r => {
            return r.data;
        })
    }
    $scope.getArtists = function(i) {
        return $http.get('/songs/artists/' + i).then(r => {
            return r.data;
        })
    }
    $scope.getAlbums = function(i) {
        return $http.get('/songs/albums/' + i).then(r => {
            return r.data;
        })
    }
    $scope.getTags = function(i) {
        return $http.get('/songs/tags/' + i).then(r => {
            return r.data;
        })
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
        $scope.newTag = '';
    }
    $scope.doAddSong = function(s) {
        if (confirm(`Are you sure you wish to add the song ${s.title}?`)) {
            if (!s.title && (!s.album || !s.tags.length || !s.genre)) {
                alert("Your song has too little info. Please include more!");
                return false;
            }
            $http.post('/songs/new', s)
                .then(r => {
                    //either we get an error back (something went horribly wrong) or a call to refresh the song list (since we just added one)
                    $scope.clearSong();
                    if (!r.data) {
                        alert('Error adding song! Sorry!')
                    } else {
                        $scope.refSongs();
                    }
                })
        }
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

})