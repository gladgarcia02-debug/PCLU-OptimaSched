'use strict';

const { query } = require('../config/db');

const CourseModel = {
  async all() {
    const { rows } = await query(
      `SELECT c.*, d.code AS department_code
         FROM courses c
         LEFT JOIN departments d ON d.id = c.department_id
        ORDER BY c.code`
    );
    return rows;
  },
  async findById(id) {
    const { rows } = await query('SELECT * FROM courses WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async create({ code, title, units, department_id, hours_per_week, expected_students }) {
    const { rows } = await query(
      `INSERT INTO courses (code, title, units, department_id, hours_per_week, expected_students)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code, title, units || 3, department_id || null, hours_per_week || 3, expected_students || 40]
    );
    return rows[0];
  },
  async update(id, { code, title, units, department_id, hours_per_week, expected_students }) {
    const { rows } = await query(
      `UPDATE courses
          SET code = $1, title = $2, units = $3, department_id = $4,
              hours_per_week = $5, expected_students = $6
        WHERE id = $7 RETURNING *`,
      [code, title, units || 3, department_id || null, hours_per_week || 3, expected_students || 40, id]
    );
    return rows[0];
  },
  async remove(id) {
    await query('DELETE FROM courses WHERE id = $1', [id]);
  },
  async count() {
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM courses');
    return rows[0].n;
  },
};

module.exports = CourseModel;
