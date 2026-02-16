const readingHistoryService = require('./readingHistory.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/reading-history — Upsert reading history
 */
const upsertHistory = catchAsync(async (req, res) => {
  const result = await readingHistoryService.upsertHistory(req.user.id, req.body);
  ApiResponse.success(res, result, 'Reading history berhasil diperbarui');
});

/**
 * GET /api/reading-history — My reading history
 */
const getMyHistory = catchAsync(async (req, res) => {
  const result = await readingHistoryService.getMyHistory(req.user.id, req.query);
  ApiResponse.paginated(res, result.history, result.pagination, 'Reading history berhasil diambil');
});

/**
 * DELETE /api/reading-history/:storyId — Hapus satu entry
 */
const deleteHistory = catchAsync(async (req, res) => {
  await readingHistoryService.deleteHistory(req.user.id, Number(req.params.storyId));
  ApiResponse.noContent(res);
});

/**
 * DELETE /api/reading-history — Clear semua reading history
 */
const clearAllHistory = catchAsync(async (req, res) => {
  const result = await readingHistoryService.clearAllHistory(req.user.id);
  ApiResponse.success(res, result, 'Semua reading history berhasil dihapus');
});

module.exports = {
  upsertHistory,
  getMyHistory,
  deleteHistory,
  clearAllHistory,
};
