const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      unique: true
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: 0,
      default: 0
    },
    billingCycle: {
      type: String,
      enum: ['Monthly', 'Yearly', 'One-time'],
      default: 'Monthly'
    },
    limits: {
      maxEvents: { type: Number, default: 5, min: 0 },
      maxAttendeesPerEvent: { type: Number, default: 500, min: 0 },
      storageGB: { type: Number, default: 10, min: 0 }
    },
    features: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
