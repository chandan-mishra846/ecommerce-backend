import handleAsyncError from '../middleware/handleAsynError.js';
import User from '../models/userModel.js';
import HandleError from '../utils/handleError.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { sendToken } from '../utils/jwtTokens.js';
import { sendEmail } from '../utils/sendEmail.js';
import { v2 as cloudinary } from 'cloudinary';

// 1. Register User
export const registerUser = handleAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!req.files || !req.files.avatar) {
    return next(new HandleError("Avatar image is required", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new HandleError("User with this email already exists", 409));

  const file = req.files.avatar;
  const myCloud = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: 'avatars',
    width: 150,
    crop: 'scale',
  });

  const user = await User.create({
    name,
    email,
    password,
    avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
  });

  sendToken(user, 201, res);
});

// 1b. Register Admin
export const registerAdmin = handleAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!req.files || !req.files.avatar) {
    return next(new HandleError("Avatar image is required", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new HandleError("User with this email already exists", 409));

  const file = req.files.avatar;
  const myCloud = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: 'avatars',
    width: 150,
    crop: 'scale',
  });

  const user = await User.create({
    name,
    email,
    password,
    role: 'admin',
    avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
  });

  sendToken(user, 201, res);
});

// 2. Login User
export const loginUser = handleAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new HandleError("Email or Password cannot be empty", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new HandleError("Invalid email or Password", 401));

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) return next(new HandleError("Invalid email or Password", 401));

  sendToken(user, 200, res);
});

// 3. Logout
export const logout = handleAsyncError(async (req, res, next) => {
  res.cookie('token', null, { expires: new Date(Date.now()), httpOnly: true });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// 4. Request Password Reset
export const requestPasswordReset = handleAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new HandleError("User does not exist with this email", 404));

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL2}/reset/${resetToken}`;
  const message = `Reset your password using this link:\n${resetPasswordUrl}\nThis link expires in 30 minutes.`;

  try {
    await sendEmail({ email: user.email, subject: 'Password Reset Request', message });
    res.status(200).json({ success: true, message: `Email sent to ${user.email}` });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new HandleError("Email could not be sent", 500));
  }
});

// 5. Reset Password
export const resetPassword = handleAsyncError(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) return next(new HandleError("Passwords do not match", 400));

  const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) return next(new HandleError("Reset password token is invalid or has expired", 400));

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res);
});

// 6. Get User Details
export const getUserDetails = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new HandleError("User not found", 404));
  res.status(200).json({ success: true, user });
});

// 7. Update Password
export const updatePassword = handleAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return next(new HandleError("User not found", 404));

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) return next(new HandleError("Old password is incorrect", 400));
  if (newPassword !== confirmPassword) return next(new HandleError("New passwords do not match", 400));

  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

// 8. Update Profile
export const updateProfile = handleAsyncError(async (req, res, next) => {
  const { name, email, avatar } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return next(new HandleError("User not found", 404));

  const updatedData = { name, email };
  if (avatar) {
    if (user.avatar?.public_id) await cloudinary.uploader.destroy(user.avatar.public_id);
    const myCloud = await cloudinary.uploader.upload(avatar, { folder: 'avatars', width: 150, crop: 'scale' });
    updatedData.avatar = { public_id: myCloud.public_id, url: myCloud.secure_url };
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, updatedData, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: "Profile updated successfully", user: updatedUser });
});

// 9-12. Admin routes (Get list, single, update role, delete user)
export const getUserList = handleAsyncError(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({ success: true, users });
});

// Get users with role 'user' only
export const getUsersOnly = handleAsyncError(async (req, res, next) => {
  const users = await User.find({ role: 'user' });
  res.status(200).json({ success: true, users });
});

// Get users with role 'seller' only  
export const getSellersOnly = handleAsyncError(async (req, res, next) => {
  const sellers = await User.find({ role: 'seller' });
  res.status(200).json({ success: true, users: sellers });
});

export const getSingleUser = handleAsyncError(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return next(new HandleError("Invalid Mongo ID", 400));
  const user = await User.findById(req.params.id);
  if (!user) return next(new HandleError("User not found", 404));
  res.status(200).json({ success: true, user });
});

export const updateUserRole = handleAsyncError(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return next(new HandleError("Invalid Mongo ID", 400));
  const user = await User.findById(req.params.id);
  if (!user) return next(new HandleError("User not found", 404));
  
  // Update role
  user.role = req.body.role;
  
  // If seller info is provided, update it too
  if (req.body.sellerInfo) {
    user.sellerInfo = req.body.sellerInfo;
  }
  
  await user.save();
  res.status(200).json({ success: true, user });
});

export const deleteUser = handleAsyncError(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return next(new HandleError("Invalid Mongo ID", 400));
  const user = await User.findById(req.params.id);
  if (!user) return next(new HandleError("User not found", 404));
  if (user.avatar?.public_id) await cloudinary.uploader.destroy(user.avatar.public_id);
  await user.deleteOne();
  res.status(200).json({ success: true, message: "User deleted successfully" });
});
