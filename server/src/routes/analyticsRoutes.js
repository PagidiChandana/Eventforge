'use strict';

const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { authorizeEventAccess } = require('../middleware/eventAuthMiddleware');
const { PERMS } = require('../middleware/permissions');

router.use(requireAuth);

// Matrix Analytics row: Platform (Admin) + Event (Organizer).
// Other roles are served by scoped endpoints (my-shifts, speaker sessions,
// my-tickets/registrations, sponsor deliverables, session attendance stats).
router.get(
  '/organizer/dashboard',
  requireRole(...PERMS.ANALYTICS_FULL),
  analyticsController.getOrganizerOverview
);

router.get(
  '/events/:eventId',
  requireRole(...PERMS.ANALYTICS_FULL),
  authorizeEventAccess,
  analyticsController.getEventAnalytics
);

module.exports = router;
