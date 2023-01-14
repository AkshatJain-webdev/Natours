const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    reviewBody: {
      type: String,
      required: [true, 'Review cannot be without text body'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    _u: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a tour'],
    },
    _t: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// We can set up a unique index which will ensure that there will be no two reviews by same user for a given tour
reviewSchema.index({ _t: 1, _u: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: '_u',
  //     select: 'name photo',
  //   }).populate({
  //     path: '_t',
  //     select: 'name',
  //   });

  this.populate({
    path: '_u',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // 'this' in static methods refer to the current model
  const stats = await this.aggregate([
    {
      $match: { _t: tourId },
    },
    {
      $group: {
        _id: '$_t',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
};

// We calculate ratingsAverage and quantity once our review has been saved in the DB
reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRatings(this._t);
});

// We get the tour id before a review is updated or deleted because unlike document middleware, 
// we do not have direct access to document in query middleware and hence we don't have tourId either
// findByIdAndUpdate, findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
})
// We again calculate the stats after the action on Review collection has completed
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r._t)
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
