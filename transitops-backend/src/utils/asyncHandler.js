'use strict';

/**
 * Wraps an async route handler so that any thrown error
 * is passed to Express's next() error middleware, preventing
 * unhandled promise rejections from hanging the request.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
