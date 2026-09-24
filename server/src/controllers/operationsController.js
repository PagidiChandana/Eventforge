const operationsService = require('../services/operationsService');

// --- QR CHECK-IN ---
const processQRCheckIn = async (req, res, next) => {
  try {
    const { qrToken, ticketId, ticketCode, attendeeId, eventId, event } = req.body;
    const result = await operationsService.processQRCheckIn({
      qrToken,
      ticketId,
      ticketCode,
      attendeeId,
      staffUserId: req.user.id,
      targetEventId: eventId || event
    });
    res.status(200).json({ success: true, message: 'Check-in successful!', data: result });
  } catch (err) { next(err); }
};

// --- SESSION ATTENDANCE ---
const markSessionAttendance = async (req, res, next) => {
  try {
    const { sessionId, attendeeId, qrToken } = req.body;
    const result = await operationsService.markSessionAttendance({
      sessionId,
      attendeeId,
      qrToken,
      targetEventId: req.params.eventId,
      staffUserId: req.user.id
    });
    res.status(200).json({ success: true, message: 'Session attendance marked', data: result });
  } catch (err) { next(err); }
};

const getSessionAttendanceStats = async (req, res, next) => {
  try {
    const result = await operationsService.getSessionAttendanceStats(req.params.sessionId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// --- STAFF ASSIGNMENTS ---
const getStaffDirectory = async (req, res, next) => {
  try {
    const staff = await operationsService.getStaffDirectory();
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (err) { next(err); }
};

const getStaffAssignments = async (req, res, next) => {
  try {
    const assignments = await operationsService.getStaffAssignments(req.params.eventId);
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) { next(err); }
};

const assignStaff = async (req, res, next) => {
  try {
    const assignment = await operationsService.assignStaff({ ...req.body, event: req.params.eventId });
    res.status(201).json({ success: true, message: 'Staff member assigned', data: assignment });
  } catch (err) { next(err); }
};

const updateStaffAssignment = async (req, res, next) => {
  try {
    const assignment = await operationsService.updateStaffAssignment(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Staff assignment updated', data: assignment });
  } catch (err) { next(err); }
};

const deleteStaffAssignment = async (req, res, next) => {
  try {
    await operationsService.deleteStaffAssignment(req.params.id);
    res.status(200).json({ success: true, message: 'Staff assignment removed' });
  } catch (err) { next(err); }
};

// --- DASHBOARDS & OVERVIEW ---
const getMyStaffShifts = async (req, res, next) => {
  try {
    const shifts = await operationsService.getMyStaffShifts(req.user.id);
    res.status(200).json({ success: true, count: shifts.length, data: shifts });
  } catch (err) { next(err); }
};

const getEventOperationsOverview = async (req, res, next) => {
  try {
    const overview = await operationsService.getEventOperationsOverview(req.params.eventId);
    res.status(200).json({ success: true, data: overview });
  } catch (err) { next(err); }
};

// --- ATTENDEE SUPPORT ---
const searchAttendeeForSupport = async (req, res, next) => {
  try {
    const results = await operationsService.searchAttendeeForSupport(req.params.eventId, req.query.query || '');
    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err) { next(err); }
};

module.exports = {
  processQRCheckIn,
  markSessionAttendance, getSessionAttendanceStats,
  getStaffDirectory, getStaffAssignments, assignStaff, updateStaffAssignment, deleteStaffAssignment,
  getMyStaffShifts, getEventOperationsOverview,
  searchAttendeeForSupport
};
