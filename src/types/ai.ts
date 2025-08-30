// AI and automation related types

export interface AIInsight {
  advantages: string;
  vulnerabilities: string;
  recommendation: string;
}

export interface AIComparison {
  comparison: string;
  recommendation: string;
}

export interface AISuggestedFormation {
  formationName: string;
  playerIds: readonly string[];
  reasoning: string;
}

export interface TeamTalkOption {
  tone: string;
  message: string;
  moraleEffect: number;
}

export interface AITeamTalkResponse {
  options: TeamTalkOption[];
}

export interface AIOppositionReport {
  keyPlayers: string;
  tacticalApproach: string;
  weaknesses: string;
}

export interface AISubstitutionSuggestion {
  playerOutId: string;
  playerInId: string;
  reasoning: string;
}

export interface AIPostMatchAnalysis {
  summary: string;
  keyMoment: string;
  advice: string;
}

export interface AIAgentResponse {
  response: string;
  isDealAccepted: boolean;
}

export interface AIPressConferenceResponse {
  question: string;
  options: readonly {
    text: string;
    outcome: string;
    fanConfidenceEffect: number;
    teamMoraleEffect: number;
  }[];
  narrativeId?: string;
}

export interface AIDevelopmentSummary {
  summary: string;
  strengths: readonly string[];
  areasForImprovement: readonly string[];
}

export interface AIScoutReport {
  strengths: readonly string[];
  weaknesses: readonly string[];
  summary: string;
  potentialFit: string;
  estimatedValue: number;
}