'use strict';

const analyticsService = require('../services/analyticsService');

async function getEventAnalytics(req, res, next) {
  try {
    const { eventId } = req.params;
    const analytics = await analyticsService.getEventAnalytics(eventId);
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    next(err);
  }
}

async function getOrganizerOverview(req, res, next) {
  try {
    const overview = await analyticsService.getOrganizerOverview(req.user);
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEventAnalytics,
  getOrganizerOverview
};
