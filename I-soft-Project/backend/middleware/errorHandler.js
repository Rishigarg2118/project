/**
 * Global Error Handler Middleware
 * Single place for all unhandled errors in the Express pipeline.
 * Students learn: Centralised error handling pattern.
 */
import logger from '../config/logger.js';

// 404 handler — for unknown routes
export const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found — ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Main error handler
export const errorHandler = (err, req, res, next) => {
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Log every server-side error
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${statusCode}: ${err.message}`);
  }

  // Normalise Joi validation errors
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(422).json({
      error: 'Validation Error',
      details: err.details?.map(d => d.message) || [err.message],
    });
  }

  // Normalise JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Normalise PostgreSQL constraint errors
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry — record already exists', detail: err.detail });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Foreign key violation — referenced record not found', detail: err.detail });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  let responseMessage = err.message || 'Internal Server Error';
  if (isProduction && statusCode >= 500) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) {
      responseMessage = 'Database connection failed. Please verify DATABASE_URL on Render.';
    } else if (err.code === '42P01') {
      responseMessage = 'Database table not found. Auto-initialization is initializing tables, please retry in a few seconds.';
    } else if (err.code === '28P01' || err.message?.includes('password authentication failed')) {
      responseMessage = 'Database authentication failed. Please check DATABASE_URL credentials on Render.';
    } else {
      responseMessage = 'Internal Server Error';
    }
  }

  res.status(statusCode).json({
    error: responseMessage,
    ...(!isProduction && { stack: err.stack }),
  });
};
