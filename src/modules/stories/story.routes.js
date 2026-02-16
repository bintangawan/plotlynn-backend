const express = require('express');
const router = express.Router();
const storyController = require('./story.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/roles');
const { validate } = require('../../middlewares/validate');
const storyValidation = require('./story.validation');

// ========== PUBLIC ROUTES ==========

// GET /api/stories — list stories (filterable, paginated)
router.get('/', validate(storyValidation.listStories), storyController.listStories);

// GET /api/stories/slug/:slug — detail by slug
router.get('/slug/:slug', validate(storyValidation.getStoryBySlug), storyController.getStoryBySlug);

// ========== AUTHENTICATED ROUTES ==========

// GET /api/stories/me/list — my stories (writer/admin) — HARUS sebelum /:id
router.get('/me/list', authenticate, authorize('writer', 'admin'), storyController.getMyStories);

// GET /api/stories/:id — detail by ID
router.get('/:id', validate(storyValidation.getStoryById), storyController.getStoryById);

// POST /api/stories — create story (writer/admin)
router.post(
  '/',
  authenticate,
  authorize('writer', 'admin'),
  validate(storyValidation.createStory),
  storyController.createStory
);

// PUT /api/stories/:id — update story (owner/admin)
router.put(
  '/:id',
  authenticate,
  authorize('writer', 'admin'),
  validate(storyValidation.updateStory),
  storyController.updateStory
);

// DELETE /api/stories/:id — delete story (owner/admin)
router.delete(
  '/:id',
  authenticate,
  authorize('writer', 'admin'),
  validate(storyValidation.deleteStory),
  storyController.deleteStory
);

module.exports = router;
