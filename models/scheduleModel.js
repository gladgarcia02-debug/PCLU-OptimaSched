'use strict';

const { query } = require('../config/db');

/**
 * Joined projection used by every list / grid view. Keeping the SELECT in
 * one place means the timetable, the section view and the room view all
 * read the same shape of row.
 */
const SELECT_FULL = `
  SELECT sch.*,
         sec.section_name,
         sec.semester,
         sec.school_year,
         c.code  AS course_code,
         c.title AS course_title,
         r.name  AS room_name,
         r.building,
         i.id    AS instructor_id,
         i.full_name AS instructor_name
    FROM schedules sch
    JOIN sections   sec ON sec.id = sch.section_id
    JOIN courses    c   ON c.id   = sec.course_id
    JOIN rooms      r   ON r.id   = sch.room_id
    LEFT JOIN instructors i ON i.id = sec.instructor_id
`;

const ScheduleModel = {
  async all() {
    const { rows } = await query(
      `${SELECT_FULL} ORDER BY sch.day_of_week, sch.start_time`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`${SELECT_FULL} WHERE sch.id = $1`, [id]);
    return rows[0] || null;
  },

  async create({ section_id, room_id, day_of_week, start_time, end_time, created_by }) {
    const { rows } = await query(
      `INSERT INTO schedules (section_id, room_id, day_of_week, start_time, end_time, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [section_id, room_id, day_of_week, start_time, end_time, created_by || null]
    );
    return rows[0];
  },

  async update(id, { section_id, room_id, day_of_week, start_time, end_time }) {
    const { rows } = await query(
      `UPDATE schedules
          SET section_id = $1, room_id = $2, day_of_week = $3,
              start_time = $4, end_time = $5
        WHERE id = $6 RETURNING *`,
      [section_id, room_id, day_of_week, start_time, end_time, id]
    );
    return rows[0];
  },

  async remove(id) {
    await query('DELETE FROM schedules WHERE id = $1', [id]);
  },

  async count() {
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM schedules');
    return rows[0].n;
  },

  /**
   * Rows that overlap a candidate block on the same day, sharing EITHER the
   * same room OR the same section OR the same instructor. This is the heart
   * of clash detection. `excludeId` lets edits ignore their own row.
   *
   * Overlap test: existing.start < candidate.end AND existing.end > candidate.start
   */
  async findConflicts({ section_id, room_id, instructor_id, day_of_week, start_time, end_time, excludeId }) {
    const { rows } = await query(
      `${SELECT_FULL}
        WHERE sch.day_of_week = $1
          AND sch.start_time < $3
          AND sch.end_time   > $2
          AND ($6::int IS NULL OR sch.id <> $6)
          AND (
                sch.room_id = $4
             OR sch.section_id = $5
             OR ($7::int IS NOT NULL AND i.id = $7)
              )
        ORDER BY sch.start_time`,
      [day_of_week, start_time, end_time, room_id, section_id, excludeId || null, instructor_id || null]
    );
    return rows;
  },
};

module.exports = ScheduleModel;
