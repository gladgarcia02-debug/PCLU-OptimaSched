'use strict';

/** 404 — no route matched. */
function notFound(req, res) {
  res.status(404).render('error', {
    title: 'Not found',
    status: 404,
    message: `We couldn't find ${req.originalUrl}.`,
  });
}

/** Centralised error handler. Keep stack traces out of production responses. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err.stack || err.message);
  const status = err.status || 500;
  res.status(status).render('error', {
    title: 'Something went wrong',
    status,
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred. Please try again.',
  });
}

module.exports = { notFound, errorHandler };
