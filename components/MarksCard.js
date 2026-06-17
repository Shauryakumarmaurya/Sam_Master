'use client';

import { useApp } from './AppProvider';
import { parseDateKey, DAY_NAMES, MONTH_NAMES } from '@/utils/dateHelpers';

export default function MarksCard() {
  const { setShowGradebook, subjects, exams } = useApp();
  
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">Academic Gradebook</h2>
        <p className="text-xs text-gray-500">Manage subjects and exams</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center rounded-lg border border-purple-100 bg-purple-50 py-3">
          <span className="text-xl font-bold text-purple-600">{subjects.length}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-500">Subjects</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 py-3">
          <span className="text-xl font-bold text-indigo-600">{exams.length}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">Exams</span>
        </div>
      </div>

      <button
        onClick={() => setShowGradebook(true)}
        className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors mt-auto"
      >
        Open Gradebook
      </button>
    </div>
  );
}
