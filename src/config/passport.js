const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./index');
const { pool } = require('./database');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar_url, role, is_verified FROM users WHERE id = ?',
      [id]
    );
    done(null, rows[0] || null);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails[0].value;
        const displayName = profile.displayName;
        const avatarUrl = profile.photos[0]?.value || null;

        // Cek apakah user sudah ada berdasarkan google_id
        const [existingByGoogle] = await pool.execute(
          'SELECT * FROM users WHERE google_id = ?',
          [googleId]
        );

        if (existingByGoogle.length > 0) {
          return done(null, existingByGoogle[0]);
        }

        // Cek apakah email sudah terdaftar (register manual sebelumnya)
        const [existingByEmail] = await pool.execute(
          'SELECT * FROM users WHERE email = ?',
          [email]
        );

        if (existingByEmail.length > 0) {
          // Link Google account ke user yang sudah ada
          await pool.execute(
            'UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?), is_verified = 1 WHERE id = ?',
            [googleId, avatarUrl, existingByEmail[0].id]
          );
          const [updated] = await pool.execute('SELECT * FROM users WHERE id = ?', [existingByEmail[0].id]);
          return done(null, updated[0]);
        }

        // Buat user baru
        // Generate username unik dari displayName
        let username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const [duplicateUsername] = await pool.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );
        if (duplicateUsername.length > 0) {
          username = `${username}${Date.now().toString().slice(-4)}`;
        }

        const [result] = await pool.execute(
          'INSERT INTO users (username, email, google_id, avatar_url, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
          [username, email, googleId, avatarUrl, 'reader', 1]
        );

        const [newUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
        return done(null, newUser[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
