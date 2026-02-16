const chapterService = require('./chapter.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/stories/:storyId/chapters — Buat chapter baru
 */
const createChapter = catchAsync(async (req, res) => {
  const chapter = await chapterService.createChapter(
    Number(req.params.storyId),
    req.user.id,
    req.user.role,
    req.body
  );
  ApiResponse.created(res, chapter, 'Chapter berhasil dibuat');
});

/**
 * PUT /api/stories/:storyId/chapters/:chapterId — Update chapter
 */
const updateChapter = catchAsync(async (req, res) => {
  const chapter = await chapterService.updateChapter(
    Number(req.params.storyId),
    Number(req.params.chapterId),
    req.user.id,
    req.user.role,
    req.body
  );
  ApiResponse.success(res, chapter, 'Chapter berhasil diperbarui');
});

/**
 * GET /api/stories/:storyId/chapters/:chapterId — Detail chapter
 */
const getChapter = catchAsync(async (req, res) => {
  const chapter = await chapterService.getChapterById(
    Number(req.params.storyId),
    Number(req.params.chapterId)
  );
  ApiResponse.success(res, chapter);
});

/**
 * DELETE /api/stories/:storyId/chapters/:chapterId — Hapus chapter
 */
const deleteChapter = catchAsync(async (req, res) => {
  await chapterService.deleteChapter(
    Number(req.params.storyId),
    Number(req.params.chapterId),
    req.user.id,
    req.user.role
  );
  ApiResponse.noContent(res);
});

/**
 * GET /api/stories/:storyId/chapters — List chapters
 */
const listChapters = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const result = await chapterService.listChapters(
    Number(req.params.storyId),
    userId,
    req.query
  );
  ApiResponse.paginated(res, result.chapters, result.pagination, 'Daftar chapter berhasil diambil');
});

module.exports = {
  createChapter,
  updateChapter,
  getChapter,
  deleteChapter,
  listChapters,
};
