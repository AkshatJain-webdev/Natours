/* eslint-disable node/no-unsupported-features/es-syntax */
const Tour = require('../models/tourModel');

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // BUILD QUERY
    // 1) FILTERING
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 2) ADVANCED FILERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // 3) SORTING
    if (this.queryString.sort) {
      // For sorting by multiple criterion, the format is something like this:
      // sort('price ratingsAverage')
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); // Will return the most recently created one
    }
    return this;
  }

  limitFields() {
    // 4) FIELD LIMITING FROM CLIENT SIDE (Projection but not done on server side)
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); // select is similar to project or include by default, to exclude you just use '-' with the field string
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  async paginate() {
    // 5) PAGINATION
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 15;
    this.query = this.query.skip((page - 1) * limit).limit(limit);
    if (this.queryString.page) {
      const numTours = await Tour.countDocuments();
      if ((page - 1) * limit >= numTours)
        throw new Error('This page does not exist');
    }
    return this;
  }
}

module.exports = ApiFeatures;
