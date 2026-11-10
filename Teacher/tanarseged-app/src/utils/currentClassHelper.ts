export interface TimetableEntry {
  day: number;       // 1=Hé, 2=Ke, 3=Sz, 4=Cs, 5=Pé
  period: number;    // 1-10
  subject: string;   // "mat", "fiz"
  className: string; // "10.a", "9.c"
  room: string;      // "225"
  groupCode: string; // "CS1", "MAT1"
}

// Fix időbeosztás az iskolai csengetési rend alapján
export const PERIODS = [
  { p: 1, start: '07:30', end: '08:15' },
  { p: 2, start: '08:25', end: '09:10' },
  { p: 3, start: '09:20', end: '10:05' },
  { p: 4, start: '10:20', end: '11:05' },
  { p: 5, start: '11:15', end: '12:00' },
  { p: 6, start: '12:20', end: '13:05' },
  { p: 7, start: '13:25', end: '14:10' },
  { p: 8, start: '14:20', end: '15:05' },
  { p: 9, start: '15:10', end: '15:55' },
  { p: 10, start: '16:00', end: '16:40' },
];

/**
 * Szöveges "HH:MM" formátumú időt percre konvertál a nap elejétől
 */
const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Visszaadja az aktuális időszakot (óra vagy szünet) a rendszeridő alapján.
 */
export const getCurrentPeriodInfo = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Vas, 1 = Hét ... 6 = Szo
  
  // Hétvégén nincs óra
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { type: 'weekend', day: dayOfWeek, message: 'Hétvége van' };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Óra előtt
  if (currentMinutes < timeToMinutes(PERIODS[0].start)) {
    return { type: 'before_school', day: dayOfWeek, message: 'Tanítás előtt' };
  }

  // Óra után
  if (currentMinutes > timeToMinutes(PERIODS[PERIODS.length - 1].end)) {
    return { type: 'after_school', day: dayOfWeek, message: 'Tanítás véget ért' };
  }

  for (let i = 0; i < PERIODS.length; i++) {
    const pStart = timeToMinutes(PERIODS[i].start);
    const pEnd = timeToMinutes(PERIODS[i].end);

    // Aktuális óra tart
    if (currentMinutes >= pStart && currentMinutes <= pEnd) {
      return { 
        type: 'class', 
        day: dayOfWeek, 
        period: PERIODS[i].p,
        startStr: PERIODS[i].start,
        endStr: PERIODS[i].end,
        progress: (currentMinutes - pStart) / (pEnd - pStart)
      };
    }

    // Szünet ellenőrzése (az aktuális óra vége és a következő kezdete között)
    if (i < PERIODS.length - 1) {
      const nextStart = timeToMinutes(PERIODS[i + 1].start);
      if (currentMinutes > pEnd && currentMinutes < nextStart) {
        return {
          type: 'break',
          day: dayOfWeek,
          nextPeriod: PERIODS[i + 1].p,
          minutesLeft: nextStart - currentMinutes
        };
      }
    }
  }

  return { type: 'unknown', day: dayOfWeek, message: 'Ismeretlen időszak' };
};

/**
 * Visszaadja a jelenlegi órát a localStorage-ből betöltött órarend alapján
 */
export const getCurrentClass = (timetable: TimetableEntry[]) => {
  const info = getCurrentPeriodInfo();
  
  if (info.type === 'class') {
    const currentEntry = timetable.find(t => t.day === info.day && t.period === info.period);
    if (currentEntry) {
      return { status: 'active', entry: currentEntry, info };
    } else {
       return { status: 'free', info, message: `${info.period}. óra (Lyukasóra)` };
    }
  } else if (info.type === 'break') {
    const nextEntry = timetable.find(t => t.day === info.day && t.period === info.nextPeriod);
    if (nextEntry) {
       return { status: 'break', nextEntry, info, message: `Szünet. Következő: ${info.nextPeriod}. óra (${nextEntry.subject} - ${nextEntry.className})` };
    } else {
       return { status: 'break', info, message: `Szünet. Következő: lyukasóra` };
    }
  }

  return { status: 'inactive', info };
};
