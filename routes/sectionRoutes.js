'use strict';

const express = require('express');
const c = require('../controllers/sectionController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', c.index);
router.get('/new', c.newForm);
router.post('/', c.create);
router.get('/:id/edit', c.editForm);
router.put('/:id', c.update);
router.delete('/:id', requireRole('admin', 'scheduler'), c.remove);

module.exports = router;
