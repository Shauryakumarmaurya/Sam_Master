import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppProvider';
import { useModalHistory } from '@/hooks/useModalHistory';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function GradebookModal() {
  const {
    showGradebook,
    setShowGradebook,
    subjects,
    exams,
    students,
    examGrades,
    addSubject,
    removeSubject,
    addExam,
    removeExam,
    setExamGrade,
    attendance,
    principalSignature,
    setPrincipalSignature,
    classTeacherSignature,
    setClassTeacherSignature,
  } = useApp();

  const [activeTab, setActiveTab] = useState('setup');
  const [newSubject, setNewSubject] = useState('');
  const [newExam, setNewExam] = useState('');
  const [newExamMaxMarks, setNewExamMaxMarks] = useState('100');

  const closeGradebook = useCallback(() => setShowGradebook(false), [setShowGradebook]);
  useModalHistory(closeGradebook);

  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [rankingsExamFilter, setRankingsExamFilter] = useState('all');
  const reportCardRef = useRef(null);
  const reportWrapperRef = useRef(null);
  const [reportScale, setReportScale] = useState(1);

  useEffect(() => {
    if (activeTab === 'report' && selectedStudentId && reportCardRef.current && reportWrapperRef.current) {
      const updateScale = () => {
        if (!reportWrapperRef.current || !reportCardRef.current) return;
        const parentWidth = reportWrapperRef.current.parentElement.clientWidth;
        if (parentWidth < 800) {
          // If parent is smaller than 800, scale it down to fit exactly
          const newScale = parentWidth / 800;
          setReportScale(newScale);
          reportWrapperRef.current.style.height = `${reportCardRef.current.scrollHeight * newScale}px`;
        } else {
          setReportScale(1);
          reportWrapperRef.current.style.height = `${reportCardRef.current.scrollHeight}px`;
        }
      };
      
      updateScale();
      window.addEventListener('resize', updateScale);
      
      const observer = new ResizeObserver(updateScale);
      if (reportCardRef.current) observer.observe(reportCardRef.current);
      
      return () => {
        window.removeEventListener('resize', updateScale);
        observer.disconnect();
      };
    }
  }, [activeTab, selectedStudentId]);

  const handleGenerateShareLink = async () => {
    if (!selectedExamId || !selectedSubjectId || students.length === 0) return;
    
    setIsGeneratingLink(true);
    try {
      const examObj = exams.find(e => e.id === selectedExamId);
      const subjectObj = subjects.find(s => s.id === selectedSubjectId);
      
      const payload = {
        examId: selectedExamId,
        examName: examObj?.name || 'Exam',
        maxMarks: examObj?.maxMarks || 100,
        subjectId: selectedSubjectId,
        subjectName: subjectObj?.name || 'Subject',
        students: students.map(s => ({ id: s.id, name: s.name })),
        existingGrades: students.reduce((acc, s) => {
          const score = examGrades[selectedExamId]?.[selectedSubjectId]?.[s.id];
          if (score) acc[s.id] = score;
          return acc;
        }, {})
      };
      
      let shareUrl;
      try {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.id) {
            shareUrl = `${window.location.origin}/share?id=${data.id}`;
          } else {
            throw new Error("No ID returned");
          }
        } else {
          throw new Error("API failed");
        }
      } catch (err) {
        console.error('Failed to generate internal share link, falling back to legacy long link', err);
        const encodedPayload = btoa(encodeURIComponent(JSON.stringify(payload)));
        shareUrl = `${window.location.origin}/share?payload=${encodedPayload}`;
      }
      
      const shareData = {
        title: `Grade Entry: ${subjectObj?.name}`,
        text: `Please enter marks for ${subjectObj?.name} (${examObj?.name}) using this link:`,
        url: shareUrl
      };
      
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 3000);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 3000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert("Failed to share link. Please check browser permissions.");
      }
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSignatureUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setter(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  if (!showGradebook) return null;

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (addSubject(newSubject)) setNewSubject('');
  };

  const handleAddExam = (e) => {
    e.preventDefault();
    if (addExam(newExam, newExamMaxMarks)) {
      setNewExam('');
      setNewExamMaxMarks('100');
    }
  };

  const handleDownloadPDF = async (targetStudentId = selectedStudentId) => {
    if (!reportCardRef.current) return;
    setIsDownloading(true);
    try {
      const element = reportCardRef.current;
      // Capture the full scrollable width/height, ensuring at least A4 width (794px)
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
      
      // If the report card is taller than one A4 page, scale it down so it fits perfectly
      const maxPdfHeight = pdf.internal.pageSize.getHeight();
      if (pdfHeight > maxPdfHeight) {
        const ratio = maxPdfHeight / pdfHeight;
        pdfHeight = maxPdfHeight;
        pdfWidth = pdfWidth * ratio;
      }
      
      // Center horizontally if it was scaled down
      const xOffset = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 0, pdfWidth, pdfHeight);
      const filename = `${students.find(s => s.id === targetStudentId)?.name || 'Student'}_Report_Card.pdf`;
      
      try {
        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });
        
        // Use native iOS/Android Share Sheet to prevent WebKitBlobResource history corruption
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
          // Fallback if sharing fails for some reason
          pdf.save(filename);
        }
      }
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleQuickDownload = (studentId) => {
    setSelectedStudentId(studentId);
    setActiveTab('report');
    
    // Give React a moment to render the report tab DOM node, then trigger download
    setTimeout(() => {
      handleDownloadPDF(studentId);
    }, 150);
  };

  const handleDownloadAllZip = async () => {
    if (!students || students.length === 0) return;
    setIsBulkDownloading(true);
    setBulkProgress(0);
    setActiveTab('report'); // Need report tab active to render the DOM nodes

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setSelectedStudentId(student.id);
        
        // Wait for React to render the specific student's report card
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!reportCardRef.current) continue;
        const element = reportCardRef.current;
        const targetWidth = Math.max(element.scrollWidth, 794);
        const targetHeight = element.scrollHeight;

        const imgData = await htmlToImage.toPng(element, { 
          quality: 1, 
          pixelRatio: 2,
          width: targetWidth,
          height: targetHeight,
          style: { width: `${targetWidth}px`, height: `${targetHeight}px`, transform: 'none', margin: '0' },
          backgroundColor: '#ffffff',
          filter: (node) => !(node.classList && node.classList.contains('no-print'))
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
        
        const filename = `${student.name.replace(/[^a-z0-9]/gi, '_')}_Report_Card.pdf`;
        zip.file(filename, pdf.output('blob'));
        
        setBulkProgress(i + 1);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'Class_Report_Cards.zip', { type: 'application/zip' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [zipFile] })) {
        await navigator.share({ files: [zipFile], title: 'Class Report Cards' });
      } else {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Class_Report_Cards.zip';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Bulk download error:', error);
      alert('Failed to generate bulk ZIP. Please try again.');
    } finally {
      setIsBulkDownloading(false);
      setBulkProgress(0);
    }
  };

  const exportRankingsToCSV = () => {
    if (!students || students.length === 0) return;

    const filteredExams = rankingsExamFilter === 'all' ? exams : exams.filter(e => e.id === rankingsExamFilter);
    
    const rankedStudents = students.map(student => {
      let grandScore = 0;
      let grandMax = 0;
      filteredExams.forEach(ex => {
        subjects.forEach(sub => {
          const score = examGrades[ex.id]?.[sub.id]?.[student.id];
          if (score) {
            grandScore += Number(score);
            grandMax += (ex.maxMarks || 100);
          }
        });
      });
      return { ...student, grandScore, grandMax, percent: grandMax > 0 ? (grandScore / grandMax) * 100 : 0 };
    }).sort((a, b) => b.grandScore - a.grandScore);

    let currentRank = 1;
    const csvRows = [];
    csvRows.push(['Rank', 'Student Name', 'Total Score', 'Max Score', 'Percentage', 'Status']);

    rankedStudents.forEach((student, index) => {
      if (index > 0 && student.grandScore < rankedStudents[index - 1].grandScore) {
        currentRank = index + 1;
      }
      const rankStr = student.grandScore === 0 ? '-' : currentRank;
      const passFail = student.percent >= 33 ? 'Pass' : (student.grandScore > 0 ? 'Fail' : 'N/A');
      
      csvRows.push([
        rankStr,
        `"${student.name.replace(/"/g, '""')}"`,
        student.grandScore,
        student.grandMax,
        `${Math.round(student.percent)}%`,
        passFail
      ]);
    });

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filterName = rankingsExamFilter === 'all' ? 'Overall' : exams.find(e => e.id === rankingsExamFilter)?.name || 'Filtered';
    link.setAttribute("href", url);
    link.setAttribute("download", `Class_Rankings_${filterName.replace(/[^a-z0-9]/gi, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-0">
      <div className="flex h-full w-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Academic Gradebook</h2>
            <p className="text-sm text-gray-500">Manage subjects, exams, and student performance.</p>
          </div>
          <button
            onClick={closeGradebook}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-3 sm:px-6 py-2">
          <nav className="grid grid-cols-4 gap-1 sm:flex sm:space-x-6 sm:gap-0">
            {[
              { key: 'setup', icon: '⚙️', short: 'Setup', full: 'Setup & Config' },
              { key: 'grading', icon: '✏️', short: 'Grades', full: 'Grading Entry' },
              { key: 'report', icon: '📄', short: 'Reports', full: 'Report Cards' },
              { key: 'rankings', icon: '🏆', short: 'Ranks', full: 'Class Rankings' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 rounded-lg sm:rounded-none py-2 sm:py-3 px-1 sm:px-1 text-[11px] sm:text-sm font-medium transition-colors sm:border-b-2 sm:whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-purple-100 text-purple-700 sm:bg-transparent sm:border-purple-500 sm:text-purple-600'
                    : 'text-gray-500 sm:border-transparent hover:text-gray-700 hover:bg-gray-100 sm:hover:bg-transparent sm:hover:border-gray-300'
                }`}
              >
                <span className="text-base sm:hidden">{tab.icon}</span>
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.full}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 custom-scrollbar">
          
          {/* TAB: SETUP */}
          {activeTab === 'setup' && (
            <div className="mx-auto max-w-4xl space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Subjects */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Subjects</h3>
                  <form onSubmit={handleAddSubject} className="mb-6 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Mathematics"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <button type="submit" className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 w-full sm:w-auto mt-2 sm:mt-0">
                      Add
                    </button>
                  </form>
                  <ul className="space-y-2">
                    {subjects.map(s => (
                      <li key={s.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                        <span className="text-sm font-medium text-gray-800">{s.name}</span>
                        <button onClick={() => removeSubject(s.id)} className="text-red-500 hover:text-red-700">
                          Remove
                        </button>
                      </li>
                    ))}
                    {subjects.length === 0 && <p className="text-sm text-gray-500">No subjects added.</p>}
                  </ul>
                </div>

                {/* Exams */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Exams</h3>
                  <form onSubmit={handleAddExam} className="mb-6 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Unit Test 1"
                      value={newExam}
                      onChange={(e) => setNewExam(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="relative w-24">
                      <input
                        type="number"
                        placeholder="Max"
                        min="1"
                        value={newExamMaxMarks}
                        onChange={(e) => setNewExamMaxMarks(e.target.value)}
                        className="w-full rounded-md border border-gray-300 pl-3 pr-8 py-2 text-base sm:text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400">pts</span>
                    </div>
                    <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 w-full sm:w-auto mt-2 sm:mt-0">
                      Add
                    </button>
                  </form>
                  <ul className="space-y-2">
                    {exams.map(e => (
                      <li key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                        <span className="text-sm font-medium text-gray-800">
                          {e.name} <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">Out of {e.maxMarks || 100}</span>
                        </span>
                        <button onClick={() => removeExam(e.id)} className="text-red-500 hover:text-red-700">
                          Remove
                        </button>
                      </li>
                    ))}
                    {exams.length === 0 && <p className="text-sm text-gray-500">No exams added.</p>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GRADING */}
          {activeTab === 'grading' && (
            <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">-- Select Exam --</option>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                
                {selectedExamId && selectedSubjectId && students.length > 0 && (
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isGeneratingLink}
                    className="flex items-center gap-2 rounded-md bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200 transition-colors whitespace-nowrap border border-purple-200 disabled:opacity-50"
                  >
                    {isGeneratingLink ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : shareLinkCopied ? (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Shared!
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Share Link
                      </>
                    )}
                  </button>
                )}
              </div>

              {!selectedExamId || !selectedSubjectId ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Please select an Exam and a Subject to start grading.
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  No students in the roster.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map(student => {
                    const score = examGrades[selectedExamId]?.[selectedSubjectId]?.[student.id] || '';
                    const examObj = exams.find(e => e.id === selectedExamId);
                    const maxMarks = examObj?.maxMarks || 100;
                    
                    return (
                      <div key={student.id} className="flex items-center justify-between py-3">
                        <span className="text-sm font-medium text-gray-900">{student.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            placeholder="Score"
                            value={score}
                            onChange={(e) => setExamGrade(selectedExamId, selectedSubjectId, student.id, e.target.value)}
                            className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-base sm:text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-500 w-12">/ {maxMarks}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: REPORT */}
          {activeTab === 'report' && (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">-- Select a Student to view Report Card --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selectedStudentId && (
                <div ref={reportWrapperRef} className="w-full overflow-hidden mb-6">
                  <div 
                    ref={reportCardRef} 
                    className="print-section rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 shadow-2xl w-[800px]"
                    style={{
                      transform: `scale(${reportScale})`,
                      transformOrigin: 'top left'
                    }}
                  >
                  {/* Action Bar (Not Printed) */}
                  <div className="absolute top-4 right-4 no-print z-10">
                    <button 
                      onClick={handleDownloadPDF} 
                      disabled={isDownloading}
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? (
                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      )}
                      {isDownloading ? 'Downloading...' : 'Export High-Res PDF'}
                    </button>
                  </div>

                  {/* School Header */}
                  <div className="flex justify-between items-end border-b-4 border-indigo-900 pb-6 mb-8 mt-2">
                    <div className="flex items-center gap-6">
                      <div className="w-36 h-36 flex-shrink-0 flex items-center justify-center bg-white rounded-xl overflow-hidden">
                        {/* Ensure crossOrigin="anonymous" is used if loading external images for html-to-image to work properly */}
                        <img 
                          src="/logo.png" 
                          alt="School Logo" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback if logo.png is missing
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234f46e5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 14l9-5-9-5-9 5 9 5z'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 14l9-5-9-5-9 5 9 5z'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z'/%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="text-2xl sm:text-3xl font-black text-indigo-900 uppercase tracking-tight leading-tight">
                          TINY TOTS CONVENT SCHOOL
                        </h1>
                        <p className="text-sm font-bold text-gray-500 tracking-widest uppercase mt-2">Knowledge is Light</p>
                        <p className="text-sm text-indigo-600 font-semibold mt-1">Academic Session 2026-2027</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-black text-indigo-900 uppercase tracking-widest">Report Card</h2>
                      <p className="text-sm font-medium text-gray-500 mt-1">Issued: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Student Details Grid */}
                  {(() => {
                    const totals = students.map(s => {
                      let total = 0;
                      exams.forEach(ex => subjects.forEach(sub => {
                        const score = examGrades[ex.id]?.[sub.id]?.[s.id];
                        if (score) total += Number(score);
                      }));
                      return { id: s.id, total };
                    }).sort((a, b) => b.total - a.total);

                    let rank = 1;
                    for (let i = 0; i < totals.length; i++) {
                      if (i > 0 && totals[i].total < totals[i-1].total) rank = i + 1;
                      if (totals[i].id === selectedStudentId) break;
                    }

                    let totalSchoolDays = 0;
                    let daysPresent = 0;
                    for (const dateKey of Object.keys(attendance || {})) {
                      const dayRecord = attendance[dateKey];
                      if (dayRecord && Object.keys(dayRecord).length > 0) {
                        totalSchoolDays++;
                        if (dayRecord[selectedStudentId] === 'present') daysPresent++;
                      }
                    }
                    const attendancePercentage = totalSchoolDays > 0 ? Math.round((daysPresent / totalSchoolDays) * 100) : 0;

                    let grandScore = 0;
                    let grandMax = 0;
                    exams.forEach(ex => {
                      subjects.forEach(sub => {
                        const score = examGrades[ex.id]?.[sub.id]?.[selectedStudentId];
                        if (score) {
                          grandScore += Number(score);
                          grandMax += (ex.maxMarks || 100);
                        }
                      });
                    });
                    const percent = grandMax > 0 ? Math.round((grandScore / grandMax) * 100) : 0;
                    const letterGrade = percent >= 91 ? 'A1' : percent >= 81 ? 'A2' : percent >= 71 ? 'B1' : percent >= 61 ? 'B2' : percent >= 51 ? 'C' : percent >= 33 ? 'D' : 'E';

                    return (
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
                        <div className="relative">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Student Name</p>
                          <p className="text-xl font-bold text-gray-900">{students.find(s => s.id === selectedStudentId)?.name}</p>
                        </div>
                        <div className="relative">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Class Rank</p>
                          <p className="text-xl font-black text-indigo-700">#{rank} <span className="text-sm font-medium text-gray-500">/ {students.length}</span></p>
                        </div>
                        <div className="relative">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Attendance</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-gray-900">{attendancePercentage}%</p>
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">{daysPresent}/{totalSchoolDays} Days</span>
                          </div>
                        </div>
                        <div className="relative">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Final Grade</p>
                          <p className={`text-2xl font-black ${percent >= 33 ? 'text-green-600' : 'text-red-600'}`}>{grandMax > 0 ? letterGrade : '-'}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {exams.length === 0 || subjects.length === 0 ? (
                    <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-500 font-medium">Add subjects and exams in Setup to see the academic performance table.</p>
                    </div>
                  ) : (
                    <>
                      {/* Academic Table */}
                      <div className="overflow-hidden rounded-xl border-2 border-indigo-900 shadow-sm mb-8">
                        <table className="w-full text-left text-sm text-gray-800">
                          <thead className="bg-indigo-900 text-white">
                            <tr>
                              <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Subject</th>
                              {exams.map(e => (
                                <th key={e.id} className="px-5 py-4 font-bold uppercase tracking-wider text-xs text-center border-l border-indigo-800/50">{e.name}</th>
                              ))}
                              <th className="px-5 py-4 font-black uppercase tracking-wider text-xs text-center border-l-2 border-indigo-800 bg-indigo-950">Overall</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {subjects.map((sub, idx) => {
                              let subTotalScore = 0;
                              let subTotalMax = 0;

                              return (
                                <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                  <td className="px-5 py-4 font-bold text-gray-900">{sub.name}</td>
                                  {exams.map(ex => {
                                    const score = examGrades[ex.id]?.[sub.id]?.[selectedStudentId];
                                    const max = ex.maxMarks || 100;
                                    
                                    if (score) {
                                      subTotalScore += Number(score);
                                      subTotalMax += max;
                                    }

                                    const isPassed = Number(score) >= (max * 0.4);
                                    
                                    return (
                                      <td key={ex.id} className="px-5 py-4 text-center border-l border-gray-100">
                                        {score ? (
                                          <div>
                                            <span className={`text-sm font-bold ${isPassed ? 'text-gray-900' : 'text-red-600'}`}>{score}</span>
                                            <span className="text-xs text-gray-400 font-medium ml-1">/ {max}</span>
                                          </div>
                                        ) : (
                                          <span className="text-gray-300 font-bold">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-5 py-4 text-center border-l-2 border-indigo-100 bg-indigo-50/30">
                                    {subTotalMax > 0 ? (
                                      <div>
                                        <span className={`text-base font-black ${subTotalScore >= (subTotalMax * 0.4) ? 'text-indigo-700' : 'text-red-600'}`}>{subTotalScore}</span>
                                        <span className="text-xs text-indigo-400 font-bold ml-1">/ {subTotalMax}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-300 font-bold">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-indigo-50 border-t-2 border-indigo-200">
                            <tr>
                              <td className="px-5 py-5 font-black text-indigo-900 uppercase text-xs tracking-wider">Grand Totals</td>
                              {exams.map(ex => {
                                let exTotalScore = 0;
                                let exTotalMax = 0;
                                subjects.forEach(sub => {
                                  const score = examGrades[ex.id]?.[sub.id]?.[selectedStudentId];
                                  if (score) {
                                    exTotalScore += Number(score);
                                    exTotalMax += (ex.maxMarks || 100);
                                  }
                                });

                                return (
                                  <td key={ex.id} className="px-5 py-5 text-center border-l border-indigo-100">
                                    {exTotalMax > 0 ? (
                                      <div>
                                        <span className="text-sm font-black text-indigo-900">{exTotalScore}</span>
                                        <span className="text-xs font-bold text-indigo-500 ml-1">/ {exTotalMax}</span>
                                      </div>
                                    ) : (
                                      <span className="text-indigo-200 font-bold">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              
                              <td className="px-5 py-5 text-center border-l-2 border-indigo-200 bg-indigo-100">
                                {(() => {
                                  let grandScore = 0;
                                  let grandMax = 0;
                                  exams.forEach(ex => subjects.forEach(sub => {
                                    const score = examGrades[ex.id]?.[sub.id]?.[selectedStudentId];
                                    if (score) {
                                      grandScore += Number(score);
                                      grandMax += (ex.maxMarks || 100);
                                    }
                                  }));

                                  return grandMax > 0 ? (
                                    <div>
                                      <div className="text-xl font-black text-indigo-700">{Math.round((grandScore / grandMax) * 100)}%</div>
                                      <div className="text-xs font-bold text-indigo-500 mt-0.5">{grandScore} / {grandMax}</div>
                                    </div>
                                  ) : (
                                    <span className="text-indigo-300 font-bold">-</span>
                                  );
                                })()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Grading Legend & Remarks */}
                      <div className="mb-12">
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-gray-500 mb-8 border-t border-b border-gray-200 py-3 bg-gray-50 rounded-lg px-4">
                          <span><strong className="text-gray-800">A1:</strong> 91-100%</span>
                          <span><strong className="text-gray-800">A2:</strong> 81-90%</span>
                          <span><strong className="text-gray-800">B1:</strong> 71-80%</span>
                          <span><strong className="text-gray-800">B2:</strong> 61-70%</span>
                          <span><strong className="text-gray-800">C:</strong> 51-60%</span>
                          <span><strong className="text-gray-800">D:</strong> 33-50%</span>
                          <span><strong className="text-red-600">E:</strong> Below 33% (Fail)</span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Teacher&apos;s Remarks</h4>
                          <div className="w-full h-20 border-b-2 border-dashed border-gray-300"></div>
                        </div>
                      </div>

                      {/* Signature Boxes */}
                      <div className="mt-8 flex items-end justify-between px-8 pb-4">
                        
                        <div className="flex flex-col items-center relative group cursor-pointer">
                          <div className="w-48 border-b-2 border-gray-800 flex justify-center items-end h-16">
                            {classTeacherSignature && <img src={classTeacherSignature} alt="Class Teacher Signature" className="max-h-16 max-w-full object-contain mb-1" />}
                          </div>
                          <span className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-500">Class Teacher</span>
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity no-print">
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">Upload Signature</span>
                          </div>
                          {/* Hidden File Input */}
                          <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e, setClassTeacherSignature)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Upload Class Teacher Signature" />
                        </div>
                        
                        <div className="flex flex-col items-center relative group cursor-pointer">
                          <div className="w-48 border-b-2 border-gray-800 flex justify-center items-end h-16">
                            {principalSignature && <img src={principalSignature} alt="Principal Signature" className="max-h-16 max-w-full object-contain mb-1" />}
                          </div>
                          <span className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-500">Principal</span>
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity no-print">
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">Upload Signature</span>
                          </div>
                          {/* Hidden File Input */}
                          <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e, setPrincipalSignature)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Upload Principal Signature" />
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="w-48 border-b-2 border-gray-800 h-16"></div>
                          <span className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-500">Parent / Guardian</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: RANKINGS */}
          {activeTab === 'rankings' && (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                
                {/* Highlighted Mobile-Friendly Filter Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 bg-purple-50/80 p-4 rounded-xl border-2 border-purple-100 shadow-inner">
                  <div className="flex items-center gap-2 text-purple-900">
                    <div className="bg-purple-200 p-1.5 rounded-lg">
                      <svg className="w-5 h-5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight">Class Rankings</h3>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <label htmlFor="rankingsFilter" className="text-sm font-bold text-purple-800 whitespace-nowrap hidden sm:block">
                        Show rankings for:
                      </label>
                      <div className="relative w-full sm:w-auto">
                        <select
                          id="rankingsFilter"
                          value={rankingsExamFilter}
                          onChange={(e) => setRankingsExamFilter(e.target.value)}
                          className="appearance-none w-full sm:w-[220px] rounded-lg border-2 border-purple-200 bg-white px-4 py-2.5 pr-10 text-sm font-bold text-purple-900 shadow-sm outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/20 transition-all cursor-pointer"
                        >
                          <option value="all">🏆 Overall</option>
                          {exams.map(ex => (
                            <option key={ex.id} value={ex.id}>📝 {ex.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-purple-500">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                      <button
                        onClick={exportRankingsToCSV}
                        disabled={students.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-50 text-green-700 px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto whitespace-nowrap border border-green-200"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                      </button>

                      <button
                        onClick={handleDownloadAllZip}
                        disabled={isBulkDownloading || students.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto whitespace-nowrap"
                      >
                      {isBulkDownloading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Zipping ({bulkProgress}/{students.length})
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download All (.zip)
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {students.length === 0 ? (
                  <p className="text-sm text-gray-500">No students found in the roster.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-left text-xs sm:text-sm text-gray-600">
                      <thead className="bg-gray-50 text-gray-700">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold w-12 sm:w-auto">Rank</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold truncate max-w-[100px] sm:max-w-none">Student</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-right">Score</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-right"><span className="hidden sm:inline">Percentage</span><span className="sm:hidden">%</span></th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-right w-10 sm:w-auto"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          const filteredExams = rankingsExamFilter === 'all' ? exams : exams.filter(e => e.id === rankingsExamFilter);
                          
                          const rankedStudents = students.map(student => {
                            let grandScore = 0;
                            let grandMax = 0;
                            filteredExams.forEach(ex => {
                              subjects.forEach(sub => {
                                const score = examGrades[ex.id]?.[sub.id]?.[student.id];
                                if (score) {
                                  grandScore += Number(score);
                                  grandMax += (ex.maxMarks || 100);
                                }
                              });
                            });
                            return { ...student, grandScore, grandMax, percent: grandMax > 0 ? (grandScore / grandMax) * 100 : 0 };
                          }).sort((a, b) => b.grandScore - a.grandScore);

                          let currentRank = 1;
                          return rankedStudents.map((student, index) => {
                            if (index > 0 && student.grandScore < rankedStudents[index - 1].grandScore) {
                              currentRank = index + 1;
                            }
                            
                            const isTop3 = currentRank <= 3 && student.grandScore > 0;
                            
                            return (
                              <tr key={student.id} className={`hover:bg-gray-50 ${currentRank === 1 && student.grandScore > 0 ? 'bg-amber-50/30' : ''}`}>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">
                                  {student.grandScore === 0 ? (
                                    <span className="text-gray-400">-</span>
                                  ) : isTop3 ? (
                                    <span className={`inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full font-bold text-[10px] sm:text-xs ${
                                      currentRank === 1 ? 'bg-amber-100 text-amber-700' :
                                      currentRank === 2 ? 'bg-gray-200 text-gray-700' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {currentRank}
                                    </span>
                                  ) : (
                                    <span className="text-gray-600 text-[10px] sm:text-sm">#{currentRank}</span>
                                  )}
                                </td>
                                <td className={`px-2 sm:px-4 py-2 sm:py-3 truncate max-w-[100px] sm:max-w-none ${isTop3 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                                  {student.name}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-gray-900 text-[11px] sm:text-sm">
                                  {student.grandScore} <span className="text-[10px] sm:text-xs text-gray-400">/ {student.grandMax}</span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                                  <span className={`inline-flex items-center rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold ring-1 ring-inset ${
                                    student.percent >= 40 ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                    student.percent > 0 ? 'bg-red-50 text-red-700 ring-red-600/20' : 'bg-gray-50 text-gray-500 ring-gray-200'
                                  }`}>
                                    {Math.round(student.percent)}%
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                                  <button
                                    onClick={() => handleQuickDownload(student.id)}
                                    title="Download Report Card"
                                    className="inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
