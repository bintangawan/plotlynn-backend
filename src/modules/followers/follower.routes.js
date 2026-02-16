const express = require('express');
const router = express.Router();
const followerController = require('./follower.controller');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const followerValidation = require('./follower.validation');

// ========== PUBLIC ROUTES ==========

// GET /api/followers/:userId/followers — daftar followers user
router.get(
  '/:userId/followers',
  validate(followerValidation.getFollowers),
  followerController.getFollowers
);

// GET /api/followers/:userId/following — daftar following user
router.get(
  '/:userId/following',
  validate(followerValidation.getFollowing),
  followerController.getFollowing
);

// ========== AUTHENTICATED ROUTES ==========

// GET /api/followers/check/:userId — cek apakah saya follow user ini
router.get(
  '/check/:userId',
  authenticate,
  validate(followerValidation.checkFollow),
  followerController.checkFollow
);

// POST /api/followers/:userId — toggle follow/unfollow
router.post(
  '/:userId',
  authenticate,
  validate(followerValidation.toggleFollow),
  followerController.toggleFollow
);

module.exports = router;
