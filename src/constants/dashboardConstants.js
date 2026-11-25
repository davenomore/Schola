export const SOLID_BGS = [
  { label: 'Fekete', value: '#000000', color: '#ffffff' },
  { label: 'Sötétkék', value: '#0f172a', color: '#ffffff' },
  { label: 'Világosszürke', value: '#f3f4f6', color: '#111827' },
  { label: 'Fehér', value: '#ffffff', color: '#000000' },
  { label: 'Homok', value: '#f5f5dc', color: '#4b5563' },
  { label: 'Menta', value: '#e6f4ea', color: '#166534' },
  { label: 'Ég', value: '#e8f0fe', color: '#1e40af' },
  { label: 'Lila', value: '#f3e8ff', color: '#6b21a8' }
];

export const GRADIENT_BGS = [
  { label: 'Zöld Erdő', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', color: '#ffffff' },
  { label: 'Lila Köd', value: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)', color: '#ffffff' },
  { label: 'Óceán', value: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)', color: '#ffffff' },
  { label: 'Naplemente', value: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)', color: '#ffffff' },
  { label: 'Hajnal', value: 'linear-gradient(135deg, #fdf4ff 0%, #fbcfe8 100%)', color: '#831843' },
  { label: 'Tengerpart', value: 'linear-gradient(135deg, #a7f3d0 0%, #10b981 100%)', color: '#064e3b' }
];

export const AMBIENT_PATTERNS = [
  {
    label: 'Kréta Tábla',
    icon: '🟢',
    value: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.06) 0%, transparent 75%), #14281d',
    color: '#ffffff'
  },
  {
    label: 'Kék Négyzetháló',
    icon: '📐',
    value: 'linear-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px) 0 0 / 32px 32px, linear-gradient(90deg, rgba(56, 189, 248, 0.12) 1px, transparent 1px) 0 0 / 32px 32px, #0a192f',
    color: '#ffffff'
  },
  {
    label: 'Sarki Fény',
    icon: '🌌',
    value: 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.35) 0px, transparent 55%), radial-gradient(at 100% 0%, rgba(56, 189, 248, 0.35) 0px, transparent 55%), radial-gradient(at 50% 100%, rgba(147, 51, 234, 0.35) 0px, transparent 65%), #030712',
    color: '#ffffff'
  },
  {
    label: 'Kozmosz & Csillagok',
    icon: '✨',
    value: 'radial-gradient(1px 1px at 25px 35px, #ffffff, rgba(0,0,0,0)) 0 0 / 240px 240px, radial-gradient(1.5px 1.5px at 120px 80px, #93c5fd, rgba(0,0,0,0)) 0 0 / 240px 240px, radial-gradient(1px 1px at 190px 160px, #ffffff, rgba(0,0,0,0)) 0 0 / 240px 240px, radial-gradient(circle at 75% 25%, rgba(99, 102, 241, 0.22) 0%, transparent 60%), radial-gradient(circle at 25% 75%, rgba(168, 85, 247, 0.22) 0%, transparent 60%), #040714',
    color: '#ffffff'
  },
  {
    label: 'Topográfiai Vonalak',
    icon: '🗺️',
    value: `#0b0f19 url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0c30 10 30 50 60 60s60 10 60 60M0 20c30 10 30 50 60 60s60 10 60 60M0 40c30 10 30 50 60 60s60 10 60 60M0 60c30 10 30 50 60 60s60 10 60 60M0 80c30 10 30 50 60 60s60 10 60 60M0 100c30 10 30 50 60 60s60 10 60 60' stroke='rgba(255,255,255,0.08)' fill='none' stroke-width='1.5'/%3E%3C/svg%3E") repeat center`,
    color: '#ffffff'
  },
  {
    label: 'Naplemente Izzás',
    icon: '🌅',
    value: 'radial-gradient(at 15% 20%, rgba(249, 115, 22, 0.32) 0px, transparent 55%), radial-gradient(at 85% 80%, rgba(168, 85, 247, 0.32) 0px, transparent 55%), radial-gradient(at 50% 50%, rgba(225, 29, 72, 0.22) 0px, transparent 60%), #0c0a17',
    color: '#ffffff'
  },
  {
    label: 'Kiber Hexagon',
    icon: '⬡',
    value: `#090d16 url("data:image/svg+xml,%3Csvg width='56' height='96' viewBox='0 0 56 96' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 0l28 16v32L28 64 0 48V16L28 0zm0 96l28-16V48L28 32 0 48v32l28 16z' fill='none' stroke='rgba(56,189,248,0.08)' stroke-width='1.5'/%3E%3C/svg%3E") repeat center`,
    color: '#ffffff'
  },
  {
    label: 'Zen Bambusz Hullám',
    icon: '🌿',
    value: `#061a12 url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c20-20 40-20 80 0M0 80c20-20 40-20 80 0' fill='none' stroke='rgba(52,211,153,0.08)' stroke-width='1.5'/%3E%3C/svg%3E") repeat center`,
    color: '#ffffff'
  },
  {
    label: 'Meleg Pergamen',
    icon: '📜',
    value: 'radial-gradient(circle at 50% 50%, #fef3c7 0%, #fde68a 100%)',
    color: '#1c1917'
  },
  {
    label: 'Pontmátrix (Dot Grid)',
    icon: '⠂',
    value: 'radial-gradient(rgba(255, 255, 255, 0.16) 1.5px, transparent 1.5px) 0 0 / 24px 24px, #0f172a',
    color: '#ffffff'
  },
  {
    label: 'Világos Kockás Füzet',
    icon: '📝',
    value: 'linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px) 0 0 / 24px 24px, #f8fafc',
    color: '#0f172a'
  }
];

