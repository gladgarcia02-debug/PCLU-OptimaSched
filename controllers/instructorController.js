'use strict';

const InstructorModel = require('../models/instructorModel');
const DepartmentModel = require('../models/departmentModel');

const InstructorController = {
  async index(req, res, next) {
    try {
      const instructors = await InstructorModel.all();
      res.render('instructors/index', { title: 'Instructors', instructors });
    } catch (err) { next(err); }
  },

  async newForm(req, res, next) {
    try {
      const departments = await DepartmentModel.all();
      res.render('instructors/form', {
        title: 'Add instructor', departments, instructor: null, action: '/instructors',
      });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      await InstructorModel.create(req.body);
      req.flash('success', 'Instructor added.');
      res.redirect('/instructors');
    } catch (err) { next(err); }
  },

  async editForm(req, res, next) {
    try {
      const [instructor, departments] = await Promise.all([
        InstructorModel.findById(req.params.id),
        DepartmentModel.all(),
      ]);
      if (!instructor) { req.flash('error', 'Instructor not found.'); return res.redirect('/instructors'); }
      res.render('instructors/form', {
        title: 'Edit instructor', departments, instructor,
        action: `/instructors/${instructor.id}?_method=PUT`,
      });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      await InstructorModel.update(req.params.id, req.body);
      req.flash('success', 'Instructor updated.');
      res.redirect('/instructors');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await InstructorModel.remove(req.params.id);
      req.flash('success', 'Instructor removed.');
      res.redirect('/instructors');
    } catch (err) { next(err); }
  },
};

module.exports = InstructorController;
