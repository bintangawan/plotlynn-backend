const express = require('express');
const router = express.Router();
const readingHistoryController = require('./readingHistory.controller');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const readingHistoryValidation = require('./readingHistory.validation');

// Semua route reading history butuh autentikasi
router.use(authenticate);

// GET /api/reading-history — daftar reading history saya
router.get('/', validate(readingHistoryValidation.getMyHistory), readingHistoryController.getMyHistory);

// POST /api/reading-history — upsert (catat/update progress baca)
router.post('/', validate(readingHistoryValidation.upsertHistory), readingHistoryController.upsertHistory);

// DELETE /api/reading-history/clear — clear semua history
router.delete('/clear', readingHistoryController.clearAllHistory);

// DELETE /api/reading-history/:storyId — hapus satu entry
router.delete('/:storyId', validate(readingHistoryValidation.deleteHistory), readingHistoryController.deleteHistory);

module.exports = router;
