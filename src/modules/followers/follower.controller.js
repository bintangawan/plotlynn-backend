const followerService = require('./follower.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/followers/:userId — Toggle follow/unfollow
 */
const toggleFollow = catchAsync(async (req, res) => {
  const result = await followerService.toggleFollow(req.user.id, Number(req.params.userId));
  const message = result.following ? 'Berhasil mem-follow user' : 'Berhasil unfollow user';
  ApiResponse.success(res, result, message);
});

/**
 * GET /api/followers/:userId/followers — Daftar followers user
 */
const getFollowers = catchAsync(async (req, res) => {
  const result = await followerService.getFollowers(Number(req.params.userId), req.query);
  ApiResponse.paginated(res, result.followers, result.pagination, 'Daftar followers berhasil diambil');
});

/**
 * GET /api/followers/:userId/following — Daftar following user
 */
const getFollowing = catchAsync(async (req, res) => {
  const result = await followerService.getFollowing(Number(req.params.userId), req.query);
  ApiResponse.paginated(res, result.following, result.pagination, 'Daftar following berhasil diambil');
});

/**
 * GET /api/followers/check/:userId — Cek follow status
 */
const checkFollow = catchAsync(async (req, res) => {
  const result = await followerService.checkFollow(req.user.id, Number(req.params.userId));
  ApiResponse.success(res, result);
});

module.exports = {
  toggleFollow,
  getFollowers,
  getFollowing,
  checkFollow,
};
