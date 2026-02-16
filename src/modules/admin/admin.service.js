const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { slugify } = require('../../utils/slugify');
const { PAGINATION } = require('../../utils/constants');

// ===========================
// USER MANAGEMENT
// ===========================

/**
 * Get all users (admin view — includes semua data)
 */
const getAllUsers = async ({ page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, role, search }) => {
  let query = 'SELECT id, username, email, avatar_url, bio, role, is_verified, created_at, updated_at FROM users';
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

  const [countRows] = await pool.execute(countQuery, params);
  const totalItems = countRows[0].total;

  const offset = (page - 1) * limit;
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const [rows] = await pool.execute(query, [...params, String(limit), String(offset)]);

  return { users: rows, pagination: { page, limit, totalItems } };
};

/**
 * Get user detail by ID (admin view)
 */
const getUserById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, username, email, avatar_url, bio, role, is_verified, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  return rows[0];
};

/**
 * Update user role (admin only)
 */
const updateUserRole = async (userId, newRole) => {
  const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [userId]);

  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  await pool.execute('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);

  const [updated] = await pool.execute(
    'SELECT id, username, email, role, is_verified FROM users WHERE id = ?',
    [userId]
  );
  return updated[0];
};

/**
 * Delete user (admin only)
 */
const deleteUser = async (userId, adminId) => {
  if (userId === adminId) {
    throw ApiError.badRequest('Anda tidak bisa menghapus akun sendiri');
  }

  const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
};

// ===========================
// REPORT MANAGEMENT
// ===========================

/**
 * Get all reports (paginated)
 */
const getAllReports = async ({ page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, status, target_type }) => {
  let query = `
    SELECT r.*, u.username as reporter_username 
    FROM reports r 
    LEFT JOIN users u ON u.id = r.reporter_id
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM reports r';
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  if (target_type) {
    conditions.push('r.target_type = ?');
    params.push(target_type);
  }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }

  const [countRows] = await pool.execute(countQuery, params);
  const totalItems = countRows[0].total;

  const offset = (page - 1) * limit;
  query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';

  const [rows] = await pool.execute(query, [...params, String(limit), String(offset)]);

  return { reports: rows, pagination: { page, limit, totalItems } };
};

/**
 * Update report status
 */
const updateReportStatus = async (reportId, newStatus) => {
  const [rows] = await pool.execute('SELECT id FROM reports WHERE id = ?', [reportId]);
  if (rows.length === 0) {
    throw ApiError.notFound('Report tidak ditemukan');
  }

  await pool.execute('UPDATE reports SET status = ? WHERE id = ?', [newStatus, reportId]);

  const [updated] = await pool.execute('SELECT * FROM reports WHERE id = ?', [reportId]);
  return updated[0];
};

// ===========================
// GENRE MANAGEMENT
// ===========================

/**
 * Get all genres
 */
const getAllGenres = async () => {
  const [rows] = await pool.execute('SELECT * FROM genres ORDER BY name ASC');
  return rows;
};

/**
 * Create genre
 */
const createGenre = async (name) => {
  const slug = slugify(name);

  // Cek duplikat
  const [existing] = await pool.execute('SELECT id FROM genres WHERE name = ? OR slug = ?', [name, slug]);
  if (existing.length > 0) {
    throw ApiError.conflict('Genre sudah ada');
  }

  const [result] = await pool.execute('INSERT INTO genres (name, slug) VALUES (?, ?)', [name, slug]);
  const [genre] = await pool.execute('SELECT * FROM genres WHERE id = ?', [result.insertId]);
  return genre[0];
};

/**
 * Update genre
 */
const updateGenre = async (id, name) => {
  const [rows] = await pool.execute('SELECT id FROM genres WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound('Genre tidak ditemukan');
  }

  const slug = slugify(name);

  // Cek duplikat (selain diri sendiri)
  const [existing] = await pool.execute('SELECT id FROM genres WHERE (name = ? OR slug = ?) AND id != ?', [name, slug, id]);
  if (existing.length > 0) {
    throw ApiError.conflict('Nama genre sudah dipakai');
  }

  await pool.execute('UPDATE genres SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
  const [updated] = await pool.execute('SELECT * FROM genres WHERE id = ?', [id]);
  return updated[0];
};

/**
 * Delete genre
 */
const deleteGenre = async (id) => {
  const [rows] = await pool.execute('SELECT id FROM genres WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound('Genre tidak ditemukan');
  }

  await pool.execute('DELETE FROM genres WHERE id = ?', [id]);
};

// ===========================
// TAG MANAGEMENT
// ===========================

/**
 * Get all tags
 */
const getAllTags = async () => {
  const [rows] = await pool.execute('SELECT * FROM tags ORDER BY name ASC');
  return rows;
};

/**
 * Create tag
 */
const createTag = async (name) => {
  const slug = slugify(name);

  const [existing] = await pool.execute('SELECT id FROM tags WHERE name = ? OR slug = ?', [name, slug]);
  if (existing.length > 0) {
    throw ApiError.conflict('Tag sudah ada');
  }

  const [result] = await pool.execute('INSERT INTO tags (name, slug) VALUES (?, ?)', [name, slug]);
  const [tag] = await pool.execute('SELECT * FROM tags WHERE id = ?', [result.insertId]);
  return tag[0];
};

/**
 * Update tag
 */
const updateTag = async (id, name) => {
  const [rows] = await pool.execute('SELECT id FROM tags WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound('Tag tidak ditemukan');
  }

  const slug = slugify(name);

  const [existing] = await pool.execute('SELECT id FROM tags WHERE (name = ? OR slug = ?) AND id != ?', [name, slug, id]);
  if (existing.length > 0) {
    throw ApiError.conflict('Nama tag sudah dipakai');
  }

  await pool.execute('UPDATE tags SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
  const [updated] = await pool.execute('SELECT * FROM tags WHERE id = ?', [id]);
  return updated[0];
};

/**
 * Delete tag
 */
const deleteTag = async (id) => {
  const [rows] = await pool.execute('SELECT id FROM tags WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound('Tag tidak ditemukan');
  }

  await pool.execute('DELETE FROM tags WHERE id = ?', [id]);
};

// ===========================
// PLATFORM STATS
// ===========================

/**
 * Get platform statistics (dashboard admin)
 */
const getPlatformStats = async () => {
  const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
  const [readerCount] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'reader'");
  const [writerCount] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'writer'");
  const [storyCount] = await pool.execute('SELECT COUNT(*) as count FROM stories');
  const [chapterCount] = await pool.execute('SELECT COUNT(*) as count FROM chapters');
  const [commentCount] = await pool.execute('SELECT COUNT(*) as count FROM comments');
  const [pendingReports] = await pool.execute("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");

  return {
    users: {
      total: userCount[0].count,
      readers: readerCount[0].count,
      writers: writerCount[0].count,
    },
    content: {
      stories: storyCount[0].count,
      chapters: chapterCount[0].count,
      comments: commentCount[0].count,
    },
    reports: {
      pending: pendingReports[0].count,
    },
  };
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllReports,
  updateReportStatus,
  getAllGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getPlatformStats,
};
