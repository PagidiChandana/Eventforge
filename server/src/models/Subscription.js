const mongoose = require('mongoose');

const SUBSCRIPTION_STATUSES = ['Trialing', 'Active', 'Expired', 'Cancelled'];

const subscriptionSchema = new mongoose.Schema(
  {
    organization: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: [true, 'Plan is required']
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'Active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

subscriptionSchema.index({ organization: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = { Subscription, SUBSCRIPTION_STATUSES };
