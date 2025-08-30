import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: './config/config.env' });

console.log('=== DATABASE CONNECTION TEST ===');
console.log(`MongoDB URI exists: ${Boolean(process.env.db_URI)}`);

// Only show first few characters of connection string for security
if (process.env.db_URI) {
  const visible = process.env.db_URI.substring(0, 20) + '...';
  console.log(`MongoDB URI starts with: ${visible}`);
  
  // Check if connection string looks valid
  if (process.env.db_URI.includes('mongodb+srv://') || process.env.db_URI.includes('mongodb://')) {
    console.log('MongoDB URI format appears valid');
  } else {
    console.error('WARNING: MongoDB URI format may be invalid');
  }
}

// Create a timeout for the connection attempt
const timeoutId = setTimeout(() => {
  console.error('Connection attempt timed out after 10 seconds');
  process.exit(1);
}, 10000);

// Try to connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.db_URI)
  .then(() => {
    clearTimeout(timeoutId);
    console.log('✅ MongoDB connected successfully!');
    
    // List some collections to verify
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Try to count documents in a collection
    if (collections.length > 0) {
      return mongoose.connection.db.collection(collections[0].name).countDocuments();
    }
    return 0;
  })
  .then((count) => {
    if (count > 0) {
      console.log(`First collection has ${count} documents`);
    }
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(timeoutId);
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error details:', error);
    
    // Check for common MongoDB connection issues
    if (error.message.includes('ENOTFOUND')) {
      console.error('The MongoDB host cannot be found. Check your connection string.');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('Connection to MongoDB timed out. Check your network or firewall settings.');
    } else if (error.message.includes('Authentication failed')) {
      console.error('MongoDB authentication failed. Check your username and password.');
    } else if (error.message.includes('topology was destroyed')) {
      console.error('MongoDB topology was destroyed. This might be due to a connection timeout.');
    }
    
    process.exit(1);
  });
