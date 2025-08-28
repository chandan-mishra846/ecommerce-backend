import mongoose from "mongoose";
import isEmail from "validator/lib/isEmail.js";
import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [25, "Name must be less than 25 characters"],
    minLength: [2, "Name should contain at least 2 characters"]
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: [isEmail, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [8, "Password should contain at least 8 characters"],
    select: false
  },
  avatar: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  role: {
    type: String,
    enum: ["user", "seller", "admin"],
    default: "user"
  },
  // Seller-specific fields
  sellerInfo: {
    companyName: {
      type: String,
      required: function() { return this.role === 'seller'; }
    },
    businessType: {
      type: String,
      enum: ["Individual", "Private Limited", "Partnership", "LLP", "Proprietorship"],
      required: function() { return this.role === 'seller'; }
    },
    gstNumber: {
      type: String,
      required: function() { return this.role === 'seller'; }
    },
    panNumber: {
      type: String,
      required: function() { return this.role === 'seller'; }
    },
    address: {
      street: { type: String, required: function() { return this.role === 'seller'; } },
      city: { type: String, required: function() { return this.role === 'seller'; } },
      state: { type: String, required: function() { return this.role === 'seller'; } },
      pincode: { type: String, required: function() { return this.role === 'seller'; } },
      country: { type: String, default: "India", required: function() { return this.role === 'seller'; } }
    },
    contact: {
      phone: { type: String, required: function() { return this.role === 'seller'; } },
      whatsapp: { type: String },
      website: { type: String }
    },
    bankDetails: {
      accountHolderName: { type: String, required: function() { return this.role === 'seller'; } },
      accountNumber: { type: String, required: function() { return this.role === 'seller'; } },
      bankName: { type: String, required: function() { return this.role === 'seller'; } },
      ifscCode: { type: String, required: function() { return this.role === 'seller'; } },
      branchName: { type: String, required: function() { return this.role === 'seller'; } },
      accountType: {
        type: String,
        enum: ["Savings", "Current"],
        default: "Savings",
        required: function() { return this.role === 'seller'; }
      }
    },
    documents: {
      businessLicense: {
        public_id: String,
        url: String
      },
      gstCertificate: {
        public_id: String,
        url: String
      },
      panCard: {
        public_id: String,
        url: String
      }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date // ✅ Fixed typo
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcryptjs.hash(this.password, 10);
});

// Generate JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Generate Reset Token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // ✅ Fixed typo

  return resetToken;
};

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);