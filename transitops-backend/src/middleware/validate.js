'use strict';

const { z } = require('zod');
const AppError = require('../utils/AppError');

/**
 * validate(schema) — Zod validation middleware for req.body.
 * Returns 422 with field-level errors if validation fails.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(
      new AppError('Validation failed. Please check your input.', 422, 'VALIDATION_ERROR')
    );
  }
  req.validatedBody = result.data;
  next();
};

/**
 * validateQuery(schema) — Zod validation for req.query params.
 */
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return next(new AppError('Invalid query parameters.', 400, 'BAD_REQUEST'));
  }
  req.validatedQuery = result.data;
  next();
};

module.exports = { validate, validateQuery };
