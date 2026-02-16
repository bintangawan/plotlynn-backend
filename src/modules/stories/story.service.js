const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { slugify, generateUniqueSlug } = require('../../utils/slugify');
const { PAGINATION, NOTIFICATION_TYPES, REFERENCE_TYPES } = require('../../utils/constants');

/**
 * Helper: ambil genres & tags untuk satu story
 */
const getStoryRelations = async (storyId) => {
  const [genres] = await pool.execute(
    `SELECT g.id, g.name, g.slug 
     FROM genres g 
     JOIN story_genres sg ON sg.genre_id = g.id 
     WHERE sg.story_id = ?`,
    [storyId]
  );

  const [tags] = await pool.execute(
    `SELECT t.id, t.name, t.slug 
     FROM tags t 
     JOIN story_tags st ON st.tag_id = t.id 
     WHERE st.story_id = ?`,
    [storyId]
  );

  const [stats] = await pool.execute(
    'SELECT total_views, total_likes, total_bookmarks FROM story_stats WHERE story_id = ?',
    [storyId]
  );

  return {
    genres,
    tags,
    stats: stats[0] || { total_views: 0, total_likes: 0, total_bookmarks: 0 },
  };
};

/**
 * Helper: sync genre_ids ke story_genres
 */
const syncGenres = async (storyId, genreIds) => {
  // Hapus relasi lama
  await pool.execute('DELETE FROM story_genres WHERE story_id = ?', [storyId]);
  // Insert relasi baru
  for (const genreId of genreIds) {
    await pool.execute('INSERT INTO story_genres (story_id, genre_id) VALUES (?, ?)', [storyId, genreId]);
  }
};

/**
 * Helper: sync tag_ids ke story_tags
 */
const syncTags = async (storyId, tagIds) => {
  await pool.execute('DELETE FROM story_tags WHERE story_id = ?', [storyId]);
  for (const tagId of tagIds) {
    await pool.execute('INSERT INTO story_tags (story_id, tag_id) VALUES (?, ?)', [storyId, tagId]);
  }
};

/**
 * Helper: buat notifikasi untuk semua followers writer
 */
