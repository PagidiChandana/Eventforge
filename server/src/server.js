const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const validateProductionConfig = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = [];
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback_secret') missing.push('JWT_SECRET');
  if (!process.env.CLIENT_URL && !process.env.CLIENT_URLS) missing.push('CLIENT_URL or CLIENT_URLS');

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
};

// Connect to Database & Start Server
const startServer = async () => {
  validateProductionConfig();
  const server = app.listen(PORT, HOST, () => {
    console.log(`[EventForge Server] Running in ${process.env.NODE_ENV || 'development'} mode on ${HOST}:${PORT}`);
    console.log(`[EventForge Server] Health check available at http://localhost:${PORT}/api/health`);
  });

  let retryTimer;
  const connectWithRetry = async () => {
    try {
      await connectDB();
    } catch (err) {
      console.error(`[EventForge Server] MongoDB unavailable; retrying in 10 seconds. ${err.message}`);
      retryTimer = setTimeout(connectWithRetry, 10000);
      retryTimer.unref();
    }
  };
  connectWithRetry();

  const shutdown = (signal) => {
    console.log(`[EventForge Server] ${signal} received, closing gracefully...`);
    clearTimeout(retryTimer);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

process.on('unhandledRejection', (err) => {
  console.error('[EventForge Server] Unhandled rejection:', err);
});

startServer().catch((err) => {
  console.error(`[EventForge Server] Startup failed: ${err.message}`);
  process.exit(1);
});
