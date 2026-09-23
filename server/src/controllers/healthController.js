const healthService = require('../services/healthService');

const getHealth = async (req, res, next) => {
  try {
    const healthData = await healthService.getSystemHealth();
    res.status(200).json({
      success: true,
      data: healthData,
      message: healthData.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth
};
