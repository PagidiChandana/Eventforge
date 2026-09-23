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
      }
    };
  }

  /**
   * Organizer Macro Dashboard Analytics (Across authorized events)
   */
  async getOrganizerOverview(user) {
    const userId = user._id;

    // Filter events: Admin sees all events, Organizer sees their owned events
    const filter = user.role === 'Platform Admin' ? {} : { organizer: userId };
    const events = await Event.find(filter).select('_id name startDate endDate status capacity').lean();

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

    // Pending tasks count (Pending registrations + Pending deliverables)
    const pendingRegs = await Registration.countDocuments({ event: { $in: eventIds }, status: 'Pending' });
    const pendingDeliverables = await Deliverable.countDocuments({ event: { $in: eventIds }, status: 'Pending' });

    return {
      totalEvents,
      upcomingEvents,
      activeRegistrations,
      totalCheckedIn,
      totalRevenue,
      pendingTasks: pendingRegs + pendingDeliverables,
      eventsSummary: events.slice(0, 10)
    };
  }
}

module.exports = new AnalyticsService();
