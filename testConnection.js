import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: './config/config.env' });

console.log('Attempting to connect to MongoDB...');
console.log(`Database URI: ${process.env.db_URI ? 'Found DB URI' : 'DB URI is missing'}`);

// Connect to MongoDB
mongoose.connect(process.env.db_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
