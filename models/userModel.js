const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    validate: {
      validator: function (val) {
        const pattern = /^[a-z ,.'-]+$/i;
        return pattern.test(val);
      },
    },
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
    // required: [true, 'A user must have a profile image'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, ['Please confirm your password']],
    validate: {
      // This only works on save()/create() and not on update/replace
      validator: function (val) {
        return val === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // only run if the passowrd was modified
  if (!this.isModified('password')) return next();

  // Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete the password confirm field
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // Sometimes the user token is created before the query for passwordChangedAt is done running
  // We use passwordChangedAt to compare with the jwt token to make sure that a user that has changed password cannot login with old token
  // To ensure that that validation works, we subtract a second from passwordChangedAt
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// This middleware will only give us users that are active
userSchema.pre(/^find/, function (next) {
  // this is query middleware so 'this' refers to current query
  this.find({ active: { $ne: false } });
  next();
});

// All instances or objects of this schema/model will have access to methods defined in this manner (called instance methods)
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangedAtTimestamp =
      parseInt(this.passwordChangedAt.getTime()) / 1000;
    return passwordChangedAtTimestamp > JWTTimestamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  //We simply create a random token with inbuild crypto lib as chances of hacking ar low
  const resetToken = crypto.randomBytes(32).toString('hex');

  //We use a simpler algorithm to encrypt this password and save it in user database with an expiration period
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //Expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  //Return the random generated unencrypted token to be sent by email
  return resetToken;
};

// Here 'User' is the collection name
const User = mongoose.model('User', userSchema);

module.exports = User;
