const { verifyToken } = require('../utils/jwt.utils');
const { errorResponse } = require('../utils/response.utils');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Unauthorized: No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse(res, 401, 'Unauthorized: Invalid or expired token');
    }

    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(res, 500, 'Authentication error');
  }
};

module.exports = { authenticate };
