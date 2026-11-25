import { parseLocalDate } from './schoolHolidays';

/**
 * Calculates current and next class, along with break time and progress percentage.
 */
export function getLiveScheduleInfo(schedule, currentTime, selectedDayIndex) {
  if (!schedule || schedule.length === 0) {
    return { current: null, next: null, progress: 0, breakTime: null };
  }

  let todayIdx = new Date().getDay();
  if (todayIdx === 0 || todayIdx === 6) todayIdx = 1;
  const viewingToday = selectedDayIndex === null || selectedDayIndex === todayIdx;

  if (!viewingToday) {
    return { current: null, next: null, progress: 0, breakTime: null };
  }

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentSeconds = currentMinutes * 60 + currentTime.getSeconds();

  let currentClass = null;
  let nextClass = null;
  let progress = 0;
  let breakTime = null;

  for (let i = 0; i < schedule.length; i++) {
    const ora = schedule[i];
    if (!ora.duration || !ora.duration.includes('-')) continue;

    const [startStr, endStr] = ora.duration.split(' - ');
    const startMin = parseInt(startStr.split(':')[0], 10) * 60 + parseInt(startStr.split(':')[1], 10);
    const endMin = parseInt(endStr.split(':')[0], 10) * 60 + parseInt(endStr.split(':')[1], 10);
    const startSec = startMin * 60;
    const endSec = endMin * 60;

    if (currentSeconds >= startSec && currentSeconds <= endSec) {
      currentClass = ora;
      progress = ((currentSeconds - startSec) / (endSec - startSec)) * 100;
    }

    if (startMin > currentMinutes && !nextClass) {
      nextClass = ora;
      if (i > 0) {
        const prevOra = schedule[i - 1];
        if (prevOra.duration && prevOra.duration.includes('-')) {
          const prevEndStr = prevOra.duration.split(' - ')[1];
          const prevEndMin = parseInt(prevEndStr.split(':')[0], 10) * 60 + parseInt(prevEndStr.split(':')[1], 10);
          if (currentMinutes >= prevEndMin && currentMinutes < startMin) {
            const breakStartSec = prevEndMin * 60;
            const breakEndSec = startMin * 60;
            const breakDuration = (breakEndSec - breakStartSec) / 60;
            const breakLabel = breakDuration > 10 ? `Nagyszünet (${breakDuration} perc)` : `Szünet (${breakDuration} perc)`;
            breakTime = {
              label: breakLabel,
              progress: ((currentSeconds - breakStartSec) / (breakEndSec - breakStartSec)) * 100,
              timeLeft: Math.ceil((breakEndSec - currentSeconds) / 60)
            };
          }
        }
      }
    }
  }

  return { current: currentClass, next: nextClass, progress, breakTime };
}

/**
 * Finds the upcoming vacation and calculates days remaining.
 */
export function getNextVacation(vacationDates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const vacations = [
    { name: 'Őszi szünet', date: parseLocalDate(vacationDates.autumnStart || vacationDates.autumn) },
    { name: 'Téli szünet', date: parseLocalDate(vacationDates.winterStart || vacationDates.winter) },
    { name: 'Tavaszi szünet', date: parseLocalDate(vacationDates.springStart || vacationDates.spring) },
    { name: 'Nyári szünet', date: parseLocalDate(vacationDates.summerStart || vacationDates.summer) }
  ].filter((v) => v.date);

  const upcoming = vacations.filter((v) => v.date > today).sort((a, b) => a.date - b.date);
  if (upcoming.length === 0) return null;

  const nextV = upcoming[0];
  const diffTime = Math.abs(nextV.date - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    name: nextV.name,
    days: diffDays,
    dateStr: nextV.date.toLocaleString('hu-HU', { month: 'long', day: 'numeric' }),
    allUpcoming: upcoming.map((v) => ({
      name: v.name,
      days: Math.ceil(Math.abs(v.date - today) / (1000 * 60 * 60 * 24)),
      dateStr: v.date.toLocaleString('hu-HU', { month: 'long', day: 'numeric' })
    }))
  };
}
