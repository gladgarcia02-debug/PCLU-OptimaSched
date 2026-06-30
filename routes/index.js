'use strict';

/**
 * Mounts every feature router under its base path and wires the root
 * redirect. Keeping this in one file means server.js stays tiny.
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect(req.session.user ? '/dashboard' : '/auth/login');
});

router.use('/auth', require('./authRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/instructors', require('./instructorRoutes'));
router.use('/rooms', require('./roomRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/sections', require('./sectionRoutes'));
router.use('/schedules', require('./scheduleRoutes'));

module.exports = router;
