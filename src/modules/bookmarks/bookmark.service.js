const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION } = require('../../utils/constants');

/**
 * Toggle bookmark (add/remove)
 * bookmarks: PK(user_id, story_id), created_at
 */
const toggleBookmark = async (userId, storyId) => {
  // Cek story exist
  const [story] = await pool.execute('SELECT id FROM stories WHERE id = ?', [storyId]);
  if (story.length === 0) {
    throw ApiError.notFound('Story tidak ditemukan');
  }

  // Cek apakah sudah di-bookmark
  const [existing] = await pool.execute(
    'SELECT user_id FROM bookmarks WHERE user_id = ? AND story_id = ?',
    [userId, storyId]
  );

  if (existing.length > 0) {
    // Remove bookmark
    await pool.execute('DELETE FROM bookmarks WHERE user_id = ? AND story_id = ?', [userId, storyId]);
    // Decrement story_stats
    await pool.execute(
      'UPDATE story_stats SET total_bookmarks = GREATEST(total_bookmarks - 1, 0) WHERE story_id = ?',
      [storyId]
    );
    return { bookmarked: false };
  }

  // Add bookmark
  await pool.execute('INSERT INTO bookmarks (user_id, story_id) VALUES (?, ?)', [userId, storyId]);
  // Increment story_stats
  await pool.execute(
    'UPDATE story_stats SET total_bookmarks = total_bookmarks + 1 WHERE story_id = ?',
    [storyId]
  );
  return { bookmarked: true };
};

/**
 * Get my bookmarks (paginated) — menampilkan daftar story yang di-bookmark
 */
const getMyBookmarks = async (userId, query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as total FROM bookmarks WHERE user_id = ?',
    [userId]
  );
  const totalItems = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT b.created_at as bookmarked_at,
            s.id, s.title, s.slug, s.synopsis, s.cover_image_url, s.status, s.age_rating, s.view_count,
            u.username as writer_name, u.avatar_url as writer_avatar,
            ss.total_views, ss.total_likes, ss.total_bookmarks
     FROM bookmarks b
     JOIN stories s ON s.id = b.story_id
     LEFT JOIN users u ON u.id = s.writer_id
     LEFT JOIN story_stats ss ON ss.story_id = s.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, String(limit), String(offset)]
  );

  return {
    bookmarks: rows,
    pagination: { page, limit, totalItems },
  };
};

/**
 * Check apakah user sudah bookmark story tertentu
 */
const checkBookmark = async (userId, storyId) => {
  const [rows] = await pool.execute(
    'SELECT user_id FROM bookmarks WHERE user_id = ? AND story_id = ?',
    [userId, storyId]
  );
  return { bookmarked: rows.length > 0 };
};

module.exports = {
  toggleBookmark,
  getMyBookmarks,
  checkBookmark,
};
