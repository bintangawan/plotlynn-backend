const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Sanitize user object — hapus field sensitif sebelum kirim ke client
 */
const sanitizeUser = (user) => {
  const { password_hash, google_id, ...safeUser } = user;
  return safeUser;
};

/**
 * Register user baru (email + password)
 */
const register = async ({ username, email, password }) => {
  // Cek apakah email sudah terdaftar
  const [existingEmail] = await pool.execute(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (existingEmail.length > 0) {
    throw ApiError.conflict('Email sudah terdaftar');
  }

  // Cek apakah username sudah dipakai
  const [existingUsername] = await pool.execute(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );
  if (existingUsername.length > 0) {
    throw ApiError.conflict('Username sudah dipakai');
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert user baru (default role: reader, is_verified: 0)
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password_hash, role, is_verified) VALUES (?, ?, ?, ?, ?)',
    [username, email, passwordHash, 'reader', 0]
  );

  // Ambil user yang baru dibuat
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
  const user = rows[0];

  const token = generateToken(user);

  return { user: sanitizeUser(user), token };
};

/**
 * Login dengan email + password
 */
const login = async ({ email, password }) => {
  // Cari user berdasarkan email
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  const user = rows[0];

  // Cek apakah user punya password (bisa jadi register via Google saja)
  if (!user.password_hash) {
    throw ApiError.unauthorized('Akun ini terdaftar via Google. Silakan login dengan Google.');
  }

  // Verifikasi password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  const token = generateToken(user);

  return { user: sanitizeUser(user), token };
};

/**
 * Handle setelah Google OAuth berhasil — generate JWT
 */
const handleGoogleCallback = (user) => {
  const token = generateToken(user);
  return { user: sanitizeUser(user), token };
};

/**
 * Get current authenticated user
 */
const getMe = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  return sanitizeUser(rows[0]);
};

module.exports = { register, login, handleGoogleCallback, getMe, generateToken, sanitizeUser };
