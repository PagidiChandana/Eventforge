'use strict';
/**
 * subscriptionService.js
 * Matrix: Subscription Management = Platform Admin (plans + all subscriptions)
 * + Event Organizer (view plans, subscribe own organization, view own status).
 */

const SubscriptionPlan = require('../models/SubscriptionPlan');
const { Subscription } = require('../models/Subscription');

class SubscriptionService {
  // --- Plans ---
  async listPlans(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return await SubscriptionPlan.find(filter).sort({ price: 1 }).lean();
  }

  async createPlan(planData, userId) {
    return await SubscriptionPlan.create({ ...planData, createdBy: userId });
  }

  async updatePlan(planId, updateData) {
    const allowed = (({ name, price, billingCycle, limits, features, isActive }) => ({
      name, price, billingCycle, limits, features, isActive
    }))(updateData);
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);
    return await SubscriptionPlan.findByIdAndUpdate(planId, allowed, { new: true, runValidators: true });
  }

  async deletePlan(planId) {
    const inUse = await Subscription.countDocuments({ plan: planId, status: { $in: ['Trialing', 'Active'] } });
    if (inUse > 0) {
      const err = new Error('Cannot delete a plan with active subscriptions. Deactivate it instead.');
      err.statusCode = 400;
      throw err;
    }
    return await SubscriptionPlan.findByIdAndDelete(planId);
  }

  // --- Subscriptions ---
  async listSubscriptions() {
    return await Subscription.find()
      .populate('plan')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getOrganizationSubscription(organization) {
    return await Subscription.find({ organization })
      .populate('plan')
      .sort({ createdAt: -1 })
      .lean();
  }

  async subscribe(organization, planId, userId) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      const err = new Error('Selected plan is not available');
      err.statusCode = 400;
      throw err;
    }
    // Expire previous active subscriptions for this organization
    await Subscription.updateMany(
      { organization, status: { $in: ['Trialing', 'Active'] } },
      { $set: { status: 'Expired' } }
    );
    const months = plan.billingCycle === 'Yearly' ? 12 : 1;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);
    const sub = await Subscription.create({
      organization,
      plan: planId,
      status: 'Active',
      endDate,
      createdBy: userId
    });
    return await sub.populate('plan');
  }

  async setSubscriptionStatus(subscriptionId, status) {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) {
      const err = new Error('Subscription not found');
      err.statusCode = 404;
      throw err;
    }
    sub.status = status;
    await sub.save();
    return await sub.populate('plan');
  }
}

module.exports = new SubscriptionService();
