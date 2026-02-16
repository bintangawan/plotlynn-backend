const { Router } = require('express');
const tagController = require('./tag.controller');
const { validate } = require('../../middlewares/validate');
const tagValidation = require('./tag.validation');

const router = Router();

/**
 * GET /api/tags
 * List all tags (public)
 * Admin CRUD ada di /api/admin/tags
 */
router.get('/', tagController.getAllTags);

/**
 * GET /api/tags/:slug
 * Get tag detail by slug (public)
 */
router.get('/:slug', validate(tagValidation.getBySlug), tagController.getBySlug);

module.exports = router;
