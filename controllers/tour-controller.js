const multer = require('multer');

const Tour = require('../models/tour-model');
const catchAsync = require('../utils/catch-async');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// creating middleware
// exports.checkBody = (req, res, next) => {
//   const { name, difficulty, duration, price } = req.body;
//
//   if (!name || !difficulty || !duration || !price) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Bad request',
//     });
//   }
//   next();
// };

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/tours');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[0];
    cb(null, `tour-${req.params.id}-${Date.now()}.${ext}`);
  },
});
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);
// upload.array('image', 5)
exports.getToursDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(new AppError('Lat and lng are required', 400));
  }

  const distances = await Tour.aggregate([
    {
      // $geoNear always needs to be in the first stage and requires at least of one field with geospatial index. if you have only one - used as a default to perform calculation or use keys param
      $geoNear: {
        // point from which to calculate the distance
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        // name of the field which will be created
        distanceField: 'distance',
        // number to multiply distance with
        // conversion from meters based on unit provided
        distanceMultiplier: multiplier,
      },
    },
    {
      // names of the fields to keep in the response
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    data: {
      data: distances,
    },
  });
});
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  // latlng is two coma separated values
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(new AppError('Lat and lng are required', 400));
  }

  // geospatial query
  // distance converted to radiant based on unit
  const radiusOfEarthInMiles = 3963.2;
  const radiusOfEarthInKm = 6378.1;

  const radius =
    unit === 'mi'
      ? distance / radiusOfEarthInMiles
      : distance / radiusOfEarthInKm;
  const tours = await Tour.find({
    startLocation: {
      // find doc within circle(sphere)
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
  res.status(200).json({
    data: {
      data: tours,
    },
  });
});
exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.getTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
});
exports.createTour = factory.createOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.updateTour = factory.updateOne(Tour);

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    data: {
      plan,
    },
  });
});
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5,
        },
      },
    },
    {
      $group: {
        // _id: {
        //   $toUpper: '$difficulty'
        // }
        // _id: '$difficulty'
        _id: null,
        numRatings: {
          $sum: '$ratingsQuantity',
        },
        num: {
          $sum: 1,
        },
        avgRating: {
          $avg: '$ratingsAverage',
        },
        avgPrice: {
          $avg: '$price',
        },
        minPrice: {
          $min: '$price',
        },
        maxPrice: {
          $max: '$price',
        },
      },
    },
    {
      $sort: {
        // 1 for asc
        avgPrice: 1,
      },
    },
  ]);
  res.status(200).json({
    data: stats,
  });
});
