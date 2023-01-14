const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must not have more than 40 characters'],
      //maxLength and minLength are validations, we have set runValidators: true on update controller, that is why validation is happening
      minLength: [10, 'A tour name must have at least 10 characters'],
      // Using validator lib to test if name only contains alphabets (no spaces allowed)
      // validate: [validator.default.isAlpha, 'Tour name must only contain characters ']
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty level'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A tour can only be easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => val.toFixed(2),
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom Validation (not validator lib syntax)
      validate: {
        validator: function (val) {
          // this kind of a validator only works when creating a new document, not while updating an existing one
          // 'this' keyword only points to current doc on new document creation
          return val < this.price;
        },
        message: 'Discount price {VALUE} should be below regular price)',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(), //This is automatically converted in MongoDB as today's date
      // select: false, // This will make sure that this field is not exposed to client when a get request is made but data will come for this field on post requests
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
    },
    startLocation: {
      //GeoJSON format for GeoLocation data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // Giving type in [] means that we are expecting an array of that type
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        // The day on which the tour will reach that location
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        // ref will not be saved in db but it will be used for populate() in getTour and other methods
        ref: 'User',
      },
    ],
    // Extra id field is created due to virtualization, so it has to be explicity excluded
    id: false,
  },
  // These virtual properties will mean that virtual fields will be shown
  // Virtual fields are those that are not stored in the DB but calculated based on other fields, env conditions, etc
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Creating simple and compound indices(index)
// Single field - tourSchema.index({ price: 1 });
// Compound -
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// for geospatial data we use either 2d index for 2d plane or 2d sphere index for points on earth's sphere
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties - can only used in projecting data but not in querying data
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// This is virtual populate. We do not save the ref of other collection in model as we do in normal populate but use the
// virtual middleware to reference the child from parent in case of parentReferencing (or saving ref of parent in child)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: '_t',
  localField: '_id',
});

// Mongoose middleware are similar to express ones as in they can be run before or after some operation has been performed
// There are four types of middlewares in mongoose: Document, Query, Aggregate and Model middlewares
// middlewares are also known as pre and post hooks, depending on if they are implemented before or after an operation

// DOCUMENTS MIDDLEWARE: this runs before .save() and .create() commands, but not on insertMany/findbyIdAndUpdate/etc
// 'save' is considered the hook here, the complete term will be 'pre save hook'
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embedding users in tours for guides field
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id))
//   this.guides = await Promise.all(guidesPromises);
//   next();
// })

// post middleware is executed after the document has been saved/created. doc (argument) gives us the document that was just saved
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
// })

// QUERY MIDDLEWARES are executed before or after a query operation.
tourSchema.pre(/^find/, function (next) {
  // The regex here means that this middleware will be excuted for all the queries that start with find (findById, findOne, find, findMany, etc)
  this.find({ secretTour: { $ne: true } });
  this.queryStart = Date.now();
  next();
});

// populate guide field with data from 'User' collection every time the query runs
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  // The regex here means that this middleware will be excuted for all the queries that start with find (findById, findOne, find, findMany, etc)
  console.log(`Query took ${Date.now() - this.queryStart} milliseconds`);
  next();
});

// AGGREAGATION MIDDLEWARE are executed before or after a query operation
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //this.pipeline() method returns the aggregation pipeline(array)
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
