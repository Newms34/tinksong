var mongoose = require('mongoose'),
    crypto = require('crypto');
// Note that this stores the game info (i.e., populations, army strengths, etc.). It does NOT store the map info (i.e., shape/names of countries)
var songReq = new mongoose.Schema({
   name:String,
   time:String,
   city:String,
   id:String,
   songId:String
}, { collection: 'Requests' });
mongoose.model('Requests', songReq);