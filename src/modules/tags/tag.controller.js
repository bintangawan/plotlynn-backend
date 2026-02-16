const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const tagService = require('./tag.service');

/**
 * GET /api/tags
 * Get all tags (public)
 */
const getAllTags = catchAsync(async (req, res) => {
  const tags = await tagService.getAllTags();
  ApiResponse.success(res, tags, 'Daftar tag berhasil diambil');
});

/**
 * GET /api/tags/:slug
 * Get tag by slug (public)
 */
const getBySlug = catchAsync(async (req, res) => {
  const tag = await tagService.getBySlug(req.params.slug);
  ApiResponse.success(res, tag, 'Detail tag berhasil diambil');
});

module.exports = { getAllTags, getBySlug };
