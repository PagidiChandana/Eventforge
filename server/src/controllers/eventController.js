const eventService = require('../services/eventService');
const { checkSessionConflicts } = require('../utils/conflictEngine');
const { Event } = require('../models/Event');

// --- EVENTS ---
const getEvents = async (req, res, next) => {
  try {
    const events = await eventService.getEvents(req.query, req.user);
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (err) { next(err); }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({ success: true, data: event });
  } catch (err) { next(err); }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (err) { next(err); }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.eventId, req.body);
    res.status(200).json({ success: true, message: 'Event updated successfully', data: event });
  } catch (err) { next(err); }
};

const deleteEvent = async (req, res, next) => {
  try {
    const result = await eventService.deleteEvent(req.params.eventId);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

// --- VENUES ---
const getVenues = async (req, res, next) => {
  try {
    const venues = await eventService.getVenues();
    res.status(200).json({ success: true, count: venues.length, data: venues });
  } catch (err) { next(err); }
};

const createVenue = async (req, res, next) => {
  try {
    const venue = await eventService.createVenue(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Venue created successfully', data: venue });
  } catch (err) { next(err); }
};

const updateVenue = async (req, res, next) => {
  try {
    const venue = await eventService.updateVenue(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Venue updated', data: venue });
  } catch (err) { next(err); }
};

const deleteVenue = async (req, res, next) => {
  try {
    await eventService.deleteVenue(req.params.id);
    res.status(200).json({ success: true, message: 'Venue deleted' });
  } catch (err) { next(err); }
};

// --- SESSIONS & CONFLICT ENGINE ---
const getSessionsByEvent = async (req, res, next) => {
  try {
    const sessions = await eventService.getSessionsByEvent(req.params.eventId);
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (err) { next(err); }
};

const createSession = async (req, res, next) => {
  try {
    const { title, roomName, speakers, startTime, endTime } = req.body;
    const eventId = req.event?._id || req.params.eventId || req.body.event;

    if (!title || !String(title).trim()) {
      const err = new Error('Session title is required.');
      err.statusCode = 400;
      throw err;
    }
    if (!roomName || !String(roomName).trim()) {
      const err = new Error('Session room is required.');
      err.statusCode = 400;
      throw err;
    }

    const sessionStart = new Date(startTime);
    const sessionEnd = new Date(endTime);
    if (!startTime || !endTime || Number.isNaN(sessionStart.getTime()) || Number.isNaN(sessionEnd.getTime()) || sessionStart >= sessionEnd) {
      const err = new Error('Session start and end must be valid dates, with the start before the end.');
      err.statusCode = 400;
      throw err;
    }
    const event = await Event.findById(eventId).select('startDate endDate');
    if (!event || sessionStart < event.startDate || sessionEnd > event.endDate) {
      const err = new Error('Session time must fall within the event dates.');
      err.statusCode = 400;
      throw err;
    }

    // Execute conflict engine check
    const conflictResult = await checkSessionConflicts({
      eventId,
      roomName,
      speakers,
      startTime,
      endTime
    });

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        conflictType: conflictResult.type,
        message: conflictResult.message
      });
    }

    const session = await eventService.createSession({ ...req.body, event: eventId });
    res.status(201).json({ success: true, message: 'Session created successfully', data: session });
  } catch (err) { next(err); }
};

const updateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { roomName, speakers, startTime, endTime } = req.body;
    const eventId = req.params.eventId || req.body.event;

    const currentSession = await require('../models/Session').findById(sessionId);
    if (!currentSession) {
      const err = new Error('Session not found.');
      err.statusCode = 404;
      throw err;
    }
    if (currentSession.event.toString() !== eventId.toString()) {
      const err = new Error('Session does not belong to this event.');
      err.statusCode = 404;
      throw err;
    }
    const sessionStart = new Date(startTime || currentSession.startTime);
    const sessionEnd = new Date(endTime || currentSession.endTime);
    if (Number.isNaN(sessionStart.getTime()) || Number.isNaN(sessionEnd.getTime()) || sessionStart >= sessionEnd) {
      const err = new Error('Session start and end must be valid dates, with the start before the end.');
      err.statusCode = 400;
      throw err;
    }
    const event = await Event.findById(eventId).select('startDate endDate');
    if (!event || sessionStart < event.startDate || sessionEnd > event.endDate) {
      const err = new Error('Session time must fall within the event dates.');
      err.statusCode = 400;
      throw err;
    }

    if (roomName || startTime || endTime || speakers) {
      const conflictResult = await checkSessionConflicts({
        eventId,
        roomName: roomName || currentSession.roomName,
        speakers: speakers || currentSession.speakers,
        startTime: sessionStart,
        endTime: sessionEnd,
        excludeSessionId: sessionId
      });

      if (conflictResult.hasConflict) {
        return res.status(409).json({
          success: false,
          conflictType: conflictResult.type,
          message: conflictResult.message
        });
      }
    }

    const session = await eventService.updateSession(sessionId, req.body);
    res.status(200).json({ success: true, message: 'Session updated', data: session });
  } catch (err) { next(err); }
};

