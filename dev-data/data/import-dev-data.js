const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection is successful');
  });

// READ JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT data into Database
const importData = async () => {
  // Tour.insertMany(tours, {
  //   ordered: true,
  //   rawResult: true,
  // })
  //   .then((res) => {
  //     console.log('Success', res.insertedIds);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
  // process.exit();
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE all data from Database
const deleteData = async () => {
  try {
    const deleteResult = await Tour.deleteMany();
    const deleteResult2 = await User.deleteMany();
    const deleteResult3 = await Review.deleteMany();
    console.log(
      `Successfully deleted ${
        deleteResult.deletedCount +
        deleteResult2.deletedCount +
        deleteResult3.deletedCount
      } documents`
    );
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
