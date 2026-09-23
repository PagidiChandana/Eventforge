const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../models/User');
const { PERMS } = require('../middleware/permissions');

// Public routes (signup is Attendee-only, enforced server-side)
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Platform Admin provisions privileged accounts (organizer/staff/speaker/sponsor)
router.post(
  '/admin/users',
  requireAuth,
  requireRole(...PERMS.ADMIN_ONLY),
  authController.createUserByAdmin
);

// Protected routes
router.get('/me', requireAuth, authController.me);
router.put('/me', requireAuth, authController.updateMe);
router.put('/me/password', requireAuth, authController.changeMyPassword);
router.post('/logout', requireAuth, authController.logout);

// User directory (matrix: User Management = Admin only)
router.get(
  '/users',
  requireAuth,
  requireRole(...PERMS.USER_MANAGE),
  authController.listUsers
);

// Activate / deactivate accounts (Admin only)
router.patch(
  '/users/:id/status',
  requireAuth,
  requireRole(ROLES.PLATFORM_ADMIN),
  authController.setUserStatus
);

// Sample Role Authorization routes (to verify backend access control)
router.get('/admin-only', requireAuth, requireRole(ROLES.PLATFORM_ADMIN), (req, res) => {
  res.json({ success: true, message: 'Welcome Platform Admin!' });
});

router.get('/organizer-only', requireAuth, requireRole(ROLES.PLATFORM_ADMIN, ROLES.EVENT_ORGANIZER), (req, res) => {
  res.json({ success: true, message: 'Welcome Event Organizer or Admin!' });
});

module.exports = router;
