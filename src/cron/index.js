const cron = require('node-cron');
const { sendPendingEmailNotifications } = require('./emailNotifier');

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

  console.log('✅ Cron jobs initialized');
};

module.exports = { initCronJobs };
