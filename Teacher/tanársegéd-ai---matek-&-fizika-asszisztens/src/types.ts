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
  CLASS_MANAGER = 'CLASS_MANAGER',
  TIMETABLE = 'TIMETABLE',
  HOMEROOM_ASSISTANT = 'HOMEROOM_ASSISTANT',
  EVENT_CALENDAR = 'EVENT_CALENDAR',
  METHODOLOGY_GUIDE = 'METHODOLOGY_GUIDE',
  PSYCHOLOGY_ADVISOR = 'PSYCHOLOGY_ADVISOR'
}

export interface GenerationRequest {
  tool: ToolType;
  topic: string;
  grade: string;
  additionalInfo?: string;
  sourceText?: string;
}

export interface UserProfile {
  name: string;
  subjects: string[];
  isHomeroomTeacher: boolean;
  schoolName?: string;
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
