const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
      unique: [true, 'Name should be unique'],
      maxlength: [40, 'Name length can be less or equal 40 chars'],
      minlength: [10, 'Name length can be more or equal 10 chars'],
      // validate: [validator.isAlpha, 'Must should contain only chars'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating should be at least 1'],
      max: [5, 'Rating should be 5 max'],
      set: (val) => Math.round(val * 10) / 10, // result will be 4.7 etc
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Group size is required'],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Unsupported difficulty level',
      },
    },
    priceDiscount: {
      type: Number,
      validate: {
        message:
          'Discount should be below the regular price. Written discount is {{VALUE}}',
        validator: function (value) {
          // this is current document ONLY on new document creation
          return value < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Summary is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Image cover is required'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // to exclude field
      // select: false,
    },
    startDates: [Date],
    slug: String,

    // geoJSON for geospatial data
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // lng, lat
      coordinates: [Number],
      address: String,
      description: String,
    },
    // array to create new embedded documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // embedding user documents to the tour document
    // guides: Array,

    //referencing, input is array of user ids as well as in the response with created tour
    guides: [
      {
        type: mongoose.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// indexes are used for the fields queried a lot
// 1 or -1, 1 - sorting index in asc or desc

// compound index
tourSchema.index({
  price: 1,
  ratingsAverage: -1,
});

tourSchema.index({
  slug: 1,
});
// geospatial index
tourSchema.index({
  startLocation: '2dsphere',
});

// virtual props cannot be queried as they are dynamic and not persistent in the database
tourSchema.virtual('durationWeeks').get(function () {
  // this is pointing to curr document(value)
  return this.duration / 7;
});
// virtual populating
tourSchema.virtual('reviews', {
  ref: 'Review',
  // connecting models
  // in review model
  foreignField: 'tour',
  // in current model
  localField: '_id',
});

// document, query, model, aggregate - mongoose middlewares
// middleware running before event save or create
// can't use arrow function
tourSchema.pre('save', function (next) {
  // this object is processed document
  this.slug = slugify(this.name, { lower: true });

  next();
});
// embedding example
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//
//   next();
// });

// aggregation middleware - before or after aggregation
// tourSchema.pre('aggregate', (next) => {
  // this is current aggregation object
  // this.pipeline() - and then the aggregation pipeline can be updated
  // next();
// });

// when tour is retrieved with methods starting with find
tourSchema.pre(/^find/, function (next) {
  // populate - to fill up the guides field, which contains references only
  // just 'guides' or an object to have some other options
  this.populate({
    path: 'guides',
    // to exclude
    select: '-__v -passwordChangedAt',
  });

  next();
});

// post middlewares running after all pre middlewares
// tourSchema.post('save', function (doc, next) {
//   // this object is just saved document
//   console.log(doc);
//
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
