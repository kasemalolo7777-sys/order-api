// models/Role.js
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    trim: true
  },
  title:{
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    required: true,
    default: false
  },
  create: {
    type: Boolean,
    required: true,
    default: false
  },
  edit: {
    type: Boolean,
    required: true,
    default: false
  },
  delete: {
    type: Boolean,
    required: true,
    default: false
  }
}, { _id: false });




const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  fieldsPermissions:{
     type: [String],
     default:[]
  },
  sectionPermissions: {
    type: [permissionSchema],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Role must have at least one section permission'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
