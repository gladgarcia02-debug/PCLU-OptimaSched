'use strict';

const { query } = require('../config/db');

const UserModel = {
  async create({ full_name, email, password_hash, role = 'scheduler' }) {
    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, password_hash, role]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT id, full_name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async count() {
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM users');
    return rows[0].n;
  },
};

module.exports = UserModel;
