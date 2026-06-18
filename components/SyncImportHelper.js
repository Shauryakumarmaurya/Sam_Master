'use client';

import { useEffect, useState, useRef } from 'react';
import { useApp } from './AppProvider';
import { loadState, saveState } from '@/utils/storage';

export default function SyncImportHelper() {
  const { setExamGrade, exams, subjects, students } = useApp();
  const [notifications, setNotifications] = useState([]);
  const appDataRef = useRef({ setExamGrade, exams, subjects, students });

  // Keep ref up to date to avoid stale closures in the interval
  useEffect(() => {
    appDataRef.current = { setExamGrade, exams, subjects, students };
  }, [setExamGrade, exams, subjects, students]);

  useEffect(() => {
    let isInitialLoad = true;

    const fetchSyncs = async () => {
      try {
        const res = await fetch('/api/sync');
        if (!res.ok) return;
        
        const data = await res.json();
        const importedSyncs = loadState('sam_imported_syncs', []);
        let newImports = false;

        const { setExamGrade, subjects, students } = appDataRef.current;

        data.forEach(submission => {
          if (!importedSyncs.includes(submission.id)) {
            // Import it!
            Object.entries(submission.grades).forEach(([studentId, score]) => {
               if (students.find(s => s.id === studentId)) {
                 setExamGrade(submission.examId, submission.subjectId, studentId, score);
               }
            });
            importedSyncs.push(submission.id);
            newImports = true;
            
            // Only show toast if it's NOT the initial bulk historical load
            if (!isInitialLoad) {
              const subjectName = subjects.find(s => s.id === submission.subjectId)?.name || 'a Subject';
              
              setNotifications(prev => [...prev, {
                id: submission.id,
                message: `Marks submitted by the ${subjectName} teacher!`
              }]);
              
              // Auto dismiss after 4 seconds
              setTimeout(() => {
                setNotifications(prev => prev.filter(x => x.id !== submission.id));
              }, 4000);
            }
          }
        });

        if (newImports) {
          saveState('sam_imported_syncs', importedSyncs);
        }
      } catch(e) {
        // ignore errors if api fails
      } finally {
        isInitialLoad = false;
      }
    };

    // Run immediately on mount
    fetchSyncs();

    // Then poll every 3 seconds
    const interval = setInterval(fetchSyncs, 3000);

    return () => clearInterval(interval);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-auto">
      {notifications.map(n => (
        <div key={n.id} className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-fade-in-up min-w-[320px]">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">{n.message}</span>
          </div>
          <button 
            onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} 
            className="p-1 text-green-200 hover:text-white hover:bg-green-700 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
