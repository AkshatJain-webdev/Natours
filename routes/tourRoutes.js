// creating routers
const express = require('express');
const {
  // checkID,
  // checkBody,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages
} = require('../controllers/toursController');
const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// router.param('id', checkID);
// router.route('/').get(getAllTours).post(checkBody, createTour);

// Here the reviewRouter won't have access to tourId by default for which we use mergeParams
router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(protect, restrictTo('admin'), getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

//distance
//latlng: the latitude and longitide of the center from which we will calculate the distance
//unit: the unit of distance (miles or km)
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

// Get distance of starting locations for all the tours from a specified point
router.route('/distances/:latlng/unit/:unit').get(getDistances);

// Here the get all tours is only going to be accessed by logged in users
router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), uploadTourImages, resizeTourImages, updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
