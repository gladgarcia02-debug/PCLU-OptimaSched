'use strict';

const { query } = require('../config/db');

const RoomModel = {
  async all() {
    const { rows } = await query('SELECT * FROM rooms ORDER BY name');
    return rows;
  },
  async findById(id) {
    const { rows } = await query('SELECT * FROM rooms WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async create({ name, building, capacity, room_type }) {
    const { rows } = await query(
      `INSERT INTO rooms (name, building, capacity, room_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, building || null, capacity || 40, room_type || 'lecture']
    );
    return rows[0];
  },
  async update(id, { name, building, capacity, room_type }) {
    const { rows } = await query(
      `UPDATE rooms SET name = $1, building = $2, capacity = $3, room_type = $4
        WHERE id = $5 RETURNING *`,
      [name, building || null, capacity || 40, room_type || 'lecture', id]
    );
    return rows[0];
  },
  async remove(id) {
    await query('DELETE FROM rooms WHERE id = $1', [id]);
  },
  async count() {
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM rooms');
    return rows[0].n;
  },
};

module.exports = RoomModel;
