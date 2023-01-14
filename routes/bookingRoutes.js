const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  protect,
  bookingsController.getCheckoutSession
);

router.use(protect);

router
  .route('/:id')
  .get(bookingsController.getBooking)
  .patch(bookingsController.updateBooking)
  .delete(restrictTo('admin'), bookingsController.deleteBooking);

router.use(restrictTo('admin'));

router
  .route('/')
  .get(bookingsController.getAllBookings)
  .post(bookingsController.createBooking);

module.exports = router;
