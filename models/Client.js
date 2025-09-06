const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
   clientName:String,
})
const client = mongoose.model('client',clientSchema)
module.exports = client