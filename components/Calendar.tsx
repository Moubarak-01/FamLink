import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendarProps {
  availableDates?: string[];
  onDateChange?: (date: string) => void;
  isEditable: boolean;
  restrictToAvailable?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ availableDates = [], onDateChange, isEditable, restrictToAvailable = false }) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Safe array check
  const safeAvailableDates = Array.isArray(availableDates) ? availableDates : [];

  const monthNames = useMemo(() => [
    t('month_january'), t('month_february'), t('month_march'), t('month_april'),
    t('month_may'), t('month_june'), t('month_july'), t('month_august'),
    t('month_september'), t('month_october'), t('month_november'), t('month_december')
  ], [t]);

  const dayNames = useMemo(() => [
    t('day_sun'), t('day_mon'), t('day_tue'), t('day_wed'),
    t('day_thu'), t('day_fri'), t('day_sat')
  ], [t]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = [];
  const startDay = firstDayOfMonth.getDay();

  for (let i = 0; i < startDay; i++) {
    daysInMonth.push(null);
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: Date) => {
    if (!isEditable) return;

    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${d}`;

    if (day < today) return;

    if (restrictToAvailable && !safeAvailableDates.includes(dateString)) return;

    onDateChange?.(dateString);
  };

  return (
    <div className="w-full max-w-[900px] mx-auto bg-[var(--bg-input)] p-6 rounded-2xl border border-white/10 shadow-xl transition-all duration-300">
      <div className="flex justify-between items-center mb-8 px-2">
        <button type="button" onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">&larr;</button>
        <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <button type="button" onClick={handleNextMonth} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 gap-y-4 mb-4">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 gap-x-1 justify-items-center">
        {daysInMonth.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const year = day.getFullYear();
          const month = String(day.getMonth() + 1).padStart(2, '0');
          const d = String(day.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${d}`;

          const isToday = day.getTime() === today.getTime();
          const isAvailable = safeAvailableDates.includes(dateString);
          const isPast = day < today;
          const isDisabled = isPast || (restrictToAvailable && !isAvailable);

          let buttonClass = "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-sm transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]";

          if (isDisabled) {
            buttonClass += " text-gray-300 dark:text-gray-700 cursor-not-allowed bg-transparent";
          } else if (isAvailable) {
            buttonClass += " bg-[var(--accent-primary)] text-white font-bold shadow-md hover:shadow-lg";
            if (isEditable) buttonClass += " hover:scale-110";
          } else {
            buttonClass += " text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]";
            if (isToday) buttonClass += " bg-[var(--bg-card)] border border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold shadow-[0_0_15px_rgba(236,72,153,0.3)]";
            if (isEditable) buttonClass += " hover:scale-110 hover:bg-[var(--bg-card-subtle)]";
          }

          return (
            <div key={day.toString()} className="flex justify-center items-center">
              <button
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={isDisabled && isEditable}
                className={buttonClass}
                title={isAvailable ? "Available" : "Unavailable"}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;