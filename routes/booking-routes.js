const express = require('express');
const bookingController = require('../controllers/booking-controller');
const authController = require('../controllers/auth-controller');

const router = express.Router();

router.use(authController.protectUnauth);
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .get('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

router
  .get('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
