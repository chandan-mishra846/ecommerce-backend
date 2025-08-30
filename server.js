import dotenv from 'dotenv';
import app from './app.js';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Explicitly connect to MongoDB with error handling
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.db_URI)
  .then((data) => {
    console.log(`✅ MongoDB connected successfully on host: ${data.connection.host}`);
    startServer();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Starting server without MongoDB connection...');
    startServer();
  });

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Server is shutting down due to uncaught exception.');
  process.exit(1);
});

const PORT = process.env.PORT || 8000;

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });

  // ✅ Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    console.log('Server is shutting down due to unhandled promise rejection.');
    server.close(() => {
      process.exit(1);
    });
  });
}
