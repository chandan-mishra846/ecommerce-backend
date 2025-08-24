import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/productModel.js';
import User from './models/userModel.js';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './config/config.env' });

const fixProducts = async () => {
  try {
    await mongoose.connect(process.env.db_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    console.log('✅ Cleared existing products');

    let testUser = await User.findOne({ email: 'admin@test.com' });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      testUser = await User.create({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        avatar: {
          public_id: 'test_avatar_1',
          url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        }
      });
    }

    const sampleProducts = [
      {
        name: "Wireless Bluetooth Headphones",
        description: "High-quality wireless headphones with noise cancellation.",
        price: 99.99,
        category: "Electronics",
        stock: 25,
        image: [{ public_id: "headphones_1", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center" }],
        user: testUser._id
      },
      {
        name: "Smart Fitness Watch",
        description: "Track your fitness goals with heart rate monitoring.",
        price: 199.99,
        category: "Electronics",
        stock: 15,
        image: [{ public_id: "watch_1", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&crop=center" }],
        user: testUser._id
      },
      {
        name: "Organic Cotton T-Shirt",
        description: "Comfortable and eco-friendly cotton t-shirt.",
        price: 29.99,
        category: "Clothing",
        stock: 50,
        image: [{ public_id: "tshirt_1", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center" }],
        user: testUser._id
      },
      {
        name: "Stainless Steel Water Bottle",
        description: "Keep your drinks cold for 24 hours.",
        price: 24.99,
        category: "Home & Garden",
        stock: 30,
        image: [{ public_id: "bottle_1", url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop&crop=center" }],
        user: testUser._id
      }
    ];

    await Product.insertMany(sampleProducts);
    console.log('✅ FIXED! Images will no longer change on refresh!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixProducts();