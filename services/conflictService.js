'use strict';

/**
 * conflictService — the scheduling intelligence behind OptimaSched.
 *
 * Two jobs:
 *   1. classify()      explain WHY a candidate block clashes (room / section /
 *                      instructor), so the UI can give an actionable message.
 *   2. suggestSlots()  given a section + room, propose the earliest clash-free
 *                      blocks in the working week — the "optimise" helper.
 */

const ScheduleModel = require('../models/scheduleModel');
const SectionModel = require('../models/sectionModel');

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const WORK_START = 7 * 60; // 07:00 in minutes
const WORK_END = 19 * 60; // 19:00 in minutes
const STEP = 30; // 30-minute granularity

/** "08:30" / "08:30:00" → minutes since midnight */
function toMinutes(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
}

/** minutes since midnight → "08:30" */
function toHHMM(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Inspect a candidate block and return a structured verdict.
 * @returns {Promise<{ ok: boolean, conflicts: Array, reasons: string[] }>}
 */
async function classify(candidate) {
  const section = await SectionModel.findById(candidate.section_id);
  const instructorId = section ? section.instructor_id : null;

  const conflicts = await ScheduleModel.findConflicts({
    section_id: candidate.section_id,
    room_id: candidate.room_id,
    instructor_id: instructorId,
    day_of_week: candidate.day_of_week,
    start_time: candidate.start_time,
    end_time: candidate.end_time,
    excludeId: candidate.excludeId,
  });

  const reasons = [];
  for (const c of conflicts) {
    if (String(c.room_id) === String(candidate.room_id)) {
      reasons.push(
        `Room ${c.room_name} is already taken by ${c.course_code} (${c.section_name}) ` +
          `${toHHMM(toMinutes(c.start_time))}–${toHHMM(toMinutes(c.end_time))}.`
      );
    }
    if (String(c.section_id) === String(candidate.section_id)) {
      reasons.push(
        `Section already has ${c.course_code} scheduled in this time block.`
      );
    }
    if (instructorId && String(c.instructor_id) === String(instructorId)) {
      reasons.push(
        `${c.instructor_name} is already teaching ${c.course_code} (${c.section_name}) then.`
      );
    }
  }

  return {
    ok: conflicts.length === 0,
    conflicts,
    reasons: [...new Set(reasons)], // de-duplicate
  };
}

/**
 * Propose up to `limit` clash-free blocks of `durationMin` minutes for a
 * section/room pair, scanning the working week earliest-first.
 */
async function suggestSlots({ section_id, room_id, durationMin = 90, limit = 5 }) {
  const suggestions = [];

  for (const day of DAYS) {
    for (let start = WORK_START; start + durationMin <= WORK_END; start += STEP) {
      const end = start + durationMin;
      const verdict = await classify({
        section_id,
        room_id,
        day_of_week: day.value,
        start_time: toHHMM(start),
        end_time: toHHMM(end),
      });
      if (verdict.ok) {
        suggestions.push({
          day_of_week: day.value,
          day_label: day.label,
          start_time: toHHMM(start),
          end_time: toHHMM(end),
        });
        break; // one suggestion per day keeps the list spread out
      }
    }
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}

module.exports = { classify, suggestSlots, toMinutes, toHHMM, DAYS };
