'use strict';

const { Feedback } = require('../models/Feedback');
const { Registration } = require('../models/Registration');
const { Event } = require('../models/Event');
const mongoose = require('mongoose');

class FeedbackService {
  async submitFeedback({ userId, eventId, sessionId = null, rating, comment }) {
    if (!eventId) {
      const err = new Error('Event ID is required for feedback submission.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Verify Event exists
    const event = await Event.findById(eventId);
    if (!event) {
      const err = new Error('Event not found.');
      err.statusCode = 404;
      throw err;
    }

    // 2. Verify Attendee Registration
    const registration = await Registration.findOne({
      attendee: userId,
      event: eventId,
      status: { $in: ['Approved', 'Pending'] }
    });

    if (!registration) {
      const err = new Error('Access Denied: Only registered attendees can submit feedback for this event.');
      err.statusCode = 403;
      throw err;
    }

    // 3. Check for Duplicate Feedback
    const query = { attendee: userId, event: eventId, session: sessionId || null };
    const existing = await Feedback.findOne(query);
    if (existing) {
      const err = new Error('You have already submitted feedback for this event/session.');
      err.statusCode = 409;
      throw err;
    }

    // 4. Create Feedback
    return await Feedback.create({
      attendee: userId,
      event: eventId,
      session: sessionId || null,
      rating: Number(rating),
      comment: comment || ''
    });
  }

  // Attendee views ONLY their own submitted feedback
  async getMyFeedback(attendeeId) {
    return await Feedback.find({ attendee: attendeeId })
      .populate('event', 'name')
      .populate('session', 'title')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getEventFeedback(eventId) {    const feedbackList = await Feedback.find({ event: eventId })
      .populate('attendee', 'name email organization')
      .populate('session', 'title')
      .sort({ createdAt: -1 });

    const objectId = new mongoose.Types.ObjectId(eventId);

    const statsPipeline = await Feedback.aggregate([
      { $match: { event: objectId } },
      {
        $group: {
          _id: '$event',
          avgRating: { $avg: '$rating' },
          totalCount: { $sum: 1 },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
        }
      }
    ]);

    const stats = statsPipeline[0] || {
      avgRating: 0,
      totalCount: 0,
      star1: 0,
      star2: 0,
      star3: 0,
      star4: 0,
      star5: 0
    };

    return {
      stats: {
        avgRating: stats.avgRating ? Number(stats.avgRating.toFixed(1)) : 0,
        totalCount: stats.totalCount,
        distribution: {
          1: stats.star1,
          2: stats.star2,
          3: stats.star3,
          4: stats.star4,
          5: stats.star5
        }
      },
      feedbackList
    };
  }
}

module.exports = new FeedbackService();
