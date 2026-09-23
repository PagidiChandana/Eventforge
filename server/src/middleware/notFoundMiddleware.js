const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found - ${req.originalUrl}`,
    errors: [{ path: req.originalUrl, message: 'Route does not exist on this server' }]
  });
};

module.exports = notFoundMiddleware;
