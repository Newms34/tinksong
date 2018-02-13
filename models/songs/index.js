var mongoose = require('mongoose'),
    crypto = require('crypto');
// Note that this stores the game info (i.e., populations, army strengths, etc.). It does NOT store the map info (i.e., shape/names of countries)
var songSchema = new mongoose.Schema({
   title:String,
   artist:String,
   album:String,
   genre:String,
   tags:[String],
   reqd:{type:Number, default:0},
   id:String
}, { collection: 'Song' });
mongoose.model('Song', songSchema);