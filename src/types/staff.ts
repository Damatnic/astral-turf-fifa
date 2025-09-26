// Staff and management related types

export type CoachSpecialty =
  | 'attacking'
  | 'defending'
  | 'balanced'
  | 'youth_development'
  | 'technical';
export type AgentPersonality = 'standard' | 'greedy' | 'loyal';

export interface HeadCoach {
  id: string;
  name: string;
  specialty: CoachSpecialty;
  bonus: number;
  cost: number;
}

export interface HeadScout {
  id: string;
  name: string;
  rating: number; // 1-5 stars
  cost: number;
}

export interface HeadOfMedicine {
  id: string;
  name: string;
  injuryPreventionBonus: number; // %
  rehabBonus: number; // %
  cost: number;
}

export interface AssistantManager {
  id: string;
  name: string;
  tacticalKnowledge: number;
  manManagement: number;
  cost: number;
}

export interface GKCoach {
  id: string;
  name: string;
  goalkeepingCoaching: number;
  cost: number;
}

export interface FitnessCoach {
  id: string;
  name: string;
  fitnessCoaching: number;
  cost: number;
}

export interface LoanManager {
  id: string;
  name: string;
  negotiation: number;
  judgingPlayerAbility: number;
  cost: number;
}

export interface Staff {
  coach: HeadCoach | null;
  scout: HeadScout | null;
  medicine: HeadOfMedicine | null;
  assistantManager: AssistantManager | null;
  gkCoach: GKCoach | null;
  fitnessCoach: FitnessCoach | null;
  loanManager: LoanManager | null;
}
