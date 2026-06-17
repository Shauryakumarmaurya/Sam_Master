'use client';

import { useState, useCallback } from 'react';
import { useApp } from './AppProvider';
import VoiceInput from './VoiceInput';

export default function StudentRosterModal() {
  const { students, addStudent, removeStudent, showRoster, setShowRoster } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const added = addStudent(inputValue);
    if (added) showToast(`Added "${inputValue.trim()}"`);
    else showToast('Student already exists', 'error');
    setInputValue('');
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleAdd(); };

  const handleVoiceResult = useCallback((transcript) => {
    if (transcript.trim()) {
      const added = addStudent(transcript);
      if (added) showToast(`Added "${transcript.trim()}" (voice)`);
      else showToast('Student already exists', 'error');
    }
  }, [addStudent]);

  if (!showRoster) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={() => setShowRoster(false)} />

      {/* Modal */}
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">Student Roster</h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {students.length}
            </span>
          </div>
          <button
            onClick={() => setShowRoster(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 pb-2">
          {/* Add Student Input */}
          <div className="mb-4 flex items-center gap-2">
            <input
              id="input-student-name-modal"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter student name…"
              className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <VoiceInput onResult={handleVoiceResult} />
            <button
              onClick={handleAdd}
              className="rounded-md bg-green-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Add
            </button>
          </div>

          {toast && (
            <div className={`mb-4 rounded-md px-3 py-2 text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {toast.message}
            </div>
          )}
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {students.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <svg className="mb-2 h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <p className="text-sm text-gray-500">No students added yet</p>
              <p className="mt-1 text-xs text-gray-400">Type a name or use the microphone</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm min-w-[500px]">
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id} className="group border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3 text-xs text-gray-400 w-8 text-center">{index + 1}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-[11px] font-semibold text-green-700">
                            {student.name.charAt(0)}
                          </span>
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 w-10 text-right">
                        <button
                          onClick={() => removeStudent(student.id)}
                          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 transition-all ml-auto"
                          aria-label={`Remove ${student.name}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
