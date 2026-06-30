'use strict';

const CourseModel = require('../models/courseModel');
const DepartmentModel = require('../models/departmentModel');

const CourseController = {
  async index(req, res, next) {
    try {
      const courses = await CourseModel.all();
      res.render('courses/index', { title: 'Courses', courses });
    } catch (err) { next(err); }
  },

  async newForm(req, res, next) {
    try {
      const departments = await DepartmentModel.all();
      res.render('courses/form', { title: 'Add course', departments, course: null, action: '/courses' });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      await CourseModel.create(req.body);
      req.flash('success', 'Course added.');
      res.redirect('/courses');
    } catch (err) { next(err); }
  },

  async editForm(req, res, next) {
    try {
      const [course, departments] = await Promise.all([
        CourseModel.findById(req.params.id),
        DepartmentModel.all(),
      ]);
      if (!course) { req.flash('error', 'Course not found.'); return res.redirect('/courses'); }
      res.render('courses/form', {
        title: 'Edit course', departments, course,
        action: `/courses/${course.id}?_method=PUT`,
      });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      await CourseModel.update(req.params.id, req.body);
      req.flash('success', 'Course updated.');
      res.redirect('/courses');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await CourseModel.remove(req.params.id);
      req.flash('success', 'Course removed.');
      res.redirect('/courses');
    } catch (err) { next(err); }
  },
};

module.exports = CourseController;
