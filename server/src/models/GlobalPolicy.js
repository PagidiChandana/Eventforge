const mongoose = require('mongoose');

const globalPolicySchema = new mongoose.Schema({
  registrationRules: {
    allowWaitlist: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: false }
  },
  securityPolicies: {
    passwordMinLength: { type: Number, default: 8 },
    requireSpecialChar: { type: Boolean, default: true },
    maxLoginAttempts: { type: Number, default: 5 }
  },
  platformLimits: {
    maxEventsPerOrganizer: { type: Number, default: 50 },
    maxAttendeesPerEvent: { type: Number, default: 5000 },
    maxStorageMB: { type: Number, default: 1024 } // 1GB
  }
}, { timestamps: true });

// Ensure only one global policy document exists
globalPolicySchema.statics.getSingleton = async function() {
  let policy = await this.findOne();
  if (!policy) {
    policy = await this.create({});
  }
  return policy;
};

const GlobalPolicy = mongoose.model('GlobalPolicy', globalPolicySchema);

module.exports = GlobalPolicy;