export const TEACHER_QUOTES = [
  "A jó tanár megmagyarázza, a kiváló tanár demonstrálja, a nagyszerű tanár inspirálja. - William Arthur Ward",
  "A tanulás az az egyetlen dolog, ami sosem meríti ki az elmét, sosem félemlíti meg és sosem bánja meg. - Leonardo da Vinci",
  "Nem az a tudás, hogy mennyi mindent tudsz, hanem hogy tudod, mit kezdj vele. - Ismeretlen",
  "A gyermekek nem arra vágynak, hogy tökéletes legyél, hanem hogy ott legyél nekik. - Ismeretlen",
  "A tanítás az az optimizmus legnagyobb aktusa. - Colleen Wilcox"
];

export const STUDENT_QUOTES = [
  "A jövő azoké, akik hisznek álmaik szépségében. - Eleanor Roosevelt",
  "Nem azért tanulunk, hogy az iskolának feleljünk meg, hanem az életnek. - Seneca",
  "A titok abban rejlik, hogy elkezded. - Mark Twain",
  "Nincs olyan, hogy lehetetlen, csak olyan, hogy még nem jöttem rá. - Ismeretlen",
  "Minden szakértő volt egyszer kezdő. - Helen Hayes"
];

export const MOCK_STUDENTS = {
  '11.A': ['Nagy Péter', 'Kovács Anna', 'Szabó Bence', 'Tóth Kata', 'Varga Máté', 'Farkas Laura', 'Kiss Dávid', 'Horváth Zsófia', 'Török Ádám', 'Balázs Réka'],
  '10.B': ['Molnár Gergő', 'Németh Lili', 'Balogh Márk', 'Lukács Flóra', 'Juhász Ádám'],
  '9.C': ['Kelemen Dóra', 'Simon Bálint', 'Papp Eszter', 'Gál Bence'],
  'DEFAULT': ['Alapértelmezett Tanuló 1', 'Alapértelmezett Tanuló 2', 'Alapértelmezett Tanuló 3', 'Alapértelmezett Tanuló 4']
};

export const DEFAULT_WIDGET_SETTINGS = {
  showUpNext: false,
  showClassProgress: false,
  showVacationCountdown: true,
  showMessages: false,
  showQuickActions: false,
  showMiniCalendar: true,
  showMiniTimer: true,
  showTodos: true,
  showPostit: true,
  showQuote: true,
  showDigitalClock: true,
  showRandomStudent: true,
  showHabitTracker: false,
  autoFillGrid: false,
  habitName: 'Vízivás (pohár)',
  habitType: 'napi',
  habitDailyMax: 8,
  showBookmarks: true,
  showWeather: true,
  showHydrationTracker: true,
  showSmartNotification: true,
  hydrationTarget: 2000,
  editMode: false
};

export const DEFAULT_WIDGET_SIZES = {
  schedule: 2,
  digitalClock: 1,
  miniTimer: 1,
  todos: 1,
  miniCalendar: 1,
  vacation: 1,
  bookmarks: 2,
  quote: 2,
  postit: 1,
  weather: 1,
  hydrationTracker: 1,
  randomStudent: 1,
  smartNotification: 1,
  upNext: 1,
  classProgress: 1,
  messages: 1,
  quickActions: 1,
  habitTracker: 1
};

export const DEFAULT_WIDGET_HEIGHTS = {
  schedule: 6,
  digitalClock: 1,
  miniTimer: 1,
  todos: 4,
  miniCalendar: 3,
  vacation: 1,
  bookmarks: 1,
  quote: 1,
  postit: 3,
  weather: 1,
  hydrationTracker: 1,
  randomStudent: 1,
  smartNotification: 1,
  upNext: 1,
  classProgress: 1,
  messages: 2,
  quickActions: 2,
  habitTracker: 2
};

export const DEFAULT_WIDGET_POSITIONS = {
  schedule: { c: 1, r: 1 },
  digitalClock: { c: 3, r: 1 },
  miniTimer: { c: 3, r: 2 },
  todos: { c: 3, r: 3 },
  miniCalendar: { c: 4, r: 1 },
  vacation: { c: 5, r: 1 },
  bookmarks: { c: 5, r: 2 },
  quote: { c: 5, r: 3 },
  postit: { c: 5, r: 4 },
  weather: { c: 6, r: 1 },
  hydrationTracker: { c: 6, r: 4 },
  randomStudent: { c: 6, r: 5 },
  smartNotification: { c: 6, r: 6 },
  messages: { c: 4, r: 4 },
  quickActions: { c: 4, r: 5 },
  habitTracker: { c: 4, r: 6 },
  upNext: { c: 3, r: 6 },
  classProgress: { c: 4, r: 6 }
};

export const DEFAULT_BOOKMARKS = [
  { url: 'https://gemini.google.com', title: 'Gemini' },
  { url: 'https://youtube.com', title: 'YouTube' },
  { url: 'https://quizlet.com', title: 'Quizlet' },
  { url: 'https://quizlet.com', title: 'Quizlet' }
];

export const DEFAULT_TODOS = [
  { id: 1, text: '8.os bizonyítvány', done: false },
  { id: 2, text: 'terem órarend nyomtatás', done: false },
  { id: 3, text: 'tanulási piramis nyomtatása', done: false },
  { id: 4, text: 'befizette pénzek az elmenőknek', done: false },
  { id: 5, text: 'új listák nyomtatása', done: false }
];
