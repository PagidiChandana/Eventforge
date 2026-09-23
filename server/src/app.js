const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const operationsRoutes = require('./routes/operationsRoutes');
const modulesRoutes = require('./routes/modulesRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const policyRoutes = require('./routes/policyRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const mongoose = require('mongoose');

// Required when behind Render/Heroku/nginx proxies (rate limiting, secure cookies, IPs)
app.set('trust proxy', 1);

// Minimal security headers (no extra dependency)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// CORS configuration: supports single CLIENT_URL or comma-separated CLIENT_URLS for production
const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(process.env.CLIENT_URLS),
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow any origin for easier local testing
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser (10mb allows deck/asset metadata payloads; files themselves stay as URLs)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Mount API routes (Standard & /api/v1 aliases)
app.use('/api/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);

// Keep the API reachable while MongoDB is unavailable, and return a fast,
// actionable response instead of allowing Mongoose queries to buffer/time out.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    message: 'Database is unavailable. Check the server MongoDB connection and try again.'
  });
});
app.use('/api/v1', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    message: 'Database is unavailable. Check the server MongoDB connection and try again.'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

app.use('/api/events', eventRoutes);
app.use('/api/v1/events', eventRoutes);

app.use('/api', registrationRoutes);
app.use('/api/v1', registrationRoutes);

app.use('/api/operations', operationsRoutes);
app.use('/api/v1/operations', operationsRoutes);

app.use('/api/modules', modulesRoutes);
app.use('/api/v1/modules', modulesRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

app.use('/api', feedbackRoutes);
app.use('/api/v1', feedbackRoutes);

app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

app.use('/api/admin/policy', policyRoutes);
app.use('/api/v1/admin/policy', policyRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to EventForge Corporate Event & Conference Management API',
    docs: '/api/health'
  });
});

// 404 handler
app.use(notFoundMiddleware);

// Centralized error handler
app.use(errorMiddleware);

module.exports = app;
