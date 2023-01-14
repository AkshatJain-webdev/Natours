const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);
    // in restful api, it is good practice to not send any data back on deletion
    if (!document) {
      return next(new AppError('No document found for the given id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      // Will return the new document
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError('No document found for the given id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { document },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(200).json({
      status: 'success',
      data: {
        newDoc,
      },
    });
  });

// fieldsToPopulate is an array of fields that we want populated
exports.getOne = (Model, fieldsToPopulate) =>
  catchAsync(async (req, res, next) => {
    let qry = Model.findById(req.params.id);
    if (fieldsToPopulate && fieldsToPopulate.length > 0)
      fieldsToPopulate.map((fl) => {
        qry = qry.populate(fl);
        return true;
      });

    const doc = await qry;

    if (!doc) {
      return next(new AppError('No document found for the given id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { doc },
    });
  });

exports.getAll = (Model, filter) =>
  catchAsync(async (req, res) => {
    const features = await new ApiFeatures(Model.find(filter || {}), req.query) // since paginate is going to return a promise, we need an await keyword here
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      data: { docs },
    });
  });
