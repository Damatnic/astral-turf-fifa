// Match and simulation related types

import type { Team } from './player';
import type { PlayerStats } from './player';

export interface MatchEvent {
  minute: number;
  type: 'Goal' | 'Yellow Card' | 'Red Card' | 'Injury';
  team: Team;
  playerName: string;
  description: string;
  injuryType?: 'Minor Injury' | 'Major Injury';
  assisterName?: string;
}

export interface MatchCommentary {
  minute: number;
  text: string;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  commentaryLog: MatchCommentary[];
  isRivalry: boolean;
  playerStats: Record<string, Partial<PlayerStats>>;
}

// Team tactics and strategy
export type TeamTacticValue = 'very-defensive' | 'defensive' | 'balanced' | 'attacking' | 'very-attacking' | 'low' | 'medium' | 'high' | 'deep' | 'narrow' | 'wide';

export interface TeamTactics {
  mentality: TeamTacticValue;
  pressing: TeamTacticValue;
  defensiveLine: TeamTacticValue;
  attackingWidth: TeamTacticValue;
}

// Set pieces
export type SetPieceType = 'left_corner' | 'right_corner' | 'short_free_kick' | 'long_free_kick' | 'penalty';
export type SetPieceAssignments = Partial<Record<SetPieceType, string | null>>;

// Formation related types
export interface FormationSlot {
  id: string;
  role: string; // Will be PositionRole from player.ts
  defaultPosition: { x: number; y: number };
  playerId: string | null;
}

export interface Formation {
  id: string;
  name: string;
  slots: FormationSlot[];
  isCustom?: boolean;
  notes?: string;
}

// Team appearance
export type TeamKitPattern = 'solid' | 'stripes' | 'hoops';

export interface TeamKit {
  primaryColor: string;
  secondaryColor: string;
  pattern: TeamKitPattern;
}