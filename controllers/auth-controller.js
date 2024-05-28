const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

const User = require('../models/user-model');
const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, code, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    // converted to ms
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
    ),
    // cookie cannot be accessed or modified from browser
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    // sent only with encrypted connection
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(code).json({
    data: {
      user,
    },
    token,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, role, email, password, confirmPassword, passwordChangedAt } =
    req.body;
  const user = await User.create({
    name,
    role,
    email,
    password,
    confirmPassword,
    passwordChangedAt,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(user, url).sendWelcome();
  createSendToken(user, 201, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({});
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // + to add field which is not selected be default
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.isCorrectPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.protectUnauth = catchAsync(async (req, res, next) => {
  let token;
  const auth = req.headers.authorization;

  if (auth && auth.startsWith('Bearer')) {
    token = auth.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('Unauthorized', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError('User does not exist', 401));
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Invalid token', 401));
  }

  // add user prop to the request
  req.user = user;
  // to have user variable from pug template
  res.locals.user = user;

  next();
});
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          'You do not have a permission to proceed with current action',
          403,
        ),
      );
    }
    next();
  };

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // only for rendered pages
  if (req.cookies.jwt) {
    try {
      const token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next();
      }

      if (user.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // to have user variable from pug template
      res.locals.user = user;
    } catch (_e) {
      return next();
    }
  }

  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('User was not found', 404));
  }

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

  try {
    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error occurred while sending the email', 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token has expired or invalid', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // with validation
  await user.save();

  createSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user (select is used to retrieve password which is usually hidden
  const user = await User.findById(req.user.id).select('password');

  // check the password
  const isCorrect = await user.isCorrectPassword(
    req.body.passwordCurrent,
    user.password,
  );
  if (!isCorrect) {
    return next(new AppError('Incorrect password', 401));
  }

  // update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // save and not update to run middlewares
  await user.save();

  createSendToken(user, 200, res);
});
