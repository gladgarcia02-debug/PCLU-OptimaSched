'use strict';

const { query } = require('../config/db');

const SectionModel = {
  async all() {
    const { rows } = await query(
      `SELECT s.*,
              c.code  AS course_code,
              c.title AS course_title,
              c.hours_per_week,
              i.full_name AS instructor_name
         FROM sections s
         JOIN courses c     ON c.id = s.course_id
         LEFT JOIN instructors i ON i.id = s.instructor_id
        ORDER BY s.school_year DESC, s.semester, c.code, s.section_name`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT s.*, c.code AS course_code, c.title AS course_title
         FROM sections s
         JOIN courses c ON c.id = s.course_id
        WHERE s.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ course_id, instructor_id, section_name, semester, school_year }) {
    const { rows } = await query(
      `INSERT INTO sections (course_id, instructor_id, section_name, semester, school_year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [course_id, instructor_id || null, section_name, semester || '1st', school_year || '2025-2026']
    );
    return rows[0];
  },

  async update(id, { course_id, instructor_id, section_name, semester, school_year }) {
    const { rows } = await query(
      `UPDATE sections
          SET course_id = $1, instructor_id = $2, section_name = $3,
              semester = $4, school_year = $5
        WHERE id = $6 RETURNING *`,
      [course_id, instructor_id || null, section_name, semester || '1st', school_year || '2025-2026', id]
    );
    return rows[0];
  },

  async remove(id) {
    await query('DELETE FROM sections WHERE id = $1', [id]);
  },

  async count() {
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM sections');
    return rows[0].n;
  },
};

module.exports = SectionModel;
