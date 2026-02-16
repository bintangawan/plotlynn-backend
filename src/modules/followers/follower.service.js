const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION, NOTIFICATION_TYPES, REFERENCE_TYPES } = require('../../utils/constants');

/**
 * Toggle follow (follow/unfollow)
 * followers: PK(follower_id, following_id), created_at
 */
const toggleFollow = async (followerId, followingId) => {
  // Tidak bisa follow diri sendiri
  if (followerId === followingId) {
    throw ApiError.badRequest('Anda tidak dapat mem-follow diri sendiri');
  }

  // Cek user target exist
  const [targetUser] = await pool.execute('SELECT id, username FROM users WHERE id = ?', [followingId]);
  if (targetUser.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  // Cek apakah sudah follow
  const [existing] = await pool.execute(
    'SELECT follower_id FROM followers WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );

  if (existing.length > 0) {
    // Unfollow
    await pool.execute(
      'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return { following: false };
  }

  // Follow
  await pool.execute(
    'INSERT INTO followers (follower_id, following_id) VALUES (?, ?)',
    [followerId, followingId]
  );

  // Notifikasi ke user yang di-follow
  const [follower] = await pool.execute('SELECT username FROM users WHERE id = ?', [followerId]);
  const followerName = follower.length > 0 ? follower[0].username : 'Seseorang';

  await pool.execute(
    `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, is_read, is_emailed)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      followingId,
      NOTIFICATION_TYPES.FOLLOW,
      `${followerName} mulai mengikutimu`,
      `${followerName} sekarang mengikuti profilmu di Plotlynn.`,
      REFERENCE_TYPES.USER,
      followerId,
    ]
  );

  return { following: true };
};

/**
 * Get followers of a user (siapa yang follow dia)
 */
const getFollowers = async (userId, query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as total FROM followers WHERE following_id = ?',
    [userId]
  );
  const totalItems = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.avatar_url, u.bio, u.role, f.created_at as followed_at
     FROM followers f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, String(limit), String(offset)]
  );

  return {
    followers: rows,
    pagination: { page, limit, totalItems },
  };
};

/**
 * Get following of a user (siapa yang dia follow)
 */
const getFollowing = async (userId, query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as total FROM followers WHERE follower_id = ?',
    [userId]
  );
  const totalItems = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.avatar_url, u.bio, u.role, f.created_at as followed_at
     FROM followers f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, String(limit), String(offset)]
  );

  return {
    following: rows,
    pagination: { page, limit, totalItems },
  };
};

/**
 * Check apakah currentUser sudah follow targetUser
 */
const checkFollow = async (followerId, followingId) => {
  const [rows] = await pool.execute(
    'SELECT follower_id FROM followers WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );
  return { following: rows.length > 0 };
};

module.exports = {
  toggleFollow,
  getFollowers,
  getFollowing,
  checkFollow,
};
