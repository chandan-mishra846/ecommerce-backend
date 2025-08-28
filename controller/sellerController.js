import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import HandleError from '../utils/handleError.js';
import handleAsynError from '../middleware/handleAsynError.js';
import { v2 as cloudinary } from 'cloudinary';

// Get seller's products
export const getSellerProducts = handleAsynError(async (req, res, next) => {
  const products = await Product.find({ seller: req.user._id });
  
  res.status(200).json({
    success: true,
    products,
    count: products.length
  });
});

// Create new product (seller only)
export const createSellerProduct = handleAsynError(async (req, res, next) => {
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  const imagesLink = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.uploader.upload(images[i], {
      folder: "products",
    });

    imagesLink.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.image = imagesLink;
  req.body.seller = req.user._id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});

// Update seller's product
export const updateSellerProduct = handleAsynError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  // Check if the product belongs to the seller
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new HandleError("You can only update your own products", 403));
  }

  // Handle images if provided
  if (req.body.images !== undefined) {
    // Delete old images
    for (let i = 0; i < product.image.length; i++) {
      await cloudinary.uploader.destroy(product.image[i].public_id);
    }

    let images = [];

    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    const imagesLink = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.image = imagesLink;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete seller's product
export const deleteSellerProduct = handleAsynError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  // Check if the product belongs to the seller
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new HandleError("You can only delete your own products", 403));
  }

  // Delete images from cloudinary
  for (let i = 0; i < product.image.length; i++) {
    await cloudinary.uploader.destroy(product.image[i].public_id);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Get orders for seller's products
export const getSellerOrders = handleAsynError(async (req, res, next) => {
  // Find all orders that contain seller's products
  const sellerProducts = await Product.find({ seller: req.user._id }).select('_id');
  const productIds = sellerProducts.map(product => product._id);

  const orders = await Order.find({
    'orderItems.product': { $in: productIds }
  }).populate('user', 'name email');

  // Filter order items to only include seller's products
  const sellerOrders = orders.map(order => {
    const sellerOrderItems = order.orderItems.filter(item => 
      productIds.some(id => id.toString() === item.product.toString())
    );
    
    return {
      ...order._doc,
      orderItems: sellerOrderItems
    };
  }).filter(order => order.orderItems.length > 0);

  res.status(200).json({
    success: true,
    orders: sellerOrders,
    count: sellerOrders.length
  });
});

// Update order status (for seller's products only)
export const updateSellerOrderStatus = handleAsynError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new HandleError("Order not found", 404));
  }

  // Check if order contains seller's products
  const sellerProducts = await Product.find({ seller: req.user._id }).select('_id');
  const productIds = sellerProducts.map(product => product._id.toString());
  
  const hasSellerProducts = order.orderItems.some(item => 
    productIds.includes(item.product.toString())
  );

  if (!hasSellerProducts && req.user.role !== 'admin') {
    return next(new HandleError("You can only update orders containing your products", 403));
  }

  order.orderStatus = req.body.status;
  if (req.body.status === 'Delivered') {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    order
  });
});

// Get seller statistics
export const getSellerStats = handleAsynError(async (req, res, next) => {
  const sellerId = req.user._id;

  // Get seller's products
  const products = await Product.find({ seller: sellerId });
  const productIds = products.map(product => product._id);

  // Get orders containing seller's products
  const orders = await Order.find({
    'orderItems.product': { $in: productIds }
  });

  // Calculate statistics
  let totalRevenue = 0;
  let totalOrders = 0;
  let deliveredOrders = 0;
  let outOfStockProducts = 0;

  products.forEach(product => {
    if (product.stock === 0) {
      outOfStockProducts++;
    }
  });

  orders.forEach(order => {
    const sellerOrderItems = order.orderItems.filter(item => 
      productIds.some(id => id.toString() === item.product.toString())
    );
    
    if (sellerOrderItems.length > 0) {
      totalOrders++;
      if (order.orderStatus === 'Delivered') {
        deliveredOrders++;
        sellerOrderItems.forEach(item => {
          totalRevenue += item.price * item.quantity;
        });
      }
    }
  });

  res.status(200).json({
    success: true,
    stats: {
      totalProducts: products.length,
      totalOrders,
      deliveredOrders,
      totalRevenue,
      outOfStockProducts,
      pendingOrders: totalOrders - deliveredOrders
    }
  });
});
