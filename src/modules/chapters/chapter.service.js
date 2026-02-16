const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION, NOTIFICATION_TYPES, REFERENCE_TYPES } = require('../../utils/constants');

/**
 * Helper: hitung word_count dari content
 */
const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Helper: verifikasi story ownership — return story jika valid
 */
const verifyStoryOwnership = async (storyId, userId, userRole) => {
  const [rows] = await pool.execute('SELECT * FROM stories WHERE id = ?', [storyId]);

  if (rows.length === 0) {
    throw ApiError.notFound('Story tidak ditemukan');
  }

  if (rows[0].writer_id !== userId && userRole !== 'admin') {
    throw ApiError.forbidden('Anda tidak memiliki izin untuk mengelola chapter di cerita ini');
  }

  return rows[0];
};

/**
 * Helper: notifikasi followers saat chapter baru dipublish
 */
const notifyFollowersNewChapter = async (writerId, storyId, storyTitle, chapterTitle, chapterId) => {
  const [writer] = await pool.execute('SELECT username FROM users WHERE id = ?', [writerId]);
  if (writer.length === 0) return;

  const writerName = writer[0].username;

  // Ambil semua followers si writer
  const [followers] = await pool.execute(
    'SELECT follower_id FROM followers WHERE following_id = ?',
    [writerId]
  );

  if (followers.length === 0) return;

  const values = followers.map((f) => [
    f.follower_id,
    NOTIFICATION_TYPES.NEW_CHAPTER,
    `Chapter baru dari ${writerName}!`,
    `"${chapterTitle}" — chapter terbaru dari "${storyTitle}" sudah tersedia. Yuk baca sekarang!`,
    REFERENCE_TYPES.CHAPTER,
    chapterId,
    0, // is_read
    0, // is_emailed
  ]);

  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const flatValues = values.flat();

  if (flatValues.length > 0) {
    await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, is_read, is_emailed) VALUES ${placeholders}`,
      flatValues
    );
  }
};

/**
 * Create chapter — auto chapter_number, auto word_count
 */
const createChapter = async (storyId, userId, userRole, data) => {
  const story = await verifyStoryOwnership(storyId, userId, userRole);

  // Auto chapter_number: ambil MAX + 1
  const [maxRow] = await pool.execute(
    'SELECT COALESCE(MAX(chapter_number), 0) as max_num FROM chapters WHERE story_id = ?',
    [storyId]
  );
  const chapterNumber = maxRow[0].max_num + 1;

  const wordCount = countWords(data.content);
  const isPublished = data.is_published ? 1 : 0;
  const publishedAt = isPublished ? new Date() : null;

  const [result] = await pool.execute(
    `INSERT INTO chapters (story_id, title, chapter_number, content, word_count, is_published, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [storyId, data.title, chapterNumber, data.content || null, wordCount, isPublished, publishedAt]
  );

  const chapterId = result.insertId;

  // Jika langsung published, kirim notifikasi ke followers
  if (isPublished) {
    await notifyFollowersNewChapter(story.writer_id, storyId, story.title, data.title, chapterId);
  }

  return getChapterById(storyId, chapterId);
};

/**
 * Update chapter
 */
const updateChapter = async (storyId, chapterId, userId, userRole, data) => {
  const story = await verifyStoryOwnership(storyId, userId, userRole);

  const [rows] = await pool.execute(
    'SELECT * FROM chapters WHERE id = ? AND story_id = ?',
    [chapterId, storyId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Chapter tidak ditemukan');
  }

  const chapter = rows[0];
  const fields = [];
  const values = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }

  if (data.content !== undefined) {
    fields.push('content = ?');
    values.push(data.content);
    fields.push('word_count = ?');
    values.push(countWords(data.content));
  }

  if (data.is_published !== undefined) {
    const newIsPublished = data.is_published ? 1 : 0;
    fields.push('is_published = ?');
    values.push(newIsPublished);

    // Jika baru saja dipublish (sebelumnya belum published)
    if (newIsPublished === 1 && chapter.is_published === 0) {
      fields.push('published_at = ?');
      values.push(new Date());

      // Kirim notifikasi ke followers
      await notifyFollowersNewChapter(
        story.writer_id,
        storyId,
        story.title,
        data.title || chapter.title,
        chapterId
      );
    }
  }

  if (fields.length > 0) {
    values.push(chapterId, storyId);
    await pool.execute(
      `UPDATE chapters SET ${fields.join(', ')} WHERE id = ? AND story_id = ?`,
      values
    );
  }

  return getChapterById(storyId, chapterId);
};

