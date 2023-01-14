const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
// const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

const multerBufferStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    return callback(null, true);
  }
  return callback(
    new AppError('Not an image! Please upload only images.', 400),
    false
  );
};

const upload = multer({
  // storage: multerStorage,
  storage: multerBufferStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  req.files.imageCover[0].filename = `tour-${
    req.params.id
  }-${Date.now()}-cover.jpeg`;

  req.body.imageCover = req.files.imageCover[0].filename;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.files.imageCover[0].filename}`);

  req.body.images = [];

  for (let i = 0; i < req.files.images.length; i++) {
    req.files.images[i].filename = `tour-${req.params.id}-${Date.now()}-${
      i + 1
    }.jpeg`;
    req.body.images.push(req.files.images[i].filename);
    await sharp(req.files.images[i].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.files.images[i].filename}`);
  }
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.sort = '-ratingsAverage,price';
  req.query.limit = '5';
  next();
};

exports.getAllTours = getAll(Tour);

exports.getTour = getOne(Tour, ['reviews']);

exports.createTour = createOne(Tour);

exports.updateTour = updateOne(Tour);

exports.deleteTour = deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = parseInt(req.params.year);
  // const plan = await Tour.aggregate([
  //   {
  //     $match: {
  //       startDates: { $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)), $gt: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)) },
  //     },
  //   },
  // ]);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
          $gt: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

//latlng ex: 26.191782, 74.128353
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitude and longitude in the given format "lat, lng".',
        400
      )
    );

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  // console.log(distance, lat, lng, unit);
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitude and longitude in the given format "lat, lng".',
        400
      )
    );

  const distances = await Tour.aggregate([
    {
      // Geonear requires for at least one of our geospatial field to be indexed. Since only one field is indexed, it will use it by default
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001, //Converting to kms or miles from metres
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  // console.log(distance, lat, lng, unit);
  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: { data: distances },
  });
});

// exports.getAllTours = catchAsync(async (req, res) => {
//   // ALTERNATIVE METHOD OF WRITING THE QUERY
//   // const tours = await Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');

//   // EXECUTE QUERY
//   const features = await new ApiFeatures(Tour.find(), req.query) // since paginate is going to return a promise, we need an await keyword here
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: { tours },
//   });
// });
// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // Tour.findOne({ _id: req.params.id });

//   if (!tour) {
//     return next(new AppError('No tour found for the given id', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: { tour },
//   });
// });
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(200).json({
//     status: 'success',
//     data: {
//       newTour,
//     },
//   });
// });
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     // Will return the new document
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('No tour found for the given id', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: { tour },
//   });
// });
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   // in restful api, it is good practice to not send any data back on deletion
//   if (!tour) {
//     return next(new AppError('No tour found for the given id', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });
