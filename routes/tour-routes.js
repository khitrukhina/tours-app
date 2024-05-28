const express = require('express');
const tourController = require('../controllers/tour-controller');
const authController = require('../controllers/auth-controller');
const reviewRouter = require('./review-routes');

const router = express.Router();

// param middleware creation
// router.param('id', tourController.checkId);

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top5')
  .get([tourController.aliasTopTours, tourController.getTours]);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getToursDistances);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protectUnauth,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protectUnauth,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

router
  .route('/')
  .get(tourController.getTours)
  .post(
    authController.protectUnauth,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

module.exports = router;
