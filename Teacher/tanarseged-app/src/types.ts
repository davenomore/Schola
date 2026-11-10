/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ToolType {
  LESSON_PLANNER = 'LESSON_PLANNER',
  EXERCISE_GENERATOR = 'EXERCISE_GENERATOR',
  CONCEPT_EXPLAINER = 'CONCEPT_EXPLAINER',
  EXPERIMENT_GUIDE = 'EXPERIMENT_GUIDE',
  CURRICULUM_PLANNER = 'CURRICULUM_PLANNER',
  TIMETABLE = 'TIMETABLE',
  HOMEROOM_ASSISTANT = 'HOMEROOM_ASSISTANT',
  EVENT_CALENDAR = 'EVENT_CALENDAR',
  METHODOLOGY_GUIDE = 'METHODOLOGY_GUIDE',
  PSYCHOLOGY_ADVISOR = 'PSYCHOLOGY_ADVISOR',
  SCANNER = 'SCANNER',
  GRADE_CALCULATOR = 'GRADE_CALCULATOR',
  GROUPS = 'GROUPS',
  LIST = 'LIST',
  TIMER = 'TIMER',
  SPINWHEEL = 'SPINWHEEL',
  TEAMS = 'TEAMS',
  ANALYTICS = 'ANALYTICS',
  VOICE_ENTRY = 'VOICE_ENTRY',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  PLUS_POINTS = 'PLUS_POINTS',
  SYLLABUS_TRACKER = 'SYLLABUS_TRACKER'
}

export interface GenerationRequest {
  tool: ToolType;
  topic: string;
  grade: string;
  additionalInfo?: string;
  sourceText?: string;
}

export interface SchoolBookmark {
  id: string;
  title: string;
  url: string;
  category: 'Kréta / Adminisztráció' | 'Iskolai Honlap' | 'Tananyagok / Segédletek' | 'Egyéb';
}

export interface UserProfile {
  name: string;
  subjects: string[];
  isHomeroomTeacher: boolean;
  homeroomClass?: string;
  schoolName?: string;
  schoolCode?: string;
  schoolUrl?: string;
  plusPointThreshold?: number;
  bookmarks?: SchoolBookmark[];
}

export interface GeneratedContent {
  id: string;
  type: ToolType;
  title: string;
  content: string;
  createdAt: number;
  isFavorite?: boolean;
}

export interface MethodologyItem {
  id: string;
  title: string;
  category: 'Aktív tanulás' | 'IKT' | 'Értékelés' | 'Közösségépítés' | 'Differenciálás';
  description: string;
  content: string;
  tags: string[];
}

export interface PsychologyLibraryItem {
  id: string;
  title: string;
  category: 'Motiváció' | 'Inklúzió' | 'Közösség' | 'Wellbeing' | 'Mentális egészség' | 'Modern kihívások';
  description: string;
  content: string;
  tags: string[];
}

export interface CurriculumRow {
  week: number;
  topic: string;
  concepts: string;
  hours: number;
  methods: string;
}

export interface StudentNote {
  id: string;
  text: string;
  createdAt: number;
}

export interface StudentReminder {
  id: string;
  text: string;
  date?: string;
  time?: string;
  completed: boolean;
  createdAt: number;
}

export interface StudentRecord {
  id: string; // e.g. "groupId_studentName"
  studentName: string;
  groupId: string;
  notes: StudentNote[];
  reminders: StudentReminder[];
}

export interface SyllabusLesson {
  id: string;
  week: number;
  lessonNumber: number;
  topic: string;
  concepts: string;
  hours: number;
  methods: string;
  completed: boolean;
  completedAt?: number;
  notes?: string;
}

export interface GroupSyllabus {
  id: string; // e.g. "schoolYear_groupId"
  groupId: string;
  schoolYear: string; // e.g. "2025/2026"
  lessons: SyllabusLesson[];
  importedAt: number;
  fileName?: string;
}


