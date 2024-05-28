const Tour = require('../models/tour-model');
const Booking = require('../models/booking-model');
const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/appError');

exports.login = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login',
  });
});
exports.getAccount = catchAsync((req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
});
exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});
exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({
    user: req.user.id,
  });
  const tourIds = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({
    _id: {
      // select tour with id which is in tourIds array
      $in: tourIds,
    },
  });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('Tour is not found', 404));
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});
