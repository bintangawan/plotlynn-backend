const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');

/**
 * Get all genres (public)
 */
const getAllGenres = async () => {
  const [rows] = await pool.execute('SELECT id, name, slug FROM genres ORDER BY name ASC');
  return rows;
};

/**
 * Get genre by slug (public) — termasuk jumlah stories
 */
const getBySlug = async (slug) => {
  const [rows] = await pool.execute('SELECT id, name, slug FROM genres WHERE slug = ?', [slug]);

  if (rows.length === 0) {
    throw ApiError.notFound('Genre tidak ditemukan');
  }

  // Hitung jumlah story di genre ini
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as count FROM story_genres WHERE genre_id = ?',
    [rows[0].id]
  );

  return {
    ...rows[0],
    story_count: countRows[0].count,
  };
};

module.exports = { getAllGenres, getBySlug };
