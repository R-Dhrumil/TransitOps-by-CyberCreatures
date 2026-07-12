'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const pool = require('../db/pool');

/**
 * authenticate — verifies JWT from Authorization header.
 * On success, attaches req.user = { id, email, role, full_name }.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token.', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally fetch fresh user data to catch revocations / role changes
    const { rows } = await pool.query(
      'SELECT id, email, full_name, role FROM users WHERE id = $1',
      [decoded.id]
    );
    if (rows.length === 0) {
      throw new AppError('User not found.', 401, 'USER_NOT_FOUND');
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireRole(...roles) — RBAC guard.
 * Use after authenticate middleware.
 *
 * Example:
 *   router.post('/vehicles', authenticate, requireRole('fleet_manager'), controller);
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'MISSING_TOKEN'));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError(
      `Access denied. Required role: ${roles.join(' or ')}.`,
      403,
      'FORBIDDEN'
    ));
  }
  next();
};

module.exports = { authenticate, requireRole };
