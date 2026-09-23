const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { authorizeEventAccess } = require('../middleware/eventAuthMiddleware');
const { PERMS } = require('../middleware/permissions');

// --- PUBLIC READ ENDPOINTS ---
router.get('/events/:eventId/ticket-categories', registrationController.getCategoriesByEvent);

// --- ATTENDEE SELF-SERVICE (matrix: Ticket = Own, Registration = Own) ---
router.post('/events/:eventId/register', requireAuth, requireRole(...PERMS.REGISTER_SELF), registrationController.registerAttendee);
router.post('/events/:eventId/validate-coupon', requireAuth, requireRole(...PERMS.REGISTER_SELF), registrationController.validateCoupon);

router.get('/my-registrations', requireAuth, requireRole(...PERMS.REGISTER_SELF), registrationController.getMyRegistrations);
router.get('/my-tickets', requireAuth, requireRole(...PERMS.TICKET_SELF), registrationController.getMyTickets);
router.get('/tickets/:id', requireAuth, registrationController.getTicketById);
router.put('/registrations/:id/cancel', requireAuth, requireRole(...PERMS.REGISTER_SELF), registrationController.cancelRegistration);
router.put('/registrations/:id/sessions', requireAuth, requireRole(...PERMS.REGISTER_SELF), registrationController.updateSelectedSessions);

// --- ORGANIZER / ADMIN MANAGEMENT ENDPOINTS ---
router.post(
  '/events/:eventId/ticket-categories',
  requireAuth,
  requireRole(...PERMS.TICKET_MANAGE),
  authorizeEventAccess,
  registrationController.createCategory
);

router.put(
  '/events/:eventId/ticket-categories/:categoryId',
  requireAuth,
  requireRole(...PERMS.TICKET_MANAGE),
  authorizeEventAccess,
  registrationController.updateCategory
);

router.delete(
  '/events/:eventId/ticket-categories/:categoryId',
  requireAuth,
  requireRole(...PERMS.TICKET_MANAGE),
  authorizeEventAccess,
  registrationController.deleteCategory
);

router.post(
  '/events/:eventId/coupons',
  requireAuth,
  requireRole(...PERMS.TICKET_MANAGE),
  authorizeEventAccess,
  registrationController.createCoupon
);

router.get(
  '/events/:eventId/coupons',
  requireAuth,
  requireRole(...PERMS.TICKET_MANAGE),
  authorizeEventAccess,
  registrationController.getCouponsByEvent
);

router.get(
  '/events/:eventId/registrations',
  requireAuth,
  requireRole(...PERMS.TICKET_MANAGE),
  authorizeEventAccess,
  registrationController.getEventRegistrationsForOrganizer
);

router.patch(
  '/registrations/:id/status',
  requireAuth,
  requireRole(...PERMS.TICKET_MANAGE),
  registrationController.updateRegistrationStatus
);

module.exports = router;
