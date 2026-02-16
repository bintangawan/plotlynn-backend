const { Router } = require('express');
const genreController = require('./genre.controller');
const { validate } = require('../../middlewares/validate');
const genreValidation = require('./genre.validation');

const router = Router();

/**
 * GET /api/genres
 * List all genres (public)
 * Admin CRUD ada di /api/admin/genres
 */
router.get('/', genreController.getAllGenres);

/**
 * GET /api/genres/:slug
 * Get genre detail by slug (public)
 */
router.get('/:slug', validate(genreValidation.getBySlug), genreController.getBySlug);

module.exports = router;
