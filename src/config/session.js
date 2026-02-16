const session = require('express-session');
const config = require('./index');

const sessionConfig = session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production',   // HTTPS only di production
    httpOnly: true,                         // Tidak bisa diakses via JS
    maxAge: 24 * 60 * 60 * 1000,           // 1 hari
    sameSite: config.env === 'production' ? 'none' : 'lax',
  },
});

module.exports = sessionConfig;
