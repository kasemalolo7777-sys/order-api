const { default: mongoose } = require("mongoose");
const bcrypt = require('bcryptjs');
const EmployeeSchema = new mongoose.Schema({
    name:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    },
     role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
      stage:{
      type:[String],
      
    },
        storage:{
      type:[String],
      
    },
},{
    timestamps:true
})











EmployeeSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password,12)
    //this.confirmPassword = undefined
    next();
})














EmployeeSchema.methods.comparePasswordDB = async function(pass,passDB){
   return await bcrypt.compare(pass,passDB)
}
EmployeeSchema.methods.isPasswordChanged = async function(jwtTimestamp){
    console.log(this.passwordChangedAt ,jwtTimestamp )
 if(this.passwordChangedAt){
    const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10)
  return jwtTimestamp < passwordChangedTimestamp
 }
 return false
  
}
module.exports = mongoose.model('employee',EmployeeSchema)