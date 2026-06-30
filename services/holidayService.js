'use strict';

/**
 * holidayService — demonstrates outbound HTTP with axios.
 *
 * Pulls the current year's public holidays from the free Nager.Date API so
 * the dashboard can warn schedulers about non-teaching days. Results are
 * cached in memory for the day, and any network failure degrades quietly to
 * an empty list — scheduling must never break because an API is down.
 */

const axios = require('axios');

const COUNTRY = process.env.HOLIDAY_COUNTRY || 'PH';
const cache = new Map(); // key: `${country}-${year}` → { fetchedAt, data }
const ONE_DAY = 24 * 60 * 60 * 1000;

async function getHolidays(year = new Date().getFullYear()) {
  const key = `${COUNTRY}-${year}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < ONE_DAY) {
    return cached.data;
  }

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${COUNTRY}`;
    const { data } = await axios.get(url, { timeout: 4000 });
    const holidays = (Array.isArray(data) ? data : []).map((h) => ({
      date: h.date,
      name: h.localName || h.name,
    }));
    cache.set(key, { fetchedAt: Date.now(), data: holidays });
    return holidays;
  } catch (err) {
    console.warn(`[holidayService] lookup failed (${err.message}) — continuing without holidays.`);
    return [];
  }
}

/** Holidays from today onward, soonest first, capped at `limit`. */
async function getUpcoming(limit = 4) {
  const all = await getHolidays();
  const today = new Date().toISOString().slice(0, 10);
  return all
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

module.exports = { getHolidays, getUpcoming };
