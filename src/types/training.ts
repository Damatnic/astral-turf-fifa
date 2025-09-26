// Training and development related types

import type { PlayerAttributes } from './player';

export type TrainingDrillCategory = 'attacking' | 'defending' | 'physical' | 'technical' | 'tactical' | 'set_pieces' | 'warmup' | 'cooldown';
export type TrainingIntensity = 'low' | 'medium' | 'high';

export interface TrainingDrill {
  readonly id: string;
  readonly name: string;
  readonly category: TrainingDrillCategory;
  readonly description: string;
  readonly primaryAttributes: readonly (keyof PlayerAttributes)[];
  readonly secondaryAttributes: readonly (keyof PlayerAttributes)[];
  readonly intensity: TrainingIntensity;
  readonly fatigueEffect: number; // 0-20
  readonly moraleEffect: number; // -2 to 2
  readonly injuryRisk: number; // 0-1
}

export interface TrainingSession {
  warmup: string | null;
  main: string | null;
  cooldown: string | null;
}

export interface DailySchedule {
  morning: TrainingSession;
  afternoon: TrainingSession;
  isRestDay: boolean;
}

export interface WeeklySchedule {
  monday: DailySchedule;
  tuesday: DailySchedule;
  wednesday: DailySchedule;
  thursday: DailySchedule;
  friday: DailySchedule;
  saturday: DailySchedule;
  sunday: DailySchedule;
}

export interface TrainingPlanTemplate {
  id: string;
  name: string;
  schedule: WeeklySchedule;
  isDefault?: boolean;
}

// Skill challenges and development
export interface SkillChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Youth development
export interface YouthAcademy {
  level: number;
  prospects: unknown[]; // YouthProspect[] when player types are imported
  lastGeneratedWeek: number;
}