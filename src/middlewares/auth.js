const jwt = require('jsonwebtoken');
const config = require('../config');
const { pool } = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * Middleware: Verifikasi JWT token dari header Authorization
 * Format: Bearer <token>
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Akses ditolak. Token tidak ditemukan.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    // Ambil user dari database
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar_url, role, is_verified FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      throw new ApiError(401, 'Token tidak valid. User tidak ditemukan.');
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Token tidak valid.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token sudah expired. Silakan login ulang.'));
    }
    next(error);
  }
};

/**
 * Middleware opsional: Cek token jika ada, tapi tidak wajib
 * Berguna untuk endpoint publik yang ingin tahu siapa user-nya (jika login)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar_url, role, is_verified FROM users WHERE id = ?',
      [decoded.id]
    );

    req.user = rows[0] || null;
    next();
  } catch (error) {
    // Token invalid/expired — tetap lanjut tanpa user
    req.user = null;
    next();
  }
};

module.exports = { authenticate, optionalAuth };
