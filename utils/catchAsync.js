// This function is meant to reduce the necessity of a catch block in all our handlers
module.exports =
  (fn) =>
  // We must return a function instead of returning a value so that createTour will run a function instead of returning a value when the route is hit
  (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
