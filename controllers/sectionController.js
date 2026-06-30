'use strict';

const SectionModel = require('../models/sectionModel');
const CourseModel = require('../models/courseModel');
const InstructorModel = require('../models/instructorModel');

async function formData() {
  const [courses, instructors] = await Promise.all([
    CourseModel.all(),
    InstructorModel.all(),
  ]);
  return { courses, instructors };
}

const SectionController = {
  async index(req, res, next) {
    try {
      const sections = await SectionModel.all();
      res.render('sections/index', { title: 'Sections', sections });
    } catch (err) { next(err); }
  },

  async newForm(req, res, next) {
    try {
      const { courses, instructors } = await formData();
      res.render('sections/form', {
        title: 'Add section', courses, instructors, section: null, action: '/sections',
      });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      await SectionModel.create(req.body);
      req.flash('success', 'Section added.');
      res.redirect('/sections');
    } catch (err) { next(err); }
  },

  async editForm(req, res, next) {
    try {
      const section = await SectionModel.findById(req.params.id);
      if (!section) { req.flash('error', 'Section not found.'); return res.redirect('/sections'); }
      const { courses, instructors } = await formData();
      res.render('sections/form', {
        title: 'Edit section', courses, instructors, section,
        action: `/sections/${section.id}?_method=PUT`,
      });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      await SectionModel.update(req.params.id, req.body);
      req.flash('success', 'Section updated.');
      res.redirect('/sections');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await SectionModel.remove(req.params.id);
      req.flash('success', 'Section removed.');
      res.redirect('/sections');
    } catch (err) { next(err); }
  },
};

module.exports = SectionController;
