const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Security: Explicitly lock JWT algorithm to prevent algorithm confusion attacks.
const JWT_ALGORITHM = 'HS256';

const signToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn,
  });
};

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret, {
    algorithms: [JWT_ALGORITHM],
  });
};

const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN,
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });

module.exports = {
  signToken,
  verifyToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
