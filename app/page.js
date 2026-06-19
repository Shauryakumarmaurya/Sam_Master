'use client';

import AppProvider from '@/components/AppProvider';
import Header from '@/components/Header';
import Calendar from '@/components/Calendar';
import AttendanceSheet from '@/components/AttendanceSheet';
import MonthlyReport from '@/components/MonthlyReport';
import StudentRosterModal from '@/components/StudentRosterModal';
import AttendanceSheetModal from '@/components/AttendanceSheetModal';
import MarksCard from '@/components/MarksCard';
import MarksSheetModal from '@/components/MarksSheetModal';
import GradebookModal from '@/components/GradebookModal';
import SyncImportHelper from '@/components/SyncImportHelper';
import SplashScreen from '@/components/SplashScreen';
import { Suspense } from 'react';

export default function Home() {
  return (
    <AppProvider>
      <SplashScreen />
      <div className="flex min-h-screen flex-col" style={{ background: '#f9fafb' }}>
        <Header />

        <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-6">
            <Calendar />
            <div className="grid gap-6 md:grid-cols-2">
              <AttendanceSheet />
              <MarksCard />
            </div>
          </div>
        </main>

        <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400">
          Student Attendance Manager
        </footer>

        <MonthlyReport />
        <StudentRosterModal />
        <AttendanceSheetModal />
        <MarksSheetModal />
        <GradebookModal />
        <Suspense fallback={null}>
          <SyncImportHelper />
        </Suspense>
      </div>
    </AppProvider>
  );
}
