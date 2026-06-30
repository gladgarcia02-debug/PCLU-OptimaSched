'use strict';

const ScheduleModel = require('../models/scheduleModel');
const SectionModel = require('../models/sectionModel');
const RoomModel = require('../models/roomModel');
const conflictService = require('../services/conflictService');
const { DAYS, toMinutes, toHHMM } = conflictService;

// The grid runs 07:00–19:00 in one-hour rows.
const GRID_START = 7;
const GRID_END = 19;

function buildGridRows() {
  const rows = [];
  for (let h = GRID_START; h < GRID_END; h += 1) {
    rows.push({ hour: h, label: `${String(h).padStart(2, '0')}:00` });
  }
  return rows;
}

/** Shape schedule rows into something the EJS grid can place by day/time. */
function toGridBlocks(schedules) {
  return schedules.map((s) => {
    const startMin = toMinutes(s.start_time);
    const endMin = toMinutes(s.end_time);
    return {
      ...s,
      startMin,
      endMin,
      // offset (in hours) from the top of the grid, and height in hours
      topHours: (startMin - GRID_START * 60) / 60,
      spanHours: (endMin - startMin) / 60,
      startLabel: toHHMM(startMin),
      endLabel: toHHMM(endMin),
    };
  });
}

async function formData() {
  const [sections, rooms] = await Promise.all([
    SectionModel.all(),
    RoomModel.all(),
  ]);
  return { sections, rooms };
}

const ScheduleController = {
  async index(req, res, next) {
    try {
      const schedules = await ScheduleModel.all();
      res.render('schedules/index', {
        title: 'Timetable',
        days: DAYS,
        gridRows: buildGridRows(),
        blocks: toGridBlocks(schedules),
        gridStart: GRID_START,
        gridEnd: GRID_END,
      });
    } catch (err) { next(err); }
  },

  async newForm(req, res, next) {
    try {
      const { sections, rooms } = await formData();
      res.render('schedules/form', {
        title: 'Add timetable block',
        sections, rooms, days: DAYS, schedule: null,
        conflicts: [], reasons: [], suggestions: [],
        action: '/schedules',
      });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const candidate = {
        section_id: req.body.section_id,
        room_id: req.body.room_id,
        day_of_week: Number(req.body.day_of_week),
        start_time: req.body.start_time,
        end_time: req.body.end_time,
      };

      // Guard: end must be after start.
      if (toMinutes(candidate.end_time) <= toMinutes(candidate.start_time)) {
        const { sections, rooms } = await formData();
        return res.status(422).render('schedules/form', {
          title: 'Add timetable block',
          sections, rooms, days: DAYS, schedule: req.body,
          conflicts: [], reasons: ['End time must be later than start time.'],
          suggestions: [], action: '/schedules',
        });
      }

      const verdict = await conflictService.classify(candidate);
      if (!verdict.ok) {
        const [{ sections, rooms }, suggestions] = await Promise.all([
          formData(),
          conflictService.suggestSlots({
            section_id: candidate.section_id,
            room_id: candidate.room_id,
            durationMin: toMinutes(candidate.end_time) - toMinutes(candidate.start_time),
          }),
        ]);
        return res.status(409).render('schedules/form', {
          title: 'Scheduling conflict',
          sections, rooms, days: DAYS, schedule: req.body,
          conflicts: verdict.conflicts, reasons: verdict.reasons,
          suggestions, action: '/schedules',
        });
      }

      await ScheduleModel.create({ ...candidate, created_by: req.session.user.id });
      req.flash('success', 'Timetable block added — no conflicts found.');
      res.redirect('/schedules');
    } catch (err) { next(err); }
  },

  async editForm(req, res, next) {
    try {
      const schedule = await ScheduleModel.findById(req.params.id);
      if (!schedule) { req.flash('error', 'Block not found.'); return res.redirect('/schedules'); }
      const { sections, rooms } = await formData();
      res.render('schedules/form', {
        title: 'Edit timetable block',
        sections, rooms, days: DAYS, schedule,
        conflicts: [], reasons: [], suggestions: [],
        action: `/schedules/${schedule.id}?_method=PUT`,
      });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const id = req.params.id;
      const candidate = {
        section_id: req.body.section_id,
        room_id: req.body.room_id,
        day_of_week: Number(req.body.day_of_week),
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        excludeId: Number(id),
      };

      if (toMinutes(candidate.end_time) <= toMinutes(candidate.start_time)) {
        const { sections, rooms } = await formData();
        return res.status(422).render('schedules/form', {
          title: 'Edit timetable block',
          sections, rooms, days: DAYS,
          schedule: { ...req.body, id },
          conflicts: [], reasons: ['End time must be later than start time.'],
          suggestions: [], action: `/schedules/${id}?_method=PUT`,
        });
      }

      const verdict = await conflictService.classify(candidate);
      if (!verdict.ok) {
        const [{ sections, rooms }, suggestions] = await Promise.all([
          formData(),
          conflictService.suggestSlots({
            section_id: candidate.section_id,
            room_id: candidate.room_id,
            durationMin: toMinutes(candidate.end_time) - toMinutes(candidate.start_time),
          }),
        ]);
        return res.status(409).render('schedules/form', {
          title: 'Scheduling conflict',
          sections, rooms, days: DAYS,
          schedule: { ...req.body, id },
          conflicts: verdict.conflicts, reasons: verdict.reasons,
          suggestions, action: `/schedules/${id}?_method=PUT`,
        });
      }

      await ScheduleModel.update(id, candidate);
      req.flash('success', 'Timetable block updated.');
      res.redirect('/schedules');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await ScheduleModel.remove(req.params.id);
      req.flash('success', 'Timetable block removed.');
      res.redirect('/schedules');
    } catch (err) { next(err); }
  },

  /**
   * JSON endpoint used by the form's "Check for conflicts" button (fetch).
   * Returns { ok, reasons, suggestions }.
   */
  async check(req, res, next) {
    try {
      const candidate = {
        section_id: req.body.section_id,
        room_id: req.body.room_id,
        day_of_week: Number(req.body.day_of_week),
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        excludeId: req.body.excludeId ? Number(req.body.excludeId) : undefined,
      };
      if (
        !candidate.section_id || !candidate.room_id ||
        !candidate.start_time || !candidate.end_time
      ) {
        return res.status(400).json({ ok: false, reasons: ['Please fill in every field first.'], suggestions: [] });
      }
      const verdict = await conflictService.classify(candidate);
      let suggestions = [];
      if (!verdict.ok) {
        suggestions = await conflictService.suggestSlots({
          section_id: candidate.section_id,
          room_id: candidate.room_id,
          durationMin: toMinutes(candidate.end_time) - toMinutes(candidate.start_time),
        });
      }
      res.json({ ok: verdict.ok, reasons: verdict.reasons, suggestions });
    } catch (err) { next(err); }
  },
};

module.exports = ScheduleController;
