const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../models/User');

// All policy routes require PLATFORM_ADMIN role
router.use(requireAuth, requireRole(ROLES.PLATFORM_ADMIN));

router.get('/', policyController.getPolicy);
router.put('/', policyController.updatePolicy);

module.exports = router;
