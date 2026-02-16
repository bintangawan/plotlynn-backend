const ApiError = require('../utils/ApiError');

/**
 * Middleware: Handle 404 Not Found
 * Didaftarkan sebelum errorHandler
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route tidak ditemukan: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
