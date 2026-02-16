const dotenv = require('dotenv');
const path = require('path');

// Load .env dari root backend/
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'plotlynn_db',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
  },

  // Web Push (VAPID)
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    contact: process.env.VAPID_CONTACT || 'mailto:noreply@plotlynn.com',
  },

  // Frontend
  clientUrl: process.env.CLIENT_URL || 'http://localhost:8000',
};

module.exports = config;
