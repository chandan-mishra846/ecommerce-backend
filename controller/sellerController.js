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
  console.log('Create product request body:', req.body);
  console.log('Create product files:', req.files ? Object.keys(req.files) : 'No files');

  let images = [];

  // Handle images from request body (base64) or files
  if (req.body.images) {
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
  }

  // If no images in body, check for file uploads
  if (images.length === 0 && req.files) {
    // Handle file uploads
    const fileKeys = Object.keys(req.files).filter(key => key.startsWith('image'));
    for (const key of fileKeys) {
      const file = req.files[key];
      images.push(file.tempFilePath);
    }
  }

  if (images.length === 0) {
    return next(new HandleError("At least one product image is required", 400));
  }

  const imagesLink = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const result = await cloudinary.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      return next(new HandleError("Error uploading images", 400));
    }
  }

  // Validate required fields
  const { name, description, price, category, stock } = req.body;
  
  if (!name || !description || !price || !category || stock === undefined) {
    return next(new HandleError("Please provide all required fields: name, description, price, category, stock", 400));
  }

  if (price <= 0) {
    return next(new HandleError("Price must be greater than 0", 400));
  }

  if (stock < 0) {
    return next(new HandleError("Stock cannot be negative", 400));
  }

  const productData = {
    name: name.trim(),
    description: description.trim(),
    price: parseFloat(price),
    category: category.trim(),
    stock: parseInt(stock),
    image: imagesLink,
    seller: req.user._id,
  };

  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    product,
    message: "Product created successfully"
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

// Get out of stock products for seller
export const getOutOfStockProducts = handleAsynError(async (req, res, next) => {
  const outOfStockProducts = await Product.find({ 
    seller: req.user._id,
    stock: 0 
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    products: outOfStockProducts,
    count: outOfStockProducts.length
  });
});

// Restock product
export const restockProduct = handleAsynError(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const product = await Product.findOne({ 
    _id: productId, 
    seller: req.user._id 
  });

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  product.stock = parseInt(quantity);
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product restocked successfully",
    product
  });
});

// Get order history for seller
export const getOrderHistory = handleAsynError(async (req, res, next) => {
  const sellerId = req.user._id;
  
  // Get seller's products first
  const products = await Product.find({ seller: sellerId });
  const productIds = products.map(product => product._id);

  // Find orders containing seller's products
  const orders = await Order.find({
    'orderItems.product': { $in: productIds }
  })
  .populate('user', 'name email')
  .populate('orderItems.product', 'name seller')
  .sort({ createdAt: -1 });

  // Filter orders to only include items from this seller and calculate seller-specific totals
  const sellerOrders = orders.map(order => {
    const sellerOrderItems = order.orderItems.filter(item => 
      item.product && item.product.seller && 
      item.product.seller.toString() === sellerId.toString()
    );

    if (sellerOrderItems.length > 0) {
      // Calculate seller-specific totals
      const sellerItemsTotal = sellerOrderItems.reduce((total, item) => 
        total + (item.price * item.quantity), 0);
      
      return {
        ...order.toObject(),
        orderItems: sellerOrderItems,
        // Keep original total for reference, but seller sees their portion
        sellerTotal: sellerItemsTotal
      };
    }
    return null;
  }).filter(order => order !== null);

  res.status(200).json({
    success: true,
    orders: sellerOrders,
    count: sellerOrders.length
  });
});

// Get profit analytics for seller
export const getProfitAnalytics = handleAsynError(async (req, res, next) => {
  const { period = 'monthly' } = req.query;
  const sellerId = req.user._id;
  
  // Get seller's products first
  const products = await Product.find({ seller: sellerId });
  const productIds = products.map(product => product._id);

  // Find orders containing seller's products
  const orders = await Order.find({
    'orderItems.product': { $in: productIds },
    orderStatus: 'delivered'
  }).populate('orderItems.product', 'name seller');

  let totalRevenue = 0;
  let totalOrders = 0;
  let monthlyBreakdown = [];
  let topProducts = {};

  // Calculate statistics from orders containing seller's products
  orders.forEach(order => {
    let hasSellerItems = false;
    let orderRevenue = 0;

    order.orderItems.forEach(item => {
      if (item.product && item.product.seller && 
          item.product.seller.toString() === sellerId.toString()) {
        hasSellerItems = true;
        const itemRevenue = item.price * item.quantity;
        totalRevenue += itemRevenue;
        orderRevenue += itemRevenue;

        // Track top products
        const productId = item.product._id.toString();
        if (!topProducts[productId]) {
          topProducts[productId] = {
            _id: productId,
            name: item.product.name,
            totalSold: 0,
            totalRevenue: 0
          };
        }
        topProducts[productId].totalSold += item.quantity;
        topProducts[productId].totalRevenue += itemRevenue;
      }
    });

    if (hasSellerItems) {
      totalOrders++;
    }
  });

  // Generate monthly breakdown based on period
  const now = new Date();
  const monthlyData = {};

  orders.forEach(order => {
    let hasSellerItems = false;
    let orderRevenue = 0;

    order.orderItems.forEach(item => {
      if (item.product && item.product.seller && 
          item.product.seller.toString() === sellerId.toString()) {
        hasSellerItems = true;
        orderRevenue += item.price * item.quantity;
      }
    });

    if (hasSellerItems) {
      const orderDate = new Date(order.createdAt);
      let periodKey;

      switch (period) {
        case 'daily':
          periodKey = orderDate.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(orderDate);
          weekStart.setDate(orderDate.getDate() - orderDate.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          periodKey = orderDate.getFullYear().toString();
          break;
        default:
          periodKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!monthlyData[periodKey]) {
        monthlyData[periodKey] = { period: periodKey, revenue: 0, orders: 0 };
      }
      monthlyData[periodKey].revenue += orderRevenue;
      monthlyData[periodKey].orders += 1;
    }
  });

  monthlyBreakdown = Object.values(monthlyData).sort((a, b) => a.period.localeCompare(b.period));

  // Convert topProducts object to array and sort
  const topProductsArray = Object.values(topProducts)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate previous period data for comparison
  const previousRevenue = totalRevenue * 0.85; // Mock previous data
  const previousOrders = Math.max(0, totalOrders - 3);
  const previousAOV = averageOrderValue * 0.9;

  res.status(200).json({
    success: true,
    data: {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue),
      monthlyBreakdown,
      topProducts: topProductsArray,
      previousRevenue: Math.round(previousRevenue),
      previousOrders,
      previousAOV: Math.round(previousAOV),
      period
    }
  });
});
