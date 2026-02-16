const nodemailer = require('nodemailer');
const { pool } = require('../config/database');
const config = require('../config');

/**
 * Konfigurasi email transporter
 *
 * Untuk development: gunakan Ethereal (fake SMTP) atau Mailtrap
 * Untuk production: gunakan SMTP asli (Gmail, SendGrid, dll)
 *
 * Tambahkan env variables berikut di .env jika mau pakai SMTP asli:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your_email@gmail.com
 *   SMTP_PASS=your_app_password
 *   SMTP_FROM=Plotlynn <noreply@plotlynn.com>
 */
const createTransporter = () => {
  // Jika SMTP dikonfigurasi, gunakan SMTP asli
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development: log ke console saja (tidak kirim email beneran)
  console.log('⚠️  SMTP not configured. Emails will be logged to console only.');
  return null;
};

/**
 * Kirim email notifikasi ke user
 */
const sendEmail = async (transporter, to, subject, html) => {
  if (!transporter) {
    // Development fallback: log saja
    console.log(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  const from = process.env.SMTP_FROM || 'Plotlynn <noreply@plotlynn.com>';
  await transporter.sendMail({ from, to, subject, html });
};

/**
 * Template email untuk notifikasi chapter baru
 */
const buildNewChapterEmail = (notification, writerName, storyTitle) => {
  return {
    subject: `📖 ${writerName} baru saja update "${storyTitle}"!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Plotlynn</h2>
        <p>Hai! 👋</p>
        <p><strong>${writerName}</strong> baru saja mempublikasikan chapter baru di cerita <strong>"${storyTitle}"</strong>.</p>
        <p>${notification.message}</p>
        <a href="${config.clientUrl}/stories/${notification.reference_id}" 
           style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Baca Sekarang
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">
          Kamu menerima email ini karena kamu follow ${writerName} di Plotlynn.
        </p>
      </div>
    `,
  };
};

/**
 * Template email generik untuk notifikasi lainnya
 */
const buildGenericEmail = (notification) => {
  return {
    subject: `🔔 ${notification.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Plotlynn</h2>
        <p>Hai! 👋</p>
        <h3>${notification.title}</h3>
        <p>${notification.message}</p>
        <a href="${config.clientUrl}" 
           style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Buka Plotlynn
        </a>
      </div>
    `,
  };
};

/**
 * Main cron function: Ambil semua notifikasi yang belum di-email, kirim, update flag
 */
const sendPendingEmailNotifications = async () => {
  const transporter = createTransporter();

  // Ambil notifikasi yang belum di-email (batch 50 per cycle)
  const [notifications] = await pool.execute(
    `SELECT n.*, u.email, u.username as recipient_name
     FROM notifications n
     JOIN users u ON u.id = n.user_id
     WHERE n.is_emailed = 0
     ORDER BY n.created_at ASC
     LIMIT 50`
  );

  if (notifications.length === 0) {
    return;
  }

  console.log(`📧 [Cron] Processing ${notifications.length} pending email notifications...`);

  for (const notification of notifications) {
    try {
      let emailContent;

      if (notification.type === 'new_chapter' && notification.reference_type === 'story') {
        // Ambil info writer & story untuk email yang lebih informatif
        const [storyRows] = await pool.execute(
          `SELECT s.title, u.username as writer_name 
           FROM stories s 
           JOIN users u ON u.id = s.writer_id 
           WHERE s.id = ?`,
          [notification.reference_id]
        );

        if (storyRows.length > 0) {
          emailContent = buildNewChapterEmail(notification, storyRows[0].writer_name, storyRows[0].title);
        } else {
          emailContent = buildGenericEmail(notification);
        }
      } else {
        emailContent = buildGenericEmail(notification);
      }

      await sendEmail(transporter, notification.email, emailContent.subject, emailContent.html);

      // Update flag is_emailed = 1
      await pool.execute('UPDATE notifications SET is_emailed = 1 WHERE id = ?', [notification.id]);
    } catch (error) {
      console.error(`❌ [Cron] Failed to email notification #${notification.id}:`, error.message);
      // Lanjutkan ke notifikasi berikutnya, jangan stop seluruh batch
    }
  }

  console.log(`✅ [Cron] Email batch completed`);
};

module.exports = { sendPendingEmailNotifications };
