const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || []
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(`[Error Stack] ${err.stack}`);
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
