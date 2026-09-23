const GlobalPolicy = require('../models/GlobalPolicy');

const getPolicy = async (req, res, next) => {
  try {
    const policy = await GlobalPolicy.getSingleton();
    res.status(200).json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
};

const updatePolicy = async (req, res, next) => {
  try {
    const policy = await GlobalPolicy.getSingleton();
    
    // Update fields if provided
    if (req.body.registrationRules) {
      policy.registrationRules = { ...policy.registrationRules, ...req.body.registrationRules };
    }
    if (req.body.securityPolicies) {
      policy.securityPolicies = { ...policy.securityPolicies, ...req.body.securityPolicies };
    }
    if (req.body.platformLimits) {
      policy.platformLimits = { ...policy.platformLimits, ...req.body.platformLimits };
    }

    await policy.save();
    res.status(200).json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPolicy,
  updatePolicy
};
