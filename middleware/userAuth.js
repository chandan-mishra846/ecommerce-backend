import HandleError from "../utils/handleError.js";
import handleAsynError from "./handleAsynError.js";
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const verifyUserAuth = handleAsynError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new HandleError("Authantication is missing ,please login to use all the resource", 401));
  }

  const decodeData = jwt.verify(token, process.env.JWT_SECRET_KEY);
  

  const user = await User.findById(decodeData.id);
  if (!user) {
    return next(new HandleError("User not found, token may be invalid or user deleted", 401));
  }

  req.user = user;
  next();
});


export const roleBaseAccess =(...roles)=>{
  return (req, res, next)=>{
    if(!roles.includes(req.user.role)){
      return next(new HandleError(`Role - ${req.user.role} is not allowed to access the resource`,402))
    }
    next();
  }
}