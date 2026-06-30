'use strict';

const RoomModel = require('../models/roomModel');

const ROOM_TYPES = ['lecture', 'laboratory', 'auditorium', 'online'];

const RoomController = {
  async index(req, res, next) {
    try {
      const rooms = await RoomModel.all();
      res.render('rooms/index', { title: 'Rooms', rooms });
    } catch (err) { next(err); }
  },

  newForm(req, res) {
    res.render('rooms/form', { title: 'Add room', room: null, roomTypes: ROOM_TYPES, action: '/rooms' });
  },

  async create(req, res, next) {
    try {
      await RoomModel.create(req.body);
      req.flash('success', 'Room added.');
      res.redirect('/rooms');
    } catch (err) { next(err); }
  },

  async editForm(req, res, next) {
    try {
      const room = await RoomModel.findById(req.params.id);
      if (!room) { req.flash('error', 'Room not found.'); return res.redirect('/rooms'); }
      res.render('rooms/form', {
        title: 'Edit room', room, roomTypes: ROOM_TYPES,
        action: `/rooms/${room.id}?_method=PUT`,
      });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      await RoomModel.update(req.params.id, req.body);
      req.flash('success', 'Room updated.');
      res.redirect('/rooms');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await RoomModel.remove(req.params.id);
      req.flash('success', 'Room removed.');
      res.redirect('/rooms');
    } catch (err) { next(err); }
  },
};

module.exports = RoomController;
