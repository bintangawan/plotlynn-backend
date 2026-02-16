const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams agar :storyId dari parent route tersedia
const chapterController = require('./chapter.controller');
const { authenticate, optionalAuth } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/roles');
const { validate } = require('../../middlewares/validate');
const chapterValidation = require('./chapter.validation');

// ========== PUBLIC / OPTIONAL AUTH ROUTES ==========

// GET /api/stories/:storyId/chapters — list chapters (publik: published saja, owner: semua)
router.get(
  '/',
  optionalAuth,
  validate(chapterValidation.listChapters),
  chapterController.listChapters
);

// GET /api/stories/:storyId/chapters/:chapterId — detail chapter
router.get(
  '/:chapterId',
  validate(chapterValidation.getChapter),
  chapterController.getChapter
);

// ========== AUTHENTICATED ROUTES (writer/admin) ==========

// POST /api/stories/:storyId/chapters — create chapter
router.post(
  '/',
  authenticate,
  authorize('writer', 'admin'),
  validate(chapterValidation.createChapter),
  chapterController.createChapter
);

// PUT /api/stories/:storyId/chapters/:chapterId — update chapter
router.put(
  '/:chapterId',
  authenticate,
  authorize('writer', 'admin'),
  validate(chapterValidation.updateChapter),
  chapterController.updateChapter
);

// DELETE /api/stories/:storyId/chapters/:chapterId — delete chapter
router.delete(
  '/:chapterId',
  authenticate,
  authorize('writer', 'admin'),
  validate(chapterValidation.deleteChapter),
  chapterController.deleteChapter
);

module.exports = router;
