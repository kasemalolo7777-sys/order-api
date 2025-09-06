const mongoose = require('mongoose');
const storageSchema = new mongoose.Schema({
   storage:String,
})
const storage = mongoose.model('storage',storageSchema)
module.exports = storage