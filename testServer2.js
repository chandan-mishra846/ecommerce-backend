import dotenv from 'dotenv';
import testApp from './testApp.js';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: './config/config.env' });

const PORT = process.env.PORT || 8002;

// Try connecting to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.db_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    
    // Start server after successful DB connection
    testApp.listen(PORT, () => {
      console.log(`✅ Test server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    // Continue even if MongoDB fails
    console.log('Starting server without MongoDB connection...');
    
    testApp.listen(PORT, () => {
      console.log(`✅ Test server running on port ${PORT} (without MongoDB)`);
    });
  });
