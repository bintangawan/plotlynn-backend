const config = require('../config');
const ApiError = require('../utils/ApiError');

/**
 * Global Error Handler Middleware
 * Harus didaftarkan paling akhir setelah semua routes
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Jika bukan instance ApiError, wrap sebagai internal error
  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = config.env === 'production' ? 'Internal Server Error' : err.message;
  }

  // Log error di development
  if (config.env === 'development') {
    console.error('❌ Error:', {
      statusCode,
      message,
      errors,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors.length > 0 && { errors }),
    ...(config.env === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
