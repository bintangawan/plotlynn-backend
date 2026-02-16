const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const notificationValidation = require('./notification.validation');

// Semua route perlu autentikasi
router.use(authenticate);

// GET /api/notifications — daftar notifikasi saya (filterable)
router.get('/', validate(notificationValidation.getMyNotifications), notificationController.getMyNotifications);

// GET /api/notifications/unread-count — jumlah unread
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/:notificationId/read — mark single as read
router.patch('/:notificationId/read', validate(notificationValidation.markAsRead), notificationController.markAsRead);

// DELETE /api/notifications/:notificationId — hapus notifikasi
router.delete('/:notificationId', validate(notificationValidation.markAsRead), notificationController.deleteNotification);

// ========== Push Notification Subscription ==========

// GET /api/notifications/push/vapid-key — get public VAPID key
router.get('/push/vapid-key', notificationController.getVapidKey);

// POST /api/notifications/push/subscribe — subscribe (permanent, no unsubscribe)
router.post('/push/subscribe', validate(notificationValidation.subscribePush), notificationController.subscribePush);

module.exports = router;
