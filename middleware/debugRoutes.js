// Debug middleware for API routes
const debugRoutes = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture the original methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalStatus = res.status;
  
  // Track response status
  let responseStatus = 200;
  
  // Override status method
  res.status = function(code) {
    responseStatus = code;
    return originalStatus.apply(res, arguments);
  };
  
  // Override send method
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Response Status: ${responseStatus}`);
    if (responseStatus >= 400) {
      console.error('Error Response:', body);
    }
    return originalSend.apply(res, arguments);
  };
  
  // Override json method
  res.json = function(body) {
    console.log(`[${new Date().toISOString()}] Response Status: ${responseStatus}`);
    if (responseStatus >= 400) {
      console.error('Error Response:', body);
    }
    return originalJson.apply(res, arguments);
  };
  
  next();
};

export default debugRoutes;
