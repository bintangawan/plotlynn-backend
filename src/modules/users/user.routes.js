const { Router } = require('express');
const userController = require('./user.controller');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const userValidation = require('./user.validation');

const router = Router();

/**
 * GET /api/users
 * List users (public, paginated)
 */
router.get('/', userController.getUsers);

/**
 * GET /api/users/profile
 * Get own profile (authenticated) — taruh sebelum /:id supaya tidak bentrok
 */
router.get('/profile', authenticate, (req, res, next) => {
  req.params.id = req.user.id;
  userController.getUserById(req, res, next);
});

/**
 * PUT /api/users/profile
 * Update own profile (authenticated)
 */
router.put('/profile', authenticate, validate(userValidation.updateProfile), userController.updateProfile);

/**
 * PUT /api/users/change-password
 * Change own password (authenticated)
 */
router.put('/change-password', authenticate, validate(userValidation.changePassword), userController.changePassword);

/**
 * PATCH /api/users/upgrade-writer
 * Upgrade dari reader ke writer (authenticated)
 */
router.patch('/upgrade-writer', authenticate, userController.upgradeToWriter);

/**
 * GET /api/users/username/:username
 * Get user by username (public)
 */
router.get('/username/:username', validate(userValidation.getUserByUsername), userController.getUserByUsername);

/**
 * GET /api/users/:id
 * Get user by ID (public) — taruh paling bawah agar tidak menangkap route string di atas
 */
router.get('/:id', validate(userValidation.getUserById), userController.getUserById);

module.exports = router;
