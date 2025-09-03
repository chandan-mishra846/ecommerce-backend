import express from 'express';
import { createProducts, createReviewforProduct, deleteProduct, DeleteReview, getAdminProducts, getAllProducts, getProductReviews, getSingleProduct, updateProduct, createAdminProduct} from '../controller/productController.js';

import { roleBaseAccess, verifyUserAuth } from '../middleware/userAuth.js';

const router = express.Router();

// Test route to check if API is working
router.route("/test").get((req, res) => {
  res.status(200).json({
    success: true,
    message: "Product API is working correctly!"
  });
});

router.route("/products").get(getAllProducts)

router.route("/admin/products").get(verifyUserAuth,roleBaseAccess("admin"),getAdminProducts)

router.route("/admin/products/create").post(verifyUserAuth,roleBaseAccess("admin"),createAdminProduct);


router.route("/admin/products/:id")
.put(verifyUserAuth,roleBaseAccess("admin"),updateProduct)
.delete(verifyUserAuth,roleBaseAccess("admin"),deleteProduct)

router.route("/products/:id").get(getSingleProduct);
router.route("/review").put(verifyUserAuth,createReviewforProduct);
router.route("/reviews").get(getProductReviews).delete(verifyUserAuth,DeleteReview)


export default router;
