const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/error-controller');

const userRouter = require('./routes/user-routes');
const tourRouter = require('./routes/tour-routes');
const reviewRouter = require('./routes/review-routes');
const viewRouter = require('./routes/view-routes');
const bookingRouter = require('./routes/booking-routes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// serving static files from folder
app.use(express.static(path.join(__dirname, 'public')));

// set security http headers, collection 14 middlewares. some of them are default and some can be also included
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit requests to 100 req per hour allowed from certain ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: 'Too many requests',
});
app.use('/api', limiter);

app.use(cookieParser());
// body parser into req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);

// data sanitization against nosql query injection
app.use(mongoSanitize());

// data sanitization against xss. clean malicious html code with js attached to it
app.use(xss());
app.use(cors());
app.options('*', cors());

//prevents param pollution (cleans query strings from duplicates, last one remains)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
// compress text sent to client
app.use(compression());

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// for all http methods
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

// error handling middleware
app.use(globalErrorHandler);

module.exports = app;
