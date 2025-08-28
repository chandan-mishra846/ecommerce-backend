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
  const { name, email, password, role } = req.body;

  if (!req.files || !req.files.avatar) {
    return next(new HandleError("Avatar image is required", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new HandleError("User with this email already exists", 409));

  // Validate role - only allow user, seller, admin
  const allowedRoles = ['user', 'seller', 'admin'];
  const userRole = role && allowedRoles.includes(role) ? role : 'user';

  const file = req.files.avatar;
  const myCloud = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: 'avatars',
    width: 150,
    crop: 'scale',
  });

  // Prepare user data
  const userData = {
    name,
    email,
    password,
    role: userRole,
    avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
  };

  // If registering as seller, add seller-specific information
  if (userRole === 'seller') {
    const {
      companyName,
      businessType,
      gstNumber,
      panNumber,
      street,
      city,
      state,
      pincode,
      country = 'India',
      phone,
      whatsapp,
      website,
      accountHolderName,
      accountNumber,
      bankName,
      ifscCode,
      branchName,
      accountType = 'Savings'
    } = req.body;

    // Validate required seller fields
    const requiredFields = [
      'companyName', 'businessType', 'gstNumber', 'panNumber',
      'street', 'city', 'state', 'pincode', 'phone',
      'accountHolderName', 'accountNumber', 'bankName', 'ifscCode', 'branchName'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new HandleError(`${field} is required for seller registration`, 400));
      }
    }

    userData.sellerInfo = {
      companyName,
      businessType,
      gstNumber,
      panNumber,
      address: {
        street,
        city,
        state,
        pincode,
        country
      },
      contact: {
        phone,
        whatsapp,
        website
      },
      bankDetails: {
        accountHolderName,
        accountNumber,
        bankName,
        ifscCode,
        branchName,
        accountType
      },
      documents: {},
      isVerified: false,
      verificationStatus: 'pending'
    };

    // Handle document uploads if provided
    if (req.files.businessLicense) {
      const businessLicenseUpload = await cloudinary.uploader.upload(req.files.businessLicense.tempFilePath, {
        folder: 'seller-documents',
      });
      userData.sellerInfo.documents.businessLicense = {
        public_id: businessLicenseUpload.public_id,
        url: businessLicenseUpload.secure_url
      };
    }

    if (req.files.gstCertificate) {
      const gstCertificateUpload = await cloudinary.uploader.upload(req.files.gstCertificate.tempFilePath, {
        folder: 'seller-documents',
      });
      userData.sellerInfo.documents.gstCertificate = {
        public_id: gstCertificateUpload.public_id,
        url: gstCertificateUpload.secure_url
      };
    }

    if (req.files.panCard) {
      const panCardUpload = await cloudinary.uploader.upload(req.files.panCard.tempFilePath, {
        folder: 'seller-documents',
      });
      userData.sellerInfo.documents.panCard = {
        public_id: panCardUpload.public_id,
        url: panCardUpload.secure_url
      };
    }
  }

  const user = await User.create(userData);

  sendToken(user, 201, res);
});

// Special Admin Registration (only for initial setup)
export const registerAdmin = handleAsyncError(async (req, res, next) => {
  const { name, email, password, adminSecretKey } = req.body;

  // Verify admin secret key
  if (adminSecretKey !== process.env.ADMIN_SECRET_KEY || adminSecretKey !== 'SUPER_ADMIN_KEY_2024') {
    return next(new HandleError("Unauthorized: Invalid admin secret key", 403));
  }

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
  const { email, password, adminLogin } = req.body;
  if (!email || !password) return next(new HandleError("Email or Password cannot be empty", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new HandleError("Invalid email or Password", 401));

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) return next(new HandleError("Invalid email or Password", 401));

  // If admin login is attempted, verify user has admin role
  if (adminLogin && user.role !== 'admin') {
    return next(new HandleError("Unauthorized: Admin access denied", 403));
  }

  // If user is admin but not using admin login, deny access
  if (user.role === 'admin' && !adminLogin) {
    return next(new HandleError("Admin users must use admin login", 403));
  }

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
  user.role = req.body.role;
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
