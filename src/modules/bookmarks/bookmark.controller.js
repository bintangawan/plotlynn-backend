const bookmarkService = require('./bookmark.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/bookmarks/:storyId — Toggle bookmark
 */
const toggleBookmark = catchAsync(async (req, res) => {
  const result = await bookmarkService.toggleBookmark(req.user.id, Number(req.params.storyId));
  const message = result.bookmarked ? 'Story berhasil di-bookmark' : 'Bookmark berhasil dihapus';
  ApiResponse.success(res, result, message);
});

/**
 * GET /api/bookmarks — My bookmarks
 */
const getMyBookmarks = catchAsync(async (req, res) => {
  const result = await bookmarkService.getMyBookmarks(req.user.id, req.query);
  ApiResponse.paginated(res, result.bookmarks, result.pagination, 'Daftar bookmark berhasil diambil');
});

/**
 * GET /api/bookmarks/check/:storyId — Check bookmark status
 */
const checkBookmark = catchAsync(async (req, res) => {
  const result = await bookmarkService.checkBookmark(req.user.id, Number(req.params.storyId));
  ApiResponse.success(res, result);
});

module.exports = {
  toggleBookmark,
  getMyBookmarks,
  checkBookmark,
};
