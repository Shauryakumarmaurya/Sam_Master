'use client';

import { useApp } from './AppProvider';
import { parseDateKey, isWeekend } from '@/utils/dateHelpers';

export default function AttendanceSheet() {
  const { students, attendance, selectedDate, holidays, setShowAttendance, toggleHoliday } = useApp();

  if (!selectedDate) {
    return (
      <div className="card p-5">
        <div className="flex flex-col items-center py-10 text-center">
          <svg className="mb-2 h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <p className="text-sm text-gray-500">Select a date on the calendar</p>
          <p className="mt-1 text-xs text-gray-400">to start marking attendance</p>
        </div>
      </div>
    );
  }

  const date = parseDateKey(selectedDate);
  const weekend = isWeekend(date);
  const isHoliday = holidays.has(selectedDate);
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  if (weekend || isHoliday) {
    return (
      <div className="card p-5">
        <div className="flex flex-col items-center py-10 text-center">
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${isHoliday ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
            {isHoliday ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium text-gray-800">{dateLabel}</p>
          <p className="mt-1 mb-4 text-xs text-gray-400">
            {isHoliday ? 'This day is marked as a holiday' : 'Weekend — no attendance required'}
          </p>
          
          {isHoliday && (
            <button
              onClick={() => toggleHoliday(selectedDate)}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 shadow-sm"
            >
              Remove Holiday
            </button>
          )}
        </div>
      </div>
    );
  }

  const dateAttendance = attendance[selectedDate] || {};
  const presentCount = students.filter((s) => dateAttendance[s.id] === 'present').length;
  const absentCount = students.filter((s) => dateAttendance[s.id] === 'absent').length;
  const unmarked = students.length - presentCount - absentCount;

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Daily Attendance</h2>
        <p className="text-xs text-gray-400">{dateLabel}</p>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-green-700">{presentCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-green-600/60">Present</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-red-600">{absentCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-red-500/60">Absent</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-gray-500">{unmarked}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Unmarked</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 sm:mt-2 flex flex-col sm:flex-row gap-3">
        <button
          id="btn-open-attendance"
          onClick={() => setShowAttendance(true)}
          className="flex-1 rounded-md bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 shadow-sm"
        >
          Open Attendance List
        </button>
        <button
          onClick={() => toggleHoliday(selectedDate)}
          className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 shadow-sm whitespace-nowrap"
        >
          Mark as Holiday
        </button>
      </div>
    </div>
  );
}
