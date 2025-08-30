import express from 'express';
import { getDashboardAnalytics, getFilteredAnalytics } from '../controller/analyticsController.js';
import { verifyUserAuth, roleBaseAccess } from '../middleware/userAuth.js';

const router = express.Router();

// Only allow admin to access analytics
router.route('/dashboard').get(verifyUserAuth, roleBaseAccess('admin'), getDashboardAnalytics);
router.route('/filtered').get(verifyUserAuth, roleBaseAccess('admin'), getFilteredAnalytics);

export default router;
