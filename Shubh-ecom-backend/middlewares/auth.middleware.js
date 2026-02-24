const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/apiResponse');
const env = require('../config/env');
const tokenBlacklist = require('../services/tokenBlacklist.service');

module.exports = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        error('Authorization token missing', 401);
      }

      const token = authHeader.split(' ')[1];

      // Security: Await blacklist check to ensure revoked tokens are blocked before auth succeeds.
      if (typeof tokenBlacklist?.isBlacklisted === 'function') {
        const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
        if (isBlacklisted) {
          error('Token has been revoked', 401);
        }
      }

      let decoded;
      try {
        decoded = verifyToken(token, env.JWT_SECRET);
      } catch (err) {
        error('Invalid or expired token', 401);
      }

      req.user = {
        _id: decoded.userId,
        id: decoded.userId,
        role: decoded.role,
      };

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        error('Access denied', 403);
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};
