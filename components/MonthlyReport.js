'use client';

import { useState, useRef, useCallback } from 'react';
import { useApp } from './AppProvider';
import { useModalHistory } from '@/hooks/useModalHistory';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import {
  getWorkingDays,
  getWorkingDateKeys,
  MONTH_NAMES,
  getDaysInMonth,
} from '@/utils/dateHelpers';

export default function MonthlyReport() {
  const { students, attendance, holidays, showReport, setShowReport } = useApp();

  const closeReport = useCallback(() => setShowReport(false), [setShowReport]);
  useModalHistory(closeReport);

  const now = new Date();
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth());
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef(null);

  if (!showReport) return null;

  const workingDays = getWorkingDays(reportYear, reportMonth, holidays);
  const workingDateKeys = getWorkingDateKeys(reportYear, reportMonth, holidays);
  const totalDays = getDaysInMonth(reportYear, reportMonth);

  const studentStats = students.map((student) => {
    let present = 0;
    let absent = 0;

    workingDateKeys.forEach((dateKey) => {
      const status = attendance[dateKey]?.[student.id];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
    });

    const percentage = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;

    return { ...student, present, absent, percentage };
  });

  const avgPercentage =
    studentStats.length > 0
      ? Math.round(studentStats.reduce((s, st) => s + st.percentage, 0) / studentStats.length)
      : 0;

  const getColor = (pct) => {
    if (pct >= 75) return 'text-green-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBarColor = (pct) => {
    if (pct >= 75) return 'bg-green-600';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-600';
  };

  const yearOptions = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
    yearOptions.push(y);
  }

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    try {
      const element = reportRef.current;
      const targetWidth = Math.max(element.scrollWidth, 794);
      const targetHeight = element.scrollHeight;

      const imgData = await htmlToImage.toPng(element, { 
        quality: 1, 
        pixelRatio: 2,
        width: targetWidth,
        height: targetHeight,
        style: {
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          transform: 'none',
          margin: '0'
        },
        backgroundColor: '#ffffff',
        filter: (node) => {
          if (node.classList && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        }
      });
      
      const pdf = new jsPDF(targetWidth > targetHeight ? 'l' : 'p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      
      let pdfWidth = pdf.internal.pageSize.getWidth();
      let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      const maxPdfHeight = pdf.internal.pageSize.getHeight();
      if (pdfHeight > maxPdfHeight) {
        const ratio = maxPdfHeight / pdfHeight;
        pdfHeight = maxPdfHeight;
        pdfWidth = pdfWidth * ratio;
      }
      
      const xOffset = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 0, pdfWidth, pdfHeight);
      const filename = `Monthly_Report_${MONTH_NAMES[reportMonth]}_${reportYear}.pdf`;
      
      try {
        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
          });
        } else {
          pdf.save(filename);
        }
      } catch (err) {
        console.error('Share/Save error:', err);
        if (err.name !== 'AbortError') {
          pdf.save(filename);
        }
      }
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={closeReport} />

      {/* Modal */}
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold text-gray-900">Monthly Report</h2>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-1.5 rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 no-print"
            >
              {isDownloading ? (
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
              {isDownloading ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
          <button
            onClick={closeReport}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-65px)] p-6 custom-scrollbar">
          <div ref={reportRef} className="bg-white p-2">
            {/* Month selector */}
            <div className="mb-5 flex items-center gap-3 no-print">
            <label className="text-xs font-medium text-gray-500">Period:</label>
            <select
              id="select-report-month"
              value={reportMonth}
              onChange={(e) => setReportMonth(Number(e.target.value))}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-base sm:text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
            <select
              id="select-report-year"
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-base sm:text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Summary row */}
          <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
              <p className="text-xl font-semibold text-gray-900">{totalDays}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">Calendar Days</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-xl font-semibold text-green-600">{workingDays}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-green-600/70">Working Days</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
              <p className="text-xl font-semibold text-gray-900">{students.length}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">Students</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
              <p className={`text-xl font-semibold ${getColor(avgPercentage)}`}>{avgPercentage}%</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">Avg Attendance</p>
            </div>
          </div>

          {/* Data table */}
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No students in the roster
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">#</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Student Name</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-green-600">Present</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-red-600">Absent</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {studentStats.map((stat, index) => (
                    <tr key={stat.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-400">{index + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-50 text-[10px] font-semibold text-green-700">
                            {stat.name.charAt(0)}
                          </span>
                          <span className="font-medium text-gray-900">{stat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center font-medium text-green-600">{stat.present}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-red-600">{stat.absent}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${getBarColor(stat.percentage)}`}
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${getColor(stat.percentage)}`}>
                            {stat.percentage}%
                          </span>
                        </div>
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
