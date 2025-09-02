import mongoose from 'mongoose';
import Product from './models/productModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.db_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Check products in database
const checkProducts = async () => {
  try {
    await connectDB();
    
    const productCount = await Product.countDocuments();
    console.log(`Total products in database: ${productCount}`);
    
    if (productCount === 0) {
      console.log('No products found in database. Adding sample products...');
      
      // Add sample products
      const sampleProducts = [
        {
          name: "Wireless Bluetooth Headphones",
          description: "High-quality wireless Bluetooth headphones with noise cancellation",
          price: 99.99,
          category: "Electronics",
          stock: 50,
          images: [
            {
              public_id: "sample_1",
              url: "/images/placeholder.png"
            }
          ],
          seller: new mongoose.Types.ObjectId(), // Dummy seller ID
          ratings: 4.5,
          numberOfReviews: 25
        },
        {
          name: "Smartphone",
          description: "Latest Android smartphone with 128GB storage",
          price: 599.99,
          category: "Electronics",
          stock: 30,
          images: [
            {
              public_id: "sample_2",
              url: "/images/placeholder.png"
            }
          ],
          seller: new mongoose.Types.ObjectId(), // Dummy seller ID
          ratings: 4.3,
          numberOfReviews: 45
        },
        {
          name: "Running Shoes",
          description: "Comfortable running shoes for daily exercise",
          price: 79.99,
          category: "Sports",
          stock: 100,
          images: [
            {
              public_id: "sample_3",
              url: "/images/placeholder.png"
            }
          ],
          seller: new mongoose.Types.ObjectId(), // Dummy seller ID
          ratings: 4.7,
          numberOfReviews: 78
        },
        {
          name: "Coffee Maker",
          description: "Automatic coffee maker with programmable timer",
          price: 129.99,
          category: "Home & Kitchen",
          stock: 25,
          images: [
            {
              public_id: "sample_4",
              url: "/images/placeholder.png"
            }
          ],
          seller: new mongoose.Types.ObjectId(), // Dummy seller ID
          ratings: 4.2,
          numberOfReviews: 32
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('✅ Sample products added successfully!');
    } else {
      console.log('Products found in database:');
      const products = await Product.find().limit(5).select('name price category stock');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${product.price} (Stock: ${product.stock})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    mongoose.disconnect();
  }
};

checkProducts();
