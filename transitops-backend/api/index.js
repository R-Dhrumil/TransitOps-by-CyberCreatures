'use strict';
/**
 * Vercel Serverless Function entry point.
 * Exports the Express app — no app.listen() here.
 * The vercel.json rewrite routes all /api/* requests here.
 */
require('dotenv').config();
const app = require('../src/app');

module.exports = app;
