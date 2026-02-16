const notificationService = require('./notification.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * GET /api/notifications — Daftar notifikasi saya
 */
const getMyNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.getMyNotifications(req.user.id, req.query);
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Daftar notifikasi berhasil diambil',
    data: result.notifications,
    unread_count: result.unread_count,
    pagination: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalItems: result.pagination.totalItems,
      totalPages: Math.ceil(result.pagination.totalItems / result.pagination.limit),
    },
  });
});

/**
 * GET /api/notifications/unread-count — Jumlah notifikasi belum dibaca
 */
const getUnreadCount = catchAsync(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  ApiResponse.success(res, result);
});

/**
 * PATCH /api/notifications/:notificationId/read — Mark as read
 */
const markAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAsRead(
    Number(req.params.notificationId),
    req.user.id
  );
  ApiResponse.success(res, result, 'Notifikasi ditandai telah dibaca');
});

/**
 * PATCH /api/notifications/read-all — Mark all as read
 */
const markAllAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  ApiResponse.success(res, result, 'Semua notifikasi ditandai telah dibaca');
});

/**
 * DELETE /api/notifications/:notificationId — Hapus notifikasi
 */
const deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotification(
    Number(req.params.notificationId),
    req.user.id
  );
  ApiResponse.noContent(res);
});

/**
 * POST /api/notifications/push/subscribe — Subscribe push notification
 */
const subscribePush = catchAsync(async (req, res) => {
  const result = await notificationService.subscribePush(req.user.id, req.body);
  ApiResponse.created(res, result);
});

/**
 * GET /api/notifications/push/vapid-key — Get VAPID public key
 */
const getVapidKey = catchAsync(async (req, res) => {
  const config = require('../../config');
  ApiResponse.success(res, { publicKey: config.vapid.publicKey });
});

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribePush,
  getVapidKey,
};
