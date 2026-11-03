const jwt = require('jsonwebtoken');
const RevokedToken = require('../models/revoked-token.model');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.jti || !decoded.exp) {
      const err = new Error('Invalid or expired token');
      err.statusCode = 401;
      throw err;
    }

    if (await RevokedToken.exists({ jti: decoded.jti })) {
      const err = new Error('Invalid or expired token');
      err.statusCode = 401;
      throw err;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      error.statusCode = 401;
      error.message = 'Invalid or expired token';
    }

    next(error);
  }
};

module.exports = authMiddleware;
