const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION } = require('../../utils/constants');

/**
 * Get my notifications (paginated, filterable)
 */
const getMyNotifications = async (userId, query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  let sql = `SELECT * FROM notifications WHERE user_id = ?`;
  let countSql = `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`;
  const params = [userId];
  const countParams = [userId];

  if (query.type) {
    sql += ' AND type = ?';
    countSql += ' AND type = ?';
    params.push(query.type);
    countParams.push(query.type);
  }

  if (query.is_read !== undefined) {
    sql += ' AND is_read = ?';
    countSql += ' AND is_read = ?';
    params.push(query.is_read);
    countParams.push(query.is_read);
  }

  const [countRows] = await pool.execute(countSql, countParams);
  const totalItems = countRows[0].total;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(String(limit), String(offset));

  const [rows] = await pool.execute(sql, params);

  // Hitung unread count
  const [unreadRows] = await pool.execute(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  return {
    notifications: rows,
    unread_count: unreadRows[0].count,
    pagination: { page, limit, totalItems },
  };
};

/**
 * Mark single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const [rows] = await pool.execute(
    'SELECT id, user_id FROM notifications WHERE id = ?',
    [notificationId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Notifikasi tidak ditemukan');
  }

  if (rows[0].user_id !== userId) {
    throw ApiError.forbidden('Anda tidak memiliki izin');
  }

  await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);

  return { id: notificationId, is_read: 1 };
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  const [result] = await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  return { updated: result.affectedRows };
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId, userId) => {
  const [rows] = await pool.execute(
    'SELECT id, user_id FROM notifications WHERE id = ?',
    [notificationId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Notifikasi tidak ditemukan');
  }

  if (rows[0].user_id !== userId) {
    throw ApiError.forbidden('Anda tidak memiliki izin');
  }

  await pool.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return { unread_count: rows[0].count };
};

// ========================
// Push Subscription Management
// ========================

/**
 * Subscribe to push notifications
 * push_subscriptions: id, user_id, endpoint, p256dh, auth, created_at
 */
const subscribePush = async (userId, subscription) => {
  // Cek apakah endpoint sudah ada untuk user ini
  const [existing] = await pool.execute(
    'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    [userId, subscription.endpoint]
  );

  if (existing.length > 0) {
    // Update keys jika sudah ada
    await pool.execute(
      'UPDATE push_subscriptions SET p256dh = ?, auth = ? WHERE id = ?',
      [subscription.keys.p256dh, subscription.keys.auth, existing[0].id]
    );
    return { subscribed: true, message: 'Subscription diperbarui' };
  }

  // Insert baru
  await pool.execute(
    'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
    [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
  );

  return { subscribed: true, message: 'Berhasil subscribe push notification' };
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  subscribePush,
};