/**
 * Get single chapter by ID
 */
const getChapterById = async (storyId, chapterId) => {
  const [rows] = await pool.execute(
    `SELECT c.*, s.title as story_title, s.slug as story_slug, s.writer_id,
            u.username as writer_name
     FROM chapters c
     JOIN stories s ON s.id = c.story_id
     LEFT JOIN users u ON u.id = s.writer_id
     WHERE c.id = ? AND c.story_id = ?`,
    [chapterId, storyId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Chapter tidak ditemukan');
  }

  // Ambil info prev/next chapter
  const [prev] = await pool.execute(
    'SELECT id, title, chapter_number FROM chapters WHERE story_id = ? AND chapter_number < ? AND is_published = 1 ORDER BY chapter_number DESC LIMIT 1',
    [storyId, rows[0].chapter_number]
  );

  const [next] = await pool.execute(
    'SELECT id, title, chapter_number FROM chapters WHERE story_id = ? AND chapter_number > ? AND is_published = 1 ORDER BY chapter_number ASC LIMIT 1',
    [storyId, rows[0].chapter_number]
  );

  return {
    ...rows[0],
    prev_chapter: prev[0] || null,
    next_chapter: next[0] || null,
  };
};

/**
 * Delete chapter — reorder chapter_number setelah delete
 */
const deleteChapter = async (storyId, chapterId, userId, userRole) => {
  await verifyStoryOwnership(storyId, userId, userRole);

  const [rows] = await pool.execute(
    'SELECT chapter_number FROM chapters WHERE id = ? AND story_id = ?',
    [chapterId, storyId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Chapter tidak ditemukan');
  }

  const deletedNumber = rows[0].chapter_number;

  // Hapus chapter
  await pool.execute('DELETE FROM chapters WHERE id = ? AND story_id = ?', [chapterId, storyId]);

  // Reorder: semua chapter dengan nomor > yang dihapus, kurangi 1
  await pool.execute(
    'UPDATE chapters SET chapter_number = chapter_number - 1 WHERE story_id = ? AND chapter_number > ?',
    [storyId, deletedNumber]
  );
};

/**
 * List chapters of a story (publik hanya yang published, owner bisa liat semua)
 */
const listChapters = async (storyId, userId, query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;

  // Cek story exist
  const [storyRows] = await pool.execute('SELECT id, writer_id FROM stories WHERE id = ?', [storyId]);
  if (storyRows.length === 0) {
    throw ApiError.notFound('Story tidak ditemukan');
  }

  const isOwner = userId && storyRows[0].writer_id === userId;

  let sql = `SELECT id, story_id, title, chapter_number, word_count, is_published, published_at, created_at, updated_at
             FROM chapters WHERE story_id = ?`;
  let countSql = 'SELECT COUNT(*) as total FROM chapters WHERE story_id = ?';
  const params = [storyId];
  const countParams = [storyId];

  // Publik hanya lihat yang published
  if (!isOwner) {
    sql += ' AND is_published = 1';
    countSql += ' AND is_published = 1';
  }

  const [countRows] = await pool.execute(countSql, countParams);
  const totalItems = countRows[0].total;

  sql += ' ORDER BY chapter_number ASC LIMIT ? OFFSET ?';
  const offset = (page - 1) * limit;
  params.push(String(limit), String(offset));

  const [rows] = await pool.execute(sql, params);

  return {
    chapters: rows,
    pagination: { page, limit, totalItems },
  };
};

module.exports = {
  createChapter,
  updateChapter,
  getChapterById,
  deleteChapter,
  listChapters,
};
