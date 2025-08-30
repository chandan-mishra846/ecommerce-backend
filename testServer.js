import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config/config.env' });

const app = express();
const PORT = process.env.PORT || 8002;

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});
