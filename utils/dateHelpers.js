/**
 * Calendar math utilities for attendance manager.
 */

/**
 * Returns "YYYY-MM-DD" string for a Date object.
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a "YYYY-MM-DD" string into a Date (local timezone).
 */
export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Check if a Date falls on a weekend (Only Sunday now).
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 0; // 0 = Sunday
}

/**
 * Fetch national holidays.
 * Uses Nager.Date API, with a static fallback for India (IN) since the API lacks India data.
 * Returns an array of "YYYY-MM-DD" date strings.
 */
export async function fetchNationalHolidays(year, countryCode = 'IN') {
  try {
    if (countryCode === 'IN') {
      return [
        `${year}-01-26`, // Republic Day
        `${year}-08-15`, // Independence Day
        `${year}-10-02`, // Gandhi Jayanti
        `${year}-12-25`, // Christmas
        ...(year === 2026 ? [
          '2026-03-03', // Holi
          '2026-03-20', // Eid al-Fitr
          '2026-11-08', // Diwali
        ] : [])
      ];
    }

    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
    if (!response.ok || response.status === 204) return [];
    
    const text = await response.text();
    if (!text) return [];
    
    const data = JSON.parse(text);
    return data.map((holiday) => holiday.date);
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return [];
  }
}

/**
 * Get the number of days in a given month (0-indexed month).
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Generate an array of day objects for a calendar grid.
 * Includes leading days from the previous month and trailing days
 * from the next month so the grid always starts on Sunday.
 *
 * Each object: { date: Date, dateKey: string, isCurrentMonth: boolean }
 */
export function getCalendarDays(year, month) {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 0=Sun, 1=Mon... we want Monday=0, Sunday=6
  let startDayOfWeek = firstDay.getDay(); 
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Leading days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      date: d,
      dateKey: formatDateKey(d),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      dateKey: formatDateKey(date),
      isCurrentMonth: true,
    });
  }

  // Trailing days to fill the last week
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

/**
 * Calculate working days for a month.
 * Working days = total days in month - weekends - holidays (that fall on weekdays).
 */
export function getWorkingDays(year, month, holidays = new Set()) {
  const totalDays = getDaysInMonth(year, month);
  let working = 0;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const key = formatDateKey(date);
    if (!isWeekend(date) && !holidays.has(key)) {
      working++;
    }
  }

  return working;
}

/**
 * Get all working-day date keys for a month.
 */
export function getWorkingDateKeys(year, month, holidays = new Set()) {
  const totalDays = getDaysInMonth(year, month);
  const keys = [];

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const key = formatDateKey(date);
    if (!isWeekend(date) && !holidays.has(key)) {
      keys.push(key);
    }
  }

  return keys;
}

/**
 * Month names for display.
 */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Short day names for calendar header.
 */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
