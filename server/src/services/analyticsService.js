'use strict';
/**
 * analyticsService.js
 * Enterprise Analytics Engine powered by high-performance MongoDB aggregation pipelines.
 */

const mongoose = require('mongoose');
const { Event } = require('../models/Event');
const { Registration } = require('../models/Registration');
const CheckIn = require('../models/CheckIn');
const Session = require('../models/Session');
const SessionAttendance = require('../models/SessionAttendance');
const { Feedback } = require('../models/Feedback');
const Sponsor = require('../models/Sponsor');
const { Deliverable } = require('../models/Deliverable');
const SponsorshipPackage = require('../models/SponsorshipPackage');
const Ticket = require('../models/Ticket');
const Speaker = require('../models/Speaker');
const PresentationMaterial = require('../models/PresentationMaterial');
const BrandAsset = require('../models/BrandAsset');
const { StaffAssignment } = require('../models/StaffAssignment');
const Task = require('../models/Task');
const { ROLES } = require('../models/User');

class AnalyticsService {
  /**
   * Complete Event-Scoped Analytics Overview
   */
  async getEventAnalytics(eventId) {
    const objectId = new mongoose.Types.ObjectId(eventId);

    const event = await Event.findById(eventId).populate('venue').lean();
    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    // 1. Registration Breakdown Aggregation
    const regBreakdownPipeline = await Registration.aggregate([
      { $match: { event: objectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$finalPrice' }
        }
      }
    ]);

    const regStats = {
      total: 0,
      approved: 0,
      pending: 0,
      waitlisted: 0,
      cancelled: 0,
      rejected: 0,
      totalRevenue: 0
    };

    regBreakdownPipeline.forEach((item) => {
      const status = (item._id || '').toLowerCase();
      regStats.total += item.count;
      if (status === 'approved') regStats.approved = item.count;
      else if (status === 'pending') regStats.pending = item.count;
      else if (status === 'waitlisted') regStats.waitlisted = item.count;
      else if (status === 'cancelled') regStats.cancelled = item.count;
      else if (status === 'rejected') regStats.rejected = item.count;

      if (status === 'approved') regStats.totalRevenue += item.totalRevenue;
    });

    // 2. Attendance & Check-In Aggregation
    const totalCheckedIn = await CheckIn.countDocuments({ event: objectId, status: 'Success' });
    const checkInPercentage = regStats.approved > 0 ? Number(((totalCheckedIn / regStats.approved) * 100).toFixed(1)) : 0;
    const noShowCount = Math.max(0, regStats.approved - totalCheckedIn);
    const [ticketRows, staffCount, uniqueAttendeeIds, eventSpeakerIds] = await Promise.all([
      Ticket.aggregate([{ $match: { event: objectId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      StaffAssignment.countDocuments({ event: objectId }),
      Registration.distinct('attendee', { event: objectId }),
      Session.distinct('speakers', { event: objectId })
    ]);
    const ticketStatuses = Object.fromEntries(ticketRows.map((row) => [row._id, row.count]));

    // 3. Session Capacity Utilization & Popularity Pipeline
    const sessions = await Session.find({ event: objectId }).populate('speakers', 'name company').lean();

    const sessionAttendancePipeline = await SessionAttendance.aggregate([
      { $match: { event: objectId } },
      {
        $group: {
          _id: '$session',
          attendedCount: { $sum: 1 }
        }
      }
    ]);

    const attendanceMap = new Map();
    sessionAttendancePipeline.forEach((item) => {
      attendanceMap.set(item._id.toString(), item.attendedCount);
    });

    const sessionAnalytics = sessions.map((s) => {
      const attended = attendanceMap.get(s._id.toString()) || s.attendeeCount || 0;
      const capacity = s.capacity || 100;
      const utilization = Number(((attended / capacity) * 100).toFixed(1));

      return {
        _id: s._id,
        title: s.title,
        track: s.track || 'General',
        capacity,
        attended,
        utilization,
        speakers: s.speakers ? s.speakers.map((spk) => spk.name).join(', ') : 'TBD'
      };
    });

    sessionAnalytics.sort((a, b) => b.utilization - a.utilization);

    // 4. Feedback Ratings Aggregation Pipeline
    const feedbackStatsPipeline = await Feedback.aggregate([
      { $match: { event: objectId } },
      {
        $group: {
          _id: '$event',
          avgRating: { $avg: '$rating' },
          totalResponses: { $sum: 1 },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
        }
      }
    ]);

    const feedbackSummary = feedbackStatsPipeline[0] || {
      avgRating: 0,
      totalResponses: 0,
      star1: 0,
      star2: 0,
      star3: 0,
      star4: 0,
      star5: 0
    };

    // 5. Sponsor & Deliverable Aggregation
    const sponsorsCount = await Sponsor.countDocuments({ event: objectId });
    const packagesCount = await SponsorshipPackage.countDocuments({ event: objectId });

    const deliverableStatsPipeline = await Deliverable.aggregate([
      { $match: { event: objectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const deliverableStats = {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      rejected: 0
    };

    deliverableStatsPipeline.forEach((item) => {
      const st = (item._id || '').toLowerCase();
      deliverableStats.total += item.count;
      if (st === 'approved' || st === 'completed') deliverableStats.completed += item.count;
      else if (st === 'pending') deliverableStats.pending += item.count;
      else if (st === 'in progress' || st === 'submitted') deliverableStats.inProgress += item.count;
      else if (st === 'rejected') deliverableStats.rejected += item.count;
    });

    deliverableStats.completionRate =
      deliverableStats.total > 0
        ? Number(((deliverableStats.completed / deliverableStats.total) * 100).toFixed(1))
        : 0;

    return {
      event: {
        _id: event._id,
        name: event.name,
        eventType: event.eventType,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate
      },
      registrations: regStats,
      attendees: { unique: uniqueAttendeeIds.length },
      tickets: { Valid: ticketStatuses.Valid || 0, Used: ticketStatuses.Used || 0, Cancelled: ticketStatuses.Cancelled || 0 },
      attendance: {
        totalCheckedIn,
        checkInPercentage,
        noShowCount
      },
      sessions: {
        totalSessions: sessions.length,
        mostPopular: sessionAnalytics.slice(0, 5),
        allSessions: sessionAnalytics
      },
      feedback: {
        avgRating: feedbackSummary.avgRating ? Number(feedbackSummary.avgRating.toFixed(1)) : 0,
        totalResponses: feedbackSummary.totalResponses,
        distribution: {
          1: feedbackSummary.star1,
          2: feedbackSummary.star2,
          3: feedbackSummary.star3,
          4: feedbackSummary.star4,
          5: feedbackSummary.star5
        }
      },
      sponsors: {
        sponsorsCount,
        packagesCount,
        deliverables: deliverableStats
      },
      speakers: { count: eventSpeakerIds.filter(Boolean).length },
      staff: { assignments: staffCount }
    };
  }

  /**
   * Organizer Macro Dashboard Analytics (Across authorized events)
   */
  async getOrganizerOverview(user) {
    const userId = user._id;

    // Filter events: Admin sees all events, Organizer sees their owned events
    const filter = user.role === 'Platform Admin' ? {} : { organizer: userId };
    const events = await Event.find(filter).select('_id name startDate endDate status capacity organizer').populate('organizer', 'name email').sort({ startDate: 1 }).lean();

    const eventIds = events.map((e) => e._id);

    const totalEvents = events.length;
    const upcomingEvents = events.filter((e) => new Date(e.startDate) > new Date()).length;

    // Aggregated registrations across all owned events
    const regAgg = await Registration.aggregate([
      { $match: { event: { $in: eventIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$finalPrice' }
        }
      }
    ]);

    let activeRegistrations = 0;
    let totalRevenue = 0;
    regAgg.forEach((item) => {
      if (item._id === 'Approved') {
        activeRegistrations += item.count;
        totalRevenue += item.revenue;
      }
    });

    // Total checked in across events
    const totalCheckedIn = await CheckIn.countDocuments({ event: { $in: eventIds }, status: 'Success' });

    const ticketStatus = await Ticket.aggregate([
      { $match: { event: { $in: eventIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const ticketStatuses = ticketStatus.reduce((result, item) => {
      result[item._id] = item.count;
      return result;
    }, { Valid: 0, Used: 0, Cancelled: 0 });
    const attendeeCount = await Registration.distinct('attendee', { event: { $in: eventIds } }).then((ids) => ids.length);

    const [eventStatusRows, speakerIds, sponsorCount, packageCount, deliverableRows, staffCount, sessionAttendanceCount, feedbackSummary, organizationIds] = await Promise.all([
      Event.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Session.distinct('speakers', { event: { $in: eventIds } }),
      Sponsor.countDocuments({ event: { $in: eventIds } }),
      SponsorshipPackage.countDocuments({ event: { $in: eventIds } }),
      Deliverable.aggregate([{ $match: { event: { $in: eventIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      StaffAssignment.countDocuments({ event: { $in: eventIds } }),
      SessionAttendance.countDocuments({ event: { $in: eventIds } }),
      Feedback.aggregate([{ $match: { event: { $in: eventIds } } }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
      Event.distinct('organization', filter)
    ]);

    // Pending tasks count (Pending registrations + Pending deliverables)
    const pendingRegs = await Registration.countDocuments({ event: { $in: eventIds }, status: 'Pending' });
    const pendingDeliverables = await Deliverable.countDocuments({ event: { $in: eventIds }, status: 'Pending' });

    return {
      totalEvents,
      organizationCount: organizationIds.filter(Boolean).length,
      upcomingEvents,
      activeRegistrations,
      attendeeCount,
      eventStatuses: Object.fromEntries(eventStatusRows.map((item) => [item._id, item.count])),
      registrationStatuses: Object.fromEntries(regAgg.map((item) => [item._id, item.count])),
      ticketStatuses,
      speakerCount: speakerIds.filter(Boolean).length,
      sponsorCount,
      packageCount,
      deliverableStatuses: Object.fromEntries(deliverableRows.map((item) => [item._id, item.count])),
      staffAssignments: staffCount,
      sessionAttendanceCount,
      feedback: { count: feedbackSummary[0]?.count || 0, averageRating: Number((feedbackSummary[0]?.average || 0).toFixed(1)) },
      totalCheckedIn,
      totalRevenue,
      pendingTasks: pendingRegs + pendingDeliverables,
      eventsSummary: events
    };
  }

  async getMyAnalytics(user) {
    const userId = user._id;
    if (user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.EVENT_ORGANIZER) {
      return { role: user.role, ...(await this.getOrganizerOverview(user)) };
    }

    if (user.role === ROLES.EVENT_STAFF) {
      const assignments = await StaffAssignment.find({ staffUser: userId }).populate('event', 'name status startDate endDate').lean();
      const eventIds = assignments.map((assignment) => assignment.event?._id).filter(Boolean);
      const [checkIns, sessionCheckIns, taskRows] = await Promise.all([
        CheckIn.countDocuments({ checkedInBy: userId, event: { $in: eventIds }, status: 'Success' }),
        SessionAttendance.countDocuments({ checkedInBy: userId, event: { $in: eventIds } }),
        Task.aggregate([{ $match: { assignedTo: userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }])
      ]);
      return {
        role: user.role,
        totalEvents: eventIds.length,
        activeAssignments: assignments.filter((assignment) => assignment.status === 'Active').length,
        checkIns,
        sessionCheckIns,
        tasks: Object.fromEntries(taskRows.map((item) => [item._id, item.count])),
        events: assignments.map((assignment) => ({ ...assignment.event, assignmentRole: assignment.role, assignmentStatus: assignment.status }))
      };
    }

    if (user.role === ROLES.SPEAKER) {
      const escapedEmail = String(user.email || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matchingProfiles = await Speaker.find({ $or: [{ user: userId }, { contactEmail: new RegExp(`^${escapedEmail}$`, 'i') }] }).select('_id').lean();
      const profileIds = matchingProfiles.map((profile) => profile._id);
      const sessions = await Session.find({ speakers: { $in: profileIds } }).populate('event', 'name status startDate endDate').select('title startTime endTime event').sort({ startTime: 1 }).lean();
      const sessionIds = sessions.map((session) => session._id);
      const [attendance, feedback, materials] = await Promise.all([
        SessionAttendance.countDocuments({ session: { $in: sessionIds } }),
        Feedback.aggregate([{ $match: { session: { $in: sessionIds } } }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
        PresentationMaterial.countDocuments({ speaker: { $in: profileIds } })
      ]);
      return {
        role: user.role,
        sessionCount: sessions.length,
        upcomingSessions: sessions.filter((session) => new Date(session.startTime) >= new Date()).length,
        eventCount: new Set(sessions.map((session) => session.event?._id?.toString()).filter(Boolean)).size,
        sessionAttendance: attendance,
        feedback: { count: feedback[0]?.count || 0, averageRating: Number((feedback[0]?.average || 0).toFixed(1)) },
        materials,
        sessions
      };
    }

    if (user.role === ROLES.SPONSOR) {
      let sponsorProfiles = await Sponsor.find({ user: userId }).populate('event', 'name status startDate endDate').populate('assignedPackage', 'name price').lean();
      if (sponsorProfiles.length === 0) {
        const escapedEmail = String(user.email || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        await Sponsor.updateMany({ contactEmail: new RegExp(`^${escapedEmail}$`, 'i'), $or: [{ user: null }, { user: { $exists: false } }] }, { $set: { user: userId } });
        sponsorProfiles = await Sponsor.find({ user: userId }).populate('event', 'name status startDate endDate').populate('assignedPackage', 'name price').lean();
      }
      const sponsorIds = sponsorProfiles.map((profile) => profile._id);
      const [deliverableRows, assetCount] = await Promise.all([
        Deliverable.aggregate([{ $match: { sponsor: { $in: sponsorIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        BrandAsset.countDocuments({ sponsor: { $in: sponsorIds } })
      ]);
      const packageMap = new Map();
      sponsorProfiles.forEach((profile) => { if (profile.assignedPackage) packageMap.set(profile.assignedPackage._id.toString(), profile.assignedPackage); });
      const deliverables = Object.fromEntries(deliverableRows.map((item) => [item._id, item.count]));
      return {
        role: user.role,
        events: sponsorProfiles.map((profile) => ({ _id: profile.event?._id, name: profile.event?.name, status: profile.event?.status, companyName: profile.companyName, package: profile.assignedPackage })),
        eventCount: sponsorProfiles.length,
        packageCount: packageMap.size,
        packageValue: [...packageMap.values()].reduce((sum, pkg) => sum + (pkg.price || 0), 0),
        deliverables,
        deliverableCount: Object.values(deliverables).reduce((sum, count) => sum + count, 0),
        brandAssets: assetCount
      };
    }

    if (user.role === ROLES.ATTENDEE) {
      const [registrations, tickets, checkIns, sessionCheckIns, feedback] = await Promise.all([
        Registration.find({ attendee: userId }).populate('event', 'name status startDate endDate').populate('selectedSessions', 'title startTime endTime').lean(),
        Ticket.aggregate([{ $match: { attendee: userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        CheckIn.countDocuments({ attendee: userId, status: 'Success' }),
        SessionAttendance.countDocuments({ attendee: userId }),
        Feedback.aggregate([{ $match: { attendee: userId } }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }])
      ]);
      return {
        role: user.role,
        eventCount: registrations.length,
        registrations: Object.fromEntries(['Approved', 'Pending', 'Waitlisted', 'Rejected', 'Cancelled'].map((status) => [status, registrations.filter((registration) => registration.status === status).length])),
        tickets: Object.fromEntries(tickets.map((item) => [item._id, item.count])),
        checkIns,
        sessionCheckIns,
        selectedSessions: registrations.reduce((sum, registration) => sum + (registration.selectedSessions?.length || 0), 0),
        feedback: { count: feedback[0]?.count || 0, averageRating: Number((feedback[0]?.average || 0).toFixed(1)) },
        events: registrations.map((registration) => ({ _id: registration.event?._id, name: registration.event?.name, status: registration.status, startDate: registration.event?.startDate, selectedSessions: registration.selectedSessions?.length || 0 }))
      };
    }

    return { role: user.role };
  }
}

module.exports = new AnalyticsService();
