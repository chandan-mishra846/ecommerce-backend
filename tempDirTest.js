import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: './config/config.env' });

const app = express();
const PORT = process.env.PORT || 8002;

// Basic CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5177'],
  credentials: true,
}));

// Check if temp directory exists
try {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Created temp directory at: ${tempDir}`);
  } else {
    console.log(`Temp directory exists at: ${tempDir}`);
  }
} catch (error) {
  console.error('Error checking/creating temp directory:', error);
}

app.get('/', (req, res) => {
  res.send('Temp directory test server is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});
