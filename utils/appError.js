class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor); //When a new object is created and the constructor is called, then the function call is not gonna appear in the stack trace and will not pollute it.
  }
}

module.exports = AppError;