const notifyFollowers = async (writerId, storyId, storyTitle, writerName) => {
  // Ambil semua followers si writer
  const [followers] = await pool.execute(
    'SELECT follower_id FROM followers WHERE following_id = ?',
    [writerId]
  );

  if (followers.length === 0) return;

  // Batch insert notifikasi
  const values = followers.map((f) => [
    f.follower_id,
    NOTIFICATION_TYPES.NEW_CHAPTER,
    `${writerName} memposting cerita baru!`,
    `"${storyTitle}" — cerita baru dari ${writerName} sudah tersedia. Yuk baca sekarang!`,
    REFERENCE_TYPES.STORY,
    storyId,
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
 * Create story — hanya writer & admin
 */
const createStory = async (writerId, data) => {
  // Generate unique slug
  let slug = slugify(data.title);
  const [existingSlug] = await pool.execute('SELECT id FROM stories WHERE slug = ?', [slug]);
  if (existingSlug.length > 0) {
    slug = generateUniqueSlug(data.title);
  }

  const [result] = await pool.execute(
    `INSERT INTO stories (writer_id, title, slug, synopsis, cover_image_url, status, age_rating)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      writerId,
      data.title,
      slug,
      data.synopsis || null,
      data.cover_image_url || null,
      data.status || 'draft',
      data.age_rating || 'general',
    ]
  );

  const storyId = result.insertId;

  // Buat story_stats record
  await pool.execute(
    'INSERT INTO story_stats (story_id, total_views, total_likes, total_bookmarks) VALUES (?, 0, 0, 0)',
    [storyId]
  );

  // Sync genres & tags
  if (data.genre_ids && data.genre_ids.length > 0) {
    await syncGenres(storyId, data.genre_ids);
  }
  if (data.tag_ids && data.tag_ids.length > 0) {
    await syncTags(storyId, data.tag_ids);
  }

  // Notifikasi ke followers jika story langsung berstatus ongoing (bukan draft)
  if (data.status && data.status !== 'draft') {
    const [writer] = await pool.execute('SELECT username FROM users WHERE id = ?', [writerId]);
    if (writer.length > 0) {
      await notifyFollowers(writerId, storyId, data.title, writer[0].username);
    }
  }

  // Return story lengkap
  return getStoryById(storyId);
};

/**
 * Update story — hanya pemilik story atau admin
 */
const updateStory = async (storyId, userId, userRole, data) => {
  const [rows] = await pool.execute('SELECT * FROM stories WHERE id = ?', [storyId]);

  if (rows.length === 0) {
    throw ApiError.notFound('Story tidak ditemukan');
  }

  const story = rows[0];

  // Cek ownership (unless admin)
  if (story.writer_id !== userId && userRole !== 'admin') {
    throw ApiError.forbidden('Anda tidak memiliki izin untuk mengedit cerita ini');
  }

  const fields = [];
  const values = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);

    // Update slug juga
    let newSlug = slugify(data.title);
    const [existingSlug] = await pool.execute('SELECT id FROM stories WHERE slug = ? AND id != ?', [newSlug, storyId]);
    if (existingSlug.length > 0) {
      newSlug = generateUniqueSlug(data.title);
    }
    fields.push('slug = ?');
    values.push(newSlug);
  }

  if (data.synopsis !== undefined) {
    fields.push('synopsis = ?');
    values.push(data.synopsis);
  }

  if (data.cover_image_url !== undefined) {
    fields.push('cover_image_url = ?');
    values.push(data.cover_image_url);
  }

  if (data.status !== undefined) {
    // Jika story diubah dari draft ke ongoing/completed, notifikasi followers
    if (story.status === 'draft' && data.status !== 'draft') {
      const [writer] = await pool.execute('SELECT username FROM users WHERE id = ?', [story.writer_id]);
      if (writer.length > 0) {
        await notifyFollowers(story.writer_id, storyId, data.title || story.title, writer[0].username);
      }
    }
    fields.push('status = ?');
    values.push(data.status);
  }

  if (data.age_rating !== undefined) {
    fields.push('age_rating = ?');
    values.push(data.age_rating);
  }

  if (fields.length > 0) {
    values.push(storyId);
    await pool.execute(`UPDATE stories SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // Sync genres & tags jika dikirim
  if (data.genre_ids !== undefined) {
    await syncGenres(storyId, data.genre_ids);
  }
  if (data.tag_ids !== undefined) {
    await syncTags(storyId, data.tag_ids);
  }

  return getStoryById(storyId);
};

/**
 * Get story by ID (public) — tambahkan view_count
 */
const getStoryById = async (storyId, incrementView = false) => {
  const [rows] = await pool.execute(
    `SELECT s.*, u.username as writer_name, u.avatar_url as writer_avatar
     FROM stories s
     LEFT JOIN users u ON u.id = s.writer_id
     WHERE s.id = ?`,
    [storyId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Story tidak ditemukan');
  }

  // Increment view count
  if (incrementView) {
    await pool.execute('UPDATE stories SET view_count = view_count + 1 WHERE id = ?', [storyId]);
    await pool.execute(
      'UPDATE story_stats SET total_views = total_views + 1 WHERE story_id = ?',
      [storyId]
    );
    rows[0].view_count += 1;
  }

  // Ambil relasi
  const relations = await getStoryRelations(storyId);

  // Hitung jumlah chapter yang published
  const [chapterCount] = await pool.execute(
    'SELECT COUNT(*) as count FROM chapters WHERE story_id = ? AND is_published = 1',
    [storyId]
  );

  return {
    ...rows[0],
    genres: relations.genres,
    tags: relations.tags,
    stats: relations.stats,
    chapter_count: chapterCount[0].count,
  };
};

/**
 * Get story by slug (public) — increment view
 */
const getStoryBySlug = async (slug) => {
  const [rows] = await pool.execute('SELECT id FROM stories WHERE slug = ?', [slug]);

  if (rows.length === 0) {
    throw ApiError.notFound('Story tidak ditemukan');
  }

  return getStoryById(rows[0].id, true);
};

/**
 * Delete story — hanya pemilik atau admin
 */
const deleteStory = async (storyId, userId, userRole) => {
  const [rows] = await pool.execute('SELECT writer_id FROM stories WHERE id = ?', [storyId]);

  if (rows.length === 0) {
    throw ApiError.notFound('Story tidak ditemukan');
  }

  if (rows[0].writer_id !== userId && userRole !== 'admin') {
    throw ApiError.forbidden('Anda tidak memiliki izin untuk menghapus cerita ini');
  }

  // CASCADE di SQL akan menghapus chapters, story_genres, story_tags, story_stats, bookmarks
  await pool.execute('DELETE FROM stories WHERE id = ?', [storyId]);
};

/**
 * List stories (public, paginated, filterable, sortable)
 */
const listStories = async (query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;

  let sql = `
    SELECT s.*, u.username as writer_name, u.avatar_url as writer_avatar,
           ss.total_views, ss.total_likes, ss.total_bookmarks,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id AND c.is_published = 1) as chapter_count
    FROM stories s
    LEFT JOIN users u ON u.id = s.writer_id
    LEFT JOIN story_stats ss ON ss.story_id = s.id
  `;

  let countSql = 'SELECT COUNT(DISTINCT s.id) as total FROM stories s';

  const conditions = ["s.status != 'draft'"]; // Public hanya tampilkan yang bukan draft
  const params = [];
  let joinGenre = false;
  let joinTag = false;

  if (query.status) {
    conditions.push('s.status = ?');
    params.push(query.status);
  }

  if (query.age_rating) {
    conditions.push('s.age_rating = ?');
    params.push(query.age_rating);
  }

  if (query.writer_id) {
    conditions.push('s.writer_id = ?');
    params.push(query.writer_id);
  }

  if (query.search) {
    conditions.push('(s.title LIKE ? OR s.synopsis LIKE ?)');
    params.push(`%${query.search}%`, `%${query.search}%`);
  }

  if (query.genre) {
    joinGenre = true;
    conditions.push('g.slug = ?');
    params.push(query.genre);
  }

  if (query.tag) {
    joinTag = true;
    conditions.push('t.slug = ?');
    params.push(query.tag);
  }

  // Tambah JOIN jika filter genre/tag
  let joins = '';
  if (joinGenre) {
    joins += ' JOIN story_genres sg ON sg.story_id = s.id JOIN genres g ON g.id = sg.genre_id';
  }
  if (joinTag) {
    joins += ' JOIN story_tags st ON st.story_id = s.id JOIN tags t ON t.id = st.tag_id';
  }

  sql = sql.replace('FROM stories s', `FROM stories s${joins}`);
  countSql += joins;

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    sql += where;
    countSql += where;
  }

  // Count total
  const [countRows] = await pool.execute(countSql, params);
  const totalItems = countRows[0].total;

  // Sort
  switch (query.sort) {
    case 'oldest':
      sql += ' ORDER BY s.created_at ASC';
      break;
    case 'popular':
      sql += ' ORDER BY ss.total_likes DESC, s.created_at DESC';
      break;
    case 'views':
      sql += ' ORDER BY s.view_count DESC, s.created_at DESC';
      break;
    case 'latest':
    default:
      sql += ' ORDER BY s.created_at DESC';
      break;
  }

  // Pagination
  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';

  const [rows] = await pool.execute(sql, [...params, String(limit), String(offset)]);

  // Untuk setiap story, ambil genres & tags
  const storiesWithRelations = await Promise.all(
    rows.map(async (story) => {
      const relations = await getStoryRelations(story.id);
      return { ...story, genres: relations.genres, tags: relations.tags };
    })
  );

  return {
    stories: storiesWithRelations,
    pagination: { page, limit, totalItems },
  };
};

/**
 * Get stories milik writer sendiri (termasuk draft)
 */
const getMyStories = async (writerId, query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;

  let sql = `
    SELECT s.*, ss.total_views, ss.total_likes, ss.total_bookmarks,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) as chapter_count
    FROM stories s
    LEFT JOIN story_stats ss ON ss.story_id = s.id
    WHERE s.writer_id = ?
  `;
  let countSql = 'SELECT COUNT(*) as total FROM stories WHERE writer_id = ?';
  const params = [writerId];
  const countParams = [writerId];

  if (query.status) {
    sql += ' AND s.status = ?';
    countSql += ' AND status = ?';
    params.push(query.status);
    countParams.push(query.status);
  }

  const [countRows] = await pool.execute(countSql, countParams);
  const totalItems = countRows[0].total;

  sql += ' ORDER BY s.updated_at DESC LIMIT ? OFFSET ?';
  const offset = (page - 1) * limit;
  params.push(String(limit), String(offset));

  const [rows] = await pool.execute(sql, params);

  const storiesWithRelations = await Promise.all(
    rows.map(async (story) => {
      const relations = await getStoryRelations(story.id);
      return { ...story, genres: relations.genres, tags: relations.tags };
    })
  );

  return {
    stories: storiesWithRelations,
    pagination: { page, limit, totalItems },
  };
};

module.exports = {
  createStory,
  updateStory,
  getStoryById,
  getStoryBySlug,
  deleteStory,
  listStories,
  getMyStories,
};
