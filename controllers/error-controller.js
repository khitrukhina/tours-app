const AppError = require('../utils/appError');

const sendDevError = (error, res, req) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(error.status).json({
      status: error.status,
      message: error.message,
      stack: error.stack,
      error,
    });
  }
  res.status(error.status).render('error', {
    title: 'Something went wrong',
    msg: error.message,
  });
};

const sendProdError = (error, res, req) => {
  if (req.originalUrl.startsWith('/api')) {
    if (error.isOperational) {
      return res.status(error.status).json({
        status: error.status,
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 500,
      message: 'Something went wrong',
    });
  }
  if (error.isOperational) {
    return res.status(error.status).render('error', {
      title: 'Something went wrong',
      msg: error.message,
    });
  }
  return res.status(error.status).render('error', {
    title: 'Something went wrong',
    msg: 'Please, try again later',
  });
};

const handleCastError = (error) =>
  new AppError(`Invalid ${error.path}: ${error.value}`, 400);

const handleDuplicateFieldsError = (error) => {
  const val = Object.entries(error.keyValue)[0];
  const msg = `Duplicate ${val[0]}: ${val[1]}`;

  return new AppError(msg, 400);
};

const handleValidationError = (error) => {
  const errors = Object.values(error.errors)
    .map((e) => e.message)
    .join('. ');

  return new AppError(errors, 400);
};

const handleJwtError = () => new AppError('Invalid token', 401);
const handleJwtExpiredError = () => new AppError('Token is expired', 401);

module.exports = (error, req, res, next) => {
  error.status = error.status || 500;
  if (process.env.NODE_ENV === 'development') {
    sendDevError(error, res, req);
  } else if (process.env.NODE_ENV === 'production') {
    if (error.name === 'CastError') {
      error = handleCastError({ ...error });
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsError({ ...error });
    }
    if (error.name === 'ValidationError') {
      error = handleValidationError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJwtError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJwtExpiredError();
    }
    sendProdError(error, res, req);
  }
};
