const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/roles');
const { validate } = require('../../middlewares/validate');
const reportValidation = require('./report.validation');

// ========== USER ROUTES ==========

// POST /api/reports — buat laporan (semua user yang login)
router.post(
  '/',
  authenticate,
  validate(reportValidation.createReport),
  reportController.createReport
);

// ========== ADMIN ROUTES ==========

// GET /api/reports — list semua reports (admin)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(reportValidation.listReports),
  reportController.listReports
);

// GET /api/reports/:reportId — detail report (admin)
router.get(
  '/:reportId',
  authenticate,
  authorize('admin'),
  validate(reportValidation.getReportById),
  reportController.getReportById
);

// PATCH /api/reports/:reportId/status — update status (admin)
router.patch(
  '/:reportId/status',
  authenticate,
  authorize('admin'),
  validate(reportValidation.updateReportStatus),
  reportController.updateReportStatus
);

// DELETE /api/reports/:reportId — hapus report (admin)
router.delete(
  '/:reportId',
  authenticate,
  authorize('admin'),
  validate(reportValidation.getReportById),
  reportController.deleteReport
);

module.exports = router;
