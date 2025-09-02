import express from 'express';
import product from './routes/ProductRoutes.js';
import user from './routes/userRoutes.js';
import order from './routes/orderRoutes.js';
import cart from './routes/cartRoutes.js';
import seller from './routes/sellerRoutes.js';
import analytics from './routes/analyticsRoutes.js';
import payment from './routes/paymentRoutes.js';
import errorHandleMiddleWare from './middleware/error.js';
import debugRoutes from './middleware/debugRoutes.js';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();

// ✅ Allow frontend to send cookies (needed for persistent login)
app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin (not recommended for production)
    callback(null, true);
  },
  credentials: true,
}));

// ✅ Increased payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`Created temp directory at: ${tempDir}`);
}

// ✅ Allow file uploads with limit
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "./temp/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}));

// Add debug middleware to log request and response details
app.use(debugRoutes);

app.use('/images', express.static('public/images'));

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1/cart", cart);
app.use("/api/v1/seller", seller);
app.use("/api/v1/analytics", analytics);
app.use("/api/v1/payment", payment);
app.use("/api/v1/payment", payment);

app.use(errorHandleMiddleWare);

export default app;
