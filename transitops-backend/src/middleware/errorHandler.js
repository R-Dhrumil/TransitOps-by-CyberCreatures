'use strict';

const AppError = require('../utils/AppError');

/**
 * Maps raw Postgres error codes to friendly AppError instances.
 * Call this in the catch block of any DB operation.
 */
const mapDbError = (err) => {
  // Unique constraint violation (e.g. duplicate registration_number)
  if (err.code === '23505') {
    const detail = err.detail || '';
    const field = detail.match(/\((.+?)\)/)?.[1] || 'field';
    return new AppError(`A record with this ${field} already exists.`, 409, 'DUPLICATE_ENTRY');
  }
  // Foreign key violation
  if (err.code === '23503') {
    return new AppError('Referenced record does not exist.', 400, 'INVALID_REFERENCE');
  }
  // Not null violation
  if (err.code === '23502') {
    return new AppError(`Required field missing: ${err.column}`, 400, 'MISSING_FIELD');
  }
  // Check constraint violation
  if (err.code === '23514') {
    return new AppError('Value violates a data constraint.', 400, 'CONSTRAINT_VIOLATION');
  }
  // Invalid enum value
  if (err.code === '22P02') {
    return new AppError('Invalid value provided.', 400, 'INVALID_VALUE');
  }
  return null; // Unknown DB error — let errorHandler handle it
};

/**
 * Central error handling middleware.
 * Must be the LAST middleware registered in app.js.
 */
const errorHandler = (err, req, res, next) => {
  // Map known Postgres errors
  const dbMapped = mapDbError(err);
  if (dbMapped) {
    return res.status(dbMapped.statusCode).json({
      success: false,
      error: { code: dbMapped.code, message: dbMapped.message },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or malformed token.' },
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Your session has expired. Please log in again.' },
    });
  }

  // Operational errors (AppError instances thrown intentionally)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  // Unexpected / programming errors — do NOT leak details
  console.error('[ERROR]', err.stack || err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.' },
  });
};

/**
 * 404 handler — registered before errorHandler.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found.` },
  });
};

module.exports = { errorHandler, notFoundHandler };
