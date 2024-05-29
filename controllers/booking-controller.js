const catchAsync = require('../utils/catch-async');
const Tour = require('../models/tour-model');
const Booking = require('../models/booking-model');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;
  const tour = await Tour.findById(tourId);

  if (!tour) {
    return next(new AppError('Tour was not found', 404));
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    // no query params with web hooks
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tourId,
  });

  res.status(200).json({
    session,
  });
});
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // temporary solution - with deployed app u need to use stripe webhooks to redirect after completed checkout session
  // after that u need to create the route and its handler which stripe will use after completed checkout
  // body needs to be raw, not converted by body parser but by raw parser - express.raw({ type: 'application/json' })
  // route handler implementation
  // const signature = req.headers['stripe-signature']
  // const event = stripe.webhooks.constructEvent(req.body, signature, secret)
  // if (event.type === 'checkout.session.complete)
  // const session = event.data.object;
  // session.client_reference_id is tour id
  // await User.findOne({ email: session.customer_email }).id - user id
  // price is in session.line_items[0].amount / 100
  // await Booking.create ...
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) {
    return next();
  }
  await Booking.create({
    tour,
    user,
    price,
  });
  // remove query
  res.redirect(req.originalUrl.split('?')[0]);
});
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
