const express = require('express');
const viewsController = require('../controllers/views-controller');
const authController = require('../controllers/auth-controller');
const bookingController = require('../controllers/booking-controller');
const cspMiddleware = require('../utils/csp-middleware');

const router = express.Router();

router.use(cspMiddleware);

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview,
);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/login', authController.isLoggedIn, viewsController.login);
router.get('/me', authController.protectUnauth, viewsController.getAccount);
router.get(
  '/my-tours',
  authController.protectUnauth,
  viewsController.getMyTours,
);
module.exports = router;
