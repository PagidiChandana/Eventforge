const mongoose = require('mongoose');

class HealthService {
  async getSystemHealth() {
    const dbStateMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };

    const dbState = mongoose.connection ? dbStateMap[mongoose.connection.readyState] || 'Unknown' : 'Disconnected';

    return {
      message: 'EventForge API is running',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: dbState
    };
  }
}

module.exports = new HealthService();
