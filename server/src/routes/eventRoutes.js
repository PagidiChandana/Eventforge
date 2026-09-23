const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { authorizeEventAccess } = require('../middleware/eventAuthMiddleware');
const { PERMS } = require('../middleware/permissions');

// --- PUBLIC READ ENDPOINTS ---
router.get('/', eventController.getEvents);
router.get('/venues', eventController.getVenues);
router.get('/speakers', eventController.getSpeakers);
router.get('/organizations', eventController.getOrganizations);
router.get('/:id', eventController.getEventById);

// Sub-resources for an event (Public read)
router.get('/:eventId/sessions', eventController.getSessionsByEvent);
router.get('/:eventId/packages', eventController.getPackagesByEvent);
router.get('/:eventId/sponsors', eventController.getSponsorsByEvent);
router.get('/:eventId/announcements', eventController.getAnnouncementsByEvent);

// --- PROTECTED GLOBAL CREATION ENDPOINTS ---
router.post(
  '/',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  eventController.createEvent
);

router.post(
  '/venues',
  requireAuth,
  requireRole(...PERMS.VENUE_MANAGE),
  eventController.createVenue
);

router.post(
  '/speakers',
  requireAuth,
  requireRole(...PERMS.SPEAKER_SELF),
  eventController.createSpeaker
);

router.post(
  '/organizations',
  requireAuth,
  requireRole(...PERMS.ORG_MANAGE),
  eventController.createOrganization
);

router.put(
  '/organizations/:id',
  requireAuth,
  requireRole(...PERMS.ORG_MANAGE),
  eventController.updateOrganization
);

router.delete(
  '/organizations/:id',
  requireAuth,
  requireRole(...PERMS.ORG_MANAGE),
  eventController.deleteOrganization
);

// --- EVENT-SCOPED MANAGEMENT ENDPOINTS ---
// Events
router.put(
  '/:eventId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.updateEvent
);

router.delete(
  '/:eventId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.deleteEvent
);

// Sessions
router.post(
  '/:eventId/sessions',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.createSession
);

router.put(
  '/:eventId/sessions/:sessionId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.updateSession
);

router.delete(
  '/:eventId/sessions/:sessionId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.deleteSession
);

// Packages
router.post(
  '/:eventId/packages',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.createPackage
);

router.put(
  '/:eventId/packages/:packageId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.updatePackage
);

router.delete(
  '/:eventId/packages/:packageId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.deletePackage
);

// Sponsors
router.post(
  '/:eventId/sponsors',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.createSponsor
);

router.put(
  '/:eventId/sponsors/:sponsorId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.updateSponsor
);

router.delete(
  '/:eventId/sponsors/:sponsorId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.deleteSponsor
);

// Announcements
router.post(
  '/:eventId/announcements',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.createAnnouncement
);

router.delete(
  '/:eventId/announcements/:announcementId',
  requireAuth,
  requireRole(...PERMS.EVENT_MANAGE),
  authorizeEventAccess,
  eventController.deleteAnnouncement
);

module.exports = router;
