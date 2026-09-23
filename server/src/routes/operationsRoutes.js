const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { authorizeEventAccess } = require('../middleware/eventAuthMiddleware');
const { authorizeStaffOrOrganizer, authorizeStaffOrOrganizerOrSpeaker } = require('../middleware/staffAuthMiddleware');
const { PERMS } = require('../middleware/permissions');

// --- STAFF SHIFTS: own tasks only (matrix: Staff Management = Organizer manage, Staff own tasks) ---
router.get('/my-shifts', requireAuth, requireRole(...PERMS.STAFF_SELF), operationsController.getMyStaffShifts);

// --- QR CHECK-IN: perform = Staff only (matrix: Organizer View via operations-overview, Attendee Own QR via tickets) ---
router.post('/check-in', requireAuth, requireRole(...PERMS.CHECKIN_PERFORM), authorizeStaffOrOrganizer, operationsController.processQRCheckIn);

// --- SESSION ATTENDANCE: mark = Staff only; stats = Staff/Organizer/Admin/Speaker view ---
router.post('/events/:eventId/session-attendance', requireAuth, requireRole(...PERMS.ATTENDANCE_MARK), authorizeStaffOrOrganizer, operationsController.markSessionAttendance);
router.get('/events/:eventId/sessions/:sessionId/attendance', requireAuth, authorizeStaffOrOrganizerOrSpeaker, operationsController.getSessionAttendanceStats);

// --- ATTENDEE SUPPORT LOOKUP ---
router.get('/events/:eventId/support/search', requireAuth, authorizeStaffOrOrganizer, operationsController.searchAttendeeForSupport);

// --- ORGANIZER OPERATIONS DASHBOARD & STAFF MANAGEMENT ---
router.get(
  '/events/:eventId/operations-overview',
  requireAuth,
  requireRole(...PERMS.STAFF_MANAGE),
  authorizeEventAccess,
  operationsController.getEventOperationsOverview
);

router.get(
  '/events/:eventId/staff-assignments',
  requireAuth,
  requireRole(...PERMS.STAFF_MANAGE),
  authorizeEventAccess,
  operationsController.getStaffAssignments
);

router.post(
  '/events/:eventId/staff-assignments',
  requireAuth,
  requireRole(...PERMS.STAFF_MANAGE),
  authorizeEventAccess,
  operationsController.assignStaff
);

router.put(
  '/events/:eventId/staff-assignments/:id',
  requireAuth,
  requireRole(...PERMS.STAFF_MANAGE),
  authorizeEventAccess,
  operationsController.updateStaffAssignment
);

router.delete(
  '/events/:eventId/staff-assignments/:id',
  requireAuth,
  requireRole(...PERMS.STAFF_MANAGE),
  authorizeEventAccess,
  operationsController.deleteStaffAssignment
);

module.exports = router;
