'use strict';
/**
 * aiController.js
 * Exposes API endpoints for AI Content Generation and AI Session Recommendations.
 */

const aiService = require('../services/aiService');

async function answerGuideQuestion(req, res, next) {
  try {
    const answer = await aiService.answerGuideQuestion(req.body.question, req.user.role, req.body.history);
    res.status(200).json({ success: true, data: { answer } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/event-description
 * Allowed roles: Event Organizer, Platform Admin
 */
async function generateEventDescription(req, res, next) {
  try {
    const result = await aiService.generateContent('event-description', req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/speaker-bio
 * Allowed roles: Event Organizer, Platform Admin, Speaker
 */
async function generateSpeakerBio(req, res, next) {
  try {
    const result = await aiService.generateContent('speaker-bio', req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/announcement
 * Allowed roles: Event Organizer, Platform Admin, Event Staff
 */
async function generateAnnouncement(req, res, next) {
  try {
    const result = await aiService.generateContent('announcement', req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/session-summary
 * Allowed roles: Event Organizer, Platform Admin, Speaker, Event Staff
 */
async function generateSessionSummary(req, res, next) {
  try {
    const result = await aiService.generateContent('session-summary', req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ai/recommendations/sessions?eventId=...&limit=5
 * Allowed roles: All authenticated users
 */
async function getRecommendedSessions(req, res, next) {
  try {
    const { eventId, limit } = req.query;
    const userId = req.user._id;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'eventId query parameter is required'
      });
    }

    const limitNum = limit ? parseInt(limit, 10) : 5;
    const result = await aiService.getRecommendedSessions(userId, eventId, limitNum);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  answerGuideQuestion,
  generateEventDescription,
  generateSpeakerBio,
  generateAnnouncement,
  generateSessionSummary,
  getRecommendedSessions
};
