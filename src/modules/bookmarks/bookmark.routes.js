const express = require('express');
const router = express.Router();
const bookmarkController = require('./bookmark.controller');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const bookmarkValidation = require('./bookmark.validation');

// Semua route bookmark butuh autentikasi
router.use(authenticate);

// GET /api/bookmarks — daftar bookmark saya
router.get('/', validate(bookmarkValidation.getMyBookmarks), bookmarkController.getMyBookmarks);

// GET /api/bookmarks/check/:storyId — cek apakah story sudah di-bookmark
router.get('/check/:storyId', validate(bookmarkValidation.checkBookmark), bookmarkController.checkBookmark);

// POST /api/bookmarks/:storyId — toggle bookmark (add/remove)
router.post('/:storyId', validate(bookmarkValidation.toggleBookmark), bookmarkController.toggleBookmark);

module.exports = router;
