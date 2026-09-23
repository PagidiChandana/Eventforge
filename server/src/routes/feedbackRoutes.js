'use strict';

const express = require('express');
const router = express.Router();

const feedbackController = require('../controllers/feedbackController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { authorizeEventAccess } = require('../middleware/eventAuthMiddleware');
const { PERMS } = require('../middleware/permissions');

// Submit feedback (matrix: Attendee Submit)
router.post('/events/:eventId/feedback', requireAuth, requireRole(...PERMS.FEEDBACK_SUBMIT), feedbackController.submitFeedback);

// Own feedback history (Attendee views only their own submissions)
router.get('/feedback/mine', requireAuth, requireRole(...PERMS.FEEDBACK_SUBMIT), feedbackController.getMyFeedback);

// View feedback stats & list (matrix: Organizer View, Speaker View)
router.get(
  '/events/:eventId/feedback',
  requireAuth,
  requireRole(...PERMS.FEEDBACK_VIEW),
  authorizeEventAccess,
  feedbackController.getEventFeedback
);

module.exports = router;
