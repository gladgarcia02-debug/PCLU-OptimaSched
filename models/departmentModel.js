'use strict';

const { query } = require('../config/db');

const DepartmentModel = {
  async all() {
    const { rows } = await query('SELECT * FROM departments ORDER BY code');
    return rows;
  },
  async findById(id) {
    const { rows } = await query('SELECT * FROM departments WHERE id = $1', [id]);
    return rows[0] || null;
  },
};

module.exports = DepartmentModel;
