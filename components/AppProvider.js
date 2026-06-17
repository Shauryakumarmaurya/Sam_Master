'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadState, saveState } from '@/utils/storage';
import { formatDateKey, fetchNationalHolidays } from '@/utils/dateHelpers';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

/**
 * Capitalize the first letter of each word.
 */
function capitalizeName(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate a simple unique ID.
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function AppProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [holidays, setHolidays] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });
  const [showReport, setShowReport] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showMarksSheet, setShowMarksSheet] = useState(false);
  const [showGradebook, setShowGradebook] = useState(false);
  const [marks, setMarks] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [examGrades, setExamGrades] = useState({});
  const [principalSignature, setPrincipalSignature] = useState(null);
  const [classTeacherSignature, setClassTeacherSignature] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // ─── Hydrate from localStorage ─────────────────────────────
  useEffect(() => {
    const savedStudents = loadState('sam_students', []);
    const savedAttendance = loadState('sam_attendance', {});
    const savedMarks = loadState('sam_marks', {});
    const savedSubjects = loadState('sam_subjects', []);
    const savedExams = loadState('sam_exams', []);
    const savedExamGrades = loadState('sam_exam_grades', {});
    const savedPrincipalSignature = loadState('sam_principal_signature', null);
    const savedClassTeacherSignature = loadState('sam_class_teacher_signature', null);
    const savedHolidays = loadState('sam_holidays', []);

    setStudents(savedStudents.sort((a, b) => a.name.localeCompare(b.name)));
    setAttendance(savedAttendance);
    setMarks(savedMarks);
    setSubjects(savedSubjects);
    setExams(savedExams);
    setExamGrades(savedExamGrades);
    setPrincipalSignature(savedPrincipalSignature);
    setClassTeacherSignature(savedClassTeacherSignature);
    
    // Fetch and merge national holidays
    const currentYear = new Date().getFullYear();
    fetchNationalHolidays(currentYear, 'IN').then((nationalHolidays) => {
      setHolidays(new Set([...savedHolidays, ...nationalHolidays]));
      setHydrated(true);
    });
  }, []);

  // ─── Persist to localStorage on changes ────────────────────
  useEffect(() => {
    if (!hydrated) return;
    saveState('sam_students', students);
  }, [students, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveState('sam_attendance', attendance);
  }, [attendance, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveState('sam_marks', marks);
  }, [marks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveState('sam_subjects', subjects);
    saveState('sam_exams', exams);
    saveState('sam_exam_grades', examGrades);
    saveState('sam_principal_signature', principalSignature);
    saveState('sam_class_teacher_signature', classTeacherSignature);
  }, [subjects, exams, examGrades, principalSignature, classTeacherSignature, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveState('sam_holidays', Array.from(holidays));
  }, [holidays, hydrated]);

  // ─── Student CRUD ──────────────────────────────────────────
  const addStudent = useCallback((name) => {
    const cleaned = capitalizeName(name);
    if (!cleaned) return false;

    setStudents((prev) => {
      // Check for duplicates
      if (prev.some((s) => s.name.toLowerCase() === cleaned.toLowerCase())) {
        return prev;
      }
      const next = [...prev, { id: generateId(), name: cleaned }];
      next.sort((a, b) => a.name.localeCompare(b.name));
      return next;
    });
    return true;
  }, []);

  const removeStudent = useCallback((id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    // Also remove attendance records for that student
    setAttendance((prev) => {
      const next = { ...prev };
      for (const dateKey of Object.keys(next)) {
        if (next[dateKey][id]) {
          const { [id]: _, ...rest } = next[dateKey];
          next[dateKey] = rest;
        }
      }
      return next;
    });
    setMarks((prev) => {
      const next = { ...prev };
      for (const dateKey of Object.keys(next)) {
        if (next[dateKey][id]) {
          const { [id]: _, ...rest } = next[dateKey];
          next[dateKey] = rest;
        }
      }
      return next;
    });
    // Remove from exam grades
    setExamGrades((prev) => {
      const next = { ...prev };
      for (const examId of Object.keys(next)) {
        next[examId] = { ...next[examId] };
        for (const subjectId of Object.keys(next[examId])) {
          if (next[examId][subjectId][id] !== undefined) {
            next[examId][subjectId] = { ...next[examId][subjectId] };
            delete next[examId][subjectId][id];
          }
        }
      }
      return next;
    });
  }, []);

  // ─── Holiday Management ────────────────────────────────────
  const toggleHoliday = useCallback((dateKey) => {
    setHolidays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  }, []);

  // ─── Attendance Marking ────────────────────────────────────
  const markAttendance = useCallback((dateKey, studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {}),
        [studentId]: status,
      },
    }));
  }, []);

  const markAllAttendance = useCallback(
    (dateKey, status) => {
      setAttendance((prev) => {
        const dateRecord = { ...(prev[dateKey] || {}) };
        students.forEach((s) => {
          dateRecord[s.id] = status;
        });
        return { ...prev, [dateKey]: dateRecord };
      });
    },
    [students]
  );

  // ─── Marks Management ────────────────────────────────────────
  const setMark = useCallback((dateKey, studentId, markValue) => {
    setMarks((prev) => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {}),
        [studentId]: markValue,
      },
    }));
  }, []);

  // ─── Academic Gradebook ──────────────────────────────────────
  const addSubject = useCallback((name) => {
    const cleaned = capitalizeName(name);
    if (!cleaned) return false;
    setSubjects(prev => {
      if (prev.some(s => s.name.toLowerCase() === cleaned.toLowerCase())) return prev;
      return [...prev, { id: generateId(), name: cleaned }].sort((a, b) => a.name.localeCompare(b.name));
    });
    return true;
  }, []);

  const removeSubject = useCallback((id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  }, []);

  const addExam = useCallback((name, maxMarks = 100) => {
    const cleaned = capitalizeName(name);
    if (!cleaned) return false;
    setExams(prev => {
      if (prev.some(e => e.name.toLowerCase() === cleaned.toLowerCase())) return prev;
      return [...prev, { id: generateId(), name: cleaned, maxMarks: Number(maxMarks) || 100 }];
    });
    return true;
  }, []);

  const removeExam = useCallback((id) => {
    setExams(prev => prev.filter(e => e.id !== id));
  }, []);

  const setExamGrade = useCallback((examId, subjectId, studentId, score) => {
    setExamGrades(prev => ({
      ...prev,
      [examId]: {
        ...(prev[examId] || {}),
        [subjectId]: {
          ...(prev[examId]?.[subjectId] || {}),
          [studentId]: score,
        }
      }
    }));
  }, []);

  // ─── Navigation ────────────────────────────────────────────
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  }, []);

  const jumpToMonth = useCallback((year, month) => {
    setCurrentMonth({ year, month });
  }, []);

  const value = {
    students,
    attendance,
    holidays,
    selectedDate,
    currentMonth,
    showReport,
    setShowReport,
    showRoster,
    setShowRoster,
    showAttendance,
    setShowAttendance,
    showMarksSheet,
    setShowMarksSheet,
    showGradebook,
    setShowGradebook,
    marks,
    setMark,
    subjects,
    exams,
    examGrades,
    principalSignature,
    setPrincipalSignature,
    classTeacherSignature,
    setClassTeacherSignature,
    addSubject,
    removeSubject,
    addExam,
    removeExam,
    setExamGrade,
    hydrated,
    jumpToMonth,
    addStudent,
    removeStudent,
    toggleHoliday,
    markAttendance,
    markAllAttendance,
    setSelectedDate,
    setCurrentMonth,
    goToPrevMonth,
    goToNextMonth,
    setShowReport,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
