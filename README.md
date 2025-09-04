# � E-Commerce Backend API Server

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.18-blue?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb)
![J### 🗄️ **Database Configuration**
```javascript
// config/db.js
const connectDatabase = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};
```

---

## 📡 Complete API Documentation

### 🔑 **Authentication Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/register` | Register new user | Public |
| POST | `/api/v1/login` | User login | Public |
| POST | `/api/v1/logout` | User logout | Private |
| GET | `/api/v1/profile` | Get user profile | Private |
| PUT | `/api/v1/profile/update` | Update profile | Private |
| PUT | `/api/v1/password/update` | Change password | Private |
| POST | `/api/v1/password/forgot` | Forgot password | Public |
| PUT | `/api/v1/password/reset/:token` | Reset password | Public |

### 📦 **Product Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/products` | Get all products with filters | Public |
| GET | `/api/v1/products/:id` | Get single product | Public |
| POST | `/api/v1/products/new` | Create product | Seller/Admin |
| PUT | `/api/v1/products/:id` | Update product | Seller/Admin |
| DELETE | `/api/v1/products/:id` | Delete product | Seller/Admin |
| PUT | `/api/v1/products/:id/review` | Add/Update review | Private |
| GET | `/api/v1/products/:id/reviews` | Get product reviews | Public |

### 🛒 **Cart & Order Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/cart` | Get user cart | Private |
| POST | `/api/v1/cart/add` | Add to cart | Private |
| PUT | `/api/v1/cart/update/:itemId` | Update cart item | Private |
| DELETE | `/api/v1/cart/remove/:itemId` | Remove cart item | Private |
| POST | `/api/v1/orders/new` | Create new order | Private |
| GET | `/api/v1/orders/me` | Get user orders | Private |
| GET | `/api/v1/orders/:id` | Get single order | Private |

### 💳 **Payment Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/payment/razorpay/order` | Create Razorpay order | Private |
| POST | `/api/v1/payment/razorpay/verify` | Verify Razorpay payment | Private |
| GET | `/api/v1/payment/razorpay/key` | Get Razorpay key | Private |
| POST | `/api/v1/payment/stripe/process` | Process Stripe payment | Private |

### 🏪 **Seller Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/seller/register` | Seller registration | Public |
| GET | `/api/v1/seller/products` | Get seller products | Seller |
| GET | `/api/v1/seller/orders` | Get seller orders | Seller |
| PUT | `/api/v1/seller/orders/:id/status` | Update order status | Seller |
| GET | `/api/v1/seller/analytics` | Get seller analytics | Seller |

### 🎛️ **Admin Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/admin/users` | Get all users | Admin |
| PUT | `/api/v1/admin/users/:id/role` | Update user role | Admin |
| DELETE | `/api/v1/admin/users/:id` | Delete user | Admin |
| GET | `/api/v1/admin/products` | Get all products | Admin |
| GET | `/api/v1/admin/orders` | Get all orders | Admin |
| GET | `/api/v1/admin/analytics` | Get platform analytics | Admin |

---

## 🗄️ Database Schema Overview

### 👤 **User Model**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['user', 'seller', 'admin'],
  avatar: { public_id, url },
  isVerified: Boolean,
  addresses: [AddressSchema],
  createdAt: Date,
  updatedAt: Date
}
```

### 📦 **Product Model**
```javascript
{
  name: String,
  description: String,
  price: Number,
  images: [{ public_id, url }],
  category: String,
  brand: String,
  stock: Number,
  ratings: Number,
  reviews: [ReviewSchema],
  seller: ObjectId (ref: User),
  createdAt: Date
}
```

### 🛒 **Cart Model**
```javascript
{
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    price: Number,
    addedAt: Date
  }],
  totalAmount: Number
}
```

### 📦 **Order Model**
```javascript
{
  user: ObjectId (ref: User),
  orderItems: [OrderItemSchema],
  shippingInfo: AddressSchema,
  paymentInfo: PaymentSchema,
  orderStatus: Enum ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
  totalPrice: Number,
  createdAt: Date
}
```

---

## 🔒 Security Features

- **JWT Authentication** with HTTP-only cookies
- **Password Hashing** using bcrypt (12 rounds)
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS Configuration** with whitelist
- **Helmet.js** security headers
- **File Upload Security** with type validation
- **Payment Signature Verification**
- **Role-based Access Control**
- **Environment Variables** for sensitive data

---

## 📊 Performance Optimizations

- **Database Indexing** for frequently queried fields
- **API Response Compression** with gzip
- **Image Optimization** via Cloudinary
- **Pagination** for large datasets
- **Caching Strategies** with Redis (ready)
- **Connection Pooling** for MongoDB
- **Async/Await** for non-blocking operations
- **Error Handling** without memory leaks

---

## 🧪 Testing

### **Test Coverage**
- Unit Tests for Controllers
- Integration Tests for API Endpoints
- Database Model Tests
- Authentication Flow Tests
- Payment Integration Tests

### **Running Tests**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 🚀 Deployment

### **Environment Setup**
```env
NODE_ENV=production
PORT=8000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://yourdomain.com
```

### **Production Deployment Options**
- **Heroku**: Git-based deployment
- **DigitalOcean**: App Platform deployment
- **AWS EC2**: VM-based deployment
- **Docker**: Containerized deployment

### **Process Management**
```bash
# Using PM2 for production
pm2 start server.js --name "ecommerce-api"
pm2 startup
pm2 save
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Setup**
```bash
# Clone repository
git clone https://github.com/chandan-mishra846/ecommerce-backend.git
cd ecommerce-backend

# Install dependencies
npm install

# Set up environment
cp config/config.env.example config/config.env

# Start development server
npm run dev
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Node.js Community** for the robust runtime environment
- **Express.js Team** for the flexible web framework
- **MongoDB Team** for the scalable database solution
- **Mongoose Team** for elegant MongoDB object modeling
- **Cloudinary** for image management solutions
- **Razorpay** for payment processing in India
- **Stripe** for international payment capabilities

---

## 📞 Support

For support and queries:
- 🐛 **Issues**: [GitHub Issues](https://github.com/chandan-mishra846/ecommerce-backend/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/chandan-mishra846/ecommerce-backend/discussions)
- 📧 **Email**: support@ecommerce-backend.com
- 📚 **Documentation**: [API Docs](https://documenter.getpostman.com)

---

## 🗺️ Roadmap

### **Upcoming Features**
- [ ] GraphQL API integration
- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Social login integration
- [ ] Advanced search with Elasticsearch
- [ ] Microservices architecture migration
- [ ] Machine learning recommendations

### **Version History**
- **v2.0.0** - Complete API restructure with advanced features (Current)
- **v1.3.0** - Enhanced order management and analytics
- **v1.2.0** - Seller management system
- **v1.1.0** - Payment integration and cart functionality
- **v1.0.0** - Initial release with core features

---

<div align="center">

### 🌟 **Built with ❤️ by [Chandan Mishra]**

**Star ⭐ this repository if you find it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/chandan-mishra846/ecommerce-backend?style=social)](https://github.com/chandan-mishra846/ecommerce-backend/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/chandan-mishra846/ecommerce-backend?style=social)](https://github.com/chandan-mishra846/ecommerce-backend/network/members)

**[🔗 Frontend Repository](https://github.com/chandan-mishra846/ecommerce-frontend)** • **[🚀 Live API](https://your-api-url.com)** • **[📚 Documentation](https://documenter.getpostman.com)**

---

*Powering the future of e-commerce* 🚀

</div>mg.shields.io/badge/JWT-9.0-red?style=for-the-badge&logo=jsonwebtokens)

**A comprehensive, production-ready e-commerce backend API built with Node.js and Express.js**

[🔗 Frontend Repository](https://github.com/chandan-mishra846/ecommerce-frontend) • [📚 API Documentation](#-api-documentation) • [🚀 Live Demo](https://your-api-url.com)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔧 Configuration](#-configuration)
- [📡 API Documentation](#-api-documentation)
- [🗄️ Database Schema](#️-database-schema)
- [🔒 Security](#-security)
- [📊 Performance](#-performance)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

---

## 🌟 Overview

This is a **complete, scalable e-commerce backend API** built with modern Node.js technologies. It provides a robust foundation for building e-commerce applications with comprehensive user management, product catalog, shopping cart, order processing, and payment integration capabilities.

### 🎯 **Key Highlights**
- **RESTful API Design** with consistent response patterns
- **JWT-based Authentication** with refresh token support
- **Role-based Access Control** (Customer, Seller, Admin)
- **Comprehensive Payment Integration** (Razorpay & Stripe)
- **Advanced Product Management** with categories and search
- **Real-time Order Tracking** with status updates
- **Email Notification System** for order updates
- **File Upload Support** with Cloudinary integration
- **Rate Limiting & Security** measures implemented
- **Comprehensive Error Handling** with proper HTTP status codes

### � **Related Repositories**
- **Frontend Application**: [E-Commerce Frontend](https://github.com/chandan-mishra846/ecommerce-frontend)
- **Admin Dashboard**: Integrated within main application
- **Mobile App**: *Coming Soon*

---

## ✨ Features

### 🔐 **Authentication & Authorization**
- [x] **User Registration & Login** with email verification
- [x] **JWT Authentication** with access and refresh tokens
- [x] **Password Reset** via email with secure tokens
- [x] **Role-based Access Control** (Customer, Seller, Admin)
- [x] **Social Login** integration ready (Google, Facebook)
- [x] **Account Verification** via email
- [x] **Two-Factor Authentication** support
- [x] **Session Management** with token blacklisting

### 📦 **Product Management**
- [x] **CRUD Operations** for products with admin controls
- [x] **Advanced Search & Filtering** by category, price, ratings
- [x] **Product Categories** with hierarchical structure
- [x] **Product Reviews & Ratings** with user verification
- [x] **Inventory Management** with stock tracking
- [x] **Product Images** upload with Cloudinary
- [x] **Product Variants** (size, color, etc.)
- [x] **Bulk Operations** for admin efficiency

### � **Shopping Cart & Orders**
- [x] **Shopping Cart Management** with persistent storage
- [x] **Order Processing** with comprehensive workflow
- [x] **Order Tracking** with real-time status updates
- [x] **Order History** with detailed information
- [x] **Wishlist Management** for saved items
- [x] **Order Cancellation** with refund processing
- [x] **Bulk Order Processing** for sellers

### 💳 **Payment Integration**
- [x] **Razorpay Integration** for Indian payments
- [x] **Stripe Integration** for international payments
- [x] **Payment Verification** with webhook support
- [x] **Refund Processing** automated system
- [x] **Payment History** tracking
- [x] **Multiple Payment Methods** support
- [x] **Currency Conversion** for international sales

### 🏪 **Seller Management**
- [x] **Seller Registration** with verification process
- [x] **Seller Dashboard** with analytics
- [x] **Product Management** for sellers
- [x] **Order Fulfillment** workflow
- [x] **Revenue Tracking** and reporting
- [x] **Seller Verification** process
- [x] **Commission Management** system

### 🎛️ **Admin Panel**
- [x] **User Management** with role assignment
- [x] **Product Moderation** and approval
- [x] **Order Management** with override capabilities
- [x] **Analytics & Reporting** comprehensive dashboards
- [x] **System Configuration** and settings
- [x] **Content Management** for static pages
- [x] **Security Monitoring** and logs

### 📧 **Communication & Notifications**
- [x] **Email Notifications** for order updates
- [x] **SMS Notifications** for critical updates
- [x] **In-app Notifications** system
- [x] **Newsletter Management** for marketing
- [x] **Customer Support** ticket system
- [x] **Automated Emails** for various events

---

## 🏗️ Architecture

### 📁 **Project Structure**
```
ecommerce-backend/
├── 📁 config/                 # Configuration files
│   ├── db.js                  # Database connection
│   └── config.env.example     # Environment variables template
│
├── 📁 controllers/            # Request handlers
│   ├── analyticsController.js # Analytics & reporting
│   ├── cartController.js      # Shopping cart operations
│   ├── orderController.js     # Order management
│   ├── paymentController.js   # Payment processing
│   ├── productController.js   # Product operations
│   ├── sellerController.js    # Seller management
│   └── userController.js      # User operations
│
├── 📁 middleware/             # Custom middleware
│   ├── error.js              # Error handling
│   ├── handleAsynError.js    # Async error wrapper
│   ├── userAuth.js           # Authentication middleware
│   └── debugRoutes.js        # Development debugging
│
├── 📁 models/                 # Database schemas
│   ├── Cart.js               # Shopping cart schema
│   ├── orderModel.js         # Order schema
│   ├── productModel.js       # Product schema
│   └── userModel.js          # User schema
│
├── 📁 routes/                 # API route definitions
│   ├── analyticsRoutes.js    # Analytics endpoints
│   ├── cartRoutes.js         # Cart endpoints
│   ├── contactRoutes.js      # Contact/support endpoints
│   ├── orderRoutes.js        # Order endpoints
│   ├── paymentRoutes.js      # Payment endpoints
│   ├── ProductRoutes.js      # Product endpoints
│   ├── sellerRoutes.js       # Seller endpoints
│   └── userRoutes.js         # User endpoints
│
├── 📁 utils/                  # Utility functions
│   ├── apiFunctionality.js   # API helpers
│   ├── handleError.js        # Error utilities
│   ├── jwtTokens.js          # JWT utilities
│   └── sendEmail.js          # Email utilities
│
├── 📁 temp/                   # Temporary files
├── app.js                     # Express app configuration
├── server.js                  # Server entry point
└── package.json              # Dependencies & scripts
```

### 🔧 **Technical Architecture**

#### **API Layer**
```
Client Request → Router → Middleware → Controller → Service → Database
                                   ↓
                              Error Handler → Response
