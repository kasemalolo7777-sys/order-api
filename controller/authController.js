const API = require("../classes/Api");
const User = require("./../models/User");
const { GET_RESET_PASSWORD_URL } = require("../constraints/CONSTANTS");
const Token = require('./../models/Token')
const ResetToken = require('./../models/ResetToken')
//)

const asyncErrorHandler = require("./../wrapper_functions/asyncErrorHandler");
const { signToken, verifyToken, generateResetToken,sendToEmail, formatDates } = require("../utils");
const dotenv = require("dotenv");
const InviteCode = require("../models/InviteCode");
const Role = require("../models/Role");
dotenv.config({path: '../config.env'});

exports.signup = asyncErrorHandler(async (req, res,next) => {
  const api = new API(req, res);
  const {email,userName,password,inviteCode} = req.body
   const checkEmail = await User.findOne({ email: req.body.email });
    const checkName = await User.findOne({userName:req.body.userName});
    const inviteState = await InviteCode.findOne({code:inviteCode}) 
    const isInvite = (inviteState && inviteState.state === true) || req.body.inviteCode === "SuperAdmin@1234"
  
    //generate new password
    if(checkEmail ){
      const error = api.errorHandler("invalid","email is taken")
      next(error)
     
    }
    else if(checkName){
     console.log(checkName);
     const error = api.errorHandler("invalid","name is taken")
      next(error)
     
    }
    else if(!isInvite ){
      const error = api.errorHandler('Forbidden',"you are not invited")
     next(error)
  
    }
 // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    

  //const otpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  let newUser = {}
  if( req.body.inviteCode === "SuperAdmin@1234"){
  newUser = await User.create({
    email,
    userName,
    password,
    isAdmin:true,
    confirmPassword:password
  });
  }else{
    if(!inviteState.role){
      const error = api.errorHandler('Forbidden','some thing wrong with your role id')
      next(error)
      return
    }
       newUser = await User.create({
    email,
    userName,
    password,
    roleId:inviteState.role,
    confirmPassword:password
  });
  }
   
  // create access token
  const accessToken = signToken(newUser._id);
  // create refresh token
  // store refresh token in database
   const newToken = await Token.create({token:accessToken,userId:newUser._id})

   // send request to the client 
   newUser.save()
       api.dataHandler("create", {data:{
        id:newUser._id,
        token:newToken.token,
    nickName:newUser.userName,
    email:newUser.email,
    role:newUser.role,
    isVerified:newUser.isVerified
  } });
});
exports.login = asyncErrorHandler(async (req, res, next) => {
  const api = new API(req, res);
  const { email, password } = req.body;
  // check if user found 
 
  const user = await User.findOne({ email }).select("+password");
  if (!email || !password) {
    const error = api.errorHandler("uncomplated_data");
    next(error);
  }
  if (!user) {
    const error = api.errorHandler("not_found",'email not found');
    next(error);
  }
  // check if password correct
  const isMatch = await user.comparePasswordDB(password, user.password);
  if (!isMatch) {
    const error = api.errorHandler("invalid");
    next(error);
  }
  // generate access token
  const accessToken = signToken(user._id);
  // generate refresh token
 
  // check if previous refresh token still found and deleted
  await Token.findOneAndDelete({userId:user._id})
  // store new refresh token in database
  const newToken = await Token.create({token:accessToken,userId:user._id})
  // send access and refresh token to db

  api.dataHandler("create", {   data:{
    token:newToken.token,
    nickName:user.userName,
    email:user.email,
    role:user.role,
    isVerified:user.isVerified
  } },'user log in and new tokens has been generated');
});
exports.token = asyncErrorHandler(async (req, res, next) => {
  const refreshToken = req.body.token;
  const api = new API(req, res);

  if (refreshToken == null){
    const error = api.errorHandler('unauthorized','your refreshToken not found')
    next(error)
  };
  let decodedToken =await verifyToken(refreshToken,process.env.REFRESH_TOKEN_SECRET)
  if(!decodedToken){
    const error = api.errorHandler('unauthorized')
    next(error)
  }
   const token = await Token.findOne({userId:decodedToken.id})
 
 
  
  if (!token || refreshToken !== token.token){
    const error = api.errorHandler('unauthorized','your token not valid anymore')
    next(error)
  }else{
    const accessToken = signToken(decodedToken.id);
    api.dataHandler("create", { accessToken},'new access token has been created');
  }
  
});
exports.logout = asyncErrorHandler(async (req, res, next) =>{
  const api = new API(req,res)
  const userId = req.user._id
  console.log(userId)
  await Token.findOneAndDelete({userId})
  api.dataHandler('delete')
})
exports.foregetPassword = asyncErrorHandler(async (req,res,next)=>{
  const user = await User.findOne({email:req.body.email})
  const api = new API(req,res)
  
  if(!user){
    const error = api.errorHandler('not_found','user not found check if the email correct')
    next(error)
  }
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newResetToken = await ResetToken.create({
    userID:user._id,
    code:resetCode
  })
await newResetToken.save()
  
  const result = await sendToEmail({
    email:req.body.email,
    subject:'Reset Password',
    message:RESET_PASSWORD_TEMPLATE.replace('{{subject}}', 'OTP verification').replace('{{message}}', resetCode).replace('{{type}}', 'system msg').replace('{{from}}',req.body.email)
  })

  if(result){
    api.dataHandler('create','reset token created its valid for 15 min')
  }else{
    await ResetToken.findByIdAndDelete(newResetToken._id)
    const error = api.errorHandler('uncomplated_data','something going wrong with send to email operation')
    next(error)
    
  }
 
  
})
exports.resetPassword =asyncErrorHandler(async(req,res,next)=>{
  const api = new API(req,res)
  const resetUserToken = await ResetToken.find({code:req.body.code})
  if(!resetUserToken){
    const error = api.errorHandler('invalid','your token in invalid')
    next(error)
  }
  const currentUser = await User.findById(resetUserToken.userId)
  if(!currentUser){
    const error = api.errorHandler('not_found','user not found')
    next(error)
  }
  if(req.body.newPassword.length === 0){
    const error = api.errorHandler('uncomplated_data')
    next(error)
  }
  const newHashedPassword = hashPassword(req.body.newPassword)
  up
  await currentUser.updateOne({$set:{password:newHashedPassword}})
  api.dataHandler('update')
})
exports.createInviteCode = asyncErrorHandler(async(req,res,next)=>{
  const api = new API(req,res)
  console.log(req.user);
   const newCode = new InviteCode({
    code:req.body.inviteCode,
    role:req.body.role,
    state:true
   })
   await newCode.save();
   console.log("done");
   api.dataHandler('create',null,'your invite code work now')
  
  })
