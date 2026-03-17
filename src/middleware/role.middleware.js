const { errorResponse } = require('../utils/response.utils');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Forbidden: You do not have the required permissions');
    }
    next();
  };
};

module.exports = { authorize };
