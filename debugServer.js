import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: './config/config.env' });

const app = express();
const PORT = process.env.PORT || 8002;

// Print environment variables for debugging (exclude sensitive ones)
console.log('Environment variables:');
console.log(`PORT: ${PORT}`);
console.log(`DB URI exists: ${Boolean(process.env.db_URI)}`);
console.log(`JWT_SECRET_KEY exists: ${Boolean(process.env.JWT_SECRET_KEY)}`);
console.log(`CLOUDINARY_NAME exists: ${Boolean(process.env.CLOUDINARY_NAME)}`);

// Basic CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5177'],
  credentials: true,
}));

// Basic middleware
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test API is working!' });
});

// Try to connect to MongoDB
mongoose.connect(process.env.db_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    
    // Start server only after DB connection
    app.listen(PORT, () => {
      console.log(`✅ Test server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
