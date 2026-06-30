'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const morgan = require('morgan');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const { pool } = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── View engine ────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.locals.appName = 'PCLU OptimaSched';
app.locals.currentUser = null;

// ── Core middleware ────────────────────────────────────────
if (!IS_PROD) app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method')); // lets HTML forms send PUT/DELETE
app.use(express.static(path.join(__dirname, 'public')));

// ── Sessions (stored in PostgreSQL) ────────────────────────
app.set('trust proxy', 1);
app.use(
  session({
    store: new PgSession({ pool, tableName: 'session', createTableIfMissing: false }),
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'insecure-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: IS_PROD,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);
app.use(flash());

// ── Locals available to every view ─────────────────────────
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// ── Routes ─────────────────────────────────────────────────
app.use('/', routes);

// ── Errors ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Boot ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  PCLU OptimaSched running → http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
