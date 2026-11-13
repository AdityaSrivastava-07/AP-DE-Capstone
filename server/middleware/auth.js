const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_heroics_key';

// Middleware to verify the JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Access Denied. No token provided.' });
  
  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attach user payload to request
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token.' });
  }
}

module.exports = { verifyToken };