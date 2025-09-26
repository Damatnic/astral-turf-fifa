/**
 * Lazy-loaded AI Service Wrapper
 * This module provides dynamic imports for AI services to reduce initial bundle size
 */

// Type imports (these don't affect bundle size)
import type {
  Player,
  Formation,
  AIInsight,
  AIComparison,
  AISuggestedFormation,
  ChatMessage,
  TeamTactics,
  AIOppositionReport,
  AISubstitutionSuggestion,
  AIPersonality,
  AIPostMatchAnalysis,
  MatchResult,
  HeadCoach,
  AIAgentResponse,
  AIPressConferenceResponse,
  TransferPlayer,
  AIScoutReport,
  AIDevelopmentSummary,
  PressNarrative,
  PromiseRequest,
  AITeamTalkResponse,
} from '../types';

// Cache for the lazy-loaded aiService module
let aiServiceModule: unknown = null;

/**
 * Dynamically imports the aiService module when first needed
 */
async function getAIService() {
  if (!aiServiceModule) {
    try {
      aiServiceModule = await import('./aiService');
    } catch (_error) {
      console.error('Failed to load AI service:', _error);
      throw new Error('AI service is currently unavailable');
    }
  }
  return aiServiceModule;
}

// Tactical Analysis Functions
export async function getTacticalAdvice(
  homePlayers: Player[],
  awayPlayers: Player[],
  homeFormation: Formation,
  awayFormation: Formation,
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  personality: AIPersonality,
  coach: HeadCoach | null,
): Promise<AIInsight> {
  const aiService = await getAIService();
  return aiService.getTacticalAdvice(
    homePlayers,
    awayPlayers,
    homeFormation,
    awayFormation,
    homeTactics,
    awayTactics,
    personality,
    coach,
  );
}

export async function getAIFormationSuggestion(
  allPlayers: Player[],
  personality: AIPersonality,
): Promise<AISuggestedFormation> {
  const aiService = await getAIService();
  return aiService.getAIFormationSuggestion(allPlayers, personality);
}

export async function getAISubstitutionSuggestion(
  onFieldPlayers: Player[],
  benchedPlayers: Player[],
  personality: AIPersonality,
): Promise<AISubstitutionSuggestion> {
  const aiService = await getAIService();
  return aiService.getAISubstitutionSuggestion(onFieldPlayers, benchedPlayers, personality);
}

// Player Analysis Functions
export async function getAIPlayerComparison(
  player1: Player,
  player2: Player,
  formation: Formation,
  personality: AIPersonality,
): Promise<AIComparison> {
  const aiService = await getAIService();
  return aiService.getAIPlayerComparison(player1, player2, formation, personality);
}

export async function getAIDevelopmentSummary(player: Player): Promise<AIDevelopmentSummary> {
  const aiService = await getAIService();
  return aiService.getAIDevelopmentSummary(player);
}

export async function generatePlayerBio(player: Player): Promise<string> {
  const aiService = await getAIService();
  return aiService.generatePlayerBio(player);
}

export async function getPlayerScoutingReport(
  player: TransferPlayer,
  formation: Formation,
  tactics: TeamTactics,
  personality: AIPersonality,
): Promise<AIScoutReport> {
  const aiService = await getAIService();
  return aiService.getPlayerScoutingReport(player, formation, tactics, personality);
}

export async function analyzePlayerCompatibility(
  player1: Player,
  player2: Player,
  relationshipType: 'potential_signing' | 'formation_pairing' | 'mentorship',
  personality: AIPersonality,
): Promise<{
  compatibilityScore: number;
  reasoning: string;
  recommendations: string[];
}> {
  const aiService = await getAIService();
  return aiService.analyzePlayerCompatibility(player1, player2, relationshipType, personality);
}

// Match Analysis Functions
export async function getPostMatchAnalysis(
  result: MatchResult,
  homeTeamName: string,
  awayTeamName: string,
  personality: AIPersonality,
): Promise<AIPostMatchAnalysis> {
  const aiService = await getAIService();
  return aiService.getPostMatchAnalysis(result, homeTeamName, awayTeamName, personality);
}

export async function getOppositionAnalysis(
  opponentName: string,
  formation: string,
  keyPlayers: string,
  personality: AIPersonality,
  scoutRating: number,
): Promise<AIOppositionReport> {
  const aiService = await getAIService();
  return aiService.getOppositionAnalysis(
    opponentName,
    formation,
    keyPlayers,
    personality,
    scoutRating,
  );
}

