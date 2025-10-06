// AI and automation related types

export interface AIInsight {
  advantages: string;
  vulnerabilities: string;
  recommendation: string;

  // Extended properties
  id?: string;
  timestamp?: string;
  category?: 'tactical' | 'player' | 'formation' | 'match';
  type?: 'tactical' | 'defensive' | 'offensive' | 'general';
  title?: string;
  description?: string;
  message?: string; // Alternative to advantages/vulnerabilities
  confidence?: number; // 0-1 confidence score
  recommendations?: string[];
  relatedPlayerIds?: string[];
  relatedFormationIds?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface AIComparison {
  comparison: string;
  recommendation: string;

  // Extended properties
  id?: string;
  timestamp?: string;
  player1Id?: string;
  player2Id?: string;
  winner?: string; // Player ID of better player
  reasoning?: string;
  strengths?: Record<string, string[]>; // Player name -> strengths array
  weaknesses?: Record<string, string[]>; // Player name -> weaknesses array
  categories?: {
    offensive: { player1: number; player2: number; winner: string };
    defensive: { player1: number; player2: number; winner: string };
    technical: { player1: number; player2: number; winner: string };
    physical: { player1: number; player2: number; winner: string };
    mental: { player1: number; player2: number; winner: string };
  };
  overallScore?: { player1: number; player2: number };
}

export interface AISuggestedFormation {
  formationName: string;
  playerIds: readonly string[];
  reasoning: string;

  // Extended properties
  id?: string;
  formationId?: string;
  formation?: string; // Formation name (e.g., "4-4-2")
  positions?: Record<string, { x: number; y: number }>; // Position mapping
  playerAssignments?: Array<{
    playerId: string;
    position: string;
    suitabilityScore: number;
  }>;
  strengths?: string[];
  weaknesses?: string[];
  recommendedTactics?: any; // TacticsData type
  confidence?: number; // 0-1
  confidenceScore?: number; // 0-1
  alternatives?: string[]; // Alternative formations
}

export interface TeamTalkOption {
  tone: string;
  message: string;
  moraleEffect: number;
}

export interface AITeamTalkResponse {
  options: TeamTalkOption[];
  message?: string; // Direct message alternative
  tone?: string; // Message tone
  effectiveness?: number; // 0-1 effectiveness score
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

  // Extended properties
  id?: string;
  matchId?: string;
  timestamp?: string;
  overallRating?: number; // Match performance rating
  keyMoments?: Array<{
    timestamp: number;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  playerRatings?: Array<{
    playerId: string;
    rating: number;
    performance: string;
  }>;
  tacticalAnalysis?: string;
  improvements?: string[];
  strengths?: string[];
  weaknesses?: string[];
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

  // Extended properties
  id?: string;
  playerId?: string;
  timestamp?: string;
  overallAssessment?: string; // General evaluation
  recommendation?: 'buy' | 'monitor' | 'pass' | 'unknown'; // Recommendation
  confidence?: number; // 0-1 confidence score
  marketValue?: number; // Estimated market value
  technicalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  potentialRating?: number;
  recommendedPrice?: number;
  suitableRoles?: string[];
  developmentNeeds?: string[];
}
