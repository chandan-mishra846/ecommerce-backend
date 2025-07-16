import handleAsynError from '../middleware/handleAsynError.js';
import User from '../models/userModel.js';
import HandleError from '../utils/handleError.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { sendToken } from '../utils/jwtTokens.js';
import { sendEmail } from '../utils/sendEmail.js';



export const registerUser = handleAsynError(async (req, res, next) => {
  const { name, email, password } = req.body;  // ✅ fixed typo

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "this is temp id",
      url: "this is temp url"
    }
  });

  const token= user.getJWTToken();

 sendToken(user,201,res)

});

//login
export const loginUser = handleAsynError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new HandleError("Email or Password can not be empty", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new HandleError("Invalid email or Password", 401));
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    return next(new HandleError("Invalid email or Password", 401));
  }

  // const token = user.getJWTToken();
  // res.status(200).json({
  //   success: true,
  //   user,
  //   token
  // });

  sendToken(user,200,res)  //upr wale ko isse replace kiya h 
});

//logout

export const logout = handleAsynError(async (req, res, next) => {
    res.cookie('token',null,{
      expires:new Date(Date.now()),
      httpOnly:true
    })
    res.status(200).json({
      success:true,
      message:"logged out successfully"
    })
});

//Forgot password

export const requtesPasswordReset = handleAsynError(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new HandleError("User does not exit", 400));
  }

  let resetToken;
  try {
    resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    return next(new HandleError("could not save reset token please try again later", 500));
  }

  const reserPasswordUrl = `http://localhost/api/v1/reset/${resetToken}`;
  const message = `This is the link to reset your password: ${reserPasswordUrl} ,\n\n this link will expire in 30 minutes \n\n if u did not requested a password reset, please ignore the link`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'password reset request',
      message: message
    });

    res.status(200).json({
      success: true,
      message: `Email is send to ${user.email} successfully`
    });

  } catch (error) {
    console.error("Failed to send email:", error); // ✅ Added error log for debugging
    user.resetPasswordToken = undefined;
    user.resetPasswordExprire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new HandleError("email couldn't be send please try again later", 500));
  }
});

//reset password
export const resetPassword = handleAsynError(async (req, res, next) => {
  
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExprire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new HandleError("Reset password token is invalid of has been expired ", 400));
  }

  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(new HandleError("Password does not match", 400));
  }
  user.password = password;
  user.resetPasswordExprire = undefined;
  user.resetPasswordToken = undefined;
  await user.save();
  sendToken(user,200,res)
});

//get user details

export const getUserDetails = handleAsynError(async (req, res, next) => {
  const user = await User.findById(req.user.id); 

  if (!user) {
    return next(new HandleError("User not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

//Update password

export const updatePassword = handleAsynError(async(req, res, next)=>{
  const {oldPassword , newPassword, confirmPassword} = req.body;
  const user = await User.findById(req.user.id).select('+password');
  const checkPasswordMatch = await user.comparePassword(oldPassword);

  if(!checkPasswordMatch){
    return next(new HandleError("Old password is incorrect",400))
  }
  if(newPassword !== confirmPassword){
    return next(new HandleError("password doen not match",400))
  }
  user.password = newPassword;
  await user.save();
  sendToken(user,200,res);
})

//Update user profile

export const updateProfile = handleAsynError(async(req, res, next)=>{
   const {name , email} = req.body;
   const  updateUserDetails ={
      name ,
      email
   }
   const user = await User.findByIdAndUpdate(req.user.id ,updateUserDetails,{
    new:true,
    runValidators:true
   })
   res.status(200).json({
       success:true,
       message:"profile updated successfully",
       user
   })
  
})

//Admin - getting user information

export const getUserList = handleAsynError(async(req, res, next)=>{
    const user = await User.find();
    res.status(200).json({
      success:true,
      user
    })
})

//Admin - Getting single user information

export const getSingleUser = handleAsynError(async (req, res, next) => {
 
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new HandleError(`Invalid MongoDB ID format: ${req.params.id}`, 400));
  }

 
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new HandleError(`User does not exist with this id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    user
  });
});

//Admin - changing user role

export const updateUserRole = handleAsynError(async (req, res, next) => {
 
  
    const {role} = req.body;
    const newUserData={
      role:role
    }


   const user = await User.findByIdAndUpdate(req.user.id ,newUserData,{
    new:true,
    runValidators:true
   })
   if(!user){
    return next(new HandleError("User doen not exist",400))
   }
  res.status(200).json({
    success: true,
    user
  });
});

//Admin - delete user profile 

export const deleteUser = handleAsynError(async (req, res, next) => {
 
   const user = await User.findById(req.params.id);

   if(!user){
    return next(new HandleError("User doen not exist",400))
   }

   await User.findOneAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message:"user deleted successfully"
  });
});

//





