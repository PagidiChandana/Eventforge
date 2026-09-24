const express = require('express');
const router = express.Router();
const modulesController = require('../controllers/modulesController');
const presentationUpload = require('../middleware/presentationUpload');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { PERMS } = require('../middleware/permissions');

// --- SPEAKER HUB (Speaker ONLY — organizers use /organizer/* management APIs) ---
router.get(
  '/speaker/profile',
  requireAuth,
  requireRole(...PERMS.SPEAKER_ONLY),
  modulesController.getSpeakerProfile
);

router.put(
  '/speaker/profile/:id',
  requireAuth,
  requireRole(...PERMS.SPEAKER_ONLY),
  modulesController.updateSpeakerProfile
);

router.get(
  '/speaker/sessions',
  requireAuth,
  requireRole(...PERMS.SPEAKER_ONLY),
  modulesController.getSpeakerSessions
);

router.get(
  '/speaker/feedback',
  requireAuth,
  requireRole(...PERMS.SPEAKER_ONLY),
  modulesController.getSpeakerFeedback
);

router.post(
  '/speaker/materials',
  requireAuth,
  requireRole(...PERMS.SPEAKER_ONLY),
  presentationUpload.single('file'),
  modulesController.uploadPresentationMaterial
);

router.get('/materials/files/:fileId', requireAuth, modulesController.downloadPresentationMaterial);
router.get('/sessions/:sessionId/materials', requireAuth, modulesController.getMaterialsBySession);

// --- SPONSOR PORTAL (Sponsor ONLY — organizers manage via event-scoped sponsor APIs) ---
router.get(
  '/sponsor/profile',
  requireAuth,
  requireRole(...PERMS.SPONSOR_ONLY),
  modulesController.getSponsorProfile
);

router.put(
  '/sponsor/profile/:id',
  requireAuth,
  requireRole(...PERMS.SPONSOR_ONLY),
  modulesController.updateSponsorProfile
);

router.get(
  '/sponsors/:sponsorId/deliverables',
  requireAuth,
  requireRole(...PERMS.SPONSOR_ONLY),
  modulesController.getDeliverablesBySponsor
);

router.post(
  '/sponsors/deliverables',
  requireAuth,
  requireRole(...PERMS.DELIVERABLE_MANAGE),
  modulesController.createDeliverable
);

router.put(
  '/sponsors/deliverables/:id',
  requireAuth,
  requireRole(...PERMS.SPONSOR_SELF),
  modulesController.updateDeliverableStatus
);

// Organizer: view all deliverables for an event
router.get(
  '/events/:eventId/deliverables',
  requireAuth,
  requireRole(...PERMS.ORGANIZER_ONLY),
  modulesController.getDeliverablesByEvent
);

// Organizer: approve/reject a deliverable
router.put(
  '/events/:eventId/deliverables/:id',
  requireAuth,
  requireRole(...PERMS.ORGANIZER_ONLY),
  modulesController.updateDeliverableStatus
);

router.get(
  '/sponsors/:sponsorId/assets',
  requireAuth,
  requireRole(...PERMS.SPONSOR_ONLY),
  modulesController.getBrandAssetsBySponsor
);

router.post(
  '/sponsors/assets',
  requireAuth,
  requireRole(...PERMS.SPONSOR_ONLY),
  modulesController.uploadBrandAsset
);

// --- ORGANIZER SPEAKER MANAGEMENT (Organizer ONLY; assignment-level, never personal profiles) ---
router.get(
  '/organizer/speakers',
  requireAuth,
  requireRole(...PERMS.ORGANIZER_ONLY),
  modulesController.getOrganizerSpeakers
);

router.post(
  '/organizer/speakers',
  requireAuth,
  requireRole(...PERMS.ORGANIZER_ONLY),
  modulesController.createSpeakerForOrganizer
);

router.post(
  '/organizer/sessions/:sessionId/speakers',
  requireAuth,
  requireRole(...PERMS.ORGANIZER_ONLY),
  modulesController.assignSpeakerToSession
);

router.delete(
  '/organizer/sessions/:sessionId/speakers/:speakerId',
  requireAuth,
  requireRole(...PERMS.ORGANIZER_ONLY),
  modulesController.removeSpeakerFromSession
);

module.exports = router;
