import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import handleAsynError from '../middleware/handleAsynError.js';

// Get dashboard analytics overview
export const getDashboardAnalytics = handleAsynError(async (req, res, next) => {
  // Calculate date ranges
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(today.getMonth() - 2);

  // Get monthly revenue data
  const monthlyRevenueData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(today.getFullYear(), 0, 1) }, // Start of current year
        orderStatus: { $ne: "Cancelled" }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalPrice" }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Format monthly revenue for chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenue = months.map((month, index) => {
    const monthData = monthlyRevenueData.find(item => item._id === index + 1);
    return {
      month,
      revenue: monthData ? monthData.revenue : 0
    };
  });

  // Get monthly orders data
  const monthlyOrdersData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(today.getFullYear(), 0, 1) } // Start of current year
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Format monthly orders for chart
  const monthlyOrders = months.map((month, index) => {
    const monthData = monthlyOrdersData.find(item => item._id === index + 1);
    return {
      month,
      orders: monthData ? monthData.orders : 0
    };
  });

  // Get monthly user registration data
  const monthlyUsersData = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(today.getFullYear(), 0, 1) } // Start of current year
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        users: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Calculate cumulative user count per month
  let cumulativeUsers = 0;
  const userCount = await User.countDocuments({ createdAt: { $lt: new Date(today.getFullYear(), 0, 1) } });
  cumulativeUsers = userCount;

  const monthlyUsers = months.map((month, index) => {
    const monthData = monthlyUsersData.find(item => item._id === index + 1);
    if (monthData) {
      cumulativeUsers += monthData.users;
    }
    return {
      month,
      users: cumulativeUsers
    };
  });

  // Get order status counts
  const orderStatusCounts = await Order.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 }
      }
    }
  ]);

  const orderStatus = {
    processing: orderStatusCounts.find(status => status._id === "Processing")?.count || 0,
    shipped: orderStatusCounts.find(status => status._id === "Shipped")?.count || 0,
    delivered: orderStatusCounts.find(status => status._id === "Delivered")?.count || 0,
    cancelled: orderStatusCounts.find(status => status._id === "Cancelled")?.count || 0
  };

  // Get top product categories
  const topCategories = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);

  const formattedTopCategories = topCategories.map(category => ({
    name: category._id,
    count: category.count
  }));

  // Get top selling products
  const topSellingProducts = await Order.aggregate([
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.product",
        name: { $first: "$orderItems.name" },
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
      }
    },
    { $sort: { sales: -1 } },
    { $limit: 5 }
  ]);

  // Get top sellers
  const topSellers = await Product.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "seller",
        foreignField: "_id",
        as: "sellerInfo"
      }
    },
    { $unwind: "$sellerInfo" },
    {
      $group: {
        _id: "$seller",
        name: { $first: "$sellerInfo.name" },
        productCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "orders",
        let: { sellerId: "$_id" },
        pipeline: [
          { $unwind: "$orderItems" },
          {
            $lookup: {
              from: "products",
              localField: "orderItems.product",
              foreignField: "_id",
              as: "productInfo"
            }
          },
          { $unwind: "$productInfo" },
          {
            $match: {
              $expr: { $eq: ["$productInfo.seller", "$$sellerId"] }
            }
          },
          {
            $group: {
              _id: "$productInfo.seller",
              sales: { $sum: "$orderItems.quantity" },
              revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            }
          }
        ],
        as: "salesInfo"
      }
    },
    { $unwind: { path: "$salesInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        sales: { $ifNull: ["$salesInfo.sales", 0] },
        revenue: { $ifNull: ["$salesInfo.revenue", 0] }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  // Get current period revenue
  const currentPeriodRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: oneMonthAgo },
        orderStatus: { $ne: "Cancelled" }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" }
      }
    }
  ]);

  // Get previous period revenue
  const previousPeriodRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo },
        orderStatus: { $ne: "Cancelled" }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" }
      }
    }
  ]);

  const revenueData = {
    total: currentPeriodRevenue[0]?.total || 0,
    previous: previousPeriodRevenue[0]?.total || 0,
    change: previousPeriodRevenue[0]?.total 
      ? ((currentPeriodRevenue[0]?.total - previousPeriodRevenue[0]?.total) / previousPeriodRevenue[0]?.total * 100).toFixed(1)
      : 0,
    monthly: monthlyRevenue
  };

  // Get current period orders
  const currentPeriodOrders = await Order.countDocuments({
    createdAt: { $gte: oneMonthAgo }
  });

  // Get previous period orders
  const previousPeriodOrders = await Order.countDocuments({
    createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo }
  });

  const ordersData = {
    total: currentPeriodOrders,
    previous: previousPeriodOrders,
    change: previousPeriodOrders 
      ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders * 100).toFixed(1)
      : 0,
    status: orderStatus,
    monthly: monthlyOrders
  };

  // Get product stats
  const totalProducts = await Product.countDocuments();
  const outOfStockProducts = await Product.countDocuments({ stock: 0 });
  const lowStockProducts = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });

  const productsData = {
    total: totalProducts,
    outOfStock: outOfStockProducts,
    lowStock: lowStockProducts,
    topCategories: formattedTopCategories,
    topSelling: topSellingProducts
  };

  // Get user stats
  const totalUsers = await User.countDocuments({ role: "user" });
  const newUsers = await User.countDocuments({ 
    role: "user",
    createdAt: { $gte: oneMonthAgo }
  });
  const activeUsers = await User.countDocuments({ role: "user", active: true });

  const usersData = {
    total: totalUsers,
    new: newUsers,
    active: activeUsers,
    monthly: monthlyUsers
  };

  // Get seller stats
  const totalSellers = await User.countDocuments({ role: "seller" });
  const newSellers = await User.countDocuments({ 
    role: "seller",
    createdAt: { $gte: oneMonthAgo }
  });
  const activeSellers = await User.countDocuments({ role: "seller", active: true });

  const sellersData = {
    total: totalSellers,
    new: newSellers,
    active: activeSellers,
    topSellers: topSellers
  };

  // Return all analytics data
  res.status(200).json({
    success: true,
    data: {
      revenueData,
      ordersData,
      productsData,
      usersData,
      sellersData
    }
  });
});

// Get filtered analytics based on time range
export const getFilteredAnalytics = handleAsynError(async (req, res, next) => {
  const { timeRange } = req.query;
  
  let startDate;
  const endDate = new Date();
  
  switch(timeRange) {
    case 'daily':
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'weekly':
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'yearly':
      startDate = new Date(endDate);
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 1); // Default to monthly
  }
  
  // Get revenue data for the selected time period
  const revenueData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus: { $ne: "Cancelled" }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" }
      }
    }
  ]);
  
  // Get orders data
  const totalOrders = await Order.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  // Get order status breakdown
  const orderStatusCounts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get top selling products for the period
  const topSellingProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.product",
        name: { $first: "$orderItems.name" },
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
      }
    },
    { $sort: { sales: -1 } },
    { $limit: 5 }
  ]);
  
  // Get new users in the period
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  res.status(200).json({
    success: true,
    data: {
      timeRange,
      revenue: revenueData[0]?.total || 0,
      orders: totalOrders,
      orderStatus: orderStatusCounts,
      topProducts: topSellingProducts,
      newUsers
    }
  });
});
