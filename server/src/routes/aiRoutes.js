'use strict';
/**
 * aiRoutes.js
 * AI Feature endpoints for Content Generation & Recommendations.
 */

const express = require('express');
const router = express.Router();

const aiController = require('../controllers/aiController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { PERMS } = require('../middleware/permissions');

// All AI routes require authentication
router.use(requireAuth);

router.post('/guide-chat', aiController.answerGuideQuestion);

// Recommendation Engine (matrix: Attendee only)
router.get('/recommendations/sessions', requireRole(...PERMS.AI_RECOMMEND), aiController.getRecommendedSessions);

// Content Generation (matrix: Organizer full, Speaker limited to bio/summary)
router.post(
  '/event-description',
  requireRole(...PERMS.AI_CONTENT),
  aiController.generateEventDescription
);

router.post(
  '/speaker-bio',
  requireRole(...PERMS.AI_CONTENT_SPEAKER),
  aiController.generateSpeakerBio
);

router.post(
  '/announcement',
  requireRole(...PERMS.AI_CONTENT),
  aiController.generateAnnouncement
);

router.post(
  '/session-summary',
  requireRole(...PERMS.AI_CONTENT_SPEAKER),
  aiController.generateSessionSummary
);

module.exports = router;
