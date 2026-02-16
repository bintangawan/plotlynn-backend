/**
 * Custom API Error class
 * Digunakan untuk throw error yang terstruktur di seluruh aplikasi
 *
 * Contoh:
 *   throw new ApiError(404, 'Story tidak ditemukan');
 *   throw new ApiError(400, 'Validation error', ['email wajib diisi', 'password minimal 8 karakter']);
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource tidak ditemukan') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Data sudah ada') {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
