const reportService = require('./report.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/reports — Buat laporan baru (user)
 */
const createReport = catchAsync(async (req, res) => {
  const report = await reportService.createReport(req.user.id, req.body);
  ApiResponse.created(res, report, 'Laporan berhasil dikirim');
});

/**
 * GET /api/reports — List reports (admin)
 */
const listReports = catchAsync(async (req, res) => {
  const result = await reportService.listReports(req.query);
  ApiResponse.paginated(res, result.reports, result.pagination, 'Daftar laporan berhasil diambil');
});

/**
 * GET /api/reports/:reportId — Detail report (admin)
 */
const getReportById = catchAsync(async (req, res) => {
  const report = await reportService.getReportById(Number(req.params.reportId));
  ApiResponse.success(res, report);
});

/**
 * PATCH /api/reports/:reportId/status — Update status report (admin)
 */
const updateReportStatus = catchAsync(async (req, res) => {
  const report = await reportService.updateReportStatus(
    Number(req.params.reportId),
    req.body.status
  );
  ApiResponse.success(res, report, 'Status laporan berhasil diperbarui');
});

/**
 * DELETE /api/reports/:reportId — Hapus report (admin)
 */
const deleteReport = catchAsync(async (req, res) => {
  await reportService.deleteReport(Number(req.params.reportId));
  ApiResponse.noContent(res);
});

module.exports = {
  createReport,
  listReports,
  getReportById,
  updateReportStatus,
  deleteReport,
};
