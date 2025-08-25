// backend/controllers/cartController.js

import Cart from '../models/Cart.js';
import Product from '../models/productModel.js';
import handleAsynError from '../middleware/handleAsynError.js';

// Add item to cart
export const addToCart = handleAsynError(async (req, res, next) => {
  console.log('Backend: Entering addToCart controller');
  console.log('Backend: Request body:', req.body);
  console.log('Backend: User ID from request:', req.user ? req.user.id : 'User not authenticated');

  const { productId, quantity = 1 } = req.body;
  const userId = req.user.id;

  const product = await Product.findById(productId);
  if (!product) {
    console.log('Backend: Product not found:', productId);
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  console.log('Backend: Product found:', product.name);

  if (product.stock < quantity) {
    console.log('Backend: Insufficient stock for product:', product.name, 'Available:', product.stock, 'Requested:', quantity);
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} items available in stock`
    });
  }
  console.log('Backend: Stock is sufficient.');

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: []
    });
    console.log('Backend: New cart created for user:', userId);
  } else {
    console.log('Backend: Existing cart found for user:', userId);
  }

  const existingItemIndex = cart.items.findIndex(item =>
    item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
    console.log('Backend: Updated quantity for existing item:', product.name, 'New quantity:', cart.items[existingItemIndex].quantity);
  } else {
    cart.items.push({
      product: productId,
      quantity: quantity,
      price: product.price
    });
    console.log('Backend: Added new item to cart:', product.name, 'Quantity:', quantity);
  }

  await cart.save();
  console.log('Backend: Cart saved to database.');

  await cart.populate('items.product', 'name price image stock');
  console.log('Backend: Cart populated with product details.');

  res.status(200).json({
    success: true,
    message: 'Item added to cart successfully',
    cart
  });
  console.log('Backend: Successfully sent add to cart response.');
});

// Get user's cart
export const getCart = handleAsynError(async (req, res, next) => {
  console.log('Backend: Entering getCart controller');
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId })
    .populate('items.product', 'name price image stock');

  if (!cart) {
    console.log('Backend: No cart found for user:', userId);
    return res.status(200).json({
      success: true,
      cart: { items: [] }
    });
  }

  console.log('Backend: Cart found for user:', userId, 'Items:', cart.items.length);
  res.status(200).json({
    success: true,
    cart
  });
});

// Update cart item quantity
export const updateCartItem = handleAsynError(async (req, res, next) => {
  console.log('Backend: Entering updateCartItem controller');
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  if (quantity <= 0) {
    console.log('Backend: Invalid quantity for update:', quantity);
    return res.status(400).json({
      success: false,
      message: 'Quantity must be greater than 0'
    });
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    console.log('Backend: Cart not found for update for user:', userId);
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  const item = cart.items.id(itemId);
  if (!item) {
    console.log('Backend: Cart item not found for update:', itemId);
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  const product = await Product.findById(item.product);
  if (product.stock < quantity) {
    console.log('Backend: Insufficient stock for update. Product:', product.name, 'Available:', product.stock, 'Requested:', quantity);
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} items available in stock`
    });
  }

  item.quantity = quantity;
  await cart.save();
  console.log('Backend: Cart item quantity updated and cart saved.');

  await cart.populate('items.product', 'name price image stock');

  res.status(200).json({
    success: true,
    message: 'Cart item updated successfully',
    cart
  });
  console.log('Backend: Successfully sent update cart item response.');
});

// Remove item from cart
export const removeFromCart = handleAsynError(async (req, res, next) => {
  console.log('Backend: Entering removeFromCart controller');
  const { itemId } = req.params;
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    console.log('Backend: Cart not found for removal for user:', userId);
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items = cart.items.filter(item => item._id.toString() !== itemId);
  await cart.save();
  console.log('Backend: Item removed from cart and cart saved.');

  await cart.populate('items.product', 'name price image stock');

  res.status(200).json({
    success: true,
    message: 'Item removed from cart successfully',
    cart
  });
  console.log('Backend: Successfully sent remove from cart response.');
});

// Clear entire cart
export const clearCart = handleAsynError(async (req, res, next) => { // <-- Yeh function yahan export ho raha hai
  console.log('Backend: Entering clearCart controller');
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    console.log('Backend: Cart not found for clearing for user:', userId);
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items = [];
  await cart.save();
  console.log('Backend: Cart cleared and saved.');

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    cart
  });
  console.log('Backend: Successfully sent clear cart response.');
});