const mongoose = require('mongoose');
const Tour = require('./tour-model');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review is required'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // parent referencing
    tour: {
      type: mongoose.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to some tour'],
    },
    user: {
      type: mongoose.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a user as an author'],
    },
  },
  // when we have a field which is not stored in the database, but we somehow calculate it and want to show it in the output
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// each combination of tour and user on review has to be unique. only one review on exact tour from one user
reviewSchema.index(
  {
    tour: 1,
    user: 1,
  },
  { unique: true },
);

reviewSchema.pre(/^find/, function (next) {
  // chaining to populate several props

  // this.populate({
  //   path: 'tour',
  //   // to include
  //   select: 'name',
  // });
  this.populate({
    path: 'user',
    // to include
    select: 'name photo',
  });

  next();
});

// calculating number of ratings and average
reviewSchema.statics.calculateAverageRatings = async function (tourId) {
  // this is current model
  // array of aggregation stages
  const stats = await this.aggregate([
    {
      // find tour to update
      $match: {
        tour: tourId,
      },
    },
    {
      // group by tour
      $group: {
        _id: '$tour',
        nRating: {
          // add 1 for each document
          $sum: 1,
        },
        // calculate avgRating from rating field
        avgRating: {
          $avg: '$rating',
        },
      },
    },
  ]);
  // defaults if no reviews
  const { nRating, avgRating } = stats[0] || { nRating: 0, avgRating: 4.5 };

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: nRating,
    ratingsAverage: avgRating,
  });
};

// update tour after the review saved
// post middleware has no next fn access
reviewSchema.post('save', function () {
  // this obj is current review
  // constructor is a model itself - way around cause review is not defined yet
  this.constructor.calculateAverageRatings(this.tour);
});

// update tour on findOneAndDelete and findOneAndUpdate
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this - is current query
  // review will be without changes at this time
  // saving to this
  this.r = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // r got from pre middleware to got it after query was executed
  await this.r.constructor.calculateAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
