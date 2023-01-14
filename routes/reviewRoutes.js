const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
  preCreateMiddleware,
} = require('../controllers/reviewsController');

// We use merge params to ensure that any param coming from paths defined in other routes can still be accessed here
const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), preCreateMiddleware, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

// router.route('/:type/:typeId').get(getReviewsByType);

module.exports = router;
