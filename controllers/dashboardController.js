'use strict';

const InstructorModel = require('../models/instructorModel');
const RoomModel = require('../models/roomModel');
const CourseModel = require('../models/courseModel');
const SectionModel = require('../models/sectionModel');
const ScheduleModel = require('../models/scheduleModel');
const holidayService = require('../services/holidayService');
const { DAYS } = require('../services/conflictService');

const DashboardController = {
  async index(req, res, next) {
    try {
      const [instructors, rooms, courses, sections, schedules, holidays] =
        await Promise.all([
          InstructorModel.count(),
          RoomModel.count(),
          CourseModel.count(),
          SectionModel.count(),
          ScheduleModel.all(),
          holidayService.getUpcoming(4),
        ]);

      // Blocks scheduled per weekday → small distribution bar on the dashboard.
      const perDay = DAYS.map((d) => ({
        label: d.label.slice(0, 3),
        count: schedules.filter((s) => s.day_of_week === d.value).length,
      }));
      const busiest = perDay.reduce(
        (max, d) => (d.count > max.count ? d : max),
        { label: '—', count: 0 }
      );

      res.render('dashboard', {
        title: 'Dashboard',
        stats: {
          instructors,
          rooms,
          courses,
          sections,
          schedules: schedules.length,
        },
        perDay,
        busiest,
        recent: schedules.slice(0, 6),
        holidays,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = DashboardController;
