const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: [true, 'Email should be unique'],
    lowercase: true,
    validate: [validator.isEmail, 'Must be a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
    // remove from output
    select: false,
  },

  passwordResetToken: String,
  passwordResetExpires: Date,

  passwordChangedAt: Date,
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password should have at least 8 chars'],
    // not to show up in any output
    select: false,
  },
  passwordConfirm: {
    type: String,
    // required: [true, 'Password confirm is required'],
    validate: {
      // will work only on save!!!
      validator: function (el) {
        return this.password === el;
      },
      message: 'Passwords do not match',
    },
  },
});

userSchema.pre('save', async function (next) {
  // run if password was modified
  if (!this.isModified('password')) {
    return next();
  }
  // hash with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // delete not to save to the database
  this.passwordConfirm = undefined;

  next();
});
userSchema.pre('save', async function (next) {
  // run if password was modified
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  // ensure that token is created after the password is changed
  this.passwordChangedAt = Date.now() - 1000;

  next();
});
// query middleware
userSchema.pre(/^find/, async function (next) {
  // this obj point to the current query
  // exclude not active users
  this.find({ active: { $ne: false } });

  next();
});

// method will be available on every doc in the collection
userSchema.methods.isCorrectPassword = async function (
  candidatePassword,
  storedPassword,
) {
  // this points to the document
  return await bcrypt.compare(candidatePassword, storedPassword);
};
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const timestamp = this.passwordChangedAt.getTime() / 1000;
    return jwtTimestamp < timestamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
