const registrationService = require('../services/registrationService');
const { Registration } = require('../models/Registration');

// --- TICKET CATEGORIES ---
const getCategoriesByEvent = async (req, res, next) => {
  try {
    const categories = await registrationService.getCategoriesByEvent(req.params.eventId);
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await registrationService.createCategory({ ...req.body, event: req.params.eventId });
    res.status(201).json({ success: true, message: 'Ticket category created', data: category });
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await registrationService.updateCategory(req.params.categoryId, req.body);
    res.status(200).json({ success: true, message: 'Ticket category updated', data: category });
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    await registrationService.deleteCategory(req.params.categoryId);
    res.status(200).json({ success: true, message: 'Ticket category deleted' });
  } catch (err) { next(err); }
};

// --- COUPONS ---
const validateCoupon = async (req, res, next) => {
  try {
    const { code, ticketPrice } = req.body;
    const result = await registrationService.validateCoupon(req.params.eventId, code, ticketPrice);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

const createCoupon = async (req, res, next) => {
  try {
    const coupon = await registrationService.createCoupon({ ...req.body, event: req.params.eventId });
    res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
  } catch (err) { next(err); }
};

const getCouponsByEvent = async (req, res, next) => {
  try {
    const coupons = await registrationService.getCouponsByEvent(req.params.eventId);
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (err) { next(err); }
};

// --- REGISTRATION & TICKETING ---
const registerAttendee = async (req, res, next) => {
  try {
    const { ticketCategoryId, couponCode, selectedSessions } = req.body;
    const result = await registrationService.registerAttendee({
      eventId: req.params.eventId,
      attendeeId: req.user.id,
      ticketCategoryId,
      couponCode,
      selectedSessions
    });
    res.status(201).json({ success: true, message: result.message, data: result });
  } catch (err) { next(err); }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const result = await registrationService.cancelRegistration(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

const updateSelectedSessions = async (req, res, next) => {
  try {
    const reg = await registrationService.updateSelectedSessions(req.params.id, req.user.id, req.body.sessionIds || []);
    res.status(200).json({ success: true, message: 'Personal schedule updated', data: reg });
  } catch (err) { next(err); }
};

const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await registrationService.getMyRegistrations(req.user.id);
    res.status(200).json({ success: true, count: registrations.length, data: registrations });
  } catch (err) { next(err); }
};

const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await registrationService.getMyTickets(req.user.id);
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (err) { next(err); }
};

const getTicketById = async (req, res, next) => {
  try {
    const ticket = await registrationService.getTicketById(req.params.id, req.user);
    res.status(200).json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

// --- ORGANIZER MANAGEMENT ---
const getEventRegistrationsForOrganizer = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('attendee', 'name email organization')
      .populate('ticketCategory', 'name price')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: registrations.length, data: registrations });
  } catch (err) { next(err); }
};

const updateRegistrationStatus = async (req, res, next) => {
  try {
    const registration = await registrationService.updateRegistrationStatus(
      req.params.id,
      req.body.status,
      req.user.id
    );
    res.status(200).json({ success: true, data: registration });
  } catch (err) { next(err); }
};

module.exports = {
  getCategoriesByEvent, createCategory, updateCategory, deleteCategory,
  validateCoupon, createCoupon, getCouponsByEvent,
  registerAttendee, cancelRegistration, updateSelectedSessions,
  getMyRegistrations, getMyTickets, getTicketById,
  getEventRegistrationsForOrganizer, updateRegistrationStatus
};
