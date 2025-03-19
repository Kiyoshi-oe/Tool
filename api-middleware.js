// API middleware for handling server-side requests in development mode
const fs = require('fs');
const path = require('path');

// Function to handle API requests
function apiMiddleware(req, res, next) {
  // Only handle POST requests to /api/save-resource
  if (req.method === 'POST' && req.url === '/api/save-resource') {
    console.log('API middleware handling request to /api/save-resource');
    
    // Get the request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // Parse the request body
        const data = JSON.parse(body);
        
        // Import the save-resource.js handler
        const saveResourceHandler = require('./public/api/save-resource.js').handler;
        
        // Create a mock request and response
        const mockReq = {
          method: 'POST',
          body: data
        };
        
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              res.statusCode = code;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }
          })
        };
        
        // Call the handler
        saveResourceHandler(mockReq, mockRes);
      } catch (error) {
        console.error('Error in API middleware:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Server error in API middleware',
          details: error.message
        }));
      }
    });
  } else {
    // Pass through to the next middleware
    next();
  }
}

module.exports = apiMiddleware;
