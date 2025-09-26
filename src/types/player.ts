// Player-related types and interfaces

import type { WeeklySchedule } from './training';

export interface PlayerAttributes {
  speed: number;
  passing: number;
  tackling: number;
  shooting: number;
  dribbling: number;
  positioning: number;
  stamina: number; // 0-100
}

export type PositionRole = 'GK' | 'DF' | 'MF' | 'FW';
export interface Position {
  x: number;
  y: number;
}
export type PlayerMorale = 'Excellent' | 'Good' | 'Okay' | 'Poor' | 'Very Poor';
export type PlayerForm = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor';
export type PlayerAvailabilityStatus =
  | 'Available'
  | 'Minor Injury'
  | 'Major Injury'
  | 'Suspended'
  | 'International Duty';
export type PlayerTrait =
  | 'Leader'
  | 'Ambitious'
  | 'Loyal'
  | 'Injury Prone'
  | 'Consistent'
  | 'Temperamental';
export type Team = 'home' | 'away';

export interface PlayerRole {
  id: string;
  name: string;
  abbreviation: string;
  category: PositionRole;
  description: string;
}

export interface PlayerInstruction {
  id: string;
  name: string;
  description: string;
}

export interface PlayerAvailability {
  status: PlayerAvailabilityStatus;
  returnDate?: string;
}

export interface DevelopmentLogEntry {
  id: string;
  date: string;
  note: string;
  author: 'User' | 'AI';
}

export interface PlayerHistoryStats {
  season: number;
  club: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  matchesPlayed: number;
  shotsOnTarget: number;
  tacklesWon: number;
  saves: number;
  passesCompleted: number;
  passesAttempted: number;
  careerHistory: readonly PlayerHistoryStats[];
}

export interface LoanStatus {
  isLoaned: boolean;
  loanedTo?: string;
  loanedFrom?: string;
  wageContribution?: number; // for loans
  loanFee?: number;
  loanStats?: {
    matchesPlayed: number;
    goals: number;
    assists: number;
  };
}

export interface IndividualTrainingFocus {
  attribute: keyof PlayerAttributes;
  intensity: 'normal' | 'high';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export interface AttributeLogEntry {
  week: number;
  attributes: PlayerAttributes;
}

export interface CommunicationLogEntry {
  id: string;
  date: string;
  type: 'Meeting' | 'Phone Call' | 'Email' | 'Text Message';
  notes: string;
  contactPerson: string;
}

export interface ContractClause {
  id: string;
  text: string;
  status: 'Met' | 'Unmet' | 'Waived';
  isCustom: boolean;
}

export interface PlayerContract {
  wage?: number;
  expires?: number; // year
  clauses: ContractClause[];
}

// WeeklySchedule is imported from training.ts

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  age: number;
  nationality: string;
  potential: readonly [number, number];
  currentPotential: number;
  roleId: string;
  instructions: Record<string, string>;
  team: Team;
  teamColor: string;
  attributes: PlayerAttributes;
  position: { x: number; y: number };
  availability: PlayerAvailability;
  morale: PlayerMorale;
  form: PlayerForm;
  stamina: number; // 0-100
  developmentLog: DevelopmentLogEntry[];
  contract: PlayerContract;
  stats: PlayerStats;
  loan: LoanStatus;
  traits: PlayerTrait[];
  notes?: string;
  individualTrainingFocus?: IndividualTrainingFocus | null;
  conversationHistory: ChatMessage[];
  attributeHistory: AttributeLogEntry[];
  attributeDevelopmentProgress: Partial<Record<keyof PlayerAttributes, number>>;
  communicationLog: CommunicationLogEntry[];
  customTrainingSchedule: WeeklySchedule | null;
  fatigue: number; // 0-100
  injuryRisk: number; // 1-100
  lastConversationInitiatedWeek: number;
  moraleBoost: { duration: number; effect: number } | null;
  completedChallenges: string[];
}

export type TransferPlayer = Omit<Player, 'position' | 'teamColor' | 'attributeHistory'> & {
  askingPrice: number;
};

export interface YouthProspect
  extends Omit<
    Player,
    | 'attributes'
    | 'potential'
    | 'currentPotential'
    | 'age'
    | 'position'
    | 'teamColor'
    | 'conversationHistory'
    | 'attributeHistory'
    | 'attributeDevelopmentProgress'
  > {
  age: 16 | 17 | 18;
  potential: readonly [number, number];
  attributes: { readonly [K in keyof PlayerAttributes]: readonly [number, number] };
  position: { x: number; y: number };
  teamColor: string;
  conversationHistory: ChatMessage[];
}

// Player relationships and mentoring
export type PlayerRelationshipType = 'friendship' | 'rivalry';

export interface MentoringGroup {
  mentorId: string;
  menteeIds: string[];
}

// Promise system
export type PromiseType = 'playing_time';
export type PromiseStatus = 'active' | 'kept' | 'broken';

export interface Promise {
  id: string;
  playerId: string;
  type: PromiseType;
  status: PromiseStatus;
  startWeek: number;
  endWeek: number;
}

export interface PromiseRequest {
  type: PromiseType;
  description: string;
}

// Filtering and search
export interface AttributeFilter {
  attribute: keyof PlayerAttributes;
  condition: 'gt' | 'lt';
  value: number;
}

export interface AdvancedRosterFilters {
  age: { min: number; max: number };
  availability: readonly PlayerAvailabilityStatus[];
  attributes: readonly AttributeFilter[];
}

export interface TransferMarketFilters {
  name: string;
  position: PositionRole | 'All';
  age: { min: number; max: number };
  potential: { min: number; max: number };
  price: { min: number; max: number };
}