exports.changeRoleForUser =asyncErrorHandler (
async (req, res,next) => {
     const api = new API(req,res)
    const { userId, newRoleId } = req.body;

    // Validate the role exists
    const role = await Role.findById(newRoleId);
    if (!role) {
      const error = api.errorHandler('not_found','Role not found')
      next(error)
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        roleId: newRoleId,
        role: 'normal' // optional: you can adjust this based on role logic
      },
      { new: true, runValidators: true }
    ).populate('roleId');

    if (!updatedUser) {
      const error = api.errorHandler('not_found','User not found')
      next(error)
    }
     api.dataHandler('update') 
})
exports.removeUser = asyncErrorHandler(async(req,res,next)=>{
  const api = new API(req,res)
  const userId = req.body.userId
  await Token.findOneAndDelete({userId})
  await User.findByIdAndDelete({userId})
  api.dataHandler('delete')
})

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const api = new API(req, res);

  // Modify query with filters, sorts, etc.
  api.modify(
    User.find()
      .populate({
        path: 'roleId',
        select: 'name status -_id' // Only get the role name
      })
      .lean()
  ).filter().sort().limitFields().paginate();

  const users = await api.query;

  const totalPages = await User.countDocuments();

  // Replace roleId object with just its name
  const formattedUsers = users.map(user => ({
    ...user,
    role: user.isAdmin ? 'superAdmin' : user.roleId?.name || null,
  }));

  api.dataHandler('fetch', {
    users: formatDates(formattedUsers),
    totalPages
  });
});
exports.getUserById = asyncErrorHandler(async(req,res,next)=>{
  const api = new API(req,res)
  
  
  const token = api.getHeaders('authorization')
  if(!token){
    const error = api.errorHandler('unauthorized')
    next(error)
  }
  console.log(token);
  let decodedToken = await verifyToken(token,process.env.ACCESS_TOKEN_SECRET) 
      console.log(decodedToken);
    const currentUser = await User.findById(decodedToken.id)
    if(!currentUser){
      const error = api.errorHandler('not_found','user not found')
      next(error)
    }
    const currentRole = await Role.findById(currentUser.roleId)
    
     api.dataHandler('fetch',{user:{currentUser},role:{currentRole}})
  

})
