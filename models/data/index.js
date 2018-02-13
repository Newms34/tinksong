var mongoose = require('mongoose'),
    crypto = require('crypto');
// Note that this stores the game info (i.e., populations, army strengths, etc.). It does NOT store the map info (i.e., shape/names of countries)
var dataSchema = new mongoose.Schema({
   type:String,
   entry:String
}, { collection: 'data' });
mongoose.model('Data', dataSchema);