import React, { useState, useEffect } from 'react';
import './index.css';
import Groups from './components/Groups';
import TeacherTools from './components/TeacherTools';
import Exams from './components/Exams';
import HeadTeacher from './components/HeadTeacher';
import KatedraAi from './components/KatedraAi';
import Timetable from './components/Timetable';
import LoginView from './components/auth/LoginView';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import TodoModal from './components/dashboard/TodoModal';
import ClassroomScreen from './components/classroom/ClassroomScreen';
import StudentWallView from './components/classroom/StudentWallView';
import StudentPollView from './components/classroom/StudentPollView';
import StudentQuizView from './components/classroom/StudentQuizView';
import Settings from './components/settings/Settings';
import ToastContainer from './components/ui/ToastContainer';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import { evaluateSmartNotifications } from './services/smartNotificationEngine';
import { DEFAULT_VACATIONS } from './utils/schoolHolidays';
import { getLiveScheduleInfo, getNextVacation } from './utils/scheduleHelpers';
import { findEmptySpaceForWidget, getWidgetDefaultSize } from './utils/classroomPlacement';
import { useWeather } from './hooks/useWeather';
import { API_BASE } from './config';
import {
  DEFAULT_WIDGET_SETTINGS,
  DEFAULT_WIDGET_SIZES,
  DEFAULT_WIDGET_HEIGHTS,
  DEFAULT_WIDGET_POSITIONS,
  DEFAULT_BOOKMARKS,
  DEFAULT_TODOS,
  TEACHER_QUOTES,
  STUDENT_QUOTES,
  MOCK_STUDENTS
} from './constants/dashboardConstants';

