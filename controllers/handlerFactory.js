const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/api-features');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError('No document found by this id', 404));
    }

    res.status(204).json({
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.files);
    const data = req.body;
    if (req.files.images && req.files.images.length) {
      data.images = req.files.images.map((file) => file.filename);
    }
    if (req.files.imageCover && req.files.imageCover.length) {
      data.imageCover = req.files.imageCover[0].filename;
    }

    const { id } = req.params;
    const doc = await Model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document with this id found', 404));
    }

    res.status(200).json({
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { body } = req;
    const doc = await Model.create(body);

    res.status(201).json({
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found by this id', 404));
    }

    res.status(200).json({
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to allow nested get reviews on tour
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // query.explain() for statistics
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      data: {
        data: docs,
      },
    });
  });
