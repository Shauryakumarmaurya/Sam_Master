'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ShareGradingContent() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState(null);
  const [grades, setGrades] = useState({});
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const rawPayload = searchParams.get('payload');
    if (rawPayload) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(rawPayload)));
        setPayload(decoded);
        setGrades(decoded.existingGrades || {});
      } catch (err) {
        console.error("Failed to decode payload", err);
        setError(true);
      }
    } else {
      setError(true);
    }
  }, [searchParams]);

  const handleSubmitGrades = async () => {
    if (!payload) return;
    setIsSubmitting(true);

    const syncPayload = {
      examId: payload.examId,
      examName: payload.examName,
      subjectId: payload.subjectId,
      subjectName: payload.subjectName,
      grades: grades
    };

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload)
      });
      
      if (res.ok) {
        setSubmitSuccess(true);
      } else {
        alert("Failed to submit grades. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid or Missing Link</h2>
          <p className="text-sm text-gray-500">The sharing link you used appears to be broken or empty. Please ask the administrator for a new link.</p>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-indigo-900 uppercase tracking-tight">Teacher Grading Portal</h1>
          <p className="mt-2 text-lg text-gray-600">Enter marks for <span className="font-bold text-purple-600">{payload.subjectName}</span> in <span className="font-bold text-purple-600">{payload.examName}</span></p>
          <div className="mt-4 inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-800">
            Maximum Marks: {payload.maxMarks}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-indigo-900 text-white">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Student Name</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs w-48 text-right">Marks Obtained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payload.students.map((student, idx) => (
                <tr key={student.id} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'}>
                  <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min="0"
                        max={payload.maxMarks}
                        placeholder="0"
                        value={grades[student.id] || ''}
                        onChange={(e) => setGrades({ ...grades, [student.id]: e.target.value })}
                        className="w-20 rounded-md border border-gray-300 px-3 py-2 text-right text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                      <span className="text-gray-400 font-medium">/ {payload.maxMarks}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="bg-gray-50 p-6 border-t border-gray-200 flex flex-col items-center">
            {submitSuccess ? (
              <div className="w-full bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in-up">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-900 mb-2">Grades Submitted Successfully!</h3>
                <p className="text-sm text-green-700 mb-4">The marks have been automatically sent to the administrator's dashboard. You may now close this window.</p>
              </div>
            ) : (
              <button
                onClick={handleSubmitGrades}
                disabled={isSubmitting}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Grades to Admin'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <ShareGradingContent />
    </Suspense>
  );
}
