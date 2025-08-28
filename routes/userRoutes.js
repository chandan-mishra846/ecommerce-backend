import express from 'express';
import {
  deleteUser,
  getSingleUser,
  getUserDetails,
  getUserList,
  loginUser,
  logout,
  registerUser,
  registerAdmin,
  requestPasswordReset,
  resetPassword,
  updatePassword,
  updateProfile,
  updateUserRole
} from '../controller/userController.js';
import { roleBaseAccess, verifyUserAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/register/admin").post(registerAdmin); // Special admin registration
router.route("/login").post(loginUser);
router.route("/logout").post(logout);

router.route("/password/forgot").post(requestPasswordReset);
router.route("/password/reset/:token").put(resetPassword);

router.route("/profile").get(verifyUserAuth, getUserDetails);
router.route("/password/update").put(verifyUserAuth, updatePassword);
router.route("/profile/update").put(verifyUserAuth, updateProfile);

router.route("/admin/users").get(verifyUserAuth, roleBaseAccess("admin"), getUserList);
router.route("/admin/user/:id")
  .get(verifyUserAuth, roleBaseAccess("admin"), getSingleUser)
  .put(verifyUserAuth, roleBaseAccess("admin"), updateUserRole)
  .delete(verifyUserAuth, roleBaseAccess("admin"), deleteUser);

export default router;
