const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const config = require('./config');
const sessionConfig = require('./config/session');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');

// Inisialisasi passport strategy
require('./config/passport');

const app = express();

// ============================
// Global Middlewares
// ============================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (development only)
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Session (dipakai oleh Passport OAuth)
app.use(sessionConfig);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ============================
// Health Check
// ============================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Plotlynn API is running 🚀',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// ============================
// API Routes
// ============================
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/user.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/genres', require('./modules/genres/genre.routes'));
app.use('/api/tags', require('./modules/tags/tag.routes'));
app.use('/api/stories', require('./modules/stories/story.routes'));
app.use('/api/stories/:storyId/chapters', require('./modules/chapters/chapter.routes'));
app.use('/api/bookmarks', require('./modules/bookmarks/bookmark.routes'));
app.use('/api/comments', require('./modules/comments/comment.routes'));
app.use('/api/followers', require('./modules/followers/follower.routes'));
app.use('/api/likes', require('./modules/likes/like.routes'));
app.use('/api/notifications', require('./modules/notifications/notification.routes'));
app.use('/api/reading-history', require('./modules/reading-history/readingHistory.routes'));
app.use('/api/reports', require('./modules/reports/report.routes'));

// ============================
// Error Handling
// ============================

// 404 handler (route tidak ditemukan)
app.use(notFound);

// Global error handler (harus paling akhir)
app.use(errorHandler);

module.exports = app;
