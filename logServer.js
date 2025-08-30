import dotenv from 'dotenv';
import app from './app.js';
import { connectMongoDataBase } from './config/db.js';
import fs from 'fs';
import path from 'path';

// Set up logging
const logFile = path.join(process.cwd(), 'server-log.txt');
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
};

// Clear previous log
try {
  fs.writeFileSync(logFile, '--- Server Start ---\n');
  log('Log file initialized');
} catch (error) {
  console.error('Failed to initialize log file:', error);
}

try {
  log('Loading environment variables');
  dotenv.config({ path: './config/config.env' });
  log(`PORT from env: ${process.env.PORT || 'not found'}`);
  log(`DB URI exists: ${Boolean(process.env.db_URI)}`);

  log('Setting up Cloudinary');
  try {
    import('cloudinary').then(({ v2 }) => {
      v2.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      log('Cloudinary configured successfully');
    }).catch(err => {
      log(`Cloudinary setup error: ${err.message}`);
    });
  } catch (error) {
    log(`Failed to import cloudinary: ${error.message}`);
  }

  log('Connecting to MongoDB');
  connectMongoDataBase();

  log('Creating temp directory');
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    log(`Created temp directory at: ${tempDir}`);
  }

  const PORT = process.env.PORT || 8002;
  log(`Starting server on port ${PORT}`);
  
  const server = app.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
  });

  // Handle process events
  process.on('uncaughtException', (err) => {
    log(`Uncaught exception: ${err.message}`);
    log(`Stack trace: ${err.stack}`);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    log(`Unhandled rejection: ${err.message}`);
    log(`Stack trace: ${err.stack}`);
    server.close(() => {
      process.exit(1);
    });
  });
  
} catch (error) {
  log(`Critical startup error: ${error.message}`);
  log(`Stack trace: ${error.stack}`);
}
