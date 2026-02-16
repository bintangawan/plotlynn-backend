const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');

/**
 * Get all tags (public)
 */
const getAllTags = async () => {
  const [rows] = await pool.execute('SELECT id, name, slug FROM tags ORDER BY name ASC');
  return rows;
};

/**
 * Get tag by slug (public) — termasuk jumlah stories
 */
const getBySlug = async (slug) => {
  const [rows] = await pool.execute('SELECT id, name, slug FROM tags WHERE slug = ?', [slug]);

  if (rows.length === 0) {
    throw ApiError.notFound('Tag tidak ditemukan');
  }

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as count FROM story_tags WHERE tag_id = ?',
    [rows[0].id]
  );

  return {
    ...rows[0],
    story_count: countRows[0].count,
  };
};

module.exports = { getAllTags, getBySlug };
