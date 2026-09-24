const Ticket = require('../models/Ticket');
const CheckIn = require('../models/CheckIn');
const SessionAttendance = require('../models/SessionAttendance');
const Session = require('../models/Session');
const { StaffAssignment } = require('../models/StaffAssignment');
const { Registration } = require('../models/Registration');
const { Event } = require('../models/Event');
const { User } = require('../models/User');

class OperationsService {
  async getStaffDirectory() {
    return await User.find({ role: 'Event Staff', isActive: true }).select('name email').sort({ name: 1 }).lean();
  }

  // --- QR CHECK-IN ---
  async processQRCheckIn({ qrToken, ticketId, ticketCode, attendeeId, staffUserId, targetEventId }) {
    const searchCode = qrToken || ticketCode;
    const mongoose = require('mongoose');

    let query = [];
    if (searchCode) {
      const codeTrimmed = searchCode.trim();
      query.push({ qrToken: codeTrimmed });
      query.push({ ticketNumber: codeTrimmed });
    }
    if (ticketId && mongoose.Types.ObjectId.isValid(ticketId)) {
      query.push({ _id: ticketId });
    }

    let ticket = null;
    if (query.length > 0) {
      ticket = await Ticket.findOne({ $or: query })
        .populate('attendee', 'name email organization')
        .populate('event', 'name status startDate endDate')
        .populate('ticketCategory', 'name');
    }

    // If no ticket found directly, try finding Registration by ticketCode OR attendeeId
    if (!ticket) {
      const regQuery = {};
      if (searchCode) {
        regQuery.ticketCode = searchCode.trim();
      } else if (attendeeId) {
        regQuery.attendee = attendeeId;
      }
      if (targetEventId) regQuery.event = targetEventId;

      if (Object.keys(regQuery).length > 1) { // must have event + (ticketCode or attendee)
        const reg = await Registration.findOne(regQuery)
          .populate('attendee', 'name email organization')
          .populate('event', 'name status startDate endDate')
          .populate('ticketCategory', 'name');

        if (reg) {
          ticket = await Ticket.findOne({ registration: reg._id })
            .populate('attendee', 'name email organization')
            .populate('event', 'name status startDate endDate')
            .populate('ticketCategory', 'name');

          if (!ticket && reg.status === 'Approved') {
            const crypto = require('crypto');
            ticket = await Ticket.create({
              registration: reg._id,
              attendee: reg.attendee._id,
              event: reg.event._id || reg.event,
              ticketCategory: reg.ticketCategory._id || reg.ticketCategory,
              ticketNumber: reg.ticketCode || `EF-${reg.event._id.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
              qrToken: crypto.randomBytes(16).toString('hex'),
              status: 'Valid'
            });
            ticket = await Ticket.findById(ticket._id)
              .populate('attendee', 'name email organization')
              .populate('event', 'name status startDate endDate')
              .populate('ticketCategory', 'name');
          }
        }
      }
    }

    if (!ticket) {
      const err = new Error('Invalid Ticket / Code: No matching valid ticket found.');
      err.statusCode = 404;
      throw err;
    }

    // Event match check
    const eventIdStr = ticket.event._id ? ticket.event._id.toString() : ticket.event.toString();
    if (targetEventId && eventIdStr !== targetEventId.toString()) {
      const err = new Error(`Wrong Event Ticket: Ticket is issued for '${ticket.event.name || 'another event'}', not this event.`);
      err.statusCode = 400;
      throw err;
    }

    // Check if event is currently ongoing
    const eventDoc = ticket.event;
    if (eventDoc && eventDoc.startDate && eventDoc.endDate) {
      const now = new Date();
      const startDate = new Date(eventDoc.startDate);
      const endDate = new Date(eventDoc.endDate);

      if (eventDoc.status !== 'Ongoing') {
        if (now < startDate) {
          const err = new Error(`Check-in Unavailable: Event '${eventDoc.name || 'Event'}' has not started yet. Starts on ${new Date(startDate).toLocaleString()}.`);
          err.statusCode = 400;
          throw err;
        }
        if (now > endDate || eventDoc.status === 'Completed') {
          const err = new Error(`Check-in Unavailable: Event '${eventDoc.name || 'Event'}' has already ended.`);
          err.statusCode = 400;
          throw err;
        }
      }
    }

    if (ticket.status === 'Cancelled') {
      const err = new Error('Check-in Rejected: This ticket has been cancelled.');
      err.statusCode = 400;
      throw err;
    }

    // Duplicate Check-in Prevention
    const existingCheckIn = await CheckIn.findOne({ ticket: ticket._id, status: 'Success' });
    if (existingCheckIn) {
      const err = new Error(`Duplicate Check-in: Attendee ${ticket.attendee?.name || 'Attendee'} was already checked in at ${new Date(existingCheckIn.checkedInAt).toLocaleTimeString()}`);
      err.statusCode = 409;
      throw err;
    }

    // Record Successful Check-in
    const checkInRecord = await CheckIn.create({
      ticket: ticket._id,
      attendee: ticket.attendee._id || ticket.attendee,
      event: eventIdStr,
      checkedInBy: staffUserId,
      status: 'Success'
    });

    ticket.status = 'Used';
    await ticket.save();

    return {
      success: true,
      attendee: ticket.attendee,
      event: ticket.event,
      ticketCategory: ticket.ticketCategory,
      ticketNumber: ticket.ticketNumber,
      checkedInAt: checkInRecord.checkedInAt
    };
  }

  // --- SESSION ATTENDANCE ---
  async markSessionAttendance({ sessionId, attendeeId, qrToken, targetEventId, staffUserId }) {
    const session = await Session.findById(sessionId);
    if (!session) {
      const err = new Error('Session not found.');
      err.statusCode = 404;
      throw err;
    }

    if (targetEventId && session.event.toString() !== targetEventId.toString()) {
      const err = new Error('This session does not belong to the selected event.');
      err.statusCode = 400;
      throw err;
    }

    if (qrToken) {
      const ticket = await Ticket.findOne({
        event: targetEventId || session.event,
        $or: [{ qrToken: qrToken.trim() }, { ticketNumber: qrToken.trim() }]
      }).select('attendee status');
      if (!ticket || ticket.status === 'Cancelled') {
        const err = new Error('No valid attendee ticket matches this QR code.');
        err.statusCode = 404;
        throw err;
      }
      attendeeId = ticket.attendee;
    }

    if (!attendeeId) {
      const err = new Error('Scan an attendee ticket QR code or choose an attendee from search.');
      err.statusCode = 400;
      throw err;
    }

    // Check Duplicate Session Attendance
    const existing = await SessionAttendance.findOne({ session: sessionId, attendee: attendeeId });
    if (existing) {
      const err = new Error('Attendee is already checked into this session.');
      err.statusCode = 409;
      throw err;
    }

    // Check Capacity Limit
    const currentAttendedCount = await SessionAttendance.countDocuments({ session: sessionId });
    if (session.capacity && currentAttendedCount >= session.capacity) {
      const err = new Error(`Session Overbooked: Capacity limit of ${session.capacity} reached.`);
      err.statusCode = 400;
      throw err;
    }

    const attendance = await SessionAttendance.create({
      event: session.event,
      session: sessionId,
      attendee: attendeeId,
      checkedInBy: staffUserId
    });

    return { attendance, currentAttendedCount: currentAttendedCount + 1, capacity: session.capacity };
  }

  async getSessionAttendanceStats(sessionId) {
    const session = await Session.findById(sessionId).populate('speakers', 'name');
    const records = await SessionAttendance.find({ session: sessionId })
      .populate('attendee', 'name email organization')
      .sort({ checkedInAt: -1 });

    return {
      session,
      totalAttended: records.length,
      capacity: session.capacity,
      remainingSpots: Math.max(0, session.capacity - records.length),
      records
    };
  }

  // --- STAFF ASSIGNMENTS ---
  async getStaffAssignments(eventId) {
    return await StaffAssignment.find({ event: eventId })
      .populate('staffUser', 'name email role')
      .populate('assignedVenue', 'name city');
  }

  async assignStaff({ staffEmail, ...assignmentData }) {
    const normalizedEmail = String(staffEmail || '').trim().toLowerCase();
    const staffUser = await User.findOne({ email: normalizedEmail, role: 'Event Staff', isActive: true }).select('_id');
    if (!staffUser) {
      const err = new Error('Choose an active Event Staff account using its registered email.');
      err.statusCode = 400;
      throw err;
    }
    return await StaffAssignment.create({ ...assignmentData, staffUser: staffUser._id });
  }

  async updateStaffAssignment(id, updateData) {
    return await StaffAssignment.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async deleteStaffAssignment(id) {
    return await StaffAssignment.findByIdAndDelete(id);
  }

  // --- STAFF DASHBOARD & ASSIGNMENTS LOOKUP ---
  async getMyStaffShifts(staffUserId) {
    return await StaffAssignment.find({ staffUser: staffUserId })
      .populate('event', 'name startDate endDate venue status bannerUrl')
      .populate('assignedVenue', 'name city');
  }

  // --- ORGANIZER OPERATIONS METRICS ---
  async getEventOperationsOverview(eventId) {
    const event = await Event.findById(eventId).populate('venue');
    const totalRegistered = await Registration.countDocuments({ event: eventId, status: 'Approved' });
    const totalWaitlisted = await Registration.countDocuments({ event: eventId, status: 'Waitlisted' });
    const totalCheckedIn = await CheckIn.countDocuments({ event: eventId, status: 'Success' });
    const notCheckedIn = Math.max(0, totalRegistered - totalCheckedIn);

    const activeStaff = await StaffAssignment.find({ event: eventId })
      .populate('staffUser', 'name email')
      .populate('assignedVenue', 'name');

    const recentCheckIns = await CheckIn.find({ event: eventId })
      .populate('attendee', 'name email organization')
      .sort({ checkedInAt: -1 })
      .limit(10);

    return {
      event,
      totalRegistered,
      totalWaitlisted,
      totalCheckedIn,
      notCheckedIn,
      checkInPercentage: totalRegistered > 0 ? ((totalCheckedIn / totalRegistered) * 100).toFixed(1) : 0,
      activeStaff,
      recentCheckIns
    };
  }

  // --- ATTENDEE SUPPORT LOOKUP ---
  async searchAttendeeForSupport(eventId, queryStr) {
    const trimmed = (queryStr || '').trim();
    if (!trimmed) return [];

    const searchRegex = new RegExp(trimmed, 'i');
    const mongoose = require('mongoose');

    // 1. Find matching Users by name, email, or _id
    let userConditions = [{ name: searchRegex }, { email: searchRegex }];
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      userConditions.push({ _id: trimmed });
    }
    const matchedUsers = await User.find({ $or: userConditions })
      .select('name email organization role')
      .lean();

    // 2. Search Registration by ticketCode or _id
    let regConditions = [{ ticketCode: searchRegex }];
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      regConditions.push({ _id: trimmed });
    }
    const matchedRegs = await Registration.find({ $or: regConditions })
      .populate('attendee', 'name email organization role')
      .lean();

    // 3. Search Ticket by ticketNumber, qrToken, or _id
    let ticketConditions = [{ ticketNumber: searchRegex }, { qrToken: searchRegex }];
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      ticketConditions.push({ _id: trimmed });
    }
    const matchedTickets = await Ticket.find({ $or: ticketConditions })
      .populate('attendee', 'name email organization role')
      .lean();

    // Combine candidate users
    const userMap = new Map();
    matchedUsers.forEach(u => userMap.set(u._id.toString(), u));
    matchedRegs.forEach(r => {
      if (r.attendee && r.attendee._id) userMap.set(r.attendee._id.toString(), r.attendee);
    });
    matchedTickets.forEach(t => {
      if (t.attendee && t.attendee._id) userMap.set(t.attendee._id.toString(), t.attendee);
    });

    const candidateUsers = Array.from(userMap.values());
    if (candidateUsers.length === 0) return [];

    const candidateUserIds = candidateUsers.map(u => u._id);

    // Fetch Registrations for candidate users for THIS eventId
    const registrations = await Registration.find({
      event: eventId,
      attendee: { $in: candidateUserIds }
    })
      .populate('ticketCategory', 'name price')
      .populate('selectedSessions', 'title startTime endTime roomName')
      .lean();

    // Fetch Tickets for candidate users for THIS eventId
    const tickets = await Ticket.find({
      event: eventId,
      attendee: { $in: candidateUserIds }
    }).lean();

    // Fetch CheckIns for candidate users for THIS eventId
    const checkIns = await CheckIn.find({
      event: eventId,
      attendee: { $in: candidateUserIds },
      status: 'Success'
    }).lean();

    // Fetch event metadata to verify if event is currently ongoing
    const targetEvent = await Event.findById(eventId).select('name startDate endDate status').lean();
    const now = new Date();
    let isEventOngoing = false;
    let eventTimingStatus = 'Ongoing';

    if (targetEvent) {
      const s = new Date(targetEvent.startDate);
      const e = new Date(targetEvent.endDate);
      if (targetEvent.status === 'Ongoing' || (now >= s && now <= e)) {
        isEventOngoing = true;
        eventTimingStatus = 'Ongoing';
      } else if (now < s) {
        isEventOngoing = false;
        eventTimingStatus = 'Upcoming';
      } else if (now > e || targetEvent.status === 'Completed') {
        isEventOngoing = false;
        eventTimingStatus = 'Ended';
      }
    }

    return candidateUsers.map(user => {
      const reg = registrations.find(r => r.attendee.toString() === user._id.toString());
      const ticket = tickets.find(t => t.attendee.toString() === user._id.toString());
      const checkIn = checkIns.find(c => c.attendee.toString() === user._id.toString());

      const isRegistered = Boolean(reg);
      let registrationStatus = 'Not Registered';
      if (reg) {
        if (reg.status === 'Approved') registrationStatus = 'Registered';
        else if (reg.status === 'Waitlisted') registrationStatus = 'Waitlisted';
        else if (reg.status === 'Cancelled') registrationStatus = 'Cancelled';
        else if (reg.status === 'Pending') registrationStatus = 'Pending';
        else registrationStatus = reg.status;
      }

      return {
        attendee: {
          _id: user._id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          role: user.role
        },
        eventId,
        eventTitle: targetEvent?.name || 'Event',
        isEventOngoing,
        eventTimingStatus,
        isRegistered,
        registrationStatus,
        rawStatus: reg ? reg.status : null,
        registrationId: reg ? reg._id : null,
        ticketCategory: reg?.ticketCategory?.name || ticket?.ticketCategory?.name || null,
        ticketCode: reg?.ticketCode || ticket?.ticketNumber || null,
        ticketNumber: ticket?.ticketNumber || reg?.ticketCode || null,
        ticketId: ticket ? ticket._id : null,
        qrToken: ticket ? ticket.qrToken : null,
        registrationDate: reg ? (reg.registrationDate || reg.createdAt) : null,
        finalPrice: reg ? reg.finalPrice : null,
        paymentStatus: reg ? (reg.finalPrice === 0 ? 'Free ($0.00)' : `Paid ($${reg.finalPrice})`) : null,
        isCheckedIn: Boolean(checkIn),
        checkedInAt: checkIn ? checkIn.checkedInAt : null,
        selectedSessions: reg?.selectedSessions ? reg.selectedSessions.map(s => ({
          _id: s._id,
          title: s.title,
          roomName: s.roomName,
          startTime: s.startTime,
          endTime: s.endTime
        })) : []
      };
    });
  }
}

module.exports = new OperationsService();
