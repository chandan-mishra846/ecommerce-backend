import express from 'express';
import product from './routes/ProductRoutes.js';
import user from './routes/userRoutes.js';
import order from './routes/orderRoutes.js';
import cart from './routes/cartRoutes.js';
import seller from './routes/sellerRoutes.js';
import errorHandleMiddleWare from './middleware/error.js';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

// ✅ Allow frontend to send cookies (needed for persistent login)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

// ✅ Increased payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// ✅ Allow file uploads with limit
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}));

app.use('/images', express.static('public/images'));

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1/cart", cart);
app.use("/api/v1/seller", seller);

app.use(errorHandleMiddleWare);

export default app;
