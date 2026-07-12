'use strict';

/**
 * Custom application error with HTTP status code.
 * Thrown from controllers/services and caught by errorHandler middleware.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || this._codeFromStatus(statusCode);
    this.isOperational = true; // Distinguishes from unexpected programming errors
    Error.captureStackTrace(this, this.constructor);
  }

  _codeFromStatus(status) {
    const map = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      500: 'INTERNAL_ERROR',
    };
    return map[status] || 'INTERNAL_ERROR';
  }
}

module.exports = AppError;
