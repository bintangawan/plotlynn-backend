const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const genreService = require('./genre.service');

/**
 * GET /api/genres
 * Get all genres (public)
 */
const getAllGenres = catchAsync(async (req, res) => {
  const genres = await genreService.getAllGenres();
  ApiResponse.success(res, genres, 'Daftar genre berhasil diambil');
});

/**
 * GET /api/genres/:slug
 * Get genre by slug (public)
 */
const getBySlug = catchAsync(async (req, res) => {
  const genre = await genreService.getBySlug(req.params.slug);
  ApiResponse.success(res, genre, 'Detail genre berhasil diambil');
});

module.exports = { getAllGenres, getBySlug };
