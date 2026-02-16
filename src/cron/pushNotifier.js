const webpush = require('web-push');
const { pool } = require('../config/database');
const config = require('../config');

/**
 * Setup web-push VAPID
 */
const setupWebPush = () => {
  if (config.vapid.publicKey && config.vapid.privateKey) {
    webpush.setVapidDetails(
      config.vapid.contact,
      config.vapid.publicKey,
      config.vapid.privateKey
    );
    return true;
  }
  console.log('⚠️  VAPID keys not configured. Push notifications will be skipped.');
  return false;
};

/**
 * Kirim push notification ke satu subscription
 */
const sendPush = async (subscription, payload) => {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
  } catch (error) {
    // Jika subscription expired/invalid (410 Gone atau 404), hapus dari DB
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`🗑️  Removing expired push subscription: ${subscription.id}`);
      await pool.execute('DELETE FROM push_subscriptions WHERE id = ?', [subscription.id]);
    } else {
      console.error(`❌ Push notification failed for subscription #${subscription.id}:`, error.message);
    }
  }
};

/**
 * Main cron function: Ambil notifikasi yang belum di-push, kirim push, flag
 *
 * Strategi: Kita menggunakan field is_read=0 sebagai indikator bahwa notifikasi masih fresh.
 * Untuk push, kita track via tabel terpisah agar tidak bentrok dengan email cron.
 * Kita kirim push untuk semua notifikasi yang created_at dalam 5 menit terakhir
 * (sesuai interval cron) agar tidak double-push.
 */
const sendPendingPushNotifications = async () => {
  const vapidReady = setupWebPush();
  if (!vapidReady) return;

  // Ambil notifikasi yang dibuat dalam 6 menit terakhir (sedikit overlap untuk keamanan)
  // dan belum di-read (masih relevan untuk push)
  const [notifications] = await pool.execute(
    `SELECT n.id, n.user_id, n.type, n.title, n.message, n.reference_type, n.reference_id
     FROM notifications n
     WHERE n.created_at >= DATE_SUB(NOW(), INTERVAL 6 MINUTE)
       AND n.is_read = 0
     ORDER BY n.created_at ASC
     LIMIT 100`
  );

  if (notifications.length === 0) return;

  console.log(`🔔 [Cron] Processing ${notifications.length} push notifications...`);

  // Group notifications by user_id untuk batch push
  const userNotifications = {};
  for (const notif of notifications) {
    if (!userNotifications[notif.user_id]) {
      userNotifications[notif.user_id] = [];
    }
    userNotifications[notif.user_id].push(notif);
  }

  // Untuk setiap user, ambil subscription dan kirim push
  for (const [userId, notifs] of Object.entries(userNotifications)) {
    const [subscriptions] = await pool.execute(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subscriptions.length === 0) continue;

    // Kirim notifikasi terbaru saja (atau gabungkan jika banyak)
    for (const notif of notifs) {
      const payload = {
        title: notif.title,
        body: notif.message,
        icon: '/icons/plotlynn-icon-192.png',
        badge: '/icons/plotlynn-badge-72.png',
        tag: `${notif.type}-${notif.id}`,
        data: {
          notificationId: notif.id,
          type: notif.type,
          referenceType: notif.reference_type,
          referenceId: notif.reference_id,
          url: buildNotificationUrl(notif),
        },
      };

      for (const sub of subscriptions) {
        await sendPush(sub, payload);
      }
    }
  }

  console.log(`✅ [Cron] Push notification batch completed`);
};

/**
 * Helper: build URL berdasarkan notification type
 */
const buildNotificationUrl = (notification) => {
  const base = config.clientUrl;

  switch (notification.reference_type) {
    case 'story':
      return `${base}/stories/${notification.reference_id}`;
    case 'chapter':
      return `${base}/chapters/${notification.reference_id}`;
    case 'comment':
      return `${base}/comments/${notification.reference_id}`;
    case 'user':
      return `${base}/users/${notification.reference_id}`;
    default:
      return `${base}/notifications`;
  }
};

module.exports = { sendPendingPushNotifications };
