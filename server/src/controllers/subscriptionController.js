'use strict';
/**
 * subscriptionController.js
 * Matrix: Subscription Management = Admin + Organizer.
 * Plans CRUD + all subscriptions + status changes = Admin only.
 * View plans + subscribe + own status = Organizer.
 */

const subscriptionService = require('../services/subscriptionService');
const { SUBSCRIPTION_STATUSES } = require('../models/Subscription');

const listPlans = async (req, res, next) => {
  try {
    const plans = await subscriptionService.listPlans(req.user.role === 'Platform Admin');
    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (err) { next(err); }
};

const createPlan = async (req, res, next) => {
  try {
    const plan = await subscriptionService.createPlan(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Subscription plan created', data: plan });
  } catch (err) { next(err); }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await subscriptionService.updatePlan(req.params.id, req.body);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Plan updated', data: plan });
  } catch (err) { next(err); }
};

const deletePlan = async (req, res, next) => {
  try {
    const plan = await subscriptionService.deletePlan(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Plan deleted' });
  } catch (err) { next(err); }
};

const listSubscriptions = async (req, res, next) => {
  try {
    const subs = await subscriptionService.listSubscriptions();
    res.status(200).json({ success: true, count: subs.length, data: subs });
  } catch (err) { next(err); }
};

const getMySubscription = async (req, res, next) => {
  try {
    const org = req.user.organization;
    if (!org) return res.status(200).json({ success: true, count: 0, data: [] });
    const subs = await subscriptionService.getOrganizationSubscription(org);
    res.status(200).json({ success: true, count: subs.length, data: subs });
  } catch (err) { next(err); }
};

const subscribe = async (req, res, next) => {
  try {
    const org = req.user.organization;
    if (!org) {
      return res.status(400).json({ success: false, message: 'Your profile has no organization set. Update My Profile first.' });
    }
    if (!req.body.planId) {
      return res.status(400).json({ success: false, message: 'planId is required' });
    }
    const sub = await subscriptionService.subscribe(org, req.body.planId, req.user.id);
    res.status(201).json({ success: true, message: `Subscribed ${org} successfully`, data: sub });
  } catch (err) { next(err); }
};

const setSubscriptionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!SUBSCRIPTION_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${SUBSCRIPTION_STATUSES.join(', ')}` });
    }
    const sub = await subscriptionService.setSubscriptionStatus(req.params.id, status);
    res.status(200).json({ success: true, message: `Subscription ${status}`, data: sub });
  } catch (err) { next(err); }
};

module.exports = {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  listSubscriptions,
  getMySubscription,
  subscribe,
  setSubscriptionStatus
};
