const ApiError = require('../utils/ApiError');

/**
 * Middleware: Validasi request body/params/query menggunakan Joi schema
 *
 * Contoh penggunaan:
 *   router.post('/register', validate(authValidation.register), controller.register);
 *
 * @param {Object} schema - Joi schema object { body, params, query }
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Validasi body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.body = value;
      }
    }

    // Validasi params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, { abortEarly: false, stripUnknown: true });
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.params = value;
      }
    }

    // Validasi query
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.query = value;
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(400, 'Validation error', errors));
    }

    next();
  };
};

module.exports = { validate };
