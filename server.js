import dotenv from 'dotenv';
import app from './app.js';
import { connectMongoDataBase } from './config/db.js';

dotenv.config({ path: 'backend/config/config.env' });

import { v2 as cloudinary } from 'cloudinary';
connectMongoDataBase();

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
