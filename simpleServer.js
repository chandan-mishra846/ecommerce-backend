import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config/config.env' });

const app = express();
const PORT = process.env.PORT || 8002;

// Configure CORS to accept all origins (for testing only)
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

// Basic JSON middleware
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Start server with detailed error handling
try {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Try accessing: http://localhost:${PORT}/api/test`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
