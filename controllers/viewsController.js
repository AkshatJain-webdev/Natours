const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data
  const tours = await Tour.find({});

  // 2) Build template

  // 3) Render that template using the tour data from 1)

  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug: slug }).populate({
    path: 'reviews',
    fields: 'reviewBody rating _u',
  });

  if (!tour) {
    return next(new AppError('There is no tour with this name', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginPage = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
});

exports.getAccountPage = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  if (!bookings)
    return next(new AppError('No bookings found for this user', 404));

  // 2) Find all tours corresponding to these ids
  const tourIds = bookings.map((x) => x.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  // 3) Alternatively, we can use populate to get tours for our bookings
  // const bookings = await Booking.find({ user: req.user.id }).populate('tours');
  // if (!bookings)
  //   return next(new AppError('No bookings found for this user', 404));

  // const tours = bookings.map((x) => x.tour);

  console.log(tours);

  res.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
