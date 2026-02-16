const likeService = require('./like.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/likes/:chapterId — Toggle like
 */
const toggleLike = catchAsync(async (req, res) => {
  const result = await likeService.toggleLike(req.user.id, Number(req.params.chapterId));
  const message = result.liked ? 'Berhasil menyukai chapter' : 'Like berhasil dihapus';
  ApiResponse.success(res, result, message);
});

/**
 * GET /api/likes/check/:chapterId — Check like status
 */
const checkLike = catchAsync(async (req, res) => {
  const result = await likeService.checkLike(req.user.id, Number(req.params.chapterId));
  ApiResponse.success(res, result);
});

/**
 * GET /api/likes/chapter/:chapterId — Like info per chapter
 */
const getLikesByChapter = catchAsync(async (req, res) => {
  const result = await likeService.getLikesByChapter(Number(req.params.chapterId));
  ApiResponse.success(res, result);
});

module.exports = {
  toggleLike,
  checkLike,
  getLikesByChapter,
};
