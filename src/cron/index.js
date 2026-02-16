const cron = require('node-cron');
const { sendPendingEmailNotifications } = require('./emailNotifier');
const { sendPendingPushNotifications } = require('./pushNotifier');

/**
 * Register semua cron jobs
 * Dipanggil dari server.js setelah server start
 */
const initCronJobs = () => {
  console.log('⏰ Initializing cron jobs...');

  // Kirim email notifikasi setiap 5 menit
  // Cek notifications yang is_emailed = 0, kirim email, update is_emailed = 1
  cron.schedule('*/5 * * * *', async () => {
    console.log('📧 [Cron] Running email notifier...');
    try {
      await sendPendingEmailNotifications();
    } catch (error) {
      console.error('❌ [Cron] Email notifier error:', error.message);
    }
  });

  // Kirim push notification setiap 2 menit
  // Lebih sering dari email karena push harus lebih realtime
  cron.schedule('*/2 * * * *', async () => {
    console.log('🔔 [Cron] Running push notifier...');
    try {
      await sendPendingPushNotifications();
    } catch (error) {
      console.error('❌ [Cron] Push notifier error:', error.message);
    }
  });

  console.log('✅ Cron jobs initialized');
};

module.exports = { initCronJobs };
