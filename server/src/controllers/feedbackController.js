'use strict';

const feedbackService = require('../services/feedbackService');

async function submitFeedback(req, res, next) {
  try {
    const { eventId } = req.params;
    const { sessionId, rating, comment } = req.body;

    const feedback = await feedbackService.submitFeedback({
      userId: req.user._id,
      eventId,
      sessionId,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Feedback submitted successfully.',
      data: feedback
    });
  } catch (err) {
    next(err);
  }
}

async function getEventFeedback(req, res, next) {
  try {
    const { eventId } = req.params;
    const result = await feedbackService.getEventFeedback(eventId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getMyFeedback(req, res, next) {
  try {
    const list = await feedbackService.getMyFeedback(req.user._id);
    res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitFeedback,
  getEventFeedback,
  getMyFeedback
};
