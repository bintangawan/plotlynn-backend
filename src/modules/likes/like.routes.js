const express = require('express');
const router = express.Router();
const likeController = require('./like.controller');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const likeValidation = require('./like.validation');

// ========== PUBLIC ROUTES ==========

// GET /api/likes/chapter/:chapterId — info like per chapter (count + recent likers)
router.get(
  '/chapter/:chapterId',
  validate(likeValidation.getLikesByChapter),
  likeController.getLikesByChapter
);

// ========== AUTHENTICATED ROUTES ==========

// GET /api/likes/check/:chapterId — cek apakah saya sudah like
router.get(
  '/check/:chapterId',
  authenticate,
  validate(likeValidation.checkLike),
  likeController.checkLike
);

// POST /api/likes/:chapterId — toggle like
router.post(
  '/:chapterId',
  authenticate,
  validate(likeValidation.toggleLike),
  likeController.toggleLike
);

module.exports = router;
