import express from 'express';
import { roleBaseAccess, verifyUserAuth } from '../middleware/userAuth.js';
import { 
  getSellerProducts, 
  createSellerProduct, 
  updateSellerProduct, 
  deleteSellerProduct, 
  getSellerOrders,
  getSellerStats,
  updateSellerOrderStatus
} from '../controller/sellerController.js';

const router = express.Router();

// All seller routes require authentication and seller role
router.use(verifyUserAuth);
router.use(roleBaseAccess('seller', 'admin'));

// Seller product routes
router.route('/products')
  .get(getSellerProducts)
  .post(createSellerProduct);

router.route('/products/:id')
  .put(updateSellerProduct)
  .delete(deleteSellerProduct);

// Seller order routes
router.route('/orders').get(getSellerOrders);
router.route('/orders/:id/status').put(updateSellerOrderStatus);

// Seller stats
router.route('/stats').get(getSellerStats);

export default router;
