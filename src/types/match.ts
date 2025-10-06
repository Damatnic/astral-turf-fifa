// Match and simulation related types

import type { Team, PlayerStats } from './player';

export interface MatchEvent {
  id?: string;
  minute: number;
  type:
    | 'Goal'
    | 'Yellow Card'
    | 'Red Card'
    | 'Injury'
    | 'shot_on_target'
    | 'shot_off_target'
    | 'goal'
    | 'corner'
    | 'foul'
    | 'yellow_card'
    | 'red_card'
    | 'substitution'
    | 'penalty'
    | 'free_kick'
    | 'offside';
  team: Team;
  playerName?: string;
  playerId?: string;
  player?: string;
  description: string;
  injuryType?: 'Minor Injury' | 'Major Injury';
  assisterName?: string;
}

export interface MatchCommentary {
  minute: number;
  text: string;
}

export interface MatchResult {
  id?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore: number;
  awayScore: number;
  date?: string;
  events: MatchEvent[];
  commentaryLog?: MatchCommentary[];
  isRivalry?: boolean;
  playerStats?: Record<string, Partial<PlayerStats>>;
  statistics?: any;
  playerRatings?: any;
}

// Team tactics and strategy
export type TeamTacticValue =
  | 'very-defensive'
  | 'defensive'
  | 'balanced'
  | 'attacking'
  | 'very-attacking'
  | 'low'
  | 'medium'
  | 'high'
  | 'deep'
  | 'narrow'
  | 'wide';

export interface TeamTactics {
  mentality: TeamTacticValue;
  pressing: TeamTacticValue;
  defensiveLine: TeamTacticValue;
  attackingWidth: TeamTacticValue;
}

// Set pieces
export type SetPieceType =
  | 'left_corner'
  | 'right_corner'
  | 'short_free_kick'
  | 'long_free_kick'
  | 'penalty';
export type SetPieceAssignments = Partial<Record<SetPieceType, string | null>>;

// Formation related types
export interface FormationSlot {
  id: string;
  role: string; // Will be PositionRole from player.ts
  defaultPosition: { x: number; y: number };
  position?: { x: number; y: number }; // Current position during play
  playerId: string | null;
  roleId?: string;
  preferredRoles?: string[];
}

export interface Formation {
  id: string;
  name: string;
  slots: FormationSlot[];
  isCustom?: boolean;
  notes?: string;

  // Additional optional properties
  description?: string; // Formation description
  players?: any[]; // Assigned players (using any to avoid circular dependency)
  tactics?: TacticsData; // Associated tactics
  strengths?: string[]; // Formation strengths
  weaknesses?: string[]; // Formation weaknesses
  suitableFor?: string[]; // Best suited playing styles
  popularityRating?: number; // How common this formation is
  offensiveRating?: number; // Offensive capability (0-100)
  defensiveRating?: number; // Defensive capability (0-100)
  flexibilityRating?: number; // Tactical flexibility (0-100)
  strengthRating?: number; // Overall strength rating
}

// Tactics data structure
export interface TacticsData {
  attackingStyle?: 'possession' | 'counter' | 'direct' | 'wing-play';
  defensiveStyle?: 'high-press' | 'mid-block' | 'low-block' | 'zonal';
  buildUpSpeed?: 'slow' | 'balanced' | 'fast';
  width?: 'narrow' | 'balanced' | 'wide';
}

// Team appearance
export type TeamKitPattern = 'solid' | 'stripes' | 'hoops';

export interface TeamKit {
  primaryColor: string;
  secondaryColor: string;
  pattern: TeamKitPattern;
}
