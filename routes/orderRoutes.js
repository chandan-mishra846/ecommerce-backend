import express from 'express';
import { roleBaseAccess, verifyUserAuth } from '../middleware/userAuth.js';
import { allMyOrder, createNewOrder, deleteOrder, getAllOrders, getSingleOrder, UpdateOrderStatus } from '../controller/orderController.js';


const router = express.Router();


router.route('/new/order').post(verifyUserAuth,createNewOrder);
router.route('/admin/order/:id')
.get(verifyUserAuth,roleBaseAccess('admin'),getSingleOrder)
.put(verifyUserAuth,roleBaseAccess('admin'),UpdateOrderStatus)
.delete(verifyUserAuth,roleBaseAccess('admin'),deleteOrder);

router.route('/order/user').get(verifyUserAuth,allMyOrder);

router.route('/admin/order').get(verifyUserAuth,roleBaseAccess('admin'),getAllOrders);

export default router;