import React, { useState, useEffect } from 'react';
import { Rnd } from "react-rnd";
import './index.css';
import Groups from './components/Groups';
import TeacherTools from './components/TeacherTools';
import Exams from './components/Exams';
import HeadTeacher from './components/HeadTeacher';
import { DEFAULT_VACATIONS, parseLocalDate } from './utils/schoolHolidays';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('ekreta_sidebar_collapsed') === 'true');
  const toggleSidebar = () => { const nextState = !isSidebarCollapsed; setIsSidebarCollapsed(nextState); localStorage.setItem('ekreta_sidebar_collapsed', nextState); };
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('ekreta_logged_in') === 'true';
  });
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState('vezérlőpult');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [classroomWidgets, setClassroomWidgets] = useState([]);
  
  const addWidget = (type) => {
    setClassroomWidgets(prev => [...prev, { id: Date.now().toString(), type, x: 100 + (prev.length * 30), y: 100 + (prev.length * 30) }]);
  };
  
  const removeWidget = (id) => {
    setClassroomWidgets(prev => prev.filter(w => w.id !== id));
  };
  const [classroomBg, setClassroomBg] = useState(() => localStorage.getItem('ekreta_classroom_bg') || '#0a0a0a');
  
  const solidBgs = [
    { label: 'Fekete', value: '#000000', color: '#ffffff' },
    { label: 'Sötétkék', value: '#0f172a', color: '#ffffff' },
    { label: 'Világosszürke', value: '#f3f4f6', color: '#111827' },
    { label: 'Fehér', value: '#ffffff', color: '#000000' },
    { label: 'Homok', value: '#f5f5dc', color: '#4b5563' },
    { label: 'Menta', value: '#e6f4ea', color: '#166534' },
    { label: 'Ég', value: '#e8f0fe', color: '#1e40af' },
    { label: 'Lila', value: '#f3e8ff', color: '#6b21a8' }
  ];

  const gradientBgs = [
    { label: 'Zöld Erdő', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', color: '#ffffff' },
    { label: 'Lila Köd', value: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)', color: '#ffffff' },
    { label: 'Óceán', value: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)', color: '#ffffff' },
    { label: 'Naplemente', value: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)', color: '#ffffff' },
    { label: 'Hajnal', value: 'linear-gradient(135deg, #fdf4ff 0%, #fbcfe8 100%)', color: '#831843' },
    { label: 'Tengerpart', value: 'linear-gradient(135deg, #a7f3d0 0%, #10b981 100%)', color: '#064e3b' }
  ];
  
  const currentBgObj = [...solidBgs, ...gradientBgs].find(b => b.value === classroomBg) || { color: '#ffffff' };
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Schedule state
  const [schedule, setSchedule] = useState([]);
  const [scheduleDay, setScheduleDay] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false); // set to false initially

  // Widget settings
  // Todos state
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [newTodoDraft, setNewTodoDraft] = useState({ text: '', deadline: '', class: '', lesson: '', priority: 'Közepes' });
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('ekreta_todos');
    return saved ? JSON.parse(saved) : [{ id: 1, text: '11.A dolgozatok javítása', done: false }, { id: 2, text: 'E-mail a szülőnek', done: true }];
  });
  useEffect(() => { localStorage.setItem('ekreta_todos', JSON.stringify(todos)); }, [todos]);

  // Post-it state
  const [postit, setPostit] = useState(() => localStorage.getItem('ekreta_postit') || 'Ne felejtsd el feladni a pénteki leckét!');
  useEffect(() => { localStorage.setItem('ekreta_postit', postit); }, [postit]);

    const [quoteType, setQuoteType] = useState(() => localStorage.getItem('ekreta_quote_type') || 'teacher');

  const teacherQuotes = [
    "A jó tanár megmagyarázza, a kiváló tanár demonstrálja, a nagyszerű tanár inspirálja. - William Arthur Ward",
    "A tanulás az az egyetlen dolog, ami sosem meríti ki az elmét, sosem félemlíti meg és sosem bánja meg. - Leonardo da Vinci",
    "Nem az a tudás, hogy mennyi mindent tudsz, hanem hogy tudod, mit kezdj vele. - Ismeretlen",
    "A gyermekek nem arra vágynak, hogy tökéletes legyél, hanem hogy ott legyél nekik. - Ismeretlen",
    "A tanítás az az optimizmus legnagyobb aktusa. - Colleen Wilcox"
  ];

  const studentQuotes = [
    "A jövő azoké, akik hisznek álmaik szépségében. - Eleanor Roosevelt",
    "Nem azért tanulunk, hogy az iskolának feleljünk meg, hanem az életnek. - Seneca",
    "A titok abban rejlik, hogy elkezded. - Mark Twain",
    "Nincs olyan, hogy lehetetlen, csak olyan, hogy még nem jöttem rá. - Ismeretlen",
    "Minden szakértő volt egyszer kezdő. - Helen Hayes"
  ];

  const currentQuotes = quoteType === 'student' ? studentQuotes : teacherQuotes;
  const [quoteOffset, setQuoteOffset] = useState(0);
  const dailyQuote = currentQuotes[(Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) + quoteOffset) % currentQuotes.length];

  const [widgetSettings, setWidgetSettings] = useState(() => {
    const saved = localStorage.getItem('ekreta_widgets');
    const defaults = {
      showUpNext: true,
      showClassProgress: true,
      showVacationCountdown: true,
      showMessages: true,
      showQuickActions: true,
      showMiniCalendar: true,
      showMiniTimer: false,
      showTodos: true,
      showPostit: true,
      showQuote: true,
      showDigitalClock: true,
      showRandomStudent: true,
      showHabitTracker: true,
      autoFillGrid: false,
      habitName: 'Vízivás (pohár)',
      habitType: 'napi',
      habitDailyMax: 8,
      showBookmarks: true,
      showWeather: true,
      showHydrationTracker: true,
      hydrationTarget: 2000,
      editMode: false
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [habitProgress, setHabitProgress] = useState(() => {
    const saved = localStorage.getItem('ekreta_habit_progress');
    const today = new Date().toDateString();
    let parsed = saved ? JSON.parse(saved) : null;
    if (!parsed || parsed.date !== today) {
      parsed = { date: today, dailyCount: 0, weeklyDays: [] }; // weeklyDays won't clear daily if we want to keep it, but let's clear daily.
    }
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem('ekreta_habit_progress', JSON.stringify(habitProgress));
  }, [habitProgress]);

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

  // Értesítési rendszer (Toast)
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', title = 'Rendszerüzenet') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('ekreta_bookmarks');
    return saved ? JSON.parse(saved) : [
      { url: 'https://youtube.com', title: 'YouTube' },
      { url: 'https://kahoot.com', title: 'Kahoot' },
      { url: 'https://quizlet.com', title: 'Quizlet' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ekreta_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const updateWidgetSetting = (key, value) => {
    const newSettings = { ...widgetSettings, [key]: value };
    setWidgetSettings(newSettings);
    localStorage.setItem('ekreta_widgets', JSON.stringify(newSettings));
  };

  // Widget Sizes state
  const [widgetSizes, setWidgetSizes] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_sizes');
    const defaults = {
      upNext: 2,
      classProgress: 2,
      vacation: 2,
      miniCalendar: 2,
      miniTimer: 2,
      messages: 2,
      quickActions: 2,
      todos: 2,
      postit: 1,
      quote: 2,
      digitalClock: 2,
      randomStudent: 2,
      habitTracker: 2,
      bookmarks: 2,
      weather: 2,
      hydrationTracker: 2
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [widgetHeights, setWidgetHeights] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_heights');
    const defaults = {
      upNext: 1, classProgress: 1, vacation: 1, miniCalendar: 3, miniTimer: 2, messages: 2, quickActions: 2, quote: 2, todos: 3, postit: 2, digitalClock: 2, randomStudent: 2, habitTracker: 2, bookmarks: 2, weather: 2, hydrationTracker: 3
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });
  const changeWidgetHeight = (key, h) => {
    if (h < 1 || h > 10) return;
    setWidgetHeights(prev => { const n = {...prev, [key]: h}; localStorage.setItem('ekreta_widget_heights', JSON.stringify(n)); return n; });
  };

  
  const MOCK_STUDENTS = {
    '11.A': ['Nagy Péter', 'Kovács Anna', 'Szabó Bence', 'Tóth Kata', 'Varga Máté', 'Farkas Laura', 'Kiss Dávid', 'Horváth Zsófia', 'Török Ádám', 'Balázs Réka'],
    '10.B': ['Molnár Gergő', 'Németh Lili', 'Balogh Márk', 'Lukács Flóra', 'Juhász Ádám'],
    '9.C': ['Kelemen Dóra', 'Simon Bálint', 'Papp Eszter', 'Gál Bence'],
    'DEFAULT': ['Alapértelmezett Tanuló 1', 'Alapértelmezett Tanuló 2', 'Alapértelmezett Tanuló 3', 'Alapértelmezett Tanuló 4']
  };
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isPickingStudent, setIsPickingStudent] = useState(false);
  const [pickedGroup, setPickedGroup] = useState('');

  const handlePickRandomStudent = () => {
    if (isPickingStudent) return;
    setIsPickingStudent(true);
    
    const info = getLiveScheduleInfo();
    const activeClass = info.current || info.next;
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

  const changeWidgetWidth = (key, w) => {
    if (w < 1 || w > 4) return;
    setWidgetSizes(prev => { const n = { ...prev, [key]: w }; localStorage.setItem('ekreta_widget_sizes', JSON.stringify(n)); return n; });
  };

  const [widgetPositions, setWidgetPositions] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_positions');
    const defaults = {
      schedule: { c: 1, r: 1 },
      upNext: { c: 3, r: 1 },
      classProgress: { c: 4, r: 1 },
      vacation: { c: 6, r: 1 },
      miniCalendar: { c: 3, r: 2 },
      miniTimer: { c: 4, r: 2 },
      messages: { c: 5, r: 2 },
      quickActions: { c: 6, r: 2 },
      quote: { c: 3, r: 3 },
      todos: { c: 4, r: 3 },
      postit: { c: 5, r: 3 },
      digitalClock: { c: 6, r: 3 },
      randomStudent: { c: 3, r: 4 },
      habitTracker: { c: 4, r: 4 },
      hydrationTracker: { c: 5, r: 4 },
      bookmarks: { c: 6, r: 4 },
      weather: { c: 3, r: 5 }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) { }
    }
    return defaults;
  });

  const handleDragStart = (e, key) => {
    if (!widgetSettings.editMode) { e.preventDefault(); return; }
    e.dataTransfer.setData('text/plain', key);
  };
  const handleDragOver = (e) => {
    if (!widgetSettings.editMode) return;
    e.preventDefault();
  };
  const handleDropEmpty = (e, c, r) => {
    if (!widgetSettings.editMode) return;
    const sourceKey = e.dataTransfer.getData('text/plain');
    if (!sourceKey || !widgetPositions[sourceKey]) return;
    setWidgetPositions(prev => {
      const n = { ...prev, [sourceKey]: { c, r } };
      localStorage.setItem('ekreta_widget_positions', JSON.stringify(n));
      return n;
    });
  };

  const handleDrop = (e, targetKey) => {
    if (!widgetSettings.editMode) return;
    const sourceKey = e.dataTransfer.getData('text/plain');
    if (sourceKey === targetKey || !sourceKey || !widgetPositions[sourceKey] || !widgetPositions[targetKey]) return;
    setWidgetPositions(prev => {
      const n = { ...prev };
      const temp = n[targetKey];
      n[targetKey] = n[sourceKey];
      n[sourceKey] = temp;
      localStorage.setItem('ekreta_widget_positions', JSON.stringify(n));
      return n;
    });
  };

    const WidgetResizer = ({ widgetKey, w, h }) => {
    if (!widgetSettings.editMode) return null;
    return (
      <>
        <div 
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '24px', cursor: 'ew-resize', zIndex: 10 }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.target.setPointerCapture(e.pointerId);
            const startX = e.clientX;
            const handlePointerMove = (moveEvent) => {
               const diff = moveEvent.clientX - startX;
               if (diff > 40) { changeWidgetWidth(widgetKey, w + 1); cleanup(); }
               else if (diff < -40) { changeWidgetWidth(widgetKey, w - 1); cleanup(); }
            };
            const cleanup = () => { window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerup', cleanup); };
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', cleanup);
          }}
        >
          <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '24px', background: 'var(--text-secondary)', opacity: 0.5, borderRadius: '2px' }} />
        </div>
        <div 
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', cursor: 'ns-resize', zIndex: 10 }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.target.setPointerCapture(e.pointerId);
            const startY = e.clientY;
            const handlePointerMove = (moveEvent) => {
               const diff = moveEvent.clientY - startY;
               if (diff > 40) { changeWidgetHeight(widgetKey, h + 1); cleanup(); }
               else if (diff < -40) { changeWidgetHeight(widgetKey, h - 1); cleanup(); }
            };
            const cleanup = () => { window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerup', cleanup); };
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', cleanup);
          }}
        >
          <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', height: '4px', width: '24px', background: 'var(--text-secondary)', opacity: 0.5, borderRadius: '2px' }} />
        </div>
      </>
    );
  };



  // Vacation Settings (Iskolai szünetek a visszaszámlálóhoz és a 15 munkanapos dolgozat határidőhöz)
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

  // Live Time state for Next Class / Progress bar
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mini Timer state
  const [miniTimerLeft, setMiniTimerLeft] = useState(0);
  const [miniTimerRunning, setMiniTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (miniTimerRunning && miniTimerLeft > 0) {
      interval = setInterval(() => {
        setMiniTimerLeft(t => {
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

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  const fetchSchedule = (dayIndex = null) => {
    setLoadingSchedule(true);
    const url = dayIndex !== null ? `http://localhost:3001/api/timetable?day=${dayIndex}` : 'http://localhost:3001/api/timetable';
    fetch(url)
      .then(res => {
        if (!res.ok && res.status === 500) {
          return res.json().then(data => { throw new Error(data.error || 'Server Error'); });
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          if (data.data && data.data.list) {
            setSchedule(data.data.list);
            setScheduleDay(data.data.day);
          } else {
            setSchedule(data.data || []);
          }
          setLoadingSchedule(false);
          
          // Ha cache-ből jött, háttérben frissítünk
          if (data.fromCache) {
             const refreshUrl = url + (url.includes('?') ? '&' : '?') + 'refresh=true';
             fetch(refreshUrl)
               .then(r => r.json())
               .then(freshData => {
                  if (freshData.success) {
                    if (freshData.data && freshData.data.list) {
                      setSchedule(freshData.data.list);
                      setScheduleDay(freshData.data.day);
                    } else {
                      setSchedule(freshData.data || []);
                    }
                  }
               }).catch(e => console.error('Háttérfrissítés hiba:', e));
          }
        } else {
          throw new Error(data.error || 'Unknown Error');
        }
      })
      .catch(err => {
        console.error('Hiba az órarend betöltésekor:', err);
        setLoadingSchedule(false);
        if (err.message && (err.message.toLowerCase().includes('closed') || err.message.toLowerCase().includes('null') || err.message.toLowerCase().includes('undefined'))) {
          alert('A háttérben futó kapcsolat (böngésző) megszakadt. Kérjük, jelentkezzen be újra!');
          setIsLoggedIn(false);
          localStorage.removeItem('ekreta_logged_in');
        }
      });
  };

  // Automatikus betöltés belépéskor
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

    fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, schoolId: 'bmszc-neumann' })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setIsLoggedIn(true);
        localStorage.setItem('ekreta_logged_in', 'true');
        fetchSchedule(); // Bejelentkezés után lekérjük az órarendet
      } else {
        setLoginError(data.message || 'Hiba a bejelentkezés során.');
        setIsLoggingIn(false);
      }
    })
    .catch(err => {
      console.error(err);
      setLoginError('Nem sikerült kapcsolódni a helyi robothoz.');
      setIsLoggingIn(false);
    });
  };

  const [weatherData, setWeatherData] = useState(null);
  const [weatherLocation, setWeatherLocation] = useState('Keresés...');

  useEffect(() => {
    if (!widgetSettings.showWeather) return;

    const fetchWeatherData = async (lat = 47.4984, lon = 19.0404, defaultLoc = 'Budapest') => {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherJson = await weatherRes.json();
        
        if (weatherJson && weatherJson.current_weather) {
          setWeatherData(weatherJson.current_weather);
        }

        if (lat !== 47.4984 || lon !== 19.0404) {
          const locRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=hu`);
          const locJson = await locRes.json();
          setWeatherLocation(locJson.city || locJson.locality || defaultLoc);
        } else {
          setWeatherLocation(defaultLoc);
        }
      } catch (err) {
        console.error('Failed to fetch weather data', err);
        setWeatherLocation(defaultLoc);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Helymeghatározás sikertelen, alapértelmezett (Budapest) használata.", error);
          fetchWeatherData();
        },
        { timeout: 10000 }
      );
    } else {
      fetchWeatherData();
    }
  }, [widgetSettings.showWeather]);

  const [syncingGroups, setSyncingGroups] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Háttérszinkronizáció
  useEffect(() => {
    const syncMissingGroups = async () => {
      if (schedule.length === 0 || syncingGroups) return;
      
      const savedGroupsStr = localStorage.getItem('ekreta_groups');
      const savedGroups = savedGroupsStr ? JSON.parse(savedGroupsStr) : [];
      
      const activeDayIndex = selectedDayIndex !== null 
        ? selectedDayIndex 
        : (new Date().getDay() || 7);

      // Mely osztályokat/csoportokat kell még leszinkronizálni ezen a napon?
      const missingClasses = schedule.filter(ora => {
         // Kizárjuk a lyukasórákat (ahol nincs details vagy subject)
         if (!ora.subject || !ora.details) return false;
         
         const groupName = ora.details;
         const existing = savedGroups.find(g => g.name === groupName && g.subject === ora.subject);
         // Ha nem létezik még a helyi mentésben, szinkronizáljuk!
         return !existing;
      });
      
      // Hogy ne küldjünk dupla kérést ugyanarra az osztályra, kiszűrjük a duplikátumokat
      const uniqueMissing = [];
      const seen = new Set();
      for (const mc of missingClasses) {
         const key = `${mc.subject}-${mc.details}`;
         if (!seen.has(key)) {
            seen.add(key);
            uniqueMissing.push(mc);
         }
      }
      
      if (uniqueMissing.length === 0) return;
      
      setSyncingGroups(true);
      setSyncStatus(`${uniqueMissing.length} új csoport azonosítva. Háttérszinkronizáció indítása...`);
      
      const currentSavedGroups = [...savedGroups];
      
      for (const ora of uniqueMissing) {
        setSyncStatus(`${ora.subject} - ${ora.details} diákok letöltése...`);
        try {
          const response = await fetch('http://localhost:3001/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              dayIndex: activeDayIndex, 
              classIndex: ora.id // Fontos: az eredeti ID-t kell küldeni, nem a szűrt indexet!
            })
          });
          
          const data = await response.json();
          if (data.success) {
            currentSavedGroups.push({
              id: Date.now().toString(),
              name: ora.details,
              subject: ora.subject,
              students: data.data
            });
            // Köztes mentés, hogy ha megszakad, ne kelljen újra kezdeni
            localStorage.setItem('ekreta_groups', JSON.stringify(currentSavedGroups));
          }
        } catch (error) {
          console.error(`Hiba a(z) ${ora.details} szinkronizálásakor:`, error);
        }
        // Kis szünet a kérések között
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setSyncStatus('');
      setSyncingGroups(false);
    };
    // A háttérszinkronizáció kikapcsolva, helyette a 'Csoportok' oldalon lévő 'Kréta Szink' gombot használjuk
    // syncMissingGroups();
  }, [schedule]);

  const currentDate = new Date().toLocaleDateString('hu-HU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });


  const getDaysOfWeek = () => {
    let today = new Date();
    const currentDay = today.getDay();
    
    // Ha szombat vagy vasárnap van, a tanár már a jövő heti órarendet szeretné látni!
    if (currentDay === 0 || currentDay === 6) {
      today.setDate(today.getDate() + (currentDay === 6 ? 2 : 1));
    }
    
    const activeDay = today.getDay();
    const diff = today.getDate() - activeDay + (activeDay === 0 ? -6 : 1); 
    const monday = new Date(today.setDate(diff));
    
    const dayNames = ['H', 'K', 'Sze', 'Cs', 'P'];
    const fullNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
    
    return dayNames.map((name, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      
      const dIdx = i + 1; // Hétfő = 1, Péntek = 5
      
      const isActive = selectedDayIndex !== null 
        ? selectedDayIndex === dIdx 
        : (scheduleDay === fullNames[i] || (scheduleDay === '' && i === 0));

      return {
        name: name,
        date: d.getDate(),
        dayIndex: dIdx,
        active: isActive
      };
    });
  };

  // Dinamikus naptár cím generálása
  const getCalendarTitle = () => {
    let today = new Date();
    const currentDay = today.getDay();
    if (currentDay === 0 || currentDay === 6) {
      today.setDate(today.getDate() + (currentDay === 6 ? 2 : 1));
    }

    const month = today.toLocaleString('hu-HU', { month: 'long' });
    const year = today.getFullYear();
    
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    const weekType = weekNumber % 2 === 0 ? 'B' : 'A';
    
    return `${year}. ${month} - ${weekNumber}. hét (${weekType})`;
  };

  const getLiveScheduleInfo = () => {
    if (!schedule || schedule.length === 0) return { current: null, next: null, progress: 0, breakTime: null };
    
    let todayIdx = new Date().getDay();
    if (todayIdx === 0 || todayIdx === 6) todayIdx = 1;
    const viewingToday = selectedDayIndex === null || selectedDayIndex === todayIdx;
    
    if (!viewingToday) return { current: null, next: null, progress: 0, breakTime: null };

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
      const startMin = parseInt(startStr.split(':')[0]) * 60 + parseInt(startStr.split(':')[1]);
      const endMin = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);
      const startSec = startMin * 60;
      const endSec = endMin * 60;

      if (currentSeconds >= startSec && currentSeconds <= endSec) {
        currentClass = ora;
        progress = ((currentSeconds - startSec) / (endSec - startSec)) * 100;
      }
      
      if (startMin > currentMinutes && !nextClass) {
        nextClass = ora;
        if (i > 0) {
           const prevOra = schedule[i-1];
           if (prevOra.duration && prevOra.duration.includes('-')) {
             const prevEndStr = prevOra.duration.split(' - ')[1];
             const prevEndMin = parseInt(prevEndStr.split(':')[0]) * 60 + parseInt(prevEndStr.split(':')[1]);
             if (currentMinutes >= prevEndMin && currentMinutes < startMin) {
                const breakStartSec = prevEndMin * 60;
                const breakEndSec = startMin * 60;
                const breakDuration = (breakEndSec - breakStartSec) / 60;
                const breakLabel = breakDuration > 10 ? `Nagyszünet (${breakDuration} perc)` : `Szünet (${breakDuration} perc)`;
                breakTime = {
                   label: breakLabel,
                   progress: ((currentSeconds - breakStartSec) / (breakEndSec - breakStartSec)) * 100,
                   timeLeft: Math.ceil((breakEndSec - currentSeconds)/60)
                };
             }
           }
        }
      }
    }
    return { current: currentClass, next: nextClass, progress, breakTime };
  };

  const getNextVacation = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const vacations = [
      { name: 'Őszi szünet', date: parseLocalDate(vacationDates.autumnStart || vacationDates.autumn) },
      { name: 'Téli szünet', date: parseLocalDate(vacationDates.winterStart || vacationDates.winter) },
      { name: 'Tavaszi szünet', date: parseLocalDate(vacationDates.springStart || vacationDates.spring) },
      { name: 'Nyári szünet', date: parseLocalDate(vacationDates.summerStart || vacationDates.summer) }
    ].filter(v => v.date);
    
    const upcoming = vacations.filter(v => v.date > today).sort((a,b) => a.date - b.date);
    if (upcoming.length === 0) return null;
    
    const nextV = upcoming[0];
    const diffTime = Math.abs(nextV.date - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { 
      name: nextV.name, 
      days: diffDays,
      dateStr: nextV.date.toLocaleString('hu-HU', { month: 'long', day: 'numeric' })
    };
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box animate-fade-in" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="60" height="60" viewBox="0 0 128 128" fill="none" style={{ borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
              <rect width="128" height="128" rx="28" fill="#0A0A0C"/>
              <rect x="1" y="1" width="126" height="126" rx="27" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
              <circle cx="90" cy="36" r="14" fill="#E11D48" opacity="0.3" filter="blur(6px)"/>
              <path d="M80 44 C80 34.5 71.5 28 58 28 C43 28 34 37 34 48 C34 61 46 65 64 69 C79 72.5 86 78 86 89 C86 101.5 73.5 108 56 108 C40 108 32 99.5 32 89" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="90" cy="36" r="6.5" fill="#E11D48"/>
            </svg>
          </div>
          <h2 className="login-title" style={{ letterSpacing: '1px', marginBottom: '4px' }}>Schola</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Digitális Tanári Műszerfal</p>
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Felhasználónév</label>
              <input 
                type="text" 
                className="input-field" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Oktatási azonosító"
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Jelszó</label>
              <input 
                type="password" 
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Kréta jelszó"
              />
            </div>

            {loginError && <div className="error-message">{loginError}</div>}

            <button type="submit" className="btn-primary" disabled={isLoggingIn}>
              {isLoggingIn ? 'Hitelesítés a roboton keresztül...' : 'Bejelentkezés'}
            </button>
          </form>

          {/* Kis téma váltó a login képernyőre is */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button 
              className="btn-outline" 
              style={{ border: 'none', fontSize: '10px' }}
              onClick={() => setIsDarkTheme(!isDarkTheme)}
            >
              {isDarkTheme ? 'VILÁGOS TÉMA VÁLTÁSA' : 'SÖTÉT TÉMA VÁLTÁSA'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const habitDailyPct = widgetSettings.habitDailyMax > 0 ? Math.round((habitProgress.dailyCount / widgetSettings.habitDailyMax) * 100) : 0;
  const habitWeeklyPct = Math.round((habitProgress.weeklyDays.length / 7) * 100);

  const hydrationPct = Math.min(Math.round((hydrationProgress.amount / widgetSettings.hydrationTarget) * 100), 100);
  const hydroRadius = 60;
  const hydroStroke = 8;
  const hydroNormRadius = hydroRadius - (hydroStroke / 2);
  const hydroCircumference = hydroNormRadius * 2 * Math.PI;
  const hydroDashoffset = hydroCircumference - (hydrationPct / 100) * hydroCircumference;

  const getWeatherDetails = (code) => {
    const sun = <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
    const cloud = <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
    const rain = <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>;
    const sunCloudRain = <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M3 12a7 7 0 0 1 13.91-1.12"/><path d="M13 22l-2-6"/><path d="M17 22l-2-6"/></svg>;
    const fog = <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 17H7"/><path d="M17 21H9"/></svg>;
    const snow = <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/></svg>;
    const storm = <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>;

    if (code === undefined || code === null) return { desc: 'Betöltés...', icon: cloud };
    if (code === 0) return { desc: 'Derült', icon: sun };
    if (code === 1 || code === 2 || code === 3) return { desc: 'Felhős', icon: cloud };
    if (code === 45 || code === 48) return { desc: 'Ködös', icon: fog };
    if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return { desc: 'Szitálás', icon: rain };
    if (code >= 61 && code <= 67) return { desc: 'Eső', icon: rain };
    if (code >= 71 && code <= 77) return { desc: 'Havazás', icon: snow };
    if (code >= 80 && code <= 82) return { desc: 'Zápor', icon: sunCloudRain };
    if (code >= 95) return { desc: 'Zivatar', icon: storm };
    return { desc: 'Változékony', icon: cloud };
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      {!(isFullscreen && activeTab === 'classroomscreen') && (
      <aside className={`sidebar glass-panel ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-left">
            <svg width="24" height="24" viewBox="0 0 128 128" fill="none" style={{ flexShrink: 0, borderRadius: '6px' }}>
              <rect width="128" height="128" rx="28" fill="#0A0A0C"/>
              <rect x="1" y="1" width="126" height="126" rx="27" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="2"/>
              <path d="M80 44 C80 34.5 71.5 28 58 28 C43 28 34 37 34 48 C34 61 46 65 64 69 C79 72.5 86 78 86 89 C86 101.5 73.5 108 56 108 C40 108 32 99.5 32 89" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="90" cy="36" r="6.5" fill="#E11D48"/>
            </svg>
            <span className="brand-text" style={{ fontWeight: '700', letterSpacing: '2.5px' }}>SCHOLA</span>
          </div>
          <button className="btn-icon" onClick={toggleSidebar} style={{ padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={isSidebarCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} /></svg>
          </button>
        </div>
        
        <nav className="nav-links">
          <div className={`nav-item ${activeTab === 'vezérlőpult' ? 'active' : ''}`} onClick={() => setActiveTab('vezérlőpult')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><rect x="3" y="3" width="18" height="18" /><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <span className="nav-text">Vezérlőpult</span>
          </div>
          <div className={`nav-item ${activeTab === 'napló' ? 'active' : ''}`} onClick={() => setActiveTab('napló')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span className="nav-text">Napló</span>
          </div>
          <div className={`nav-item ${activeTab === 'üzenetek' ? 'active' : ''}`} onClick={() => setActiveTab('üzenetek')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M4 4h16v16H4z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span className="nav-text">Üzenetek</span>
          </div>
          <div className={`nav-item ${activeTab === 'órarend' ? 'active' : ''}`} onClick={() => setActiveTab('órarend')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><rect x="3" y="4" width="18" height="18" /><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span className="nav-text">Órarend</span>
          </div>
          <div className={`nav-item ${activeTab === 'csoportok' ? 'active' : ''}`} onClick={() => setActiveTab('csoportok')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span className="nav-text">Csoportok és Diákok</span>
          </div>
          <div className={`nav-item ${activeTab === 'dolgozatok' ? 'active' : ''}`} onClick={() => setActiveTab('dolgozatok')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span className="nav-text">Dolgozat Radar</span>
          </div>
          <div className={`nav-item ${activeTab === 'osztalyfonok' ? 'active' : ''}`} onClick={() => setActiveTab('osztalyfonok')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M12 2l3 6h6l-5 4.5 2 7.5-6-4.5-6 4.5 2-7.5-5-4.5h6z"></path></svg>
            <span className="nav-text">Osztályfőnök</span>
          </div>
          <div className={`nav-item ${activeTab === 'eszközök' ? 'active' : ''}`} onClick={() => setActiveTab('eszközök')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            <span className="nav-text">Tanári Eszközök</span>
          </div>
                    <div className={`nav-item ${activeTab === 'classroomscreen' ? 'active' : ''}`} onClick={() => setActiveTab('classroomscreen')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <span className="nav-text">Classroom Screen</span>
          </div>
          <div className={`nav-item ${activeTab === 'beállítások' ? 'active' : ''}`} onClick={() => setActiveTab('beállítások')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><rect x="3" y="3" width="18" height="18" /><circle cx="12" cy="12" r="3"/></svg>
            <span className="nav-text">Beállítások</span>
          </div>
        </nav>

                {/* User Profile in Sidebar */}
        <div className="user-profile" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar" title="Kattints a kilépéshez" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setIsLoggedIn(false); localStorage.removeItem('ekreta_logged_in'); }}>VD</div>
          <div className="nav-text" style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: '500', fontSize: '13px', letterSpacing: '0.5px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Varga Dávid</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Osztályfőnök - 11.A</div>
          </div>
          <button 
            className="btn-icon nav-text" 
            title="Kilépés"
            style={{ padding: '6px', color: 'var(--danger)' }}
            onClick={() => {
              setIsLoggedIn(false);
              localStorage.removeItem('ekreta_logged_in');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>

        {/* Téma váltó gomb a sidebar alján */}
        <div style={{ marginTop: '16px' }}>
          <button 
            className="btn-outline" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => setIsDarkTheme(!isDarkTheme)}
          >
            {isDarkTheme ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                <span className="nav-text">Világos téma</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <span className="nav-text">Sötét téma</span>
              </>
            )}
          </button>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className="main-content" style={isFullscreen && activeTab === 'classroomscreen' ? { padding: 0 } : {}}>
        

        {activeTab === 'vezérlőpult' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
            {/* Schedule Section */}
            {/* Schedule Moved */}


          {/* Sidebar Section */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', 
              gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
              gap: '12px', 
              alignContent: 'stretch',
              height: '100%',
              minHeight: 0,
              position: 'relative',
              ...(widgetSettings.editMode ? {
                borderRadius: '4px',
              } : {})
            }}
            onDragOver={(e) => {
              if (widgetSettings.editMode) e.preventDefault();
            }}
          >
            <section className="card glass-panel animate-fade-in delay-1" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gridColumn: `${widgetPositions.schedule?.c || 1} / span 2`, gridRow: `${widgetPositions.schedule?.r || 1} / span 6`, position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'schedule')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'schedule')}>
            {(() => {
              if (!widgetSettings.showClassProgress && !widgetSettings.showUpNext) return null;
              const info = getLiveScheduleInfo();
              if (!info.current && !info.breakTime && !info.next) return null;
              
              const showCurrent = widgetSettings.showClassProgress && (info.current || info.breakTime);
              const showNext = widgetSettings.showUpNext && info.next;
              
              if (!showCurrent && !showNext) return null;

              const isBreak = !!info.breakTime;
              const currentTitle = isBreak ? info.breakTime.label : (info.current ? `${info.current.hourNumber}. óra (${info.current.subject})` : '');
              const progress = isBreak ? info.breakTime.progress : (info.current ? info.progress : 0);

              let classTimeLeft = 0;
              if (info.current && !isBreak) {
                const endStr = info.current.duration.split(' - ')[1];
                const endMin = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);
                const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                classTimeLeft = Math.max(0, endMin - currentMinutes);
              }

              const timeDisplay = isBreak ? `${info.breakTime.timeLeft} perc` : (info.current ? `${classTimeLeft} perc (${Math.round(100 - progress)}%)` : '');

              let minsLeft = 0;
              if (showNext) {
                const startStr = info.next.duration.split(' - ')[0];
                const startMin = parseInt(startStr.split(':')[0]) * 60 + parseInt(startStr.split(':')[1]);
                const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                minsLeft = startMin - currentMinutes;
              }

              // Ha az aktuális óra és a következő óra tantárgya megegyezik, ne mutassuk kétszer
              const isDuplicate = showCurrent && showNext && (
                (info.current && info.current.subject === info.next.subject) ||
                (isBreak && info.breakTime.label.includes(info.next.subject)) ||
                (currentTitle.toLowerCase().includes('lyukasóra') && info.next.subject.toLowerCase().includes('lyukasóra'))
              );

              return (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
                    {showCurrent ? 'Folyamatban' : 'Következő Óra'}
                  </div>
                  <div style={{ background: '#1c1c1e', borderRadius: '4px', padding: '12px', color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                    
                    {/* Jelenlegi státusz / Progress */}
                    {showCurrent && (
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                          <span style={{ color: '#fff' }}>{currentTitle}</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{timeDisplay}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--theme-red)', transition: 'width 1s linear' }}></div>
                        </div>
                      </div>
                    )}

                    {/* Elválasztó */}
                    {showCurrent && showNext && !isDuplicate && (
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', width: '100%', position: 'relative', zIndex: 2 }}></div>
                    )}

                    {/* Következő óra */}
                    {showNext && !isDuplicate && (
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                        <div>
                          {showCurrent && <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Következik</div>}
                          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{info.next.subject}</div>
                          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>{info.next.details} • {info.next.room}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: 1 }}>{minsLeft > 0 ? `${minsLeft}'` : 'Most'}</div>
                          <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Kezdés</div>
                        </div>
                      </div>
                    )}

                    {/* Decor circle */}
                    <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', zIndex: 1 }}></div>
                  </div>
                </div>
              );
            })()}
            <div className="calendar-header">
              <button className="btn-icon">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <div className="calendar-title">{getCalendarTitle()}</div>
              <button className="btn-icon">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <div className="days-row">
              {getDaysOfWeek().map(day => (
                <div 
                  key={day.name} 
                  className={`day-selector ${day.active ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDayIndex(day.dayIndex);
                    fetchSchedule(day.dayIndex);
                  }}
                >
                  <span className="day-name">{day.name}</span>
                  <span className="day-date">{day.date}</span>
                </div>
              ))}
            </div>
            
            <div className="schedule-list">
              {loadingSchedule ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Órarend betöltése a Kréta rendszerből...
                </div>
              ) : schedule.length > 0 ? (
                schedule.map((ora) => (
                  <div key={ora.id} className={`schedule-item ${ora.isActive ? 'active' : ''}`}>
                    <div className="time" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{ora.hourNumber}. óra</span>
                      {ora.duration && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', fontSize: '10px', fontWeight: '400', letterSpacing: '0px', color: 'var(--text-secondary)' }}>
                          <span>{ora.duration.split(' - ')[0]}</span>
                          <span>{ora.duration.split(' - ')[1]}</span>
                        </div>
                      )}
                    </div>
                    <div className="class-info">
                      <h4>{ora.subject}</h4>
                      <p>{ora.details}</p>
                    </div>
                    <div className="room-badge">{ora.room}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nincs megjeleníthető óra.
                </div>
              )}
            </div>
          </section>
            {/* Grid Background/Drop Targets */}
            {widgetSettings.editMode && Array.from({ length: 36 }).map((_, i) => {
               const r = Math.floor(i / 6) + 1;
               const c = (i % 6) + 1;
               return (
                 <div 
                   key={`cell-${c}-${r}`}
                   style={{ 
                     gridColumn: c, gridRow: r, 
                     border: '2px dashed var(--panel-border)', 
                     borderRadius: '4px',
                     zIndex: 0,
                     minHeight: 0
                   }}
                   onDragOver={handleDragOver}
                   onDrop={(e) => handleDropEmpty(e, c, r)}
                 />
               );
            })}

            
            

            

            
            {/* Digitális Óra Widget */}
            {widgetSettings.showDigitalClock && (() => {
              const now = currentTime || new Date();
              const timeString = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
              const secString = now.toLocaleTimeString('hu-HU', { second: '2-digit' });
              return (
                <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.digitalClock?.c || 1} / span ${widgetSizes.digitalClock}`, gridRow: `${widgetPositions.digitalClock?.r || 1} / span ${widgetHeights.digitalClock}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'digitalClock')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'digitalClock')}>
                  <WidgetResizer widgetKey="digitalClock" w={widgetSizes.digitalClock} h={widgetHeights.digitalClock} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card-title" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Pontos Idő</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <div className="compact-value-h" style={{ fontSize: (widgetHeights.digitalClock === 1 || widgetSizes.digitalClock === 1) ? '32px' : '48px', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '2px', color: 'var(--text-primary)', lineHeight: 1 }}>{timeString}</div>
                      <div className="compact-hide-h" style={{ fontSize: (widgetHeights.digitalClock === 1 || widgetSizes.digitalClock === 1) ? '14px' : '20px', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--accent-color)', opacity: 0.8 }}>{secString}</div>
                    </div>
                  </div>
                </section>
              );
            })()}

            
            {/* Véletlen Diák Widget */}
            {widgetSettings.showRandomStudent && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.randomStudent?.c || 1} / span ${widgetSizes.randomStudent}`, gridRow: `${widgetPositions.randomStudent?.r || 1} / span ${widgetHeights.randomStudent}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'randomStudent')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'randomStudent')}>
                <WidgetResizer widgetKey="randomStudent" w={widgetSizes.randomStudent} h={widgetHeights.randomStudent} />
                <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  
                  <div className="card-title">
                    Sorsolás {pickedGroup ? `(${pickedGroup})` : ''}
                  </div>
                  
                  <div className="compact-row-h" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '12px' }}>
                    <div className="compact-value-h" style={{ fontSize: '24px', fontWeight: 'bold', color: selectedStudent ? 'var(--accent-color)' : 'var(--text-secondary)', textAlign: 'center', transition: 'all 0.2s', transform: isPickingStudent ? 'scale(1.1)' : 'scale(1)', textShadow: isPickingStudent ? '0 0 10px var(--accent-color)' : 'none', minHeight: '28px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0 }}>
                      {selectedStudent || 'Nincs kiválasztva'}
                    </div>
                    
                    <button 
                      onClick={handlePickRandomStudent}
                      disabled={isPickingStudent}
                      className="compact-hide-h"
                      style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', cursor: isPickingStudent ? 'not-allowed' : 'pointer', opacity: isPickingStudent ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    >
                      {isPickingStudent ? 'Sorsolás...' : 'Diák Választása'}
                    </button>
                    
                    {/* Compact button for ultra-small widget mode */}
                    <button 
                      onClick={handlePickRandomStudent}
                      disabled={isPickingStudent}
                      style={{ display: 'none', background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '0 12px', height: '32px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: isPickingStudent ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                      className="compact-show-h"
                    >
                      {isPickingStudent ? '...' : 'Sorsol'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Vakáció-számláló Widget */}
            {widgetSettings.showVacationCountdown && (() => {
              const vac = getNextVacation();
              if (!vac) return null;
              return (
                <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.vacation?.c || 1} / span ${widgetSizes.vacation}`, gridRow: `${widgetPositions.vacation?.r || 1} / span ${widgetHeights.vacation}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'vacation')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'vacation')}>
                  <WidgetResizer widgetKey="vacation" w={widgetSizes.vacation} h={widgetHeights.vacation} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  {!(widgetSizes.vacation === 1 && widgetHeights.vacation === 1) && <div className="card-title">Vakáció</div>}
                  <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: widgetSizes.vacation === 1 ? '8px' : '12px', padding: widgetSizes.vacation === 1 ? '0' : '12px', background: widgetSizes.vacation === 1 ? 'transparent' : 'rgba(255,255,255,0.03)', borderRadius: '4px', flex: 1, justifyContent: widgetSizes.vacation === 1 ? 'flex-start' : 'center', minWidth: 0 }}>
                    <div style={{ width: widgetSizes.vacation === 1 ? '48px' : '56px', height: widgetSizes.vacation === 1 ? '48px' : '56px', borderRadius: '4px', background: 'var(--accent-color)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: widgetSizes.vacation === 1 ? '20px' : '24px', fontWeight: 'bold', lineHeight: 1 }}>{vac.days}</div>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nap</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
                      <div style={{ fontSize: widgetSizes.vacation === 1 ? '13px' : '16px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vac.name}</div>
                      <div style={{ fontSize: widgetSizes.vacation === 1 ? '11px' : '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vac.dateStr}</div>
                    </div>
                  </div>
                                  </div>
                </section>
              );
            })()}

            {/* Naptár Widget */}
            {widgetSettings.showMiniCalendar && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.miniCalendar?.c || 1} / span ${widgetSizes.miniCalendar}`, gridRow: `${widgetPositions.miniCalendar?.r || 1} / span ${widgetHeights.miniCalendar}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'miniCalendar')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'miniCalendar')}>
                <WidgetResizer widgetKey="miniCalendar" w={widgetSizes.miniCalendar} h={widgetHeights.miniCalendar} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                {(() => {
                  const today = new Date();
                  const monthName = today.toLocaleString('hu-HU', { month: 'long' }).toUpperCase();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
                  const offset = firstDay === 0 ? 6 : firstDay - 1;
                  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                  const days = Array(offset).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => i + 1));
                  
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minHeight: 0 }}>
                      <div style={{ color: 'var(--theme-red)', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px', marginBottom: '4px', textAlign: 'center', flexShrink: 0 }}>
                        {monthName}
                      </div>
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(0, 1fr)', gap: '2px', textAlign: 'center', minHeight: 0 }}>
                        {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map((wd, i) => (
                          <div key={i} style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{wd}</div>
                        ))}
                        {days.map((day, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, height: '100%' }}>
                            {day && (
                                <div style={{
                                  height: '100%', aspectRatio: '1/1', maxHeight: '25px', maxWidth: '25px', flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 'bold', fontSize: '11px', lineHeight: 1, margin: 'auto',
                                  color: day === today.getDate() ? '#fff' : 'var(--text-primary)',
                                  background: day === today.getDate() ? 'var(--theme-red)' : 'transparent',
                                  borderRadius: '50%'
                              }}>
                                {day}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                                </div>
                </section>
            )}

            {/* Időzítő Widget */}
            {widgetSettings.showMiniTimer && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.miniTimer?.c || 1} / span ${widgetSizes.miniTimer}`, gridRow: `${widgetPositions.miniTimer?.r || 1} / span ${widgetHeights.miniTimer}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'miniTimer')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'miniTimer')}>
                <WidgetResizer widgetKey="miniTimer" w={widgetSizes.miniTimer} h={widgetHeights.miniTimer} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Gyors Időzítő
                </div>
                <div style={{ display: 'flex', flexDirection: widgetHeights.miniTimer === 1 && widgetSizes.miniTimer >= 2 ? 'row' : 'column', alignItems: 'center', margin: 'auto', gap: widgetHeights.miniTimer === 1 && widgetSizes.miniTimer >= 2 ? '16px' : '0' }}>
                  <div style={{ fontSize: widgetHeights.miniTimer === 1 && widgetSizes.miniTimer === 1 ? '24px' : '32px', fontWeight: 'bold', fontFamily: 'monospace', color: miniTimerLeft === 0 ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1, marginBottom: widgetHeights.miniTimer === 1 && widgetSizes.miniTimer >= 2 ? '0' : '8px', letterSpacing: '2px' }}>
                    {Math.floor(miniTimerLeft / 60).toString().padStart(2, '0')}:{(miniTimerLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="btn-outline" style={{ width: '42px', height: '32px', margin: 0, padding: 0, fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} onClick={() => setMiniTimerLeft(p => p + 300)}>+5P</button>
                    <button className="btn-outline" style={{ width: '42px', height: '32px', margin: 0, padding: 0, fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} onClick={() => setMiniTimerLeft(p => p + 600)}>+10P</button>
                    <button className="btn-outline" style={{ width: '42px', height: '32px', margin: 0, padding: 0, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} title="Egyéni idő" onClick={() => {
                        const val = window.prompt("Add meg a percet:", "15");
                        if(val && !isNaN(val)) setMiniTimerLeft(parseInt(val)*60);
                      }}>✎</button>
                    <button className="btn-primary" style={{ width: '42px', height: '32px', margin: 0, padding: 0, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} onClick={() => setMiniTimerRunning(!miniTimerRunning)}>
                      {miniTimerRunning ? '⏸' : '▶'}
                    </button>
                    <button className="btn-outline" style={{ width: '42px', height: '32px', margin: 0, padding: 0, fontSize: '12px', color: 'var(--theme-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} onClick={() => { setMiniTimerRunning(false); setMiniTimerLeft(0); }}>◼</button>
                  </div>
                </div>
                                </div>
                </section>
            )}

            {/* Messages */}
            {widgetSettings.showMessages && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.messages?.c || 1} / span ${widgetSizes.messages}`, gridRow: `${widgetPositions.messages?.r || 1} / span ${widgetHeights.messages}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'messages')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'messages')}>
                <WidgetResizer widgetKey="messages" w={widgetSizes.messages} h={widgetHeights.messages} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="card-title">
                  Olvasatlan Üzenetek
                  <span className="badge">2</span>
                </div>
                
                <div className="message-list" style={{ flex: 1, overflow: 'auto' }}>
                  <div className="message-item">
                    <div className="message-header">
                      <span className="message-sender" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Kovács István (Igazgató)</span>
                      <span className="message-time">10 P</span>
                    </div>
                    <div className="message-preview">
                      Tisztelt Kollégák! A holnapi értekezlet időpontja 14:00-ra módosult...
                    </div>
                  </div>
                </div>
                <button className="all-msgs-btn">Összes üzenet megtekintése</button>
                                </div>
                </section>
            )}

            {/* Quick Actions / Tasks */}
            {widgetSettings.showQuickActions && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.quickActions?.c || 1} / span ${widgetSizes.quickActions}`, gridRow: `${widgetPositions.quickActions?.r || 1} / span ${widgetHeights.quickActions}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'quickActions')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'quickActions')}>
                <WidgetResizer widgetKey="quickActions" w={widgetSizes.quickActions} h={widgetHeights.quickActions} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="card-title">Gyors Műveletek</div>
                <div style={{ display: 'grid', gridTemplateColumns: widgetSizes.quickActions === 1 ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '8px', flex: 1, minHeight: 0 }}>
                  <button className="quick-actions-btn" style={{ fontSize: '11px', padding: '6px', height: '100%', display: 'flex', flexDirection: widgetHeights.quickActions === 1 && widgetSizes.quickActions > 1 ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(128,128,128,0.2)', background: 'var(--hover-bg)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>Új üzenet</span>
                  </button>
                  <button className="quick-actions-btn" style={{ fontSize: '11px', padding: '6px', height: '100%', display: 'flex', flexDirection: widgetHeights.quickActions === 1 && widgetSizes.quickActions > 1 ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(128,128,128,0.2)', background: 'var(--hover-bg)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>Igazolás</span>
                  </button>
                  <button className="quick-actions-btn" style={{ fontSize: '11px', padding: '6px', height: '100%', display: 'flex', flexDirection: widgetHeights.quickActions === 1 && widgetSizes.quickActions > 1 ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(128,128,128,0.2)', background: 'var(--hover-bg)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><rect x="4" y="4" width="16" height="16" /><line x1="4" y1="9" x2="20" y2="9" /><line x1="9" y1="4" x2="9" y2="20" /></svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>Jegybeírás</span>
                  </button>
                  <button className="quick-actions-btn" style={{ fontSize: '11px', padding: '6px', height: '100%', display: 'flex', flexDirection: widgetHeights.quickActions === 1 && widgetSizes.quickActions > 1 ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(128,128,128,0.2)', background: 'var(--hover-bg)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>Jelenlét</span>
                  </button>
                </div>
                                </div>
                </section>
            )}

            {/* Napi Motiváció Widget */}
            {widgetSettings.showQuote && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.quote?.c || 1} / span ${widgetSizes.quote}`, gridRow: `${widgetPositions.quote?.r || 1} / span ${widgetHeights.quote}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'quote')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'quote')}>
                <WidgetResizer widgetKey="quote" w={widgetSizes.quote} h={widgetHeights.quote} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="card-title compact-hide-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span>Quote of the day</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => { setQuoteType('teacher'); localStorage.setItem('ekreta_quote_type', 'teacher'); }} 
                      style={{ padding: '2px 6px', fontSize: '10px', background: quoteType === 'teacher' ? 'var(--accent-color)' : 'transparent', color: quoteType === 'teacher' ? 'var(--bg-color)' : 'var(--text-secondary)', border: '1px solid var(--panel-border)', borderRadius: '4px', cursor: 'pointer' }}
                    >Tanári</button>
                    <button 
                      onClick={() => { setQuoteType('student'); localStorage.setItem('ekreta_quote_type', 'student'); }} 
                      style={{ padding: '2px 6px', fontSize: '10px', background: quoteType === 'student' ? 'var(--accent-color)' : 'transparent', color: quoteType === 'student' ? 'var(--bg-color)' : 'var(--text-secondary)', border: '1px solid var(--panel-border)', borderRadius: '4px', cursor: 'pointer' }}
                    >Diák</button>
                  </div>
                </div>
                <div 
                  style={{ fontStyle: 'italic', color: 'var(--text-primary)', textAlign: 'center', padding: '12px 8px', fontSize: '14px', lineHeight: 1.5, margin: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setQuoteOffset(prev => prev + 1)}
                  title="Kattints új idézetért!"
                >
                  <span>"{dailyQuote.split(' - ')[0]}"</span>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation(); // prevent cycling quote
                        const newType = quoteType === 'teacher' ? 'student' : 'teacher';
                        setQuoteType(newType);
                        localStorage.setItem('ekreta_quote_type', newType);
                      }}
                      style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Váltás (Tanári / Diák)"
                    >
                      Mód: <strong>{quoteType === 'teacher' ? 'Tanári' : 'Diák'}</strong>
                    </span>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textAlign: 'right' }}>- {dailyQuote.split(' - ')[1]}</div>
                  </div>
                </div>
                                </div>
                </section>
            )}

            {/* Gyors Teendők (To-Do) Widget */}
            {widgetSettings.showTodos && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.todos?.c || 1} / span ${widgetSizes.todos}`, gridRow: `${widgetPositions.todos?.r || 1} / span ${widgetHeights.todos}`, overflow: 'hidden', position: 'relative', zIndex: 1, }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'todos')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'todos')}>
                <WidgetResizer widgetKey="todos" w={widgetSizes.todos} h={widgetHeights.todos} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="card-title" style={{ marginBottom: '12px' }}>Gyors Teendők</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {todos.map(todo => (
                    <div key={todo.id} className="todo-item group" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px', borderRadius: '4px', transition: 'background 0.2s' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }} onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))}>
                         <div style={{ width: '18px', height: '18px', flexShrink: 0, borderRadius: '4px', border: '2px solid var(--accent-color)', background: todo.done ? 'var(--accent-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {todo.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg-color)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                           <span style={{ fontSize: '13px', color: todo.done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: todo.done ? 'line-through' : 'none', wordBreak: 'break-word' }}>{todo.text}</span>
                           {(todo.deadline || todo.class || todo.lesson || (todo.priority && todo.priority !== 'Közepes')) && (
                             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                               {todo.class && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{todo.class}</span>}
                               {todo.lesson && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{todo.lesson}. óra</span>}
                               {todo.deadline && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{todo.deadline}</span>}
                               {todo.priority && todo.priority !== 'Közepes' && <span style={{ fontSize: '10px', padding: '2px 6px', background: todo.priority === 'Magas' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: todo.priority === 'Magas' ? 'var(--danger)' : '#22c55e', borderRadius: '4px' }}>{todo.priority}</span>}
                             </div>
                           )}
                         </div>
                       </div>
                       <button className="delete-todo-btn" title="Törlés" style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.7} onClick={(e) => { e.stopPropagation(); setTodos(todos.filter(t => t.id !== todo.id)); }}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                       </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <input type="text" placeholder="Új teendő hozzáadása (Enter)..." className="input-field" style={{ flex: 1, padding: '8px 12px', fontSize: '12px', borderRadius: '4px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', outline: 'none' }} onKeyDown={(e) => {
                      if(e.key === 'Enter' && e.target.value.trim()) {
                         setTodos([...todos, { id: Date.now(), text: e.target.value.trim(), done: false }]);
                         e.target.value = '';
                      }
                    }} />
                    <button onClick={() => setTodoModalOpen(true)} className="btn-icon" style={{ padding: '8px', borderRadius: '4px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }} title="Részletes teendő felvétele">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                  </div>
                </div>
                                </div>
                </section>
            )}

            {/* Post-it / Gyors Jegyzet Widget */}
            {widgetSettings.showPostit && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.postit?.c || 1} / span ${widgetSizes.postit}`, gridRow: `${widgetPositions.postit?.r || 1} / span ${widgetHeights.postit}`, overflow: 'hidden', position: 'relative', zIndex: 1, background: 'var(--accent-color)', color: '#fff' }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'postit')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'postit')}>
                <WidgetResizer widgetKey="postit" w={widgetSizes.postit} h={widgetHeights.postit} />
                  <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="card-title" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>Gyors Jegyzet</div>
                <textarea 
                  value={postit}
                  onChange={(e) => setPostit(e.target.value)}
                  style={{ width: '100%', flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                  placeholder="Írj ide valami fontosat..."
                />
                                </div>
                </section>
            )}

            {/* Szokáskövető Widget */}
            {widgetSettings.showHabitTracker && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.habitTracker?.c || 1} / span ${widgetSizes.habitTracker}`, gridRow: `${widgetPositions.habitTracker?.r || 1} / span ${widgetHeights.habitTracker}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'habitTracker')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'habitTracker')}>
                <WidgetResizer widgetKey="habitTracker" w={widgetSizes.habitTracker} h={widgetHeights.habitTracker} />
                <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div className="card-title" style={{ marginBottom: 0 }}>{widgetSettings.habitName}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--theme-red)' }}>{widgetSettings.habitType === 'napi' ? habitDailyPct : habitWeeklyPct}%</div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="progress-bg" style={{ height: '6px', marginBottom: '16px' }}>
                    <div className="progress-fill" style={{ width: `${widgetSettings.habitType === 'napi' ? habitDailyPct : habitWeeklyPct}%`, background: 'var(--theme-red)' }}></div>
                  </div>

                  {widgetSettings.habitType === 'napi' ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                      {Array.from({length: widgetSettings.habitDailyMax}).map((_, i) => (
                        <div key={i} onClick={() => setHabitProgress({...habitProgress, dailyCount: i + 1 === habitProgress.dailyCount ? i : i + 1})} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--theme-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: i < habitProgress.dailyCount ? 'var(--theme-red)' : 'transparent', color: i < habitProgress.dailyCount ? '#fff' : 'transparent', transition: 'all 0.2s', boxShadow: i < habitProgress.dailyCount ? '0 2px 8px rgba(204, 0, 0, 0.3)' : 'none' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between', flex: 1, alignItems: 'center' }}>
                      {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((day, i) => {
                         const isActive = habitProgress.weeklyDays.includes(i);
                         return (
                           <div key={i} onClick={() => {
                              const newDays = isActive ? habitProgress.weeklyDays.filter(d => d !== i) : [...habitProgress.weeklyDays, i];
                              setHabitProgress({...habitProgress, weeklyDays: newDays});
                           }} style={{ flex: 1, aspectRatio: '1', borderRadius: '6px', border: isActive ? '1px solid var(--theme-red)' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isActive ? 'var(--theme-red)' : 'var(--bg-secondary)', color: isActive ? '#fff' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: isActive ? '0 2px 8px rgba(204, 0, 0, 0.3)' : 'none' }}>
                             {day}
                           </div>
                         );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Folyadékpótlás Widget */}
            {widgetSettings.showHydrationTracker && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.hydrationTracker?.c || 1} / span ${widgetSizes.hydrationTracker}`, gridRow: `${widgetPositions.hydrationTracker?.r || 1} / span ${widgetHeights.hydrationTracker}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'hydrationTracker')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'hydrationTracker')}>
                <WidgetResizer widgetKey="hydrationTracker" w={widgetSizes.hydrationTracker} h={widgetHeights.hydrationTracker} />
                <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div className="card-title" style={{ marginBottom: '8px' }}>Folyadékpótlás</div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '12px', minHeight: 0, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', flexShrink: 0, width: '64px', height: '100%', minHeight: 0 }}>
                      <div onClick={() => setHydrationProgress({...hydrationProgress, amount: hydrationProgress.amount + 250})} style={{ width: '100%', flex: 1, maxHeight: '32px', minHeight: 0, borderRadius: '4px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all 0.2s', overflow: 'hidden' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--theme-red)'; e.currentTarget.style.color = 'var(--theme-red)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--panel-border)'; e.currentTarget.style.color = 'var(--text-primary)'; }} title="Pohár (250ml)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>25</span>
                      </div>
                      <div onClick={() => setHydrationProgress({...hydrationProgress, amount: hydrationProgress.amount + 500})} style={{ width: '100%', flex: 1, maxHeight: '32px', minHeight: 0, borderRadius: '4px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all 0.2s', overflow: 'hidden' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--theme-red)'; e.currentTarget.style.color = 'var(--theme-red)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--panel-border)'; e.currentTarget.style.color = 'var(--text-primary)'; }} title="Kulacs (500ml)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}><rect width="8" height="14" x="8" y="8" rx="2" ry="2"/><path d="M10 2h4"/><path d="M12 2v6"/></svg>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>50</span>
                      </div>
                      <div onClick={() => setHydrationProgress({...hydrationProgress, amount: 0})} style={{ width: '100%', flex: 1, maxHeight: '32px', minHeight: 0, borderRadius: '4px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0, overflow: 'hidden' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--danger)'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--panel-border)'; }} title="Törlés">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0, height: '100%' }}>
                      <div style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 120 120" style={{ height: '100%', width: '100%' }}>
                          <circle stroke="rgba(128,128,128,0.2)" fill="transparent" strokeWidth={hydroStroke} r={hydroNormRadius} cx="60" cy="60" />
                          <circle stroke="var(--theme-red)" fill="transparent" strokeWidth={hydroStroke} strokeDasharray={hydroCircumference + ' ' + hydroCircumference} style={{ strokeDashoffset: hydroDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }} strokeLinecap="round" r={hydroNormRadius} cx="60" cy="60" transform="rotate(-90 60 60)" />
                          <text x="60" y="55" fill="var(--text-primary)" fontSize="24" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">{hydrationPct}%</text>
                          <text x="60" y="75" fill="var(--text-secondary)" fontSize="12" textAnchor="middle" alignmentBaseline="middle">{hydrationProgress.amount} / {widgetSettings.hydrationTarget}</text>
                        </svg>
                      </div>
                      {(() => { 
                        const info = getLiveScheduleInfo(); 
                        const showWarning = info.breakTime && hydrationProgress.amount < widgetSettings.hydrationTarget; 
                        return showWarning ? <div style={{ color: 'var(--theme-red)', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', marginTop: '4px', animation: 'pulse 2s infinite', flexShrink: 0 }}>💧 Szünet van, igyál!</div> : null; 
                      })()}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Könyvjelzők Widget */}
            {widgetSettings.showBookmarks && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.bookmarks?.c || 1} / span ${widgetSizes.bookmarks}`, gridRow: `${widgetPositions.bookmarks?.r || 1} / span ${widgetHeights.bookmarks}`, overflow: 'hidden', position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'bookmarks')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'bookmarks')}>
                <WidgetResizer widgetKey="bookmarks" w={widgetSizes.bookmarks} h={widgetHeights.bookmarks} />
                <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div className="card-title" style={{ marginBottom: '12px' }}>Könyvjelzők</div>
                  <div style={{ display: 'grid', gridTemplateColumns: widgetSizes.bookmarks === 1 ? '1fr' : 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', flex: 1 }}>
                    {bookmarks.slice(0, 5).map((bm, i) => (
                       <a key={i} href={bm.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '4px', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
                         <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--accent-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                           {bm.title.charAt(0).toUpperCase()}
                         </div>
                         <span style={{ fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{bm.title}</span>
                       </a>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Időjárás Widget */}
            {widgetSettings.showWeather && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gridColumn: `${widgetPositions.weather?.c || 1} / span ${widgetSizes.weather}`, gridRow: `${widgetPositions.weather?.r || 1} / span ${widgetHeights.weather}`, overflow: 'hidden', position: 'relative', zIndex: 1, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: '#fff' }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'weather')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'weather')}>
                <WidgetResizer widgetKey="weather" w={widgetSizes.weather} h={widgetHeights.weather} />
                <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1.5px', marginBottom: '8px', opacity: 0.9, textTransform: 'uppercase', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{weatherLocation}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ fontSize: '38px', lineHeight: 1 }}>{getWeatherDetails(weatherData?.weathercode).icon}</div>
                     <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{weatherData ? Math.round(weatherData.temperature) : '--'}°C</div>
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '8px', opacity: 0.8, fontWeight: '500' }}>{getWeatherDetails(weatherData?.weathercode).desc}</div>
                </div>
              </section>
            )}
          </div>
        </div>
        )}
        
        {activeTab === 'csoportok' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <Groups />
          </div>
        )}
        
        {activeTab === 'dolgozatok' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <Exams addNotification={addNotification} vacationDates={vacationDates} />
          </div>
        )}
        
        {activeTab === 'osztalyfonok' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <HeadTeacher addNotification={addNotification} />
          </div>
        )}
        
        {activeTab === 'eszközök' && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
            <TeacherTools />
          </div>
        )}

        
        {activeTab === 'classroomscreen' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: classroomBg, color: currentBgObj.color, margin: 0, overflow: 'hidden', borderRadius: isFullscreen ? '0' : '4px' }}>
            
            <button 
              className="btn-icon"
              style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 100, background: 'rgba(128,128,128,0.2)', color: currentBgObj.color, padding: '12px', borderRadius: '4px' }}
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(e => console.error(e));
                } else {
                  document.exitFullscreen().catch(e => console.error(e));
                }
              }}
              title={isFullscreen ? "Kilépés a teljes képernyőből (Esc)" : "Teljes képernyő indítása"}
            >
              {isFullscreen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
              )}
            </button>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              
              {classroomWidgets.map(widget => (
                <Rnd
                  key={widget.id}
                  default={{ x: widget.x, y: widget.y, width: 320, height: 240 }}
                  minWidth={200}
                  minHeight={150}
                  bounds="parent"
                  dragHandleClassName="widget-drag-handle"
                  style={{ zIndex: 20 }}
                >
                  <div style={{ 
                    width: '100%', height: '100%', 
                    background: currentBgObj.color === '#ffffff' ? '#111111' : '#ffffff', 
                    color: currentBgObj.color === '#ffffff' ? '#ffffff' : '#000000',
                    borderRadius: '4px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(128,128,128,0.2)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    {/* Title bar for dragging */}
                    <div className="widget-drag-handle" style={{ 
                      padding: '8px 16px', 
                      background: 'rgba(128,128,128,0.1)', 
                      borderBottom: '1px solid var(--panel-border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'grab' 
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {widget.type}
                      </span>
                      <button 
                        onClick={() => removeWidget(widget.id)}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', opacity: 0.5 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {widget.type === 'Pontos idő' && <div style={{ fontSize: '48px', fontWeight: '200' }}>12:34</div>}
                      {widget.type === 'Időzítő' && <div style={{ fontSize: '48px', fontWeight: '200', color: 'var(--accent-color)' }}>15:00</div>}
                      {widget.type === 'Zajszintmérő' && <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: '300', marginBottom: '8px' }}>Csendes</div><div style={{ width: '200px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}><div style={{ width: '30%', height: '100%', background: 'var(--success)', borderRadius: '4px' }}></div></div></div>}
                      {widget.type === 'Véletlen Diák' && <div style={{ textAlign: 'center' }}><button className="btn-primary" style={{ padding: '8px 16px', borderRadius: '4px' }}>Sorsolás</button></div>}
                      {widget.type === 'Szövegdoboz' && <textarea placeholder="Ide írhatsz..." style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: 'inherit', resize: 'none', outline: 'none' }}></textarea>}
                      {!['Pontos idő', 'Időzítő', 'Zajszintmérő', 'Véletlen Diák', 'Szövegdoboz'].includes(widget.type) && <div style={{ opacity: 0.5 }}>Hamarosan...</div>}
                    </div>
                  </div>
                </Rnd>
              ))}

              {classroomWidgets.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ fontSize: '24px', opacity: 0.3, fontWeight: '300', letterSpacing: '1px' }}>
                    Kattints egy eszközre az alsó sávban a megjelenítéshez...
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bottom Tools Bar Wrapper */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 10 }}>
              
              {/* Toggle Button */}
              {isFullscreen && (
                <button 
                  className="btn-icon"
                  style={{ 
                    position: 'absolute', 
                    top: isToolbarCollapsed ? '-14px' : '-20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    background: currentBgObj.color === '#ffffff' ? '#111111' : '#ffffff',
                    color: currentBgObj.color === '#ffffff' ? '#ffffff' : '#000000',
                    border: '1px solid var(--panel-border)',
                  borderRadius: '4px',
                    padding: '6px',
                    zIndex: 50,
                    cursor: 'pointer',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.2)'
                  }}
                  onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
                  title={isToolbarCollapsed ? "Eszköztár kinyitása" : "Eszköztár elrejtése"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isToolbarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              )}

              {/* Bottom Tools Bar */}
              <div style={{ 
                background: currentBgObj.color === '#ffffff' ? '#111111' : '#ffffff', 
                color: currentBgObj.color === '#ffffff' ? '#ffffff' : '#000000',
                borderTop: '1px solid var(--panel-border)', 
                padding: isToolbarCollapsed ? '0' : '16px 32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '48px', 
                flexWrap: 'wrap',
                height: isToolbarCollapsed ? '0px' : 'auto',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}>
                {!isToolbarCollapsed && (
                  <>
                {/* Category: Időkezelés */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '8px', fontWeight: 'bold' }}>Idő</div>
                <button onClick={() => addWidget('Pontos idő')} className="btn-icon" title="Pontos idő" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></button>
                <button onClick={() => addWidget('Időzítő')} className="btn-icon" title="Időzítő" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 12 12 14 14"></polyline><line x1="12" y1="2" x2="12" y2="4"></line></svg></button>
                <button onClick={() => addWidget('Naptár')} className="btn-icon" title="Naptár" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button>
              </div>
              
              <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }}></div>

              {/* Category: Osztályterem */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '8px', fontWeight: 'bold' }}>Osztály</div>
                <button onClick={() => addWidget('Zajszintmérő')} className="btn-icon" title="Zajszintmérő" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5v14M7 5v14M22 8v8M2 8v8"/></svg></button>
                <button onClick={() => addWidget('Véletlen Diák')} className="btn-icon" title="Véletlen Diák" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></button>
                <button onClick={() => addWidget('Csoportalkotó')} className="btn-icon" title="Csoportalkotó" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></button>
              </div>

              <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }}></div>

              {/* Category: Média & Jegyzet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '8px', fontWeight: 'bold' }}>Média</div>
                <button onClick={() => addWidget('Szövegdoboz')} className="btn-icon" title="Szövegdoboz" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg></button>
                <button onClick={() => addWidget('Rajztábla')} className="btn-icon" title="Rajztábla" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg></button>
                <button onClick={() => addWidget('QR Kód')} className="btn-icon" title="QR Kód" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
              </div>
              
              <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }}></div>

              {/* Category: Háttér */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '8px', fontWeight: 'bold' }}>Háttér</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '280px' }}>
                  {[...solidBgs, ...gradientBgs].map(bg => (
                    <div 
                      key={bg.value}
                      onClick={() => { setClassroomBg(bg.value); localStorage.setItem('ekreta_classroom_bg', bg.value); }}
                      style={{ 
                        width: '24px', height: '24px', borderRadius: '4px', background: bg.value, cursor: 'pointer',
                        border: classroomBg === bg.value ? '2px solid var(--accent-color)' : '1px solid rgba(128,128,128,0.3)',
                        boxShadow: classroomBg === bg.value ? '0 0 5px var(--accent-color)' : 'none',
                        transition: 'all 0.2s'
                      }}
                      title={bg.label}
                    />
                  ))}
                </div>
              </div>
                </>
              )}
            </div>
            </div>
          </div>
        )}
        
        {activeTab === 'beállítások' && (
          <div className="card glass-panel animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <h2 className="card-title" style={{ marginBottom: '16px' }}>Widget Beállítások</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Itt testreszabhatod, hogy milyen widgetek és modulok jelenjenek meg a Vezérlőpult oldalsávjában. A beállítások automatikusan mentésre kerülnek.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              
              {/* Oszlop 1: Adminisztráció */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', margin: '0 0 8px 0', fontSize: '18px', color: 'var(--accent-color)' }}>Adminisztráció</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Widgetek szerkesztése</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>A widgetek szélét húzva módosíthatod a méretüket.</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.editMode} onChange={(e) => updateWidgetSetting('editMode', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.editMode ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.editMode ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Rács automatikus kitöltése</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Ha be van kapcsolva, a rendszer felhúzza az alsóbb widgeteket az üresen maradt helyekre.</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.autoFillGrid || false} onChange={(e) => updateWidgetSetting('autoFillGrid', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.autoFillGrid ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.autoFillGrid ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Gyors Teendők (To-Do)</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showTodos} onChange={(e) => updateWidgetSetting('showTodos', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showTodos ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showTodos ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Post-it / Jegyzet</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showPostit} onChange={(e) => updateWidgetSetting('showPostit', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showPostit ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showPostit ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Üzenetek Előnézete</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showMessages} onChange={(e) => updateWidgetSetting('showMessages', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showMessages ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showMessages ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Gyors Műveletek</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showQuickActions} onChange={(e) => updateWidgetSetting('showQuickActions', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showQuickActions ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showQuickActions ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Oszlop 2: Óraszervezés */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', margin: '0 0 8px 0', fontSize: '18px', color: 'var(--accent-color)' }}>Óraszervezés</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Következő Óra</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showUpNext} onChange={(e) => updateWidgetSetting('showUpNext', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showUpNext ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showUpNext ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Visszaszámláló a Szünetig</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showClassProgress} onChange={(e) => updateWidgetSetting('showClassProgress', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showClassProgress ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showClassProgress ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Mini Naptár</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showMiniCalendar} onChange={(e) => updateWidgetSetting('showMiniCalendar', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showMiniCalendar ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showMiniCalendar ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Digitális Óra</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showDigitalClock} onChange={(e) => updateWidgetSetting('showDigitalClock', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showDigitalClock ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showDigitalClock ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Gyors Időzítő</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showMiniTimer} onChange={(e) => updateWidgetSetting('showMiniTimer', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showMiniTimer ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showMiniTimer ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Oszlop 3: Pedagógiai Eszközök */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', margin: '0 0 8px 0', fontSize: '18px', color: 'var(--accent-color)' }}>Pedagógiai & Egyéb</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Napi Motiváció (Idézet)</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showQuote} onChange={(e) => updateWidgetSetting('showQuote', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showQuote ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showQuote ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Szokáskövető</h4>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showHabitTracker} onChange={(e) => updateWidgetSetting('showHabitTracker', e.target.checked)} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showHabitTracker ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showHabitTracker ? 'translateX(16px)' : 'none' }}></span>
                      </span>
                    </label>
                  </div>
                  {widgetSettings.showHabitTracker && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <input type="text" value={widgetSettings.habitName} onChange={(e) => updateWidgetSetting('habitName', e.target.value)} style={{ padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} placeholder="Tevékenység (pl. Vízivás)" />
                      <select value={widgetSettings.habitType} onChange={(e) => updateWidgetSetting('habitType', e.target.value)} style={{ padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                        <option value="napi">Napi ütemezés (többszöri pipa)</option>
                        <option value="heti">Heti ütemezés (napok kipipálása)</option>
                      </select>
                      {widgetSettings.habitType === 'napi' && (
                        <input type="number" min="1" max="20" value={widgetSettings.habitDailyMax} onChange={(e) => updateWidgetSetting('habitDailyMax', parseInt(e.target.value))} style={{ padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} placeholder="Hányszor egy nap?" />
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Folyadékpótlás</h4>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showHydrationTracker} onChange={(e) => updateWidgetSetting('showHydrationTracker', e.target.checked)} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showHydrationTracker ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showHydrationTracker ? 'translateX(16px)' : 'none' }}></span>
                      </span>
                    </label>
                  </div>
                  {widgetSettings.showHydrationTracker && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Napi cél (ml)</label>
                      <input type="number" min="500" max="10000" step="100" value={widgetSettings.hydrationTarget} onChange={(e) => updateWidgetSetting('hydrationTarget', parseInt(e.target.value) || 2000)} style={{ padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} placeholder="pl. 2000" />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Könyvjelzők</h4>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showBookmarks} onChange={(e) => updateWidgetSetting('showBookmarks', e.target.checked)} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showBookmarks ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showBookmarks ? 'translateX(16px)' : 'none' }}></span>
                      </span>
                    </label>
                  </div>
                  {widgetSettings.showBookmarks && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {bookmarks.map((bm, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="text" value={bm.title} onChange={(e) => {
                            const newBm = [...bookmarks];
                            newBm[index].title = e.target.value;
                            setBookmarks(newBm);
                          }} style={{ padding: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', flex: 1, fontSize: '12px' }} placeholder="Név" />
                          <input type="text" value={bm.url} onChange={(e) => {
                            const newBm = [...bookmarks];
                            newBm[index].url = e.target.value;
                            setBookmarks(newBm);
                          }} style={{ padding: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', flex: 2, fontSize: '12px' }} placeholder="https://..." />
                          <button className="btn-icon" style={{ color: 'var(--danger)', padding: '4px', flexShrink: 0 }} onClick={() => setBookmarks(bookmarks.filter((_, i) => i !== index))}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ))}
                      {bookmarks.length < 5 && (
                        <button className="btn-outline" style={{ fontSize: '12px', padding: '6px', marginTop: '4px', display: 'flex', justifyContent: 'center' }} onClick={() => setBookmarks([...bookmarks, { title: 'Új', url: 'https://' }])}>
                          + Új hozzáadása
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Időjárás</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showWeather} onChange={(e) => updateWidgetSetting('showWeather', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showWeather ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showWeather ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Véletlen Diák</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showRandomStudent} onChange={(e) => updateWidgetSetting('showRandomStudent', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showRandomStudent ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showRandomStudent ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Vakáció-számláló</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showVacationCountdown} onChange={(e) => updateWidgetSetting('showVacationCountdown', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showVacationCountdown ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showVacationCountdown ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
                
                {widgetSettings.showVacationCountdown && (
                  <div style={{ padding: '12px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', marginTop: '-8px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-primary)' }}>Szünetek Dátumai (Kezdete – Vége)</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      A megadott szünetek automatikusan levonódnak a dolgozatok 15 munkanapos javítási határidejéből!
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <label className="input-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Őszi szünet</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }} value={vacationDates.autumnStart || vacationDates.autumn} onChange={(e) => updateVacationDate('autumnStart', e.target.value)} />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>–</span>
                          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }} value={vacationDates.autumnEnd || ''} onChange={(e) => updateVacationDate('autumnEnd', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="input-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Téli szünet</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }} value={vacationDates.winterStart || vacationDates.winter} onChange={(e) => updateVacationDate('winterStart', e.target.value)} />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>–</span>
                          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }} value={vacationDates.winterEnd || ''} onChange={(e) => updateVacationDate('winterEnd', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="input-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Tavaszi szünet</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }} value={vacationDates.springStart || vacationDates.spring} onChange={(e) => updateVacationDate('springStart', e.target.value)} />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>–</span>
                          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }} value={vacationDates.springEnd || ''} onChange={(e) => updateVacationDate('springEnd', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="input-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Nyári szünet</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }} value={vacationDates.summerStart || vacationDates.summer} onChange={(e) => updateVacationDate('summerStart', e.target.value)} />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>–</span>
                          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }} value={vacationDates.summerEnd || ''} onChange={(e) => updateVacationDate('summerEnd', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      
      {/* Todo Modal */}
      {todoModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setTodoModalOpen(false)}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Részletes Teendő</h3>
            
            <div>
              <label className="input-label">Teendő szövege</label>
              <input type="text" className="input-field" autoFocus value={newTodoDraft.text} onChange={e => setNewTodoDraft({...newTodoDraft, text: e.target.value})} placeholder="Mit kell elintézni?" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">Határidő (opcionális)</label>
                <input type="date" className="input-field" value={newTodoDraft.deadline} onChange={e => setNewTodoDraft({...newTodoDraft, deadline: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Osztály (opcionális)</label>
                <input type="text" className="input-field" value={newTodoDraft.class} onChange={e => setNewTodoDraft({...newTodoDraft, class: e.target.value})} placeholder="pl. 11.A" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">Óra (opcionális)</label>
                <input type="number" className="input-field" value={newTodoDraft.lesson} onChange={e => setNewTodoDraft({...newTodoDraft, lesson: e.target.value})} placeholder="pl. 3" min="1" max="10" />
              </div>
              <div>
                <label className="input-label">Prioritás</label>
                <select className="input-field" value={newTodoDraft.priority} onChange={e => setNewTodoDraft({...newTodoDraft, priority: e.target.value})}>
                  <option value="Alacsony">Alacsony</option>
                  <option value="Közepes">Közepes</option>
                  <option value="Magas">Magas</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setTodoModalOpen(false)}>Mégse</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                if(newTodoDraft.text.trim()) {
                  setTodos([...todos, { id: Date.now(), ...newTodoDraft, text: newTodoDraft.text.trim(), done: false }]);
                  setNewTodoDraft({ text: '', deadline: '', class: '', lesson: '', priority: 'Közepes' });
                  setTodoModalOpen(false);
                }
              }}>Mentés</button>
            </div>
          </div>
        </div>
      )}
      </main>

      {/* Értesítések (Toasts) */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 9999 }}>
        {notifications.map(notif => {
          let icon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
          let color = '#3b82f6';
          
          if (notif.type === 'error') {
            icon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
            color = '#ef4444';
          } else if (notif.type === 'warning') {
            icon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
            color = '#f59e0b';
          } else if (notif.type === 'success') {
            icon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
            color = '#10b981';
          }

          return (
            <div key={notif.id} className="glass-panel" style={{ 
              padding: '12px 16px', 
              borderRadius: '8px',
              borderLeft: `4px solid ${color}`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              minWidth: '280px',
              maxWidth: '350px',
              animation: 'slideInRight 0.3s ease-out'
            }}>
              <div style={{ marginTop: '2px' }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>{notif.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{notif.message}</div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default App;
