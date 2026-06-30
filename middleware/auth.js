'use strict';

/**
 * Authentication & authorisation guards.
 *
 * `requireAuth`  — block anonymous users, remembering where they were headed.
 * `requireRole`  — restrict an action to certain roles (e.g. admin only).
 * `redirectIfAuth` — keep logged-in users away from the login/register pages.
 */

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please sign in to continue.');
  return res.redirect('/auth/login');
}

function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.session && req.session.user;
    if (!user) {
      req.flash('error', 'Please sign in to continue.');
      return res.redirect('/auth/login');
    }
    if (!roles.includes(user.role)) {
      req.flash('error', 'You do not have permission to do that.');
      return res.redirect('/dashboard');
    }
    return next();
  };
}

function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) return res.redirect('/dashboard');
  return next();
}

module.exports = { requireAuth, requireRole, redirectIfAuth };
