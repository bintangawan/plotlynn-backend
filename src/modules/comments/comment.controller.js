const commentService = require('./comment.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/comments/:chapterId — Buat komentar baru
 */
const createComment = catchAsync(async (req, res) => {
  const comment = await commentService.createComment(
    req.user.id,
    Number(req.params.chapterId),
    req.body
  );
  ApiResponse.created(res, comment, 'Komentar berhasil ditambahkan');
});

/**
 * PUT /api/comments/:commentId — Edit komentar
 */
const updateComment = catchAsync(async (req, res) => {
  const comment = await commentService.updateComment(
    Number(req.params.commentId),
    req.user.id,
    req.body
  );
  ApiResponse.success(res, comment, 'Komentar berhasil diperbarui');
});

/**
 * DELETE /api/comments/:commentId — Hapus komentar
 */
const deleteComment = catchAsync(async (req, res) => {
  await commentService.deleteComment(Number(req.params.commentId), req.user.id, req.user.role);
  ApiResponse.noContent(res);
});

/**
 * GET /api/comments/chapter/:chapterId — Daftar komentar per chapter
 */
const getCommentsByChapter = catchAsync(async (req, res) => {
  const result = await commentService.getCommentsByChapter(
    Number(req.params.chapterId),
    req.query
  );
  ApiResponse.paginated(res, result.comments, result.pagination, 'Daftar komentar berhasil diambil');
});

/**
 * PATCH /api/comments/:commentId/flag — Toggle flag (admin)
 */
const flagComment = catchAsync(async (req, res) => {
  const result = await commentService.flagComment(Number(req.params.commentId));
  ApiResponse.success(res, result, 'Flag status berhasil diubah');
});

module.exports = {
  createComment,
  updateComment,
  deleteComment,
  getCommentsByChapter,
  flagComment,
};
