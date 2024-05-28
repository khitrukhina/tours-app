const express = require('express');
const reviewController = require('../controllers/review-controller');
const authController = require('../controllers/auth-controller');

// mergeParams - to get params from parent route (tourId)
const router = express.Router({
  mergeParams: true,
});

router.use(authController.protectUnauth);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourAndUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .get(reviewController.getReview);

module.exports = router;
