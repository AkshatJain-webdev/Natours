const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');

// This will directly save the incoming file to our destination
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users');
//   },
//   filename: (req, file, callback) => {
//     const ext = file.mimetype.split('/')[1];
//     callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// This will save the uploaded file to memory buffer from where we can use it to do image processing using sharp library
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

// middleware to handle copying of bytes data from user uploaded file to our storage destination
const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // To do image processing, we will save the incoming file in memory before saving it in directory
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const usersEdit = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/users2.json`, 'utf-8')
);

const checkID = (req, res, next, val) => {
  if (parseInt(val) >= usersEdit.length) {
    return res.status(404).json({
      status: 'error',
      message: 'Invalid id',
    });
  }
  next();
};

const filterObj = (reqBody, ...allowedFields) => {
  const returnObj = {};
  allowedFields.forEach((field) => {
    if (Object.keys(reqBody).includes(field)) returnObj[field] = reqBody[field];
  });
  return returnObj;
};

const getAllUsers = getAll(User);

const getUser = getOne(User);

const createUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'This route is not defined. Please use sign up instead.',
  });
};

const updateUser = updateOne(User);

const deleteUser = deleteOne(User);

const getMe = (req, res, next) => {
  console.log(req.user._id);
  req.params.id = req.user._id;
  next();
};

const updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user posts password data
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('This is not where you update passwords', 400));

  // 2) Update user document - filter out field names that are not to be updated like roles, passwordChangeAt, etc
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  checkID,
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto,
};
