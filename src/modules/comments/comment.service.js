const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION, NOTIFICATION_TYPES, REFERENCE_TYPES } = require('../../utils/constants');

/**
 * Create comment on a chapter
 * comments: id, user_id, chapter_id, parent_id, content, is_flagged, created_at
 */
const createComment = async (userId, chapterId, data) => {
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

  // Jika reply, cek parent_id valid & chapter sama
  if (data.parent_id) {
    const [parent] = await pool.execute(
      'SELECT id, chapter_id FROM comments WHERE id = ?',
      [data.parent_id]
    );
    if (parent.length === 0) {
      throw ApiError.notFound('Parent comment tidak ditemukan');
    }
    if (parent[0].chapter_id !== chapterId) {
      throw ApiError.badRequest('Parent comment bukan milik chapter ini');
    }
  }

  const [result] = await pool.execute(
    'INSERT INTO comments (user_id, chapter_id, parent_id, content) VALUES (?, ?, ?, ?)',
    [userId, chapterId, data.parent_id || null, data.content]
  );

  const commentId = result.insertId;

  // Kirim notifikasi ke writer jika yang comment bukan writernya sendiri
  const chapterData = chapter[0];
  if (chapterData.writer_id && chapterData.writer_id !== userId) {
    const [commenter] = await pool.execute('SELECT username FROM users WHERE id = ?', [userId]);
    const commenterName = commenter.length > 0 ? commenter[0].username : 'Seseorang';

    await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, is_read, is_emailed)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        chapterData.writer_id,
        NOTIFICATION_TYPES.COMMENT,
        `Komentar baru dari ${commenterName}`,
        `${commenterName} mengomentari "${chapterData.chapter_title}" di cerita "${chapterData.story_title}"`,
        REFERENCE_TYPES.COMMENT,
        commentId,
      ]
    );
  }

  // Jika reply, notifikasi juga ke pemilik parent comment
  if (data.parent_id) {
    const [parentComment] = await pool.execute('SELECT user_id FROM comments WHERE id = ?', [data.parent_id]);
    if (parentComment.length > 0 && parentComment[0].user_id && parentComment[0].user_id !== userId) {
      const [commenter] = await pool.execute('SELECT username FROM users WHERE id = ?', [userId]);
      const commenterName = commenter.length > 0 ? commenter[0].username : 'Seseorang';

      await pool.execute(
        `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, is_read, is_emailed)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          parentComment[0].user_id,
          NOTIFICATION_TYPES.COMMENT,
          `${commenterName} membalas komentarmu`,
          `${commenterName} membalas komentarmu di "${chapterData.chapter_title}"`,
          REFERENCE_TYPES.COMMENT,
          commentId,
        ]
      );
    }
  }

  return getCommentById(commentId);
};

/**
 * Update comment — hanya pemilik comment
 */
const updateComment = async (commentId, userId, data) => {
  const [rows] = await pool.execute('SELECT * FROM comments WHERE id = ?', [commentId]);

  if (rows.length === 0) {
    throw ApiError.notFound('Comment tidak ditemukan');
  }

  if (rows[0].user_id !== userId) {
    throw ApiError.forbidden('Anda tidak memiliki izin untuk mengedit komentar ini');
  }

  await pool.execute('UPDATE comments SET content = ? WHERE id = ?', [data.content, commentId]);

  return getCommentById(commentId);
};

/**
 * Delete comment — pemilik atau admin
 */
const deleteComment = async (commentId, userId, userRole) => {
  const [rows] = await pool.execute('SELECT user_id FROM comments WHERE id = ?', [commentId]);

  if (rows.length === 0) {
    throw ApiError.notFound('Comment tidak ditemukan');
  }

  if (rows[0].user_id !== userId && userRole !== 'admin') {
    throw ApiError.forbidden('Anda tidak memiliki izin untuk menghapus komentar ini');
  }

  // CASCADE akan menghapus replies (parent_id FK)
  await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);
};

/**
 * Get single comment by ID
 */
const getCommentById = async (commentId) => {
  const [rows] = await pool.execute(
    `SELECT c.*, u.username, u.avatar_url
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.id = ?`,
    [commentId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Comment tidak ditemukan');
  }

  return rows[0];
};

/**
 * Get comments by chapter (threaded: parent + replies)
 */
const getCommentsByChapter = async (chapterId, query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  // Cek chapter exist
  const [chapter] = await pool.execute('SELECT id FROM chapters WHERE id = ?', [chapterId]);
  if (chapter.length === 0) {
    throw ApiError.notFound('Chapter tidak ditemukan');
  }

  // Hitung top-level comments saja
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as total FROM comments WHERE chapter_id = ? AND parent_id IS NULL',
    [chapterId]
  );
  const totalItems = countRows[0].total;

  // Ambil top-level comments (parent_id IS NULL)
  const [parents] = await pool.execute(
    `SELECT c.*, u.username, u.avatar_url
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.chapter_id = ? AND c.parent_id IS NULL
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [chapterId, String(limit), String(offset)]
  );

  // Untuk setiap parent, ambil replies
  const commentsWithReplies = await Promise.all(
    parents.map(async (parent) => {
      const [replies] = await pool.execute(
        `SELECT c.*, u.username, u.avatar_url
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
         WHERE c.parent_id = ?
         ORDER BY c.created_at ASC`,
        [parent.id]
      );
      return { ...parent, replies };
    })
  );

  return {
    comments: commentsWithReplies,
    pagination: { page, limit, totalItems },
  };
};

/**
 * Flag comment (admin) — toggle is_flagged
 */
const flagComment = async (commentId) => {
  const [rows] = await pool.execute('SELECT is_flagged FROM comments WHERE id = ?', [commentId]);

  if (rows.length === 0) {
    throw ApiError.notFound('Comment tidak ditemukan');
  }

  const newFlag = rows[0].is_flagged ? 0 : 1;
  await pool.execute('UPDATE comments SET is_flagged = ? WHERE id = ?', [newFlag, commentId]);

  return { is_flagged: !!newFlag };
};

module.exports = {
  createComment,
  updateComment,
  deleteComment,
  getCommentsByChapter,
  flagComment,
};
