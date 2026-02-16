const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const authService = require('./auth.service');
const config = require('../../config');

/**
 * POST /api/auth/register
 * Register user baru (email + password)
 */
const register = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;
  const result = await authService.register({ username, email, password });
  ApiResponse.created(res, result, 'Registrasi berhasil');
});

/**
 * POST /api/auth/login
 * Login dengan email + password
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  ApiResponse.success(res, result, 'Login berhasil');
});

/**
 * GET /api/auth/google
 * Redirect ke Google OAuth consent screen
 * (Ditangani langsung oleh passport di routes)
 */

/**
 * GET /api/auth/google/callback
 * Callback setelah Google OAuth berhasil
 */
const googleCallback = catchAsync(async (req, res) => {
  const result = authService.handleGoogleCallback(req.user);

  // Redirect ke frontend dengan token sebagai query param
  const redirectUrl = `${config.clientUrl}/auth/callback?token=${result.token}`;
  res.redirect(redirectUrl);
});

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  ApiResponse.success(res, user, 'Data user berhasil diambil');
});

/**
 * POST /api/auth/logout
 * Logout (invalidate session jika pakai session-based)
 */
const logout = catchAsync(async (req, res) => {
  // Untuk JWT-based auth, logout ditangani di client (hapus token)
  // Di sini kita destroy session passport (jika ada)
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout gagal' });
    }
    ApiResponse.success(res, null, 'Logout berhasil');
  });
});

module.exports = { register, login, googleCallback, getMe, logout };
