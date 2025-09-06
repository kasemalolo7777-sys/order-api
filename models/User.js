const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Please enter your name.']
  },
  email: {
    type: String,
    required: [true, 'Please enter an email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email.']
  },
  storage:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Storage',
      required: false
    },
    stage:{
      type:String,
      
    },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please enter a password.'],
    minlength: 8,
    select: false
  },
  isAdmin:{
    type:Boolean,
    default:false
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  isActive:{
    type:Boolean,
    default:true
  },
  googleId: String,
  passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordTokenExpires: Date
},{
  timestamps:true
});











userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password,12)
    //this.confirmPassword = undefined
    next();
})














userSchema.methods.comparePasswordDB = async function(pass,passDB){
   return await bcrypt.compare(pass,passDB)
}
userSchema.methods.isPasswordChanged = async function(jwtTimestamp){
    console.log(this.passwordChangedAt ,jwtTimestamp )
 if(this.passwordChangedAt){
    const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10)
  return jwtTimestamp < passwordChangedTimestamp
 }
 return false
  
}

const User = mongoose.model('User', userSchema);

module.exports = User;