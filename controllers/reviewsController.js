const Review = require('../models/reviewModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) {
    filter = { _t: req.params.tourId };
  }
  getAll(Review, filter)(req, res, next);
});

exports.getReview = getOne(Review);

exports.createReview = createOne(Review);

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById({ _id: req.params.id });
  if (review._u._id.toString() === req.user.id.toString()) {
    updateOne(Review)(req, res, next);
  } else {
    return next(
      new AppError('You are not authorized to update this review', 401)
    );
  }
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById({ _id: req.params.id });
  if (review._u._id.toString() === req.user.id.toString()) {
    deleteOne(Review)(req, res, next);
  } else {
    return next(
      new AppError('You are not authorized to delete this review', 401)
    );
  }
});

// Validate if review by this user already exists on the tour
exports.preCreateMiddleware = catchAsync(async (req, res, next) => {
  const _u = req.user._id;
  const _t = req.params.tourId ? req.params.tourId : req.body._t;
  if (!_t) return next(new AppError('Please provide tour id'));

  const { reviewBody, rating } = req.body;
  const tour = await Tour.findById({ _id: _t });

  const reviewExists = await Review.find({ _t: _t, _u: _u });
  if (reviewExists.length > 0)
    return next(new AppError('You have already reviewed this tour', 400));

  if (!tour) return next(new AppError('Tour does not exist', 404));

  req.body = {
    _u,
    _t,
    reviewBody,
    rating,
  };
  next();
});

// exports.createReview = catchAsync(async (req, res, next) => {
//   const _u = req.user._id;
//   const _t = req.params.tourId ? req.params.tourId : req.body._t;
//   const { reviewBody, rating } = req.body;
//   const tour = await Tour.findById({ _id: _t });

//   if (!tour) return next(new AppError('Tour does not exist', 404));

//   const review = await Review.create({
//     reviewBody,
//     rating,
//     _u,
//     _t,
//   });

//   res.status(201).json({
//     status: 'success',
//     data: { review },
//   });
// });
