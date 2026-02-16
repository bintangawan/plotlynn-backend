const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const userService = require('./user.service');

/**
 * GET /api/users/:id
 * Get user profile by ID (public)
 */
const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  ApiResponse.success(res, user, 'Profil user berhasil diambil');
});

/**
 * GET /api/users/username/:username
 * Get user by username (public)
 */
const getUserByUsername = catchAsync(async (req, res) => {
  const user = await userService.getUserByUsername(req.params.username);
  ApiResponse.success(res, user, 'Profil user berhasil diambil');
});

/**
 * PUT /api/users/profile
 * Update own profile (authenticated)
 */
const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  ApiResponse.success(res, user, 'Profil berhasil diupdate');
});

/**
 * PUT /api/users/change-password
 * Change own password (authenticated)
 */
const changePassword = catchAsync(async (req, res) => {
  await userService.changePassword(req.user.id, req.body);
  ApiResponse.success(res, null, 'Password berhasil diubah');
});

/**
 * PATCH /api/users/upgrade-writer
 * Upgrade role dari reader ke writer (authenticated)
 */
const upgradeToWriter = catchAsync(async (req, res) => {
  const user = await userService.upgradeToWriter(req.user.id);
  ApiResponse.success(res, user, 'Berhasil upgrade ke Writer! Sekarang Anda bisa membuat cerita.');
});

/**
 * GET /api/users
 * Get all users (paginated, optional filter)
 */
const getUsers = catchAsync(async (req, res) => {
  const { page, limit, role, search } = req.query;
  const result = await userService.getUsers({
    page: parseInt(page) || undefined,
    limit: parseInt(limit) || undefined,
    role,
    search,
  });
  ApiResponse.paginated(res, result.users, result.pagination, 'Daftar user berhasil diambil');
});

module.exports = { getUserById, getUserByUsername, updateProfile, changePassword, upgradeToWriter, getUsers };