const deleteSession = async (req, res, next) => {
  try {
    await eventService.deleteSession(req.params.sessionId);
    res.status(200).json({ success: true, message: 'Session deleted' });
  } catch (err) { next(err); }
};

// --- SPEAKERS ---
const getSpeakers = async (req, res, next) => {
  try {
    const speakers = await eventService.getSpeakers();
    res.status(200).json({ success: true, count: speakers.length, data: speakers });
  } catch (err) { next(err); }
};

const createSpeaker = async (req, res, next) => {
  try {
    const speaker = await eventService.createSpeaker(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Speaker created successfully', data: speaker });
  } catch (err) { next(err); }
};

const updateSpeaker = async (req, res, next) => {
  try {
    const speaker = await eventService.updateSpeaker(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Speaker updated', data: speaker });
  } catch (err) { next(err); }
};

const deleteSpeaker = async (req, res, next) => {
  try {
    await eventService.deleteSpeaker(req.params.id);
    res.status(200).json({ success: true, message: 'Speaker deleted' });
  } catch (err) { next(err); }
};

// --- SPONSORSHIP PACKAGES ---
const getPackagesByEvent = async (req, res, next) => {
  try {
    const packages = await eventService.getPackagesByEvent(req.params.eventId);
    res.status(200).json({ success: true, count: packages.length, data: packages });
  } catch (err) { next(err); }
};

const createPackage = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.event;
    const pkg = await eventService.createPackage({ ...req.body, event: eventId });
    res.status(201).json({ success: true, message: 'Sponsorship package created', data: pkg });
  } catch (err) { next(err); }
};

const updatePackage = async (req, res, next) => {
  try {
    const pkg = await eventService.updatePackage(req.params.packageId, req.body);
    res.status(200).json({ success: true, message: 'Package updated', data: pkg });
  } catch (err) { next(err); }
};

const deletePackage = async (req, res, next) => {
  try {
    await eventService.deletePackage(req.params.packageId);
    res.status(200).json({ success: true, message: 'Package deleted' });
  } catch (err) { next(err); }
};

// --- SPONSORS ---
const getSponsorsByEvent = async (req, res, next) => {
  try {
    const sponsors = await eventService.getSponsorsByEvent(req.params.eventId);
    res.status(200).json({ success: true, count: sponsors.length, data: sponsors });
  } catch (err) { next(err); }
};

const createSponsor = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.event;
    const sponsor = await eventService.createSponsor({ ...req.body, event: eventId });
    res.status(201).json({ success: true, message: 'Sponsor created', data: sponsor });
  } catch (err) { next(err); }
};

const updateSponsor = async (req, res, next) => {
  try {
    const sponsor = await eventService.updateSponsor(req.params.sponsorId, req.body);
    res.status(200).json({ success: true, message: 'Sponsor updated', data: sponsor });
  } catch (err) { next(err); }
};

const deleteSponsor = async (req, res, next) => {
  try {
    await eventService.deleteSponsor(req.params.sponsorId);
    res.status(200).json({ success: true, message: 'Sponsor deleted' });
  } catch (err) { next(err); }
};

// --- ANNOUNCEMENTS ---
const getAnnouncementsByEvent = async (req, res, next) => {
  try {
    const announcements = await eventService.getAnnouncementsByEvent(req.params.eventId, req.user);
    res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (err) { next(err); }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.event;
    const announcement = await eventService.createAnnouncement({ ...req.body, event: eventId }, req.user.id);
    res.status(201).json({ success: true, message: 'Announcement created', data: announcement });
  } catch (err) { next(err); }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    await eventService.deleteAnnouncement(req.params.announcementId);
    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (err) { next(err); }
};

// --- ORGANIZATIONS ---
const getOrganizations = async (req, res, next) => {
  try {
    const orgs = await eventService.getOrganizations();
    res.status(200).json({ success: true, count: orgs.length, data: orgs });
  } catch (err) { next(err); }
};

const createOrganization = async (req, res, next) => {
  try {
    const org = await eventService.createOrganization(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Organization created', data: org });
  } catch (err) { next(err); }
};

const updateOrganization = async (req, res, next) => {
  try {
    const org = await eventService.updateOrganization(req.params.id, req.body);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.status(200).json({ success: true, message: 'Organization updated', data: org });
  } catch (err) { next(err); }
};

const deleteOrganization = async (req, res, next) => {
  try {
    const org = await eventService.deleteOrganization(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.status(200).json({ success: true, message: 'Organization deleted' });
  } catch (err) { next(err); }
};

module.exports = {
  getEvents, getEventById, createEvent, updateEvent, deleteEvent,
  getVenues, createVenue, updateVenue, deleteVenue,
  getSessionsByEvent, createSession, updateSession, deleteSession,
  getSpeakers, createSpeaker, updateSpeaker, deleteSpeaker,
  getPackagesByEvent, createPackage, updatePackage, deletePackage,
  getSponsorsByEvent, createSponsor, updateSponsor, deleteSponsor,
  getAnnouncementsByEvent, createAnnouncement, deleteAnnouncement,
  getOrganizations, createOrganization, updateOrganization, deleteOrganization
};
