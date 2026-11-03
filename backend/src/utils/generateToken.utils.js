const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
    jwtid: crypto.randomUUID(),
  });
};

module.exports = generateToken;
