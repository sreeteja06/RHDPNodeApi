const jwt = require('jsonwebtoken');

const generateAuthToken = (userID, access) => {
  const token = jwt
    .sign({ userID, access }, process.env.JWT_SECRET, {
      expiresIn: '12h'
    })
    .toString();
  return token;
};

const decodeAuthToken = token => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (e) {
    return new Error('token validation failed');
  }
};

module.exports = {
  generateAuthToken,
  decodeAuthToken
};
