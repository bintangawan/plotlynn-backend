const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const adminService = require('./admin.service');

// ===========================
// USER MANAGEMENT
// ===========================

const getAllUsers = catchAsync(async (req, res) => {
  const { page, limit, role, search } = req.query;
  const result = await adminService.getAllUsers({
    page: parseInt(page) || undefined,
    limit: parseInt(limit) || undefined,
    role,
    search,
  });
  ApiResponse.paginated(res, result.users, result.pagination, 'Daftar user berhasil diambil');
});

const getUserById = catchAsync(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  ApiResponse.success(res, user, 'Detail user berhasil diambil');
});

const updateUserRole = catchAsync(async (req, res) => {
  const user = await adminService.updateUserRole(req.params.id, req.body.role);
  ApiResponse.success(res, user, `Role user berhasil diubah ke ${req.body.role}`);
});

const deleteUser = catchAsync(async (req, res) => {
  await adminService.deleteUser(parseInt(req.params.id), req.user.id);
  ApiResponse.success(res, null, 'User berhasil dihapus');
});

// ===========================
// REPORT MANAGEMENT
// ===========================

const getAllReports = catchAsync(async (req, res) => {
  const { page, limit, status, target_type } = req.query;
  const result = await adminService.getAllReports({
    page: parseInt(page) || undefined,
    limit: parseInt(limit) || undefined,
    status,
    target_type,
  });
  ApiResponse.paginated(res, result.reports, result.pagination, 'Daftar report berhasil diambil');
});

const updateReportStatus = catchAsync(async (req, res) => {
  const report = await adminService.updateReportStatus(req.params.id, req.body.status);
  ApiResponse.success(res, report, `Status report berhasil diubah ke ${req.body.status}`);
});

// ===========================
// GENRE MANAGEMENT
// ===========================

const getAllGenres = catchAsync(async (req, res) => {
  const genres = await adminService.getAllGenres();
  ApiResponse.success(res, genres, 'Daftar genre berhasil diambil');
});

const createGenre = catchAsync(async (req, res) => {
  const genre = await adminService.createGenre(req.body.name);
  ApiResponse.created(res, genre, 'Genre berhasil dibuat');
});

const updateGenre = catchAsync(async (req, res) => {
  const genre = await adminService.updateGenre(req.params.id, req.body.name);
  ApiResponse.success(res, genre, 'Genre berhasil diupdate');
});

const deleteGenre = catchAsync(async (req, res) => {
  await adminService.deleteGenre(req.params.id);
  ApiResponse.success(res, null, 'Genre berhasil dihapus');
});

// ===========================
// TAG MANAGEMENT
// ===========================

const getAllTags = catchAsync(async (req, res) => {
  const tags = await adminService.getAllTags();
  ApiResponse.success(res, tags, 'Daftar tag berhasil diambil');
});

const createTag = catchAsync(async (req, res) => {
  const tag = await adminService.createTag(req.body.name);
  ApiResponse.created(res, tag, 'Tag berhasil dibuat');
});

const updateTag = catchAsync(async (req, res) => {
  const tag = await adminService.updateTag(req.params.id, req.body.name);
  ApiResponse.success(res, tag, 'Tag berhasil diupdate');
});

const deleteTag = catchAsync(async (req, res) => {
  await adminService.deleteTag(req.params.id);
  ApiResponse.success(res, null, 'Tag berhasil dihapus');
});

// ===========================
// PLATFORM STATS
// ===========================

const getPlatformStats = catchAsync(async (req, res) => {
  const stats = await adminService.getPlatformStats();
  ApiResponse.success(res, stats, 'Platform statistics berhasil diambil');
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllReports,
  updateReportStatus,
  getAllGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getPlatformStats,
};
