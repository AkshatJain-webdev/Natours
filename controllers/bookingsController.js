const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError('Failed to locate tour', 404));

  console.log(req.protocol);

  // 2) create a stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  // 3) send the session to client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //This is only TEMPORARY, its highly unsecure cause anyone can make bookings by changing values in our fixed url
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
  next();
});

exports.getAllBookings = handlerFactory.getAll(Booking);

exports.createBooking = handlerFactory.createOne(Booking);

exports.getBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (booking.user !== req.user.id && req.user.role !== 'admin')
    return next(new AppError('You cannot access this booking', 201));

  res.status(200).json({
    status: 'success',
    data: { booking },
  });
});

exports.updateBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (booking.user !== req.user.id && req.user.role !== 'admin')
    return next(new AppError('You cannot access this booking', 201));

  const updatedBooking = await Booking.updateOne(
    { _id: booking.id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: { booking: updatedBooking },
  });
});

exports.deleteBooking = handlerFactory.deleteOne(Booking);
