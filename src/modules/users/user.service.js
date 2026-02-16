const bcrypt = require('bcryptjs');
const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION } = require('../../utils/constants');

/**
 * Sanitize user — hapus field sensitif
 */
const sanitizeUser = (user) => {
  const { password_hash, google_id, ...safeUser } = user;
  return safeUser;
};

/**
 * Get user by ID (public profile)
 */
const getUserById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, username, email, avatar_url, bio, role, is_verified, created_at
     FROM users WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  // Tambahan: hitung jumlah followers & following
  const [followerCount] = await pool.execute(
    'SELECT COUNT(*) as count FROM followers WHERE following_id = ?',
    [id]
  );
  const [followingCount] = await pool.execute(
    'SELECT COUNT(*) as count FROM followers WHERE follower_id = ?',
    [id]
  );

  // Jika writer, hitung jumlah stories
  let storyCount = 0;
  if (rows[0].role === 'writer' || rows[0].role === 'admin') {
    const [stories] = await pool.execute(
      'SELECT COUNT(*) as count FROM stories WHERE writer_id = ?',
      [id]
    );
    storyCount = stories[0].count;
  }

  return {
    ...rows[0],
    followers_count: followerCount[0].count,
    following_count: followingCount[0].count,
    stories_count: storyCount,
  };
};

/**
 * Get user by username (public profile)
 */
const getUserByUsername = async (username) => {
  const [rows] = await pool.execute(
    `SELECT id, username, email, avatar_url, bio, role, is_verified, created_at
     FROM users WHERE username = ?`,
    [username]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  const userId = rows[0].id;

  const [followerCount] = await pool.execute(
    'SELECT COUNT(*) as count FROM followers WHERE following_id = ?',
    [userId]
  );
  const [followingCount] = await pool.execute(
    'SELECT COUNT(*) as count FROM followers WHERE follower_id = ?',
    [userId]
  );

  let storyCount = 0;
  if (rows[0].role === 'writer' || rows[0].role === 'admin') {
    const [stories] = await pool.execute(
      'SELECT COUNT(*) as count FROM stories WHERE writer_id = ?',
      [userId]
    );
    storyCount = stories[0].count;
  }

  return {
    ...rows[0],
    followers_count: followerCount[0].count,
    following_count: followingCount[0].count,
    stories_count: storyCount,
  };
};

/**
 * Update user profile (own profile)
 */
const updateProfile = async (userId, data) => {
  const fields = [];
  const values = [];

  // Hanya update field yang dikirim
  if (data.username !== undefined) {
    // Cek username unik
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [data.username, userId]
    );
    if (existing.length > 0) {
      throw ApiError.conflict('Username sudah dipakai');
    }
    fields.push('username = ?');
    values.push(data.username);
  }

  if (data.bio !== undefined) {
    fields.push('bio = ?');
    values.push(data.bio);
  }

  if (data.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(data.avatar_url);
  }

  if (fields.length === 0) {
    throw ApiError.badRequest('Tidak ada field untuk diupdate');
  }

  values.push(userId);

  await pool.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  // Return updated user
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
  return sanitizeUser(rows[0]);
};

/**
 * Change password
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);

  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  const user = rows[0];

  // Cek apakah user punya password (Google-only account gak punya)
  if (!user.password_hash) {
    throw ApiError.badRequest('Akun ini terdaftar via Google dan tidak memiliki password. Gunakan Google login.');
  }

  // Verifikasi password lama
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('Password saat ini salah');
  }

  // Hash password baru
  const salt = await bcrypt.genSalt(12);
  const newHash = await bcrypt.hash(newPassword, salt);

  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
};

/**
 * Upgrade role dari reader ke writer
 */
const upgradeToWriter = async (userId) => {
  const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [userId]);

  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  if (rows[0].role === 'writer') {
    throw ApiError.badRequest('Anda sudah menjadi writer');
  }

  if (rows[0].role === 'admin') {
    throw ApiError.badRequest('Admin tidak perlu upgrade ke writer');
  }

  await pool.execute("UPDATE users SET role = 'writer' WHERE id = ?", [userId]);

  const [updated] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
  return sanitizeUser(updated[0]);
};

/**
 * Get all users (paginated) — untuk admin atau public listing
 */
const getUsers = async ({ page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, role, search }) => {
  let query = 'SELECT id, username, email, avatar_url, bio, role, is_verified, created_at FROM users';
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const conditions = [];
  const params = [];

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (search) {
    conditions.push('(username LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }

  // Count total
  const [countRows] = await pool.execute(countQuery, params);
  const totalItems = countRows[0].total;

  // Pagination
  const offset = (page - 1) * limit;
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, String(limit), String(offset)];

  const [rows] = await pool.execute(query, queryParams);

  return {
    users: rows,
    pagination: { page, limit, totalItems },
  };
};

module.exports = {
  getUserById,
  getUserByUsername,
  updateProfile,
  changePassword,
  upgradeToWriter,
  getUsers,
};
