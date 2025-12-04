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
    <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border-color)]">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">&larr;</button>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <button type="button" onClick={handleNextMonth} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">&rarr;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-[var(--text-light)] mb-2">
        {dayNames.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const year = day.getFullYear();
          const month = String(day.getMonth() + 1).padStart(2, '0');
          const d = String(day.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${d}`;

          const isToday = day.getTime() === today.getTime();
          const isAvailable = safeAvailableDates.includes(dateString);
          const isPast = day < today;
          
          // This logic ensures pending dates (which are removed from safeAvailableDates) appear disabled
          const isDisabled = isPast || (restrictToAvailable && !isAvailable);

          let buttonClass = "w-full aspect-square flex items-center justify-center rounded-full text-sm transition-colors duration-200";

          if (isDisabled) {
            buttonClass += " text-gray-300 dark:text-gray-700 cursor-not-allowed bg-gray-50 dark:bg-gray-800";
          } else if (isAvailable) {
            buttonClass += " bg-[var(--accent-primary)] text-white font-bold shadow-sm";
            if (isEditable) buttonClass += " hover:bg-[var(--accent-primary-hover)] hover:scale-105 transform";
          } else {
            buttonClass += " text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]";
            if (isToday) buttonClass += " border-2 border-[var(--accent-primary)] font-bold text-[var(--accent-primary)]";
          }

          return (
            <div key={day.toString()}>
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