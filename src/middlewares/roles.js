const ApiError = require('../utils/ApiError');

/**
 * Middleware: Role-Based Access Control (RBAC)
 * Gunakan setelah authenticate middleware
 *
 * Contoh penggunaan:
 *   router.post('/stories', authenticate, authorize('writer', 'admin'), controller.create);
 *
 * @param  {...string} allowedRoles - Role yang diizinkan: 'reader', 'writer', 'admin'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Akses ditolak. Anda belum login.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Akses ditolak. Role "${req.user.role}" tidak memiliki izin untuk aksi ini.`)
      );
    }

    next();
  };
};

module.exports = { authorize };
