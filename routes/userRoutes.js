import express from 'express';
import { deleteUser, getSingleUser, getUserDetails, getUserList, loginUser, logout, registerUser, requtesPasswordReset, resetPassword, updatePassword, updateProfile, updateUserRole } from '../controller/userController.js';
import { roleBaseAccess, verifyUserAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logout);
router.route("/password/forgot").post(requtesPasswordReset);
router.route("/reset/:token").post(resetPassword);
router.route("/profile").post(verifyUserAuth,getUserDetails);
router.route("/password/update").post(verifyUserAuth,updatePassword);
router.route("/profile/update").post(verifyUserAuth,updateProfile);
router.route("/admin/users").get(verifyUserAuth,roleBaseAccess("admin"),getUserList);
router.route("/admin/user/:id")
.get(verifyUserAuth,roleBaseAccess("admin"),getSingleUser)
.put(verifyUserAuth,roleBaseAccess("admin"),updateUserRole)
.delete(verifyUserAuth,roleBaseAccess("admin"),deleteUser);



export default router;
