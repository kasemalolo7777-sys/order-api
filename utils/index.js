const signToken = require('./signToken')
const verifyToken = require('./verifyToken')
const hashPassword = require('./hashPassword')
const comparePasswords = require('./comparePasswords')
const generateResetToken = require('./generateResetToken')
const cloudinaryDelete = require('./cloudinaryDelete')
const cloudinaryUpload = require('./cloudinaryUpload')
const sendToEmail = require('./sendToEmail')
const { format } = require('date-fns');
function formatDates(data, fields = ['orderDate', 'deliveryDate', 'invoiceDate', 'createdAt', 'updatedAt']) {
  if (Array.isArray(data)) {
    return data.map(doc => formatDates(doc, fields));
  }

  for (const field of fields) {
    if (data[field]) {
      data[field] = format(new Date(data[field]), 'yyyy MMM dd');
    }
  }

  return data;
}
module.exports = {
   signToken,
   verifyToken,
   hashPassword,
   comparePasswords,
   generateResetToken,
   cloudinaryDelete,
   cloudinaryUpload,
   sendToEmail,
   formatDates,
   
}