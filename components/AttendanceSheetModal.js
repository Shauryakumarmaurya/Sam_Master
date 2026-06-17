'use client';

import { useApp } from './AppProvider';
import { parseDateKey } from '@/utils/dateHelpers';

export default function AttendanceSheetModal() {
  const { students, attendance, selectedDate, markAttendance, markAllAttendance, showAttendance, setShowAttendance } = useApp();

  if (!showAttendance || !selectedDate) return null;

  const date = parseDateKey(selectedDate);
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const dateAttendance = attendance[selectedDate] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={() => setShowAttendance(false)} />

      {/* Modal */}
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Mark Attendance</h2>
            <p className="text-xs text-gray-500">{dateLabel}</p>
          </div>
          <button
            onClick={() => setShowAttendance(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 pb-3">
          {/* Bulk actions */}
          <div className="flex gap-3">
            <button
              onClick={() => markAllAttendance(selectedDate, 'present')}
              className="flex-1 rounded-md border border-green-200 bg-green-50 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={() => markAllAttendance(selectedDate, 'absent')}
              className="flex-1 rounded-md border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              ✗ Mark All Absent
            </button>
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {students.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <p className="text-sm text-gray-500">No students added to the roster yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm min-w-[500px]">
                <tbody>
                  {students.map((student, index) => {
                    const status = dateAttendance[student.id] || null;
                    return (
                      <tr key={student.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 w-10 text-center text-xs text-gray-400">{index + 1}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-semibold text-green-700">
                              {student.name.charAt(0)}
                            </span>
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => markAttendance(selectedDate, student.id, 'present')}
                              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                                status === 'present'
                                  ? 'bg-green-600 text-white shadow-sm'
                                  : 'border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-600'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => markAttendance(selectedDate, student.id, 'absent')}
                              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                                status === 'absent'
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : 'border border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-600'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
