'use client';

import { useApp } from './AppProvider';
import {
  getCalendarDays,
  isWeekend,
  formatDateKey,
  MONTH_NAMES,
  DAY_NAMES,
} from '@/utils/dateHelpers';
import { useEffect, useRef } from 'react';

export default function Calendar() {
  const {
    currentMonth,
    selectedDate,
    holidays,
    students,
    attendance,
    goToPrevMonth,
    goToNextMonth,
    jumpToMonth,
    setSelectedDate,
    toggleHoliday,
  } = useApp();

  const { year, month } = currentMonth;
  // Only keep days belonging to the current month for the horizontal strip
  const allDays = getCalendarDays(currentMonth.year, currentMonth.month);
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const todayKey = formatDateKey(new Date());
  
  const scrollContainerRef = useRef(null);

  // Auto-scroll to the selected date whenever it changes or month changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedEl = scrollContainerRef.current.querySelector('.selected-day');
      if (selectedEl) {
        // Use a slight timeout to ensure render is complete
        setTimeout(() => {
          selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 50);
      }
    }
  }, [currentMonth, selectedDate]);

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    
    if (scrollLeft <= 5) {
      goToPrevMonth();
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ left: scrollContainerRef.current.scrollWidth, behavior: 'instant' });
          scrollContainerRef.current.scrollBy({ left: -clientWidth, behavior: 'smooth' });
        }
      }, 50);
    } else {
      scrollContainerRef.current.scrollBy({ left: -clientWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 5) {
      goToNextMonth();
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'instant' });
          scrollContainerRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }, 50);
    } else {
      scrollContainerRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
    }
  };

  const handleDayClick = (dayObj) => {
    setSelectedDate(dayObj.dateKey);
  };

  const handleHolidayToggle = (e, dayObj) => {
    e.stopPropagation();
    if (isWeekend(dayObj.date)) return;
    toggleHoliday(dayObj.dateKey);
  };

  return (
    <div className="card p-5">
      {/* Month Navigation */}
      <div className="mb-5 flex items-center justify-between">
        <button
          id="btn-prev-month"
          onClick={scrollLeft}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          aria-label="Previous month"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="relative flex items-center justify-center group cursor-pointer hover:bg-gray-50 px-3 py-1 rounded-md transition-colors" title="Select a specific date">
          <input 
            type="date"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
              if(!e.target.value) return;
              const [y, m] = e.target.value.split('-');
              jumpToMonth(parseInt(y, 10), parseInt(m, 10) - 1);
              setSelectedDate(e.target.value);
            }}
          />
          <h2 className="text-sm font-bold text-gray-800 pointer-events-none flex items-center gap-1.5">
            {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
            <svg className="h-3 w-3 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </h2>
        </div>

        <button
          id="btn-next-month"
          onClick={scrollRight}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          aria-label="Next month"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Horizontal Day Strip */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto custom-scrollbar pb-4 pt-1 snap-x snap-mandatory"
      >
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex min-w-full justify-between gap-1.5 px-2 snap-center">
            {week.map((dayObj) => {
              const isSelected = dayObj.dateKey === selectedDate;
              const isToday = dayObj.dateKey === todayKey;
              const isHoliday = holidays.has(dayObj.dateKey);
              const weekend = isWeekend(dayObj.date);
              const dayName = DAY_NAMES[dayObj.date.getDay()];

              // Calculate attendance for this day
              const dateAttendance = attendance[dayObj.dateKey] || {};
              let presentCount = 0;
              if (students.length > 0 && !weekend && !isHoliday) {
                presentCount = students.filter(s => dateAttendance[s.id] === 'present').length;
              }

              let cls = 'relative flex-1 flex flex-col min-w-0 h-[84px] items-center justify-center rounded-xl cursor-pointer transition-all border ';

              if (isSelected) {
                cls += 'bg-green-600 border-green-600 text-white shadow-md selected-day scale-[1.03] z-10 ';
              } else if (isHoliday || weekend) {
                cls += 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 ';
              } else if (presentCount > 0) {
                cls += 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100 ';
              } else {
                cls += 'bg-white border-gray-200 text-gray-800 hover:border-green-300 hover:bg-green-50 ';
              }

              if (!dayObj.isCurrentMonth && !isSelected) {
                cls += 'opacity-50 hover:opacity-100 ';
              }

              return (
                <div
                  key={dayObj.dateKey}
                  className={cls}
                  onClick={() => handleDayClick(dayObj)}
                  onContextMenu={(e) => { e.preventDefault(); handleHolidayToggle(e, dayObj); }}
                  title={!weekend ? 'Click to select · Right-click to toggle holiday' : undefined}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-green-100' : weekend || isHoliday ? 'text-red-400' : presentCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {dayName}
                  </span>
                  <span className={`text-xl font-bold leading-tight ${isToday && !isSelected ? 'text-green-600 underline decoration-2 underline-offset-4' : presentCount > 0 && !isSelected ? 'text-green-800' : ''}`}>
                    {dayObj.date.getDate()}
                  </span>
                  
                  {/* Attendance Ratio */}
                  {!weekend && !isHoliday && students.length > 0 && (
                    <span className={`text-[9px] font-medium mt-1 ${isSelected ? 'text-green-200' : presentCount > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      {presentCount}/{students.length}
                    </span>
                  )}
                  
                  {/* Today indicator */}
                  {isToday && !isSelected && (
                    <span className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  )}

                  {/* Holiday badge */}
                  {isHoliday && !isSelected && (
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-5 border-t border-gray-100 pt-3 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-600" />
          Selected
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-50 border border-red-200" />
          Holiday
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-green-600 ml-0.5 mr-0.5" />
          Today
        </div>
        <span className="ml-auto hidden sm:block">Right-click a day to toggle holiday</span>
      </div>
    </div>
  );
}
