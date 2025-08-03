// models/OrderHistory.js
const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  date:String,
  logs:{
    type:[
      {field: {
    type: String,
    required: false
  },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  msg:String
}]
  },
  method:String,
  
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name:String,
  editedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OrderHistory', orderHistorySchema);
