const { errorResponse } = require('../utils/response.utils');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      // We merge all req inputs depending on Zod schema structure.
      // Easiest is to validate just req.body by default if schema doesn't specify shape.
      // Or validate an object { body: req.body, ... }
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        return errorResponse(res, 400, 'Validation failed', formattedErrors);
      }
      return errorResponse(res, 400, 'Validation parsing error');
    }
  };
};

module.exports = { validate };
