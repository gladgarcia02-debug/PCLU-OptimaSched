'use strict';

const { query } = require('../config/db');

const InstructorModel = {
  async all() {
    const { rows } = await query(
      `SELECT i.*, d.code AS department_code, d.name AS department_name
         FROM instructors i
         LEFT JOIN departments d ON d.id = i.department_id
        ORDER BY i.full_name`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM instructors WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create({ full_name, email, department_id, max_hours_per_week }) {
    const { rows } = await query(
      `INSERT INTO instructors (full_name, email, department_id, max_hours_per_week)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [full_name, email || null, department_id || null, max_hours_per_week || 24]
    );
    return rows[0];
  },

  async update(id, { full_name, email, department_id, max_hours_per_week }) {
    const { rows } = await query(
      `UPDATE instructors
          SET full_name = $1, email = $2, department_id = $3, max_hours_per_week = $4
        WHERE id = $5 RETURNING *`,
      [full_name, email || null, department_id || null, max_hours_per_week || 24, id]
    );
    return rows[0];
  },

  async remove(id) {
    await query('DELETE FROM instructors WHERE id = $1', [id]);
  },

  async count() {
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM instructors');
    return rows[0].n;
  },
};

module.exports = InstructorModel;