function MainApp() {

  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem('ekreta_sidebar_collapsed') === 'true'
  );
  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('ekreta_sidebar_collapsed', String(nextState));
  };

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('ekreta_logged_in') === 'true'
  );

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState('vezérlőpult');
  const [settingsSubTab, setSettingsSubTab] = useState('widgets');
  const [examsRefreshTrigger, setExamsRefreshTrigger] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [classroomWidgets, setClassroomWidgets] = useState([]);

  const addClassroomWidget = (type) => {
    setClassroomWidgets((prev) => {
      const defaultSize = getWidgetDefaultSize(type);
      const pos = findEmptySpaceForWidget(prev, defaultSize.width, defaultSize.height);
      return [
        ...prev,
        {
          id: Date.now().toString(),
          type,
          x: pos.x,
          y: pos.y,
          width: defaultSize.width,
          height: defaultSize.height
        }
      ];
    });
  };

  const updateWidgetBounds = (id, bounds) => {
    setClassroomWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...bounds } : w))
    );
  };

  const removeClassroomWidget = (id) => {
    setClassroomWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const [classroomBg, setClassroomBg] = useState(
    () => localStorage.getItem('ekreta_classroom_bg') || '#0a0a0a'
  );

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Schedule state
  const [schedule, setSchedule] = useState([]);
  const [scheduleDay, setScheduleDay] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Widget settings
  const [widgetSettings, setWidgetSettings] = useState(() => {
    const saved = localStorage.getItem('ekreta_widgets');
    return saved ? { ...DEFAULT_WIDGET_SETTINGS, ...JSON.parse(saved) } : DEFAULT_WIDGET_SETTINGS;
  });

  const updateWidgetSetting = (key, value) => {
    const newSettings = { ...widgetSettings, [key]: value };
    setWidgetSettings(newSettings);
    localStorage.setItem('ekreta_widgets', JSON.stringify(newSettings));
  };

  // Widget sizes & heights
  const [widgetSizes, setWidgetSizes] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_sizes');
    return saved ? { ...DEFAULT_WIDGET_SIZES, ...JSON.parse(saved) } : DEFAULT_WIDGET_SIZES;
  });

  const changeWidgetWidth = (key, w) => {
    if (w < 1 || w > 6) return;
    setWidgetSizes((prev) => {
      const n = { ...prev, [key]: w };
      localStorage.setItem('ekreta_widget_sizes', JSON.stringify(n));
      return n;
    });
  };

  const [widgetHeights, setWidgetHeights] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_heights');
    return saved ? { ...DEFAULT_WIDGET_HEIGHTS, ...JSON.parse(saved) } : DEFAULT_WIDGET_HEIGHTS;
  });

  const changeWidgetHeight = (key, h) => {
    if (h < 1 || h > 10) return;
    setWidgetHeights((prev) => {
      const n = { ...prev, [key]: h };
      localStorage.setItem('ekreta_widget_heights', JSON.stringify(n));
      return n;
    });
  };

  const [widgetPositions, setWidgetPositions] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_positions');
    if (saved) {
      try {
        return { ...DEFAULT_WIDGET_POSITIONS, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_WIDGET_POSITIONS;
  });

  // Todos state
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [newTodoDraft, setNewTodoDraft] = useState({
    text: '',
    deadline: '',
    class: '',
    lesson: '',
    priority: 'Közepes'
  });
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('ekreta_todos');
    return saved ? JSON.parse(saved) : DEFAULT_TODOS;
  });
  useEffect(() => {
    localStorage.setItem('ekreta_todos', JSON.stringify(todos));
  }, [todos]);

  // Post-it state
  const [postit, setPostit] = useState(
    () => localStorage.getItem('ekreta_postit') || 'Ne felejtsd el feladni a pénteki leckét!'
  );
  useEffect(() => {
    localStorage.setItem('ekreta_postit', postit);
  }, [postit]);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('ekreta_bookmarks');
    return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
  });
  useEffect(() => {
    localStorage.setItem('ekreta_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Quote state
  const [quoteType, setQuoteType] = useState(
    () => localStorage.getItem('ekreta_quote_type') || 'student'
  );
  useEffect(() => {
    localStorage.setItem('ekreta_quote_type', quoteType);
  }, [quoteType]);

  // Központi beállítás-szinkronizáció a szerverrel (minden IP-cím és eszköz azonnal szinkronban)
  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard-config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.data) {
          const cfg = data.data;
          if (cfg.widgetSettings) {
            setWidgetSettings(cfg.widgetSettings);
            localStorage.setItem('ekreta_widgets', JSON.stringify(cfg.widgetSettings));
          }
          if (cfg.widgetSizes) {
            setWidgetSizes(cfg.widgetSizes);
            localStorage.setItem('ekreta_widget_sizes', JSON.stringify(cfg.widgetSizes));
          }
          if (cfg.widgetHeights) {
            setWidgetHeights(cfg.widgetHeights);
            localStorage.setItem('ekreta_widget_heights', JSON.stringify(cfg.widgetHeights));
          }
          if (cfg.widgetPositions) {
            setWidgetPositions(cfg.widgetPositions);
            localStorage.setItem('ekreta_widget_positions', JSON.stringify(cfg.widgetPositions));
          }
          if (cfg.todos && Array.isArray(cfg.todos)) {
            setTodos(cfg.todos);
            localStorage.setItem('ekreta_todos', JSON.stringify(cfg.todos));
          }
          if (cfg.bookmarks && Array.isArray(cfg.bookmarks)) {
            setBookmarks(cfg.bookmarks);
            localStorage.setItem('ekreta_bookmarks', JSON.stringify(cfg.bookmarks));
          }
          if (cfg.postit !== undefined) {
            setPostit(cfg.postit);
            localStorage.setItem('ekreta_postit', cfg.postit);
          }
          if (cfg.quoteType) {
            setQuoteType(cfg.quoteType);
            localStorage.setItem('ekreta_quote_type', cfg.quoteType);
          }
          if (cfg.isDarkTheme !== undefined) {
            setIsDarkTheme(cfg.isDarkTheme);
            localStorage.setItem('schola_dark_theme', String(cfg.isDarkTheme));
          }
        }
      })
      .catch((err) => console.warn('Központi beállítás szinkron figyelmeztetés:', err));
  }, []);

  const isInitialConfigMount = React.useRef(true);
  useEffect(() => {
    if (isInitialConfigMount.current) {
      isInitialConfigMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/dashboard-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            widgetSettings,
            widgetSizes,
            widgetHeights,
            widgetPositions,
            todos,
            bookmarks,
            postit,
            quoteType,
            isDarkTheme
          }
        })
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [widgetSettings, widgetSizes, widgetHeights, widgetPositions, todos, bookmarks, postit, quoteType, isDarkTheme]);

  const currentQuotes = quoteType === 'student' ? STUDENT_QUOTES : TEACHER_QUOTES;
  const [quoteOffset, setQuoteOffset] = useState(0);
  const dailyQuote =
    currentQuotes[
      (Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) + quoteOffset) % currentQuotes.length
    ];

  // Habit progress
  const [habitProgress, setHabitProgress] = useState(() => {
    const saved = localStorage.getItem('ekreta_habit_progress');
    const today = new Date().toDateString();
    let parsed = saved ? JSON.parse(saved) : null;
    if (!parsed || parsed.date !== today) {
      parsed = { date: today, dailyCount: 0, weeklyDays: [] };
    }
    return parsed;
  });
  useEffect(() => {
    localStorage.setItem('ekreta_habit_progress', JSON.stringify(habitProgress));
  }, [habitProgress]);

  // Hydration progress
  const [hydrationProgress, setHydrationProgress] = useState(() => {
    const saved = localStorage.getItem('ekreta_hydration');
    const today = new Date().toDateString();
    let parsed = saved ? JSON.parse(saved) : null;
    if (!parsed || parsed.date !== today) {
      parsed = { date: today, amount: 0 };
    }
    return parsed;
  });
  useEffect(() => {
    localStorage.setItem('ekreta_hydration', JSON.stringify(hydrationProgress));
  }, [hydrationProgress]);

  // Notifications (Toast)
  const [notifications, setNotifications] = useState([]);
  const addNotification = (message, type = 'info', title = 'Rendszerüzenet') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  // Smart Notification Engine (SNE) state
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem('schola_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [snoozedUntil, setSnoozedUntil] = useState(() => {
    try {
      const saved = localStorage.getItem('schola_snoozed_notifications');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [smartNotifications, setSmartNotifications] = useState([]);

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveScheduleInfo = getLiveScheduleInfo(schedule, currentTime, selectedDayIndex);

  // Evaluate smart notifications
  const currentClassId = liveScheduleInfo?.current?.id;
  const nextClassId = liveScheduleInfo?.next?.id;

  useEffect(() => {
    const runSNE = () => {
      const alerts = evaluateSmartNotifications({
        schedule,
        liveScheduleInfo,
        todos,
        hydrationProgress,
        dismissedIds: dismissedNotificationIds,
        snoozedUntil
      });
      setSmartNotifications((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(alerts)) {
          return prev;
        }
        return alerts;
      });
    };

    runSNE();
    const interval = setInterval(runSNE, 30000); // 30 mp-enként újraszámolja
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, currentClassId, nextClassId, todos, hydrationProgress, dismissedNotificationIds, snoozedUntil, activeTab, examsRefreshTrigger]);

  const handleDismissNotification = (id) => {
    const updated = [...dismissedNotificationIds, id];
    setDismissedNotificationIds(updated);
    localStorage.setItem('schola_dismissed_notifications', JSON.stringify(updated));
    addNotification('Értesítés elrejtve', 'info', 'Intelligens Értesítések');
  };

  const handleSnoozeNotification = (id) => {
    const updated = { ...snoozedUntil, [id]: Date.now() + 2 * 60 * 60 * 1000 };
    setSnoozedUntil(updated);
    localStorage.setItem('schola_snoozed_notifications', JSON.stringify(updated));
    addNotification('Értesítés elhalasztva 2 órával', 'info', 'Intelligens Értesítések');
  };

  const handleActionNotification = (notification) => {
    if (notification.actionType === 'DRINK_WATER') {
      const newHydration = Math.min(100, hydrationProgress + 10);
      setHydrationProgress(newHydration);
      handleDismissNotification(notification.id);
      addNotification('Folyadékbevitel sikeresen rögzítve (+250 ml)! Egészségedre!', 'success', 'Egészség & Jóllét');
    } else if (notification.targetTab) {
      setActiveTab(notification.targetTab);
      setIsNotificationDrawerOpen(false);
    }
  };

  const handleClearAllNotifications = () => {
    const allIds = [...dismissedNotificationIds, ...smartNotifications.map(n => n.id)];
    setDismissedNotificationIds(allIds);
    localStorage.setItem('schola_dismissed_notifications', JSON.stringify(allIds));
    setIsNotificationDrawerOpen(false);
    addNotification('Minden értesítés elrejtve', 'info', 'Intelligens Értesítések');
  };

  const [isCheckingTasks, setIsCheckingTasks] = useState(false);

  const handleRecheckTasks = async () => {
    setIsCheckingTasks(true);
    addNotification('Teendők és határidők ellenőrzése...', 'info', 'Intelligens Értesítések');

    try {
      // 1. Visszaállítjuk az elrejtett / elhalasztott azonosítókat, hogy a még fennálló feladatok újra előkerüljenek
      setDismissedNotificationIds([]);
      setSnoozedUntil({});
      localStorage.removeItem('schola_dismissed_notifications');
      localStorage.removeItem('schola_snoozed_notifications');

      // 2. Ha elérhető a háttérszerver, frissítsük az órarendet és dolgozatokat
      if (fetchSchedule) {
        fetchSchedule();
      }

      try {
        const res = await fetch(`${API_BASE}/api/exams`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.data) {
            // A szerver sikeresen válaszolt
          }
        }
      } catch {}

      // 3. Frissítjük a triggereket
      setExamsRefreshTrigger(prev => prev + 1);

      setTimeout(() => {
        const alerts = evaluateSmartNotifications({
          schedule,
          liveScheduleInfo,
          todos,
          hydrationProgress,
          dismissedIds: [],
          snoozedUntil: {}
        });
        setSmartNotifications(alerts);
        setIsCheckingTasks(false);

        if (alerts.length > 0) {
          const urgentCount = alerts.filter(a => a.priority === 'urgent' || a.priority === 'warning').length;
          addNotification(
            `Ellenőrzés kész: ${alerts.length} teendő található${urgentCount > 0 ? ` (${urgentCount} sürgős!)` : ''}.`,
            urgentCount > 0 ? 'warning' : 'info',
            'Intelligens Értesítések'
          );
        } else {
          addNotification('Minden feladat rendben! Nincs elmaradt teendő vagy határidő.', 'success', 'Intelligens Értesítések');
        }
      }, 500);
    } catch (err) {
      console.error('Recheck tasks error:', err);
      setIsCheckingTasks(false);
      addNotification('Hiba történt a teendők ellenőrzésekor.', 'error', 'Intelligens Értesítések');
    }
  };

  // Vacation Dates
  const [vacationDates, setVacationDates] = useState(() => {
    const saved = localStorage.getItem('ekreta_vacations');
    return saved ? { ...DEFAULT_VACATIONS, ...JSON.parse(saved) } : DEFAULT_VACATIONS;
  });

  const updateVacationDate = (key, value) => {
    const newDates = { ...vacationDates, [key]: value };
    if (key.endsWith('Start')) {
      newDates[key.replace('Start', '')] = value;
    }
    setVacationDates(newDates);
    localStorage.setItem('ekreta_vacations', JSON.stringify(newDates));
  };

  // Mini Timer
  const [miniTimerLeft, setMiniTimerLeft] = useState(0);
  const [miniTimerRunning, setMiniTimerRunning] = useState(false);
  useEffect(() => {
    let interval = null;
    if (miniTimerRunning && miniTimerLeft > 0) {
      interval = setInterval(() => {
        setMiniTimerLeft((t) => {
          if (t <= 1) {
            setMiniTimerRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [miniTimerRunning, miniTimerLeft]);

  // Theme observer
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  // Weather Custom Hook
  const { weatherData, weatherLocation } = useWeather(widgetSettings.showWeather);

  // Random student picker
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isPickingStudent, setIsPickingStudent] = useState(false);
  const [pickedGroup, setPickedGroup] = useState('');

  const vacation = getNextVacation(vacationDates);

  const handlePickRandomStudent = () => {
    if (isPickingStudent) return;
    setIsPickingStudent(true);

    const activeClass = liveScheduleInfo.current || liveScheduleInfo.next;
    let group = 'DEFAULT';
    let groupName = 'Osztályfüggetlen';
    if (activeClass && activeClass.details) {
      const match = activeClass.details.match(/\b\d{1,2}\.[A-Z]\b/);
      if (match) {
        group = match[0];
        groupName = group;
      } else if (activeClass.details.includes('Osztály')) {
        groupName = activeClass.details;
      }
    }
    const students = MOCK_STUDENTS[group] || MOCK_STUDENTS['DEFAULT'];
    setPickedGroup(groupName);

    let ticks = 0;
    const maxTicks = 15;
    const timer = setInterval(() => {
      setSelectedStudent(students[Math.floor(Math.random() * students.length)]);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(timer);
        setIsPickingStudent(false);
      }
    }, 100);
  };

  // Schedule API call
  const fetchSchedule = (dayIndex = null, retryCount = 0) => {
    setLoadingSchedule(true);
    const url = dayIndex !== null ? `${API_BASE}/api/timetable?day=${dayIndex}` : `${API_BASE}/api/timetable`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            let errMsg = `Server status ${res.status}`;
            try {
              const parsed = JSON.parse(text);
              if (parsed.error) errMsg = parsed.error;
            } catch {}
            throw new Error(errMsg);
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          if (data.data && data.data.list) {
            setSchedule(data.data.list);
            setScheduleDay(data.data.day);
          } else {
            setSchedule(data.data || []);
          }
          setLoadingSchedule(false);

          if (data.fromCache) {
            const refreshUrl = url + (url.includes('?') ? '&' : '?') + 'refresh=true';
            fetch(refreshUrl)
              .then((r) => (r.ok ? r.json() : null))
              .then((freshData) => {
                if (freshData && freshData.success) {
                  if (freshData.data && freshData.data.list) {
                    setSchedule(freshData.data.list);
                    setScheduleDay(freshData.data.day);
                  } else {
                    setSchedule(freshData.data || []);
                  }
                }
              })
              .catch((e) => console.error('Háttérfrissítés hiba:', e));
          }
        } else {
          throw new Error(data.error || 'Unknown Error');
        }
      })
      .catch((err) => {
        console.error('Hiba az órarend betöltésekor:', err);
        setLoadingSchedule(false);
        if (retryCount < 3) {
          setTimeout(() => {
            fetchSchedule(dayIndex, retryCount + 1);
          }, 2000);
        }
        if (
          err.message &&
          (err.message.toLowerCase().includes('closed') ||
            err.message.toLowerCase().includes('null') ||
            err.message.toLowerCase().includes('undefined'))
        ) {
          alert('A háttérben futó kapcsolat (böngésző) megszakadt. Kérjük, jelentkezzen be újra!');
          setIsLoggedIn(false);
          localStorage.removeItem('ekreta_logged_in');
        }
      });
  };

  useEffect(() => {
    if (isLoggedIn && schedule.length === 0) {
      fetchSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, schoolId: 'bmszc-neumann' }),
      signal: controller.signal
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        let data = null;
        try {
          data = await res.json();
        } catch {}
        if (!res.ok) {
          throw new Error(
            data?.message ||
              `A háttérszerver nem elérhető (${res.status} ${res.statusText || 'Bad Gateway'}). Fut a backend (port 3001)?`
          );
        }
        return data;
      })
      .then((data) => {
        if (data && data.success) {
          setIsLoggedIn(true);
          localStorage.setItem('ekreta_logged_in', 'true');
          fetchSchedule();
        } else {
          setLoginError(data?.message || 'Hiba a bejelentkezés során.');
          setIsLoggingIn(false);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error(err);
        if (err.name === 'AbortError') {
          setLoginError('A bejelentkezés túllépte az időkorlátot (40s). Lehet, hogy a Kréta lassú vagy nem elérhető.');
        } else {
          setLoginError(err.message || 'Nem sikerült kapcsolódni a helyi robothoz.');
        }
        setIsLoggingIn(false);
      });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('ekreta_logged_in');
    fetch(`${API_BASE}/api/logout`, { method: 'POST' }).catch(() => {});
  };

  if (!isLoggedIn) {
    return (
      <LoginView
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        handleLogin={handleLogin}
        onOfflineLogin={() => {
          setIsLoggedIn(true);
          localStorage.setItem('ekreta_logged_in', 'true');
          fetchSchedule();
        }}
        isDarkTheme={isDarkTheme}
        setIsDarkTheme={setIsDarkTheme}
      />
    );
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      {!(isFullscreen && activeTab === 'classroomscreen') && (
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkTheme={isDarkTheme}
          setIsDarkTheme={setIsDarkTheme}
          handleLogout={handleLogout}
          setExamsRefreshTrigger={setExamsRefreshTrigger}
          unreadNotificationCount={smartNotifications.length}
          onOpenNotificationDrawer={() => setIsNotificationDrawerOpen(true)}
        />
      )}

      {/* Main Content */}
      <main className="main-content" style={isFullscreen && activeTab === 'classroomscreen' ? { padding: 0 } : activeTab === 'órarend' ? { padding: '8px 12px', overflow: 'hidden' } : {}}>
        {activeTab === 'vezérlőpult' && (
          <Dashboard
            schedule={schedule}
            loadingSchedule={loadingSchedule}
            scheduleDay={scheduleDay}
            selectedDayIndex={selectedDayIndex}
            setSelectedDayIndex={setSelectedDayIndex}
            fetchSchedule={fetchSchedule}
            currentTime={currentTime}
            liveScheduleInfo={liveScheduleInfo}
            vacation={vacation}
            widgetSettings={widgetSettings}
            widgetPositions={widgetPositions}
            setWidgetPositions={setWidgetPositions}
            widgetSizes={widgetSizes}
            changeWidgetWidth={changeWidgetWidth}
            widgetHeights={widgetHeights}
            changeWidgetHeight={changeWidgetHeight}
            selectedStudent={selectedStudent}
            isPickingStudent={isPickingStudent}
            pickedGroup={pickedGroup}
            handlePickRandomStudent={handlePickRandomStudent}
            miniTimerLeft={miniTimerLeft}
            setMiniTimerLeft={setMiniTimerLeft}
            miniTimerRunning={miniTimerRunning}
            setMiniTimerRunning={setMiniTimerRunning}
            dailyQuote={dailyQuote}
            quoteType={quoteType}
            setQuoteType={setQuoteType}
            setQuoteOffset={setQuoteOffset}
            todos={todos}
            setTodos={setTodos}
            setTodoModalOpen={setTodoModalOpen}
            postit={postit}
            setPostit={setPostit}
            habitProgress={habitProgress}
            setHabitProgress={setHabitProgress}
            hydrationProgress={hydrationProgress}
            setHydrationProgress={setHydrationProgress}
            bookmarks={bookmarks}
            weatherData={weatherData}
            weatherLocation={weatherLocation}
            setActiveTab={setActiveTab}
            topSmartNotification={smartNotifications[0] || null}
            totalNotificationsCount={smartNotifications.length}
            handleActionNotification={handleActionNotification}
            handleDismissNotification={handleDismissNotification}
            openNotificationDrawer={() => setIsNotificationDrawerOpen(true)}
            onRecheckTasks={handleRecheckTasks}
            isCheckingTasks={isCheckingTasks}
          />
        )}

        {activeTab === 'órarend' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <Timetable setActiveTab={setActiveTab} addNotification={addNotification} currentTime={currentTime} />
          </div>
        )}

        {(activeTab === 'csoportok' || activeTab === 'napló') && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <Groups addNotification={addNotification} />
          </div>
        )}

        {activeTab === 'dolgozatok' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <Exams
              setActiveTab={setActiveTab}
              addNotification={addNotification}
              refreshTrigger={examsRefreshTrigger}
            />
          </div>
        )}

        {activeTab === 'katedra-ai' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <KatedraAi addNotification={addNotification} setActiveTab={setActiveTab} />
          </div>
        )}

        {activeTab === 'osztalyfonok' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <HeadTeacher addNotification={addNotification} />
          </div>
        )}

        {activeTab === 'eszközök' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <TeacherTools addNotification={addNotification} />
          </div>
        )}

        {activeTab === 'classroomscreen' && (
          <ClassroomScreen
            isFullscreen={isFullscreen}
            classroomBg={classroomBg}
            setClassroomBg={setClassroomBg}
            classroomWidgets={classroomWidgets}
            setClassroomWidgets={setClassroomWidgets}
            addWidget={addClassroomWidget}
            removeWidget={removeClassroomWidget}
            updateWidgetBounds={updateWidgetBounds}
            isToolbarCollapsed={isToolbarCollapsed}
            setIsToolbarCollapsed={setIsToolbarCollapsed}
          />
        )}

        {activeTab === 'beállítások' && (
          <Settings
            settingsSubTab={settingsSubTab}
            setSettingsSubTab={setSettingsSubTab}
            widgetSettings={widgetSettings}
            updateWidgetSetting={updateWidgetSetting}
            vacationDates={vacationDates}
            updateVacationDate={updateVacationDate}
            bookmarks={bookmarks}
            setBookmarks={setBookmarks}
            addNotification={addNotification}
          />
        )}

        {/* Todo Modal */}
        <TodoModal
          isOpen={todoModalOpen}
          onClose={() => setTodoModalOpen(false)}
          draft={newTodoDraft}
          setDraft={setNewTodoDraft}
          onSave={() => {
            if (newTodoDraft.text.trim()) {
              setTodos([
                ...todos,
                { id: Date.now(), ...newTodoDraft, text: newTodoDraft.text.trim(), done: false }
              ]);
              setNewTodoDraft({ text: '', deadline: '', class: '', lesson: '', priority: 'Közepes' });
              setTodoModalOpen(false);
            }
          }}
        />
      </main>

      {/* Intelligens Értesítési Fiók (Smart Notification Engine) */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={smartNotifications}
        onDismiss={handleDismissNotification}
        onSnooze={handleSnoozeNotification}
        onAction={handleActionNotification}
        onClearAll={handleClearAllNotifications}
        onRefresh={handleRecheckTasks}
        isChecking={isCheckingTasks}
      />

      {/* Értesítések (Toasts) */}
      <ToastContainer notifications={notifications} />
    </div>
  );
}

function App() {
  const isStudentWallMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('join') === 'wall' ||
    window.location.hash === '#wall'
  );

  const isStudentPollMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('join') === 'poll' ||
    window.location.hash === '#poll'
  );

  const isStudentQuizMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('join') === 'quiz' ||
    window.location.hash === '#quiz'
  );

  if (isStudentWallMode) {
    return <StudentWallView />;
  }

  if (isStudentPollMode) {
    return <StudentPollView />;
  }

  if (isStudentQuizMode) {
    return <StudentQuizView />;
  }

  return <MainApp />;
}

export default App;
