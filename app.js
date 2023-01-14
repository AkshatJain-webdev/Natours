const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Importing routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const tourRoute = '/api/v1/tours';
const userRoute = '/api/v1/users';
const reviewRoute = '/api/v1/reviews';
const bookingRoute = '/api/v1/bookings';

// GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      frameSrc: ['https://js.stripe.com/', "'self'"],
      connectSrc: [
        "'self'",
        'https://unpkg.com',
        'https://tile.openstreetmap.org',
        'ws:',
        'https://js.stripe.com/v3/',
      ],
      scriptSrc: [
        "'self'",
        'https://unpkg.com',
        'https://tile.openstreetmap.org',
        'ws:',
        'https://js.stripe.com/v3/',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://unpkg.com/',
        'https://tile.openstreetmap.org',
        'https://fonts.googleapis.com/',
        'ws:',
        'https://js.stripe.com/v3/',
      ],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
    },
  })
);

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log('development');
} else console.log('production');

// limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, basically it is reading data from the body to req.body
app.use(express.json({ limit: '10KB' }));
// urlencoded is used to parse data coming from an url encoded form (form submitted using actions and method attributes of form element)
app.use(express.urlencoded({ extended: true, limit: '10KB' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS(Cross-site scripting attacks)
// This will remove any JS code that is being sent with th HTML code from the frontend by converting the HTML code
app.use(xss());

// Prevent parameter pollution - basically if a field is used twice in req.query then this middleware will clear up the query string
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
// By whitlisting some of the fields, we allow them to be used twice in the query string.
// Some fields like sort will produce error if not sanatized while others like price will work even if we use them twice in query string.

// Serving static fles
// The url for opening the files in public folder will actully be localhost:3000/filename.extension
// The public folder will actually be set as root
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// API ENDPOINTS OR ROUTES

// We can render pug templates at different routes like this. The second argument of render is the data that will be available in the pug page
app.use('/', viewRouter);

app.use(tourRoute, tourRouter);
app.use(userRoute, userRouter);
app.use(reviewRoute, reviewRouter);
app.use(bookingRoute, bookingRouter);

// This will handle all the routes that we have not defined thus far. .all will handle all types of HTTP requests (get, post, patch, etc)
app.all('*', (req, res, next) => {
  // Creating a synthetic error to test our error handling middlewares
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404)); // When an argument is passed inside next it is assumed to be an erorr and all middlewares inbetween the error handler and this middleware will be skipped
});

// Check errorController
app.use(globalErrorHandler);

module.exports = app;
