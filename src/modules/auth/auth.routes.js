const { Router } = require('express');
const passport = require('passport');
const authController = require('./auth.controller');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const authValidation = require('./auth.validation');

const router = Router();

/**
 * POST /api/auth/register
 * Register user baru (email + password)
 */
router.post('/register', validate(authValidation.register), authController.register);

/**
 * POST /api/auth/login
 * Login dengan email + password
 */
router.post('/login', validate(authValidation.login), authController.login);

/**
 * GET /api/auth/google
 * Redirect ke Google OAuth consent screen
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * GET /api/auth/google/callback
 * Callback setelah Google OAuth
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/google/failure',
    session: true,
  }),
  authController.googleCallback
);

/**
 * GET /api/auth/google/failure
 * Jika Google OAuth gagal
 */
router.get('/google/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Google authentication gagal',
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user (perlu JWT)
 */
router.get('/me', authenticate, authController.getMe);

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
