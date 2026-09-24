const { StaffAssignment } = require('../models/StaffAssignment');
const { Event } = require('../models/Event');
const Ticket = require('../models/Ticket');
const { Registration } = require('../models/Registration');
const mongoose = require('mongoose');
const { ROLES } = require('../models/User');

const authorizeStaffOrOrganizer = async (req, res, next, { checkInOnly = false } = {}) => {
  try {
    const { eventId } = req.params;
    let targetEventId = eventId || req.body.event || req.body.eventId;

    // If no explicit targetEventId provided, try resolving from qrToken, ticketCode, ticketNumber, or ticketId in req.body
    if (!targetEventId && (req.body.qrToken || req.body.ticketCode || req.body.ticketNumber || req.body.ticketId)) {
      const code = req.body.qrToken || req.body.ticketCode || req.body.ticketNumber;
      let ticket = null;
      if (code) {
        ticket = await Ticket.findOne({
          $or: [{ qrToken: code }, { ticketNumber: code }]
        });
        if (!ticket) {
          const reg = await Registration.findOne({ ticketCode: code });
          if (reg) targetEventId = reg.event;
        } else {
          targetEventId = ticket.event;
        }
      } else if (req.body.ticketId && mongoose.Types.ObjectId.isValid(req.body.ticketId)) {
        ticket = await Ticket.findById(req.body.ticketId);
        if (ticket) targetEventId = ticket.event;
      }
      if (!targetEventId && req.body.ticketId && mongoose.Types.ObjectId.isValid(req.body.ticketId)) {
        ticket = await Ticket.findById(req.body.ticketId);
        if (ticket) targetEventId = ticket.event;
      }
    }

    if (!targetEventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required for staff operational check.'
      });
    }

    // 1. Platform Admin always has full access
    if (req.user.role === ROLES.PLATFORM_ADMIN) {
      return next();
    }

    // 2. Event Organizer owning the event has full access
    if (req.user.role === ROLES.EVENT_ORGANIZER) {
      const event = await Event.findById(targetEventId);
      if (event && event.organizer.toString() === req.user.id.toString()) {
        return next();
      }
    }

    // 3. Event Staff assigned to this event has access
    const assignmentQuery = {
      event: targetEventId,
      staffUser: req.user.id,
      status: 'Active'
    };
    if (checkInOnly) assignmentQuery.role = 'Check-in Staff';
    const assignment = await StaffAssignment.findOne(assignmentQuery);

    if (assignment) {
      req.staffAssignment = assignment;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access Denied: You are not assigned as staff to operate on this event.'
    });
  } catch (err) {
    next(err);
  }
};

const authorizeCheckInStaff = (req, res, next) => authorizeStaffOrOrganizer(req, res, next, { checkInOnly: true });

// Matrix (Session Attendance row): Admin View, Organizer View, Staff ✅, Speaker View.
// Read-only stats endpoint additionally admits speakers (view own session numbers).
const authorizeStaffOrOrganizerOrSpeaker = async (req, res, next) => {
  try {
    if (req.user.role === ROLES.SPEAKER) return next();
    return authorizeStaffOrOrganizer(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = { authorizeStaffOrOrganizer, authorizeCheckInStaff, authorizeStaffOrOrganizerOrSpeaker };
