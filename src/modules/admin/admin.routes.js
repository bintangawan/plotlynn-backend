const { Router } = require('express');
const adminController = require('./admin.controller');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/roles');
const adminValidation = require('./admin.validation');

const router = Router();

// Semua route admin memerlukan autentikasi + role admin
router.use(authenticate, authorize('admin'));

// ===========================
// USER MANAGEMENT
// ===========================

/**
 * GET /api/admin/users
 * List all users (paginated, filterable)
 * Query: ?page=1&limit=20&role=writer&search=john
 */
router.get('/users', adminController.getAllUsers);

/**
 * GET /api/admin/users/:id
 * Get user detail
 */
router.get('/users/:id', validate(adminValidation.getUserById), adminController.getUserById);

/**
 * PATCH /api/admin/users/:id/role
 * Update user role
 * Body: { role: 'writer' }
 */
router.patch('/users/:id/role', validate(adminValidation.updateUserRole), adminController.updateUserRole);

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', validate(adminValidation.deleteUser), adminController.deleteUser);

// ===========================
// REPORT MANAGEMENT
// ===========================

/**
 * GET /api/admin/reports
 * List all reports (paginated, filterable)
 * Query: ?page=1&limit=20&status=pending&target_type=story
 */
router.get('/reports', adminController.getAllReports);

/**
 * PATCH /api/admin/reports/:id
 * Update report status
 * Body: { status: 'reviewed' }
 */
router.patch('/reports/:id', validate(adminValidation.updateReportStatus), adminController.updateReportStatus);

// ===========================
// GENRE MANAGEMENT
// ===========================

/**
 * GET /api/admin/genres
 * List all genres
 */
router.get('/genres', adminController.getAllGenres);

/**
 * POST /api/admin/genres
 * Create genre
 * Body: { name: 'Fantasy' }
 */
router.post('/genres', validate(adminValidation.manageGenre), adminController.createGenre);

/**
 * PUT /api/admin/genres/:id
 * Update genre
 * Body: { name: 'Sci-Fi' }
 */
router.put('/genres/:id', validate(adminValidation.idParam), validate(adminValidation.manageGenre), adminController.updateGenre);

/**
 * DELETE /api/admin/genres/:id
 * Delete genre
 */
router.delete('/genres/:id', validate(adminValidation.idParam), adminController.deleteGenre);

// ===========================
// TAG MANAGEMENT
// ===========================

/**
 * GET /api/admin/tags
 * List all tags
 */
router.get('/tags', adminController.getAllTags);

/**
 * POST /api/admin/tags
 * Create tag
 * Body: { name: 'slow-burn' }
 */
router.post('/tags', validate(adminValidation.manageTag), adminController.createTag);

/**
 * PUT /api/admin/tags/:id
 * Update tag
 */
router.put('/tags/:id', validate(adminValidation.idParam), validate(adminValidation.manageTag), adminController.updateTag);

/**
 * DELETE /api/admin/tags/:id
 * Delete tag
 */
router.delete('/tags/:id', validate(adminValidation.idParam), adminController.deleteTag);

// ===========================
// PLATFORM STATS
// ===========================

/**
 * GET /api/admin/stats
 * Platform dashboard statistics
 */
router.get('/stats', adminController.getPlatformStats);

module.exports = router;
