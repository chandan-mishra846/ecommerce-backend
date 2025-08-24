import Cart from '../models/Cart.js';
import Product from '../models/productModel.js';
import handleAsynError from '../middleware/handleAsynError.js';

// Add item to cart
export const addToCart = handleAsynError(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.id;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if product is in stock
  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} items available in stock`
    });
  }

  // Find existing cart or create new one
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: []
    });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(item =>
    item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity: quantity,
      price: product.price
    });
  }

  await cart.save();

  // Populate product details
  await cart.populate('items.product', 'name price image stock');

  res.status(200).json({
    success: true,
    message: 'Item added to cart successfully',
    cart
  });
});

// Get user's cart
export const getCart = handleAsynError(async (req, res, next) => {
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId })
    .populate('items.product', 'name price image stock');

  if (!cart) {
    return res.status(200).json({
      success: true,
      cart: { items: [] }
    });
  }

  res.status(200).json({
    success: true,
    cart
  });
});

// Update cart item quantity
export const updateCartItem = handleAsynError(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  if (quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be greater than 0'
    });
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  const item = cart.items.id(itemId);
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  // Check stock availability
  const product = await Product.findById(item.product);
  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} items available in stock`
    });
  }

  item.quantity = quantity;
  await cart.save();

  await cart.populate('items.product', 'name price image stock');

  res.status(200).json({
    success: true,
    message: 'Cart item updated successfully',
    cart
  });
});

// Remove item from cart
export const removeFromCart = handleAsynError(async (req, res, next) => {
  const { itemId } = req.params;
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items = cart.items.filter(item => item._id.toString() !== itemId);
  await cart.save();

  await cart.populate('items.product', 'name price image stock');

  res.status(200).json({
    success: true,
    message: 'Item removed from cart successfully',
    cart
  });
});

// Clear entire cart
export const clearCart = handleAsynError(async (req, res, next) => {
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    cart
  });
});
