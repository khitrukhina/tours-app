const multer = require('multer');

const User = require('../models/user-model');
const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// how to store files
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[0];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
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
  // dest: 'public/img/users',
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterObj = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach((k) => {
    if (fields.includes(k)) {
      newObj[k] = obj[k];
    }
  });

  return newObj;
};

// photo is field to hold the file
// puts file info to the req obj
exports.uploadUserPhoto = upload.single('photo');

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// do not update password
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.updateCurrentUser = catchAsync(async (req, res, next) => {
  // name & email
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Password cannot be updated', 401));
  }
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    data: {
      user: updatedUser,
    },
  });
});
exports.deleteCurrentUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    data: null,
  });
});
exports.getCurrentUser = (req, res, next) => {
  // set id param to currently authorized user's id
  req.params.id = req.user.id;
  // will be passed to getUser handler
  next();
};
