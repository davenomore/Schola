import nameDays from '../utils/nameDays.json';

export function requestDesktopNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.requestPermission();
  }
  return Promise.resolve('denied');
}

export function sendDesktopNotification(title, options = {}) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (e) {
      console.warn('Desktop notification failed:', e);
    }
  }
  return null;
}

/**
 * Smart Notification Engine (SNE) for Schola
 * Analyzes schedule, exams, todos, class data, and wellbeing to generate proactive, context-aware alerts.
 */

export function evaluateSmartNotifications({
  schedule = [],
  liveScheduleInfo = null,
  todos = [],
  hydrationProgress = 0,
  dismissedIds = [],
  snoozedUntil = {}
}) {
  const notifications = [];
  const now = new Date();
  const nowTime = now.getTime();

  // Helper to check if an alert is dismissed or snoozed
  const isSuppressed = (id) => {
    if (dismissedIds.includes(id)) return true;
    if (snoozedUntil[id] && snoozedUntil[id] > nowTime) return true;
    return false;
  };

  // -------------------------------------------------------------
  // 1. Dolgozat Radar & Javítási Határidő Elemzés
  // -------------------------------------------------------------
  try {
    const savedExamsRaw = localStorage.getItem('ekreta_exams');
    if (savedExamsRaw) {
      const examsMap = JSON.parse(savedExamsRaw);
      const allExams = Object.values(examsMap).flat();

      allExams.forEach((exam) => {
        if (!exam || !exam.date) return;
        const examDate = new Date(exam.date);
        const diffDays = Math.floor((nowTime - examDate.getTime()) / (1000 * 60 * 60 * 24));

        // Ha a dolgozat megíródott, de még nincs kész (pl. 'grading' vagy 'planned' múltbeli dátummal)
        if (exam.status !== 'ready' && diffDays >= 7) {
          const alertId = `exam-deadline-${exam.id || exam.date + exam.group}`;
          if (!isSuppressed(alertId)) {
            const isCritical = diffDays >= 12;
            notifications.push({
              id: alertId,
              category: 'exam',
              priority: isCritical ? 'urgent' : 'warning',
              badge: isCritical ? 'Sürgős Határidő' : 'Javítási Emlékeztető',
              title: `${exam.subject || 'Dolgozat'} (${exam.group || 'Csoport'}) javítás`,
              message: `A dolgozat ${diffDays} napja íródott meg (${exam.topic || 'felmérő'}). A jogszabályi 14 napos javítási határidő ${14 - diffDays > 0 ? `${14 - diffDays} nap múlva lejár` : 'lejárt'}!`,
              actionLabel: 'Dolgozat Radar',
              targetTab: 'dolgozatok',
              timestamp: exam.date
            });
          }
        }
      });
    }
  } catch (err) {
    console.error('SNE Exam check error:', err);
  }

  // -------------------------------------------------------------
  // 2. Órarend & Katedra AI Előkészítési Javaslat
  // -------------------------------------------------------------
  try {
    const next = liveScheduleInfo ? (liveScheduleInfo.nextLesson || liveScheduleInfo.next) : null;
    if (next) {
      const alertId = `next-lesson-${next.subject || 'lesson'}-${now.toISOString().split('T')[0]}`;
      if (!isSuppressed(alertId)) {
        notifications.push({
          id: alertId,
          category: 'ai',
          priority: 'suggestion',
          badge: 'Katedra AI Tipp',
          title: `Következő óra: ${next.subject || 'Tanóra'} (${next.class || next.group || next.details || 'Csoport'})`,
          message: `Szeretnél egy gyors, 5 perces bemelegítő feladatsort vagy óravázlatot generálni a Katedra AI-val az órára?`,
          actionLabel: 'Katedra AI Megnyitása',
          targetTab: 'katedra-ai',
          actionPayload: { subject: next.subject, group: next.class || next.group || next.details }
        });
      }
    } else if (schedule && schedule.length > 0) {
      // Ha nincs közvetlen következő óra, de van holnapi óra
      const firstLesson = schedule[0];
      const alertId = `schedule-prep-${now.toISOString().split('T')[0]}`;
      if (!isSuppressed(alertId)) {
        notifications.push({
          id: alertId,
          category: 'ai',
          priority: 'suggestion',
          badge: 'Órai Felkészülés',
          title: `Óraterv javaslat: ${firstLesson.subject || 'Tanóra'}`,
          message: `A(z) ${firstLesson.group || firstLesson.className || 'osztály'} számára a Katedra AI segítségével pillanatok alatt összeállíthatsz egy differenciált feladatsort.`,
          actionLabel: 'Generálás Most',
          targetTab: 'katedra-ai'
        });
      }
    }
  } catch (err) {
    console.error('SNE Schedule check error:', err);
  }

  // -------------------------------------------------------------
  // 3. Sürgős Napi Teendők (Todos)
  // -------------------------------------------------------------
  try {
    const urgentTodos = todos.filter((t) => !t.done && (t.priority === 'Magas' || t.priority === 'Sürgős'));
    if (urgentTodos.length > 0) {
      const topTodo = urgentTodos[0];
      const alertId = `todo-urgent-${topTodo.id}`;
      if (!isSuppressed(alertId)) {
        notifications.push({
          id: alertId,
          category: 'todo',
          priority: 'warning',
          badge: 'Fontos Teendő',
          title: topTodo.text,
          message: topTodo.deadline
            ? `Határidő: ${topTodo.deadline}${topTodo.class ? ` (${topTodo.class})` : ''}. Ne felejtsd el elvégezni!`
            : 'Kiemelt prioritású teendő vár megoldásra a feladatlistádon.',
          actionLabel: 'Teendők Megtekintése',
          targetTab: 'vezérlőpult'
        });
      }
    }
  } catch (err) {
    console.error('SNE Todo check error:', err);
  }

  // -------------------------------------------------------------
  // 4. Osztályfőnöki & Névnapi Értesítés (HeadTeacher)
  // -------------------------------------------------------------
  try {
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateKey = `${month}-${day}`;
    const todayNames = nameDays && nameDays[dateKey] ? nameDays[dateKey] : null;

    if (todayNames) {
      const alertId = `nameday-${dateKey}`;
      if (!isSuppressed(alertId)) {
        notifications.push({
          id: alertId,
          category: 'celebration',
          priority: 'info',
          badge: 'Névnap Ma',
          title: `Ma ${todayNames} napja van!`,
          message: `Köszöntsd fel az érintett diákokat az osztályban és a kollégákat a tantestületben!`,
          actionLabel: 'Osztályfőnök Panel',
          targetTab: 'osztalyfonok'
        });
      }
    }
  } catch (err) {
    console.error('SNE Nameday check error:', err);
  }

  // -------------------------------------------------------------
  // 5. Tanári Jóllét & Hidratáció (Wellbeing)
  // -------------------------------------------------------------
  try {
    const hours = now.getHours();
    if (hours >= 11 && hydrationProgress < 50) {
      const alertId = `hydration-alert-${now.toISOString().split('T')[0]}`;
      if (!isSuppressed(alertId)) {
        notifications.push({
          id: alertId,
          category: 'wellbeing',
          priority: 'info',
          badge: 'Egészség & Jóllét',
          title: 'Igyál egy pohár vizet!',
          message: `Már ${hours} óra van, és a napi folyadékbeviteled mindössze ${hydrationProgress}%. A folyamatos beszéd és koncentráció mellett fontos a hidratálás!`,
          actionLabel: 'Ivás Rögzítése (+250ml)',
          actionType: 'DRINK_WATER'
        });
      }
    }
  } catch (err) {
    console.error('SNE Wellbeing check error:', err);
  }

  // Rendezés prioritás szerint: urgent -> warning -> suggestion -> info
  const priorityOrder = { urgent: 0, warning: 1, suggestion: 2, info: 3 };
  notifications.sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

  return notifications;
}
