// backend/middleware/handleAsynError.js

export default (theFunction) => (req, res, next) => {
  Promise.resolve(theFunction(req, res, next)).catch(error => {
    // Explicitly log the error for better visibility in the console
    console.error('Caught by handleAsynError:', error);
    next(error); // Pass the error to the next middleware (Express's error handler)
  });
};