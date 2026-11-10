/**
 * Magyarországi tanév rendje, iskolai szünetek és munkanap-számítás
 * A pedagógusoknak 15 munkanap áll rendelkezésükre a dolgozatok kijavítására.
 * A hétvégék, az állami munkaszüneti napok és az iskolai szünetek (őszi, téli, tavaszi, nyári) NEM számítanak bele!
 */

export const DEFAULT_VACATIONS = {
  autumnStart: '2026-10-24',
  autumnEnd: '2026-11-01',
  autumn: '2026-10-24',
  winterStart: '2026-12-19',
  winterEnd: '2027-01-03',
  winter: '2026-12-19',
  springStart: '2027-03-25',
  springEnd: '2027-04-06',
  spring: '2027-03-25',
  summerStart: '2027-06-16',
  summerEnd: '2027-08-31',
  summer: '2027-06-16'
};

/**
 * Húsvétvasárnap kiszámítása az adott évre (Meeus/Jones/Butcher algoritmus)
 */
export function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Ellenőrzi, hogy az adott nap hivatalos magyar munkaszüneti nap-e
 */
export function isPublicHoliday(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();

  // Fix nemzeti és állami ünnepek
  if (m === 1 && day === 1) return true; // Újév
  if (m === 3 && day === 15) return true; // 1848-as forradalom ünnepe
  if (m === 5 && day === 1) return true; // A munka ünnepe
  if (m === 8 && day === 20) return true; // Államalapítás ünnepe
  if (m === 10 && day === 23) return true; // 1956-os forradalom ünnepe
  if (m === 11 && day === 1) return true; // Mindenszentek
  if (m === 12 && (day === 24 || day === 25 || day === 26)) return true; // Karácsony

  // Mozgó ünnepek (Húsvét, Pünkösd)
  const easter = getEasterSunday(year);
  
  // Nagypéntek (Húsvétvasárnap - 2 nap)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);

  // Húsvéthétfő (Húsvétvasárnap + 1 nap)
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  // Pünkösdhétfő (Húsvétvasárnap + 50 nap)
  const whitMonday = new Date(easter);
  whitMonday.setDate(easter.getDate() + 50);

  const isSameDay = (d1, d2) => 
    d1.getFullYear() === d2.getFullYear() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getDate() === d2.getDate();

  if (isSameDay(d, goodFriday) || isSameDay(d, easterMonday) || isSameDay(d, whitMonday)) {
    return true;
  }

  return false;
}

/**
 * Szöveges dátum (YYYY-MM-DD vagy YYYY. MM. DD.) biztonságos helyi Date objektummá alakítása
 */
export function parseLocalDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }

  const str = String(dateInput).trim().replace(/\.\s*/g, '-').replace(/-$/, '');
  const parts = str.split('-').map(Number);
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
}

/**
 * A szünetek intervallumainak lekérése
 */
export function getVacationRanges(customVacations = {}) {
  const merged = { ...DEFAULT_VACATIONS, ...customVacations };
  
  const parseRange = (name, startKey, endKey, defaultStart, defaultEnd) => {
    let start = parseLocalDate(merged[startKey] || merged[name.toLowerCase()]);
    let end = parseLocalDate(merged[endKey]);

    if (!start) start = parseLocalDate(defaultStart);
    if (!end) {
      if (defaultEnd) {
        end = parseLocalDate(defaultEnd);
      } else if (start) {
        // Ha csak kezdődátum van megadva, alapértelmezett hossz
        end = new Date(start);
        end.setDate(end.getDate() + 7);
      }
    }

    return { name, start, end };
  };

  return [
    parseRange('Őszi szünet', 'autumnStart', 'autumnEnd', DEFAULT_VACATIONS.autumnStart, DEFAULT_VACATIONS.autumnEnd),
    parseRange('Téli szünet', 'winterStart', 'winterEnd', DEFAULT_VACATIONS.winterStart, DEFAULT_VACATIONS.winterEnd),
    parseRange('Tavaszi szünet', 'springStart', 'springEnd', DEFAULT_VACATIONS.springStart, DEFAULT_VACATIONS.springEnd),
    parseRange('Nyári szünet', 'summerStart', 'summerEnd', DEFAULT_VACATIONS.summerStart, DEFAULT_VACATIONS.summerEnd)
  ];
}

/**
 * Ellenőrzi, hogy egy adott nap iskolai szünetre esik-e
 */
export function getActiveVacationForDate(d, customVacations = {}) {
  const ranges = getVacationRanges(customVacations);
  const targetTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  for (const r of ranges) {
    if (!r.start || !r.end) continue;
    const startTime = new Date(r.start.getFullYear(), r.start.getMonth(), r.start.getDate()).getTime();
    const endTime = new Date(r.end.getFullYear(), r.end.getMonth(), r.end.getDate()).getTime();
    if (targetTime >= startTime && targetTime <= endTime) {
      return r.name;
    }
  }
  return null;
}

/**
 * Munkanap-e az adott nap (nem hétvége, nem ünnep és nem iskolai szünet)
 */
export function isWorkingDay(d, customVacations = {}) {
  const day = d.getDay();
  if (day === 0 || day === 6) return false; // Hétvége
  if (isPublicHoliday(d)) return false; // Ünnepnap
  if (getActiveVacationForDate(d, customVacations)) return false; // Iskolai szünet
  return true;
}

/**
 * Dolgozat javítási határidő és hátralévő munkanapok kiszámítása (15 munkanap)
 */
export function getExamDeadlineInfo(examDateInput, status, customVacations = {}) {
  if (status !== 'written') return null; // Csak a megíratott, javításra váró dolgozatoknál számolunk határidőt
  
  const examDate = parseLocalDate(examDateInput);
  if (!examDate || isNaN(examDate.getTime())) return null;

  // 15 munkanap hozzáadása
  let daysAdded = 0;
  const deadlineDate = new Date(examDate);
  const encounteredVacations = new Set();

  while (daysAdded < 15) {
    deadlineDate.setDate(deadlineDate.getDate() + 1);
    
    // Rögzítjük, ha szünetbe botlott a számlálás (hogy jelezhessük a felületen)
    const vacName = getActiveVacationForDate(deadlineDate, customVacations);
    if (vacName) {
      encounteredVacations.add(vacName);
    }

    if (isWorkingDay(deadlineDate, customVacations)) {
      daysAdded++;
    }
  }

  // Hátralévő munkanapok száma a mai naptól a határidőig
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(today);
  const targetDate = new Date(deadlineDate);
  targetDate.setHours(0, 0, 0, 0);

  let workDaysLeft = 0;
  if (checkDate < targetDate) {
    while (checkDate < targetDate) {
      checkDate.setDate(checkDate.getDate() + 1);
      if (isWorkingDay(checkDate, customVacations)) {
        workDaysLeft++;
      }
    }
  } else if (checkDate > targetDate) {
    while (checkDate > targetDate) {
      if (isWorkingDay(checkDate, customVacations)) {
        workDaysLeft--;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Naptári napok eltérése
  const diffCalendarDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

  return {
    deadlineDate,
    dateStr: deadlineDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
    fullDateStr: deadlineDate.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    workDaysLeft,
    calendarDaysLeft: diffCalendarDays,
    isWarning: workDaysLeft <= 3 && workDaysLeft >= 0,
    isLate: workDaysLeft < 0,
    isToday: workDaysLeft === 0,
    skippedVacations: Array.from(encounteredVacations)
  };
}
