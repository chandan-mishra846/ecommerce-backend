import express from 'express';
import { roleBaseAccess, verifyUserAuth } from '../middleware/userAuth.js';
import { 
  getSellerProducts, 
  createSellerProduct, 
  updateSellerProduct, 
  deleteSellerProduct, 
  getSellerOrders,
  getSellerStats,
  updateSellerOrderStatus,
  getOutOfStockProducts,
  restockProduct,
  getOrderHistory,
  getProfitAnalytics
} from '../controller/sellerController.js';

const router = express.Router();

// All seller routes require authentication and seller role
router.use(verifyUserAuth);
router.use(roleBaseAccess('seller', 'admin'));

// Seller product routes
router.route('/products')
  .get(getSellerProducts);

router.route('/product/new')
  .post(createSellerProduct);

router.route('/products/:id')
  .put(updateSellerProduct)
  .delete(deleteSellerProduct);

// Alternative route for single product operations
router.route('/product/:id')
  .put(updateSellerProduct)
  .delete(deleteSellerProduct);

// Seller order routes
router.route('/orders').get(getSellerOrders);
router.route('/orders/:id/status').put(updateSellerOrderStatus);

// Seller stats
router.route('/stats').get(getSellerStats);

// Additional seller routes
router.route('/products/out-of-stock').get(getOutOfStockProducts);
router.route('/products/restock').post(restockProduct);
router.route('/orders/history').get(getOrderHistory);
router.route('/profit').get(getProfitAnalytics);

export default router;
