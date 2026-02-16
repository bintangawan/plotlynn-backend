const express = require('express');
const router = express.Router();
const commentController = require('./comment.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/roles');
const { validate } = require('../../middlewares/validate');
const commentValidation = require('./comment.validation');

// ========== PUBLIC ROUTES ==========

// GET /api/comments/chapter/:chapterId — daftar komentar per chapter (threaded)
router.get(
  '/chapter/:chapterId',
  validate(commentValidation.getCommentsByChapter),
  commentController.getCommentsByChapter
);

// ========== AUTHENTICATED ROUTES ==========

// POST /api/comments/:chapterId — buat komentar baru
router.post(
  '/:chapterId',
  authenticate,
  validate(commentValidation.createComment),
  commentController.createComment
);

// PUT /api/comments/:commentId — edit komentar (pemilik saja)
router.put(
  '/:commentId',
  authenticate,
  validate(commentValidation.updateComment),
  commentController.updateComment
);

// DELETE /api/comments/:commentId — hapus komentar (pemilik/admin)
router.delete(
  '/:commentId',
  authenticate,
  validate(commentValidation.deleteComment),
  commentController.deleteComment
);

// PATCH /api/comments/:commentId/flag — toggle flag (admin only)
router.patch(
  '/:commentId/flag',
  authenticate,
  authorize('admin'),
  validate(commentValidation.flagComment),
  commentController.flagComment
);

module.exports = router;
