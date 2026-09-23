const { Event } = require('../models/Event');
const Venue = require('../models/Venue');
const Session = require('../models/Session');
const Speaker = require('../models/Speaker');
const Sponsor = require('../models/Sponsor');
const SponsorshipPackage = require('../models/SponsorshipPackage');
const Announcement = require('../models/Announcement');
const Organization = require('../models/Organization');
const { ROLES } = require('../models/User');

class EventService {
  // --- EVENTS ---
  async getEvents(query = {}, user = null) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.eventType) filter.eventType = query.eventType;
    if (query.organizer) filter.organizer = query.organizer;

    // Filter by ownership for organizers if requested
    if (user && user.role === ROLES.EVENT_ORGANIZER && query.myEvents === 'true') {
      filter.organizer = user.id;
    }

    return await Event.find(filter)
      .populate('venue', 'name city capacity')
      .populate('organizer', 'name email organization')
      .sort({ startDate: 1 });
  }

  async getEventById(eventId) {
    const event = await Event.findById(eventId)
      .populate('venue')
      .populate('organizer', 'name email organization')
      .populate('organization');

    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }
    return event;
  }

  async createEvent(eventData, userId) {
    if (new Date(eventData.startDate) >= new Date(eventData.endDate)) {
      const err = new Error('Event start date must be before end date.');
      err.statusCode = 400;
      throw err;
    }

    const event = await Event.create({
      ...eventData,
      organizer: userId
    });

    // Auto-create a default General Admission ticket category
    const TicketCategory = require('../models/TicketCategory');
    await TicketCategory.create({
      event: event._id,
      name: 'General Admission',
      description: 'Standard access to all main sessions and exhibits.',
      price: 0,
      capacity: event.capacity || 100,
      isActive: true
    });

    return event;
  }

  async updateEvent(eventId, updateData) {
    if (updateData.startDate && updateData.endDate) {
      if (new Date(updateData.startDate) >= new Date(updateData.endDate)) {
        const err = new Error('Event start date must be before end date.');
        err.statusCode = 400;
        throw err;
      }
    }

    const event = await Event.findByIdAndUpdate(eventId, updateData, {
      new: true,
      runValidators: true
    }).populate('venue');

    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }
    return event;
  }

  async deleteEvent(eventId) {
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    // Cascade delete related records
    await Session.deleteMany({ event: eventId });
    await Sponsor.deleteMany({ event: eventId });
    await SponsorshipPackage.deleteMany({ event: eventId });
    await Announcement.deleteMany({ event: eventId });

    return { message: 'Event and associated resources deleted successfully.' };
  }

  // --- VENUES ---
  async getVenues() {
    return await Venue.find().sort({ name: 1 });
  }

  async createVenue(venueData, userId) {
    return await Venue.create({ ...venueData, createdBy: userId });
  }

  async updateVenue(venueId, updateData) {
    return await Venue.findByIdAndUpdate(venueId, updateData, { new: true, runValidators: true });
  }

  async deleteVenue(venueId) {
    return await Venue.findByIdAndDelete(venueId);
  }

  // --- SESSIONS ---
  async getSessionsByEvent(eventId) {
    return await Session.find({ event: eventId })
      .populate('speakers', 'name designation company profileImage')
      .sort({ startTime: 1 });
  }

  async createSession(sessionData) {
    const session = await Session.create(sessionData);
    return await session.populate('speakers', 'name designation company profileImage');
  }

  async updateSession(sessionId, updateData) {
    return await Session.findByIdAndUpdate(sessionId, updateData, { new: true, runValidators: true })
      .populate('speakers', 'name designation company profileImage');
  }

  async deleteSession(sessionId) {
    return await Session.findByIdAndDelete(sessionId);
  }

  // --- SPEAKERS ---
  async getSpeakers() {
    return await Speaker.find().sort({ name: 1 });
  }

  async createSpeaker(speakerData, userId) {
    return await Speaker.create({ ...speakerData, createdBy: userId });
  }

  async updateSpeaker(speakerId, updateData) {
    return await Speaker.findByIdAndUpdate(speakerId, updateData, { new: true, runValidators: true });
  }

  async deleteSpeaker(speakerId) {
    return await Speaker.findByIdAndDelete(speakerId);
  }

  // --- SPONSORSHIP PACKAGES ---
  async getPackagesByEvent(eventId) {
    return await SponsorshipPackage.find({ event: eventId }).sort({ price: -1 });
  }

  async createPackage(packageData) {
    return await SponsorshipPackage.create(packageData);
  }

  async updatePackage(packageId, updateData) {
    return await SponsorshipPackage.findByIdAndUpdate(packageId, updateData, { new: true, runValidators: true });
  }

  async deletePackage(packageId) {
    return await SponsorshipPackage.findByIdAndDelete(packageId);
  }

  // --- SPONSORS ---
  async getSponsorsByEvent(eventId) {
    return await Sponsor.find({ event: eventId })
      .populate('assignedPackage', 'name price')
      .sort({ companyName: 1 });
  }

  async createSponsor(sponsorData) {
    const sponsor = await Sponsor.create(sponsorData);
    return await sponsor.populate('assignedPackage', 'name price');
  }

  async updateSponsor(sponsorId, updateData) {
    return await Sponsor.findByIdAndUpdate(sponsorId, updateData, { new: true, runValidators: true })
      .populate('assignedPackage', 'name price');
  }

  async deleteSponsor(sponsorId) {
    return await Sponsor.findByIdAndDelete(sponsorId);
  }

  // --- ANNOUNCEMENTS ---
  async getAnnouncementsByEvent(eventId) {
    return await Announcement.find({ event: eventId })
      .populate('createdBy', 'name email')
      .sort({ publishedAt: -1 });
  }

  async createAnnouncement(announcementData, userId) {
    const announcement = await Announcement.create({ ...announcementData, createdBy: userId });
    return await announcement.populate('createdBy', 'name email');
  }

  async deleteAnnouncement(announcementId) {
    return await Announcement.findByIdAndDelete(announcementId);
  }

  // --- ORGANIZATIONS ---
  async getOrganizations() {
    return await Organization.find().populate('owner', 'name email');
  }

  async createOrganization(orgData, userId) {
    return await Organization.create({ ...orgData, owner: userId });
  }

  async updateOrganization(orgId, updateData) {
    const allowed = (({ name, description, website, logo }) => ({ name, description, website, logo }))(updateData);
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);
    return await Organization.findByIdAndUpdate(orgId, allowed, { new: true, runValidators: true });
  }

  async deleteOrganization(orgId) {
    return await Organization.findByIdAndDelete(orgId);
  }
}

module.exports = new EventService();
