import express from 'express';
import { verifyUserAuth } from '../middleware/userAuth.js';
import { addToCart, getCart, updateCartItem, removeFromCart, clearCart } from '../controller/cartController.js';

const router = express.Router();

// Cart routes - all require authentication
router.use(verifyUserAuth);

// Add item to cart
router.post('/add', addToCart);

// Get user's cart
router.get('/', getCart);

// Update cart item quantity
router.put('/update/:itemId', updateCartItem);

// Remove item from cart
router.delete('/remove/:itemId', removeFromCart);

// Clear entire cart
router.delete('/clear', clearCart);

export default router;