export async function generateSocialMediaReactions(
  matchResult: MatchResult,
  homeTeam: string,
  awayTeam: string,
  keyPlayers: Player[],
): Promise<string[]> {
  const aiService = await getAIService();
  return aiService.generateSocialMediaReactions(matchResult, homeTeam, awayTeam, keyPlayers);
}

export async function generateSeasonReview(
  finalPosition: number,
  totalTeams: number,
  topScorer: { name: string; goals: number },
  seasonHighlights: string[],
  personality: AIPersonality,
): Promise<{
  overallAssessment: string;
  keyAchievements: string[];
  areasForImprovement: string[];
  nextSeasonGoals: string[];
}> {
  const aiService = await getAIService();
  return aiService.generateSeasonReview(
    finalPosition,
    totalTeams,
    topScorer,
    seasonHighlights,
    personality,
  );
}

// Communication Functions
export async function getAIChatResponse(
  chatHistory: ChatMessage[],
  playersInFormation: Player[],
  formation: Formation,
  personality: AIPersonality,
): Promise<{ text: string; playerIdsToHighlight: string[] }> {
  const aiService = await getAIService();
  return aiService.getAIChatResponse(chatHistory, playersInFormation, formation, personality);
}

export async function getAIPlayerConversationResponse(
  player: Player,
  userMessage: string,
  personality: AIPersonality,
): Promise<{ response: string; moraleEffect: number; promiseRequest?: PromiseRequest }> {
  const aiService = await getAIService();
  return aiService.getAIPlayerConversationResponse(player, userMessage, personality);
}

export async function getTeamTalkOptions(
  teamPlayers: Player[],
  opponentName: string,
  isHalftime: boolean,
  currentScore: string,
  personality: AIPersonality,
): Promise<AITeamTalkResponse> {
  const aiService = await getAIService();
  return aiService.getTeamTalkOptions(
    teamPlayers,
    opponentName,
    isHalftime,
    currentScore,
    personality,
  );
}

export async function getPressConferenceQuestions(
  personality: AIPersonality,
  narratives: PressNarrative[],
): Promise<AIPressConferenceResponse> {
  const aiService = await getAIService();
  return aiService.getPressConferenceQuestions(personality, narratives);
}

export async function getAgentNegotiationResponse(
  playerName: string,
  playerValue: number,
  agentPersonality: string,
  userOffer: string,
  conversationHistory: string,
): Promise<AIAgentResponse> {
  const aiService = await getAIService();
  return aiService.getAgentNegotiationResponse(
    playerName,
    playerValue,
    agentPersonality,
    userOffer,
    conversationHistory,
  );
}

// Narrative Generation Functions
export async function generatePressNarratives(
  managerName: string,
  lastMatchResult: MatchResult | null,
  upcomingOpponent: string,
  leaguePosition: number,
  topScorer: { name: string; goals: number } | null,
  playerInPoorForm: Player | null,
): Promise<PressNarrative[]> {
  const aiService = await getAIService();
  return aiService.generatePressNarratives(
    managerName,
    lastMatchResult,
    upcomingOpponent,
    leaguePosition,
    topScorer,
    playerInPoorForm,
  );
}

export async function generateInjuryReport(
  player: Player,
  injuryType: 'Minor Injury' | 'Major Injury',
): Promise<{
  description: string;
  estimatedRecovery: string;
  treatmentPlan: string[];
}> {
  const aiService = await getAIService();
  return aiService.generateInjuryReport(player, injuryType);
}

// Utility Functions
export async function isAIAvailable(): Promise<boolean> {
  try {
    const aiService = await getAIService();
    return aiService.isAIAvailable();
  } catch {
    return false;
  }
}

// Export a lazy aiService object for compatibility
export const aiService = {
  getTacticalAdvice,
  getAIFormationSuggestion,
  getAISubstitutionSuggestion,
  getAIPlayerComparison,
  getAIDevelopmentSummary,
  generatePlayerBio,
  getPlayerScoutingReport,
  analyzePlayerCompatibility,
  getPostMatchAnalysis,
  getOppositionAnalysis,
  generateSocialMediaReactions,
  generateSeasonReview,
  getAIChatResponse,
  getAIPlayerConversationResponse,
  getTeamTalkOptions,
  getPressConferenceQuestions,
  getAgentNegotiationResponse,
  generatePressNarratives,
  generateInjuryReport,
  isAIAvailable,
};
