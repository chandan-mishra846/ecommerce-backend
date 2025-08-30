import HandleError from "../utils/handleError.js";

export default (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error Handler:', err);
  
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "internal server error";

  // Handle different types of errors
  if (err.name === 'CastError') {
    const message = `Invalid resource: ${err.path}`;
    err = new HandleError(message, 404);
  }

  // Duplicate key error (same email)
  if (err.code === 11000) {
    const message = `This ${Object.keys(err.keyValue)} is already registered`;
    err = new HandleError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    err = new HandleError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    err = new HandleError(message, 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    err = new HandleError(message, 400);
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    const message = 'Database connection issue. Please try again later.';
    err = new HandleError(message, 500);
  }

  // Send the error response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}