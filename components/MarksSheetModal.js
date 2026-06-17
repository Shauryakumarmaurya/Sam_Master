'use client';

import { useCallback } from 'react';
import { useApp } from './AppProvider';
import { parseDateKey, DAY_NAMES, MONTH_NAMES } from '@/utils/dateHelpers';
import { useModalHistory } from '@/hooks/useModalHistory';

export default function MarksSheetModal() {
  const {
    showMarksSheet,
    setShowMarksSheet,
    selectedDate,
    students,
    marks,
    setMark,
  } = useApp();

  const closeMarksSheet = useCallback(() => setShowMarksSheet(false), [setShowMarksSheet]);
  useModalHistory(closeMarksSheet);

  if (!showMarksSheet || !selectedDate) return null;

  const dateObj = parseDateKey(selectedDate);
  const dayName = DAY_NAMES[dateObj.getDay()];
  const monthName = MONTH_NAMES[dateObj.getMonth()];
  const displayDate = `${dayName}, ${monthName} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

  const todayMarks = marks[selectedDate] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={closeMarksSheet} />
      <div className="relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Marks Sheet</h2>
            <p className="text-sm text-gray-500">{displayDate}</p>
          </div>
          <button
            onClick={closeMarksSheet}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
          {students.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No students found.</p>
              <p className="text-xs text-gray-400 mt-1">Add students from the Student Roster first.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map((student) => {
                const val = todayMarks[student.id] || '';
                return (
                  <div key={student.id} className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {student.name}
                    </span>
                    <input
                      type="text"
                      placeholder="Score/Grade"
                      value={val}
                      onChange={(e) => setMark(selectedDate, student.id, e.target.value)}
                      className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