```

#### **Authentication Flow**
```
Login Request → Validate Credentials → Generate JWT → Set HTTP-Only Cookie
                                                   ↓
Protected Route → Verify JWT → Extract User → Proceed
```

#### **Data Flow**
```
Frontend → API Gateway → Authentication → Business Logic → Database
                                       ↓
                                Response → Cache → Frontend
```

---

## 🚀 Quick Start

### 📋 **Prerequisites**
- **Node.js** 18.x or higher
- **MongoDB** 6.0 or higher (local or Atlas)
- **npm** or **yarn** package manager
- **Git** for version control

### ⚡ **Installation**

#### **1. Clone Repository**
```bash
# Clone the repository
git clone https://github.com/chandan-mishra846/ecommerce-backend.git
cd ecommerce-backend

# Install dependencies
npm install
```

#### **2. Environment Setup**
```bash
# Copy environment template
cp config/config.env.example config/config.env

# Edit environment variables
nano config/config.env
```

#### **3. Environment Variables**
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/ecommerce
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Cloudinary (Image Upload)
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment Gateways
RAZORPAY_API_KEY=your-razorpay-key
RAZORPAY_API_SECRET=your-razorpay-secret

STRIPE_API_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### **4. Database Setup**
```bash
# Start MongoDB (if running locally)
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### **5. Start Development Server**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Debug mode
npm run debug
```

### 🎯 **Verification**
```bash
# Test API connection
curl http://localhost:4000/api/v1/health

# Expected response:
{
  "success": true,
  "message": "API is running successfully",
  "timestamp": "2024-12-20T10:30:00.000Z"
}
```

---

## 🔧 Configuration

### ⚙️ **Environment Configuration**

#### **Development Environment**
```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/ecommerce_dev
JWT_SECRET=dev-jwt-secret-key
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

#### **Production Environment**
```env
NODE_ENV=production
PORT=8000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce_prod
JWT_SECRET=super-secure-production-jwt-secret
FRONTEND_URL=https://yourdomain.com
LOG_LEVEL=error
```

### 📦 **Package Scripts**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "debug": "nodemon --inspect server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "seed": "node scripts/seedDatabase.js",
    "backup": "node scripts/backupDatabase.js"
  }
}
```

### �️ **Database Configuration**
```javascript
// config/db.js
const connectDatabase = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};
```


