const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION } = require('../../utils/constants');

/**
 * Upsert reading history
 * reading_history: PK(user_id, story_id), last_read_chapter_id, updated_at
 *
 * Jika record sudah ada → update last_read_chapter_id
 * Jika belum ada → insert baru
 */
const upsertHistory = async (userId, data) => {
  // Validasi story & chapter exist, dan chapter milik story tsb
  const [chapter] = await pool.execute(
    'SELECT id, story_id FROM chapters WHERE id = ? AND story_id = ?',
    [data.last_read_chapter_id, data.story_id]
  );

  if (chapter.length === 0) {
    throw ApiError.badRequest('Chapter tidak ditemukan atau bukan milik story ini');
  }

  // Cek apakah sudah ada record
  const [existing] = await pool.execute(
    'SELECT user_id FROM reading_history WHERE user_id = ? AND story_id = ?',
    [userId, data.story_id]
  );

  if (existing.length > 0) {
    // Update
    await pool.execute(
      'UPDATE reading_history SET last_read_chapter_id = ? WHERE user_id = ? AND story_id = ?',
      [data.last_read_chapter_id, userId, data.story_id]
    );
  } else {
    // Insert
    await pool.execute(
      'INSERT INTO reading_history (user_id, story_id, last_read_chapter_id) VALUES (?, ?, ?)',
      [userId, data.story_id, data.last_read_chapter_id]
    );
  }

  return {
    user_id: userId,
    story_id: data.story_id,
    last_read_chapter_id: data.last_read_chapter_id,
  };
};

/**
 * Get my reading history (paginated)
 */
const getMyHistory = async (userId, query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as total FROM reading_history WHERE user_id = ?',
    [userId]
  );
  const totalItems = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT rh.story_id, rh.last_read_chapter_id, rh.updated_at,
            s.title as story_title, s.slug as story_slug, s.cover_image_url, s.status as story_status,
            u.username as writer_name,
            c.title as chapter_title, c.chapter_number
     FROM reading_history rh
     JOIN stories s ON s.id = rh.story_id
     LEFT JOIN users u ON u.id = s.writer_id
     JOIN chapters c ON c.id = rh.last_read_chapter_id
     WHERE rh.user_id = ?
     ORDER BY rh.updated_at DESC
     LIMIT ? OFFSET ?`,
    [userId, String(limit), String(offset)]
  );

  return {
    history: rows,
    pagination: { page, limit, totalItems },
  };
};

/**
 * Delete a single reading history entry
 */
const deleteHistory = async (userId, storyId) => {
  const [result] = await pool.execute(
    'DELETE FROM reading_history WHERE user_id = ? AND story_id = ?',
    [userId, storyId]
  );

  if (result.affectedRows === 0) {
    throw ApiError.notFound('Reading history tidak ditemukan');
  }
};

/**
 * Clear all reading history
 */
const clearAllHistory = async (userId) => {
  const [result] = await pool.execute(
    'DELETE FROM reading_history WHERE user_id = ?',
    [userId]
  );

  return { deleted: result.affectedRows };
};

module.exports = {
  upsertHistory,
  getMyHistory,
  deleteHistory,
  clearAllHistory,
};
