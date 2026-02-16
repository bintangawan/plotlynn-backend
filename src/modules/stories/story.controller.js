const storyService = require('./story.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/stories — Buat story baru (writer/admin)
 */
const createStory = catchAsync(async (req, res) => {
  const story = await storyService.createStory(req.user.id, req.body);
  ApiResponse.created(res, story, 'Story berhasil dibuat');
});

/**
 * PUT /api/stories/:id — Update story (owner/admin)
 */
const updateStory = catchAsync(async (req, res) => {
  const story = await storyService.updateStory(
    Number(req.params.id),
    req.user.id,
    req.user.role,
    req.body
  );
  ApiResponse.success(res, story, 'Story berhasil diperbarui');
});

/**
 * GET /api/stories/:id — Detail story by ID
 */
const getStoryById = catchAsync(async (req, res) => {
  const story = await storyService.getStoryById(Number(req.params.id), true);
  ApiResponse.success(res, story);
});

/**
 * GET /api/stories/slug/:slug — Detail story by slug
 */
const getStoryBySlug = catchAsync(async (req, res) => {
  const story = await storyService.getStoryBySlug(req.params.slug);
  ApiResponse.success(res, story);
});

/**
 * DELETE /api/stories/:id — Hapus story (owner/admin)
 */
const deleteStory = catchAsync(async (req, res) => {
  await storyService.deleteStory(Number(req.params.id), req.user.id, req.user.role);
  ApiResponse.noContent(res);
});

/**
 * GET /api/stories — List stories (public, filterable)
 */
const listStories = catchAsync(async (req, res) => {
  const result = await storyService.listStories(req.query);
  ApiResponse.paginated(res, result.stories, result.pagination, 'Daftar story berhasil diambil');
});

/**
 * GET /api/stories/me — List my stories (writer)
 */
const getMyStories = catchAsync(async (req, res) => {
  const result = await storyService.getMyStories(req.user.id, req.query);
  ApiResponse.paginated(res, result.stories, result.pagination, 'Daftar story saya berhasil diambil');
});

module.exports = {
  createStory,
  updateStory,
  getStoryById,
  getStoryBySlug,
  deleteStory,
  listStories,
  getMyStories,
};
