
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendarProps {
  availableDates: string[]; // YYYY-MM-DD
  onDateChange?: (date: string) => void;
  isEditable: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ availableDates, onDateChange, isEditable }) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Add padding for days from previous month
  for (let i = 0; i < startDay; i++) {
    daysInMonth.push(null);
  }

  // Add days of the current month
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
  
  const handleDateClick = (date: Date) => {
    if (!isEditable || date < today) return;
    const dateString = date.toISOString().split('T')[0];
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

          const dateString = day.toISOString().split('T')[0];
          const isToday = day.getTime() === today.getTime();
          const isAvailable = availableDates.includes(dateString);
          const isPast = day < today;

          let buttonClass = "w-full aspect-square flex items-center justify-center rounded-full text-sm transition-colors duration-200";

          if (isPast) {
            buttonClass += " text-gray-400 dark:text-gray-600 cursor-not-allowed";
          } else if (isAvailable) {
            buttonClass += " bg-[var(--accent-primary)] text-white font-bold";
            if (isEditable) buttonClass += " hover:bg-[var(--accent-primary-hover)]";
          } else if(isToday) {
            buttonClass += " bg-[var(--bg-accent-light)] text-[var(--text-accent)] font-bold";
            if (isEditable) buttonClass += " hover:bg-pink-200 dark:hover:bg-pink-900/50";
          } else {
             buttonClass += " text-[var(--text-secondary)]";
             if (isEditable) buttonClass += " hover:bg-[var(--bg-hover)]";
          }

          return (
            <div key={day.toString()}>
              <button
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={isPast && !isEditable}
                className={buttonClass}
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
