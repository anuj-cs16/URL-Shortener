/**
 * @file       errorHandler.js
 * @description Global error and 404 route handling middleware for the Express application.
 * @module     middleware/errorHandler
 */

'use strict';

/**
 * Middleware to catch unmatched routes and raise a 404 error.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handling middleware.
 * Formats errors and returns standardized JSON responses.
 * @param {Object} err - Error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log error with timestamp
  console.error(`[${new Date().toISOString()}] [Error ${statusCode}]: ${err.message}`);
  
  // Standardize error message for security: do not expose stack trace or database logs
  let responseMessage = 'Something went wrong';
  if (statusCode === 404) {
    responseMessage = 'The requested resource could not be found';
  } else if (err.exposeMessage || statusCode === 400 || statusCode === 410) {
    responseMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
