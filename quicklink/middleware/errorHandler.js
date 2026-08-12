/**
 * @file       errorHandler.js
 * @description Global error and 404 route handling middleware for the Express application.
 * @module     middleware/errorHandler
 */

'use strict';

const path = require('path');

/**
 * Middleware to catch unmatched routes and raise a 404 error.
 * Serves HTML 404 page for browser requests, JSON for API clients.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
const notFound = (req, res, next) => {
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  if (acceptsHtml) {
    return res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
  }
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
  let statusCode = err.statusCode || 500;
  let message = err.message;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Handle Mongoose duplicate key errors (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Log error with timestamp
  console.error(`[${new Date().toISOString()}] [Error ${statusCode}]: ${err.message}`);
  
  // Standardize error message for security: do not expose stack trace or database logs
  let responseMessage = 'Something went wrong';
  if (statusCode === 404) {
    responseMessage = 'The requested resource could not be found';
  } else if (err.exposeMessage || statusCode === 400 || statusCode === 410) {
    responseMessage = message;
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
