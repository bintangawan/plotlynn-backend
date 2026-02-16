const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { NOTIFICATION_TYPES, REFERENCE_TYPES } = require('../../utils/constants');

/**
 * Toggle like on a chapter (add/remove)
 * likes: PK(user_id, chapter_id), created_at
 */
const toggleLike = async (userId, chapterId) => {
  // Cek chapter exist & ambil info story
  const [chapter] = await pool.execute(
    `SELECT c.id, c.story_id, c.title as chapter_title, s.writer_id, s.title as story_title
     FROM chapters c
     JOIN stories s ON s.id = c.story_id
     WHERE c.id = ?`,
    [chapterId]
  );

  if (chapter.length === 0) {
    throw ApiError.notFound('Chapter tidak ditemukan');
  }

  // Cek apakah sudah like
  const [existing] = await pool.execute(
    'SELECT user_id FROM likes WHERE user_id = ? AND chapter_id = ?',
    [userId, chapterId]
  );

  if (existing.length > 0) {
    // Unlike
    await pool.execute('DELETE FROM likes WHERE user_id = ? AND chapter_id = ?', [userId, chapterId]);
    // Decrement story_stats total_likes
    await pool.execute(
      'UPDATE story_stats SET total_likes = GREATEST(total_likes - 1, 0) WHERE story_id = ?',
      [chapter[0].story_id]
    );
    return { liked: false, like_count: await getLikeCount(chapterId) };
  }

  // Like
  await pool.execute('INSERT INTO likes (user_id, chapter_id) VALUES (?, ?)', [userId, chapterId]);
  // Increment story_stats total_likes
  await pool.execute(
    'UPDATE story_stats SET total_likes = total_likes + 1 WHERE story_id = ?',
    [chapter[0].story_id]
  );

  // Notifikasi ke writer jika yang like bukan writernya sendiri
  const chapterData = chapter[0];
  if (chapterData.writer_id && chapterData.writer_id !== userId) {
    const [liker] = await pool.execute('SELECT username FROM users WHERE id = ?', [userId]);
    const likerName = liker.length > 0 ? liker[0].username : 'Seseorang';

    await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, is_read, is_emailed)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        chapterData.writer_id,
        NOTIFICATION_TYPES.LIKE,
        `${likerName} menyukai chapter-mu`,
        `${likerName} menyukai "${chapterData.chapter_title}" di cerita "${chapterData.story_title}"`,
        REFERENCE_TYPES.CHAPTER,
        chapterId,
      ]
    );
  }

  return { liked: true, like_count: await getLikeCount(chapterId) };
};

/**
 * Helper: hitung jumlah like suatu chapter
 */
const getLikeCount = async (chapterId) => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) as count FROM likes WHERE chapter_id = ?',
    [chapterId]
  );
  return rows[0].count;
};

/**
 * Check apakah user sudah like chapter
 */
const checkLike = async (userId, chapterId) => {
  const [rows] = await pool.execute(
    'SELECT user_id FROM likes WHERE user_id = ? AND chapter_id = ?',
    [userId, chapterId]
  );
  return {
    liked: rows.length > 0,
    like_count: await getLikeCount(chapterId),
  };
};

/**
 * Get like count & list untuk chapter
 */
const getLikesByChapter = async (chapterId) => {
  const [chapter] = await pool.execute('SELECT id FROM chapters WHERE id = ?', [chapterId]);
  if (chapter.length === 0) {
    throw ApiError.notFound('Chapter tidak ditemukan');
  }

  const likeCount = await getLikeCount(chapterId);

  // Ambil 10 user terbaru yang like
  const [recentLikers] = await pool.execute(
    `SELECT u.id, u.username, u.avatar_url, l.created_at as liked_at
     FROM likes l
     JOIN users u ON u.id = l.user_id
     WHERE l.chapter_id = ?
     ORDER BY l.created_at DESC
     LIMIT 10`,
    [chapterId]
  );

  return {
    like_count: likeCount,
    recent_likers: recentLikers,
  };
};

module.exports = {
  toggleLike,
  checkLike,
  getLikesByChapter,
};
