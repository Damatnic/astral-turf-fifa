import { GoogleGenAI, Type } from "@google/genai";
import type {
  Player,
  PlayerAttributes,
  TrainingDrill,
  Formation,
  TeamTactics,
  AIPersonality,
  MatchResult,
  WeeklySchedule,
} from '../types';

// Enhanced AI Types for Advanced Features
export interface PlayerDevelopmentPrediction {
  playerId: string;
  currentRating: number;
  projectedRatingIn6Months: number;
  projectedRatingIn1Year: number;
  projectedRatingIn2Years: number;
  peakPotentialAge: number;
  developmentTrajectory: 'rapid' | 'steady' | 'slow' | 'declining';
  keyStrengths: string[];
  developmentBottlenecks: string[];
  recommendedTrainingFocus: (keyof PlayerAttributes)[];
  personalizedTrainingPlan: {
    phase1: string; // 0-3 months
    phase2: string; // 3-6 months
    phase3: string; // 6-12 months
  };
  riskFactors: string[];
  optimalPlayingTime: number; // minutes per week
}

export interface TacticalHeatMap {
  playerId: string;
  positions: Array<{
    x: number;
    y: number;
    frequency: number;
    effectiveness: number;
  }>;
  movementPatterns: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    frequency: number;
    successRate: number;
  }>;
  influenceZones: Array<{
    centerX: number;
    centerY: number;
    radius: number;
    influence: number;
  }>;
}

export interface FormationEffectivenessAnalysis {
  formationId: string;
  effectivenessScore: number; // 0-100
  strengthsAgainstFormations: Record<string, number>;
  weaknessesAgainstFormations: Record<string, number>;
  optimalPlayerRoles: Array<{
    slotId: string;
    recommendedAttributes: Partial<PlayerAttributes>;
    criticalTraits: string[];
  }>;
  tacticalInsights: {
    attackingStrengths: string[];
    defensiveVulnerabilities: string[];
    transitionEffectiveness: string;
    setPieceAdvantages: string[];
  };
}

export interface MatchPrediction {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  expectedGoals: {
    home: number;
    away: number;
  };
  keyMatchups: Array<{
    homePlayer: string;
    awayPlayer: string;
    advantage: 'home' | 'away' | 'neutral';
    impactLevel: 'high' | 'medium' | 'low';
  }>;
  tacticalRecommendations: {
    formation: string;
    mentality: string;
    keyInstructions: string[];
    substitutionWindows: number[];
  };
}

export interface PlayerPerformanceMetrics {
  playerId: string;
  expectedGoals: number;
  expectedAssists: number;
  passCompletionRate: number;
  progressivePasses: number;
  defensiveActions: number;
  aerialDuelsWon: number;
  pressureResistance: number;
  creativeIndex: number;
  workRateIndex: number;
  consistencyRating: number;
}

// AI Service Instance (reuse from existing aiService)
let aiInstance: GoogleGenAI | null = null;

try {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
} catch (error) {
  console.error("Error initializing Advanced AI Service:", error);
  aiInstance = null;
}

async function generateJson(prompt: string, schema: any, systemInstruction: string) {
  const ai = aiInstance;
  if (!ai) {throw new Error("AI is offline.");}

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("AI returned an empty response.");
    }
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating JSON from Gemini API:", error);
    throw new Error("Failed to get a valid JSON response from the AI.");
  }
}

function formatPlayerAttributes(attributes: PlayerAttributes): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}

function formatPlayerHistory(player: Player): string {
  if (!player.attributeHistory || player.attributeHistory.length === 0) {
    return 'No historical data available.';
  }

  return player.attributeHistory
    .slice(-6) // Last 6 weeks
    .map(entry => `Week ${entry.week}: ${formatPlayerAttributes(entry.attributes)}`)
    .join('\n');
}

/**
 * PHASE 1: AI-POWERED ANALYTICS & INSIGHTS
 */

export const generatePlayerDevelopmentPrediction = async (
  player: Player,
  trainingSchedule: WeeklySchedule,
  personality: AIPersonality = 'balanced',
): Promise<PlayerDevelopmentPrediction> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const prompt = `Analyze this player's development trajectory and provide detailed predictions:

PLAYER DATA:
- Name: ${player.name}
- Age: ${player.age}
- Current Potential: ${player.currentPotential}
- Max Potential: ${player.potential[1]}
- Current Attributes: ${formatPlayerAttributes(player.attributes)}
- Form: ${player.form}
- Morale: ${player.morale}
- Traits: ${player.traits.join(', ') || 'None'}
- Playing Time: ${player.stats.matchesPlayed} matches played

DEVELOPMENT HISTORY:
${formatPlayerHistory(player)}

CURRENT TRAINING FOCUS:
${player.individualTrainingFocus ?
  `${player.individualTrainingFocus.attribute} (${player.individualTrainingFocus.intensity})` :
  'No specific focus'
}

Provide comprehensive development predictions with personalized training recommendations.`;

  const systemInstruction = `You are an elite youth development specialist with advanced analytics capabilities. 
  Analyze player development patterns, predict future progression, and create personalized development plans. 
  Consider age curves, training effectiveness, injury risk, and psychological factors.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      playerId: { type: Type.STRING },
      currentRating: { type: Type.NUMBER },
      projectedRatingIn6Months: { type: Type.NUMBER },
      projectedRatingIn1Year: { type: Type.NUMBER },
      projectedRatingIn2Years: { type: Type.NUMBER },
      peakPotentialAge: { type: Type.NUMBER },
      developmentTrajectory: { type: Type.STRING, enum: ['rapid', 'steady', 'slow', 'declining'] },
      keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      developmentBottlenecks: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendedTrainingFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
      personalizedTrainingPlan: {
        type: Type.OBJECT,
        properties: {
          phase1: { type: Type.STRING },
          phase2: { type: Type.STRING },
          phase3: { type: Type.STRING },
        },
        required: ['phase1', 'phase2', 'phase3'],
      },
      riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
      optimalPlayingTime: { type: Type.NUMBER },
    },
    required: [
      'playerId', 'currentRating', 'projectedRatingIn6Months', 'projectedRatingIn1Year',
      'projectedRatingIn2Years', 'peakPotentialAge', 'developmentTrajectory',
      'keyStrengths', 'developmentBottlenecks', 'recommendedTrainingFocus',
      'personalizedTrainingPlan', 'riskFactors', 'optimalPlayingTime',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    playerId: player.id,
  };
};

export const generateFormationEffectivenessAnalysis = async (
  formation: Formation,
  players: Player[],
  opponentFormations: string[],
  personality: AIPersonality = 'balanced',
): Promise<FormationEffectivenessAnalysis> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const assignedPlayers = players.filter(p =>
    formation.slots.some(slot => slot.playerId === p.id),
  );

  const prompt = `Analyze the effectiveness of this formation with the assigned players:

FORMATION: ${formation.name}
FORMATION SLOTS: ${formation.slots.map(slot =>
  `${slot.role} (${slot.defaultPosition.x}, ${slot.defaultPosition.y})${slot.playerId ? ` - ${players.find(p => p.id === slot.playerId)?.name}` : ' - Empty'}`,
).join('\n')}

ASSIGNED PLAYERS:
${assignedPlayers.map(player =>
  `${player.name} (${player.roleId}): ${formatPlayerAttributes(player.attributes)}`,
).join('\n')}

OPPONENT FORMATIONS TO ANALYZE: ${opponentFormations.join(', ')}

Provide comprehensive tactical analysis including strengths, weaknesses, and optimization recommendations.`;

  const systemInstruction = `You are a world-class tactical analyst specializing in formation analysis and tactical matchups. 
  Analyze formation effectiveness, player suitability, and tactical advantages/disadvantages against various opponents.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      formationId: { type: Type.STRING },
      effectivenessScore: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      strengthsAgainstFormations: { type: Type.OBJECT },
      weaknessesAgainstFormations: { type: Type.OBJECT },
      optimalPlayerRoles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            slotId: { type: Type.STRING },
            recommendedAttributes: { type: Type.OBJECT },
            criticalTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
      tacticalInsights: {
        type: Type.OBJECT,
        properties: {
          attackingStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          defensiveVulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
          transitionEffectiveness: { type: Type.STRING },
          setPieceAdvantages: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    required: [
      'formationId', 'effectivenessScore', 'strengthsAgainstFormations',
      'weaknessesAgainstFormations', 'optimalPlayerRoles', 'tacticalInsights',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    formationId: formation.id,
  };
};

export const generateMatchPrediction = async (
  homeTeam: {
    players: Player[];
    formation: Formation;
    tactics: TeamTactics;
  },
  awayTeam: {
    players: Player[];
    formation: Formation;
    tactics: TeamTactics;
  },
  matchContext: {
    venue: 'home' | 'away' | 'neutral';
    weather?: string;
    importance: 'low' | 'medium' | 'high';
  },
  personality: AIPersonality = 'balanced',
): Promise<MatchPrediction> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const prompt = `Predict the outcome of this match with detailed analysis:

HOME TEAM:
Formation: ${homeTeam.formation.name}
Tactics: Mentality ${homeTeam.tactics.mentality}, Pressing ${homeTeam.tactics.pressing}
Players: ${homeTeam.players.map(p =>
  `${p.name} (${p.roleId}) - ${p.currentPotential} rating, Form: ${p.form}`,
).join('\n')}

AWAY TEAM:
Formation: ${awayTeam.formation.name}
Tactics: Mentality ${awayTeam.tactics.mentality}, Pressing ${awayTeam.tactics.pressing}
Players: ${awayTeam.players.map(p =>
  `${p.name} (${p.roleId}) - ${p.currentPotential} rating, Form: ${p.form}`,
).join('\n')}

MATCH CONTEXT:
Venue: ${matchContext.venue}
Weather: ${matchContext.weather || 'Clear'}
Importance: ${matchContext.importance}

Provide detailed match prediction with probabilities, expected goals, key matchups, and tactical recommendations.`;

  const systemInstruction = `You are an elite match analyst with advanced statistical modeling capabilities. 
  Predict match outcomes based on team strengths, tactical setups, player form, and contextual factors.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      homeWinProbability: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      drawProbability: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      awayWinProbability: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      expectedGoals: {
        type: Type.OBJECT,
        properties: {
          home: { type: Type.NUMBER },
          away: { type: Type.NUMBER },
        },
      },
      keyMatchups: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            homePlayer: { type: Type.STRING },
            awayPlayer: { type: Type.STRING },
            advantage: { type: Type.STRING, enum: ['home', 'away', 'neutral'] },
            impactLevel: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
          },
        },
      },
      tacticalRecommendations: {
        type: Type.OBJECT,
        properties: {
          formation: { type: Type.STRING },
          mentality: { type: Type.STRING },
          keyInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          substitutionWindows: { type: Type.ARRAY, items: { type: Type.NUMBER } },
        },
      },
    },
    required: [
      'homeWinProbability', 'drawProbability', 'awayWinProbability',
      'expectedGoals', 'keyMatchups', 'tacticalRecommendations',
    ],
  };

  return await generateJson(prompt, schema, systemInstruction);
};

export const generateTacticalHeatMap = async (
  player: Player,
  recentMatches: MatchResult[],
  formation: Formation,
  personality: AIPersonality = 'balanced',
): Promise<TacticalHeatMap> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const prompt = `Generate a tactical heat map analysis for this player:

PLAYER: ${player.name}
ROLE: ${player.roleId}
POSITION: ${player.position.x}, ${player.position.y}
ATTRIBUTES: ${formatPlayerAttributes(player.attributes)}
FORM: ${player.form}

FORMATION CONTEXT: ${formation.name}
RECENT PERFORMANCE: ${player.stats.matchesPlayed} matches, ${player.stats.goals} goals, ${player.stats.assists} assists

Based on the player's role, attributes, and formation, predict their movement patterns, 
positioning frequency, and areas of influence on the field.`;

  const systemInstruction = `You are a tactical analyst specializing in player positioning and movement analysis. 
  Generate realistic heat maps based on player roles, attributes, and tactical systems.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      playerId: { type: Type.STRING },
      positions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER },
            frequency: { type: Type.NUMBER },
            effectiveness: { type: Type.NUMBER },
          },
        },
      },
      movementPatterns: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            from: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
            },
            to: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
            },
            frequency: { type: Type.NUMBER },
            successRate: { type: Type.NUMBER },
          },
        },
      },
      influenceZones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            centerX: { type: Type.NUMBER },
            centerY: { type: Type.NUMBER },
            radius: { type: Type.NUMBER },
            influence: { type: Type.NUMBER },
          },
        },
      },
    },
    required: ['playerId', 'positions', 'movementPatterns', 'influenceZones'],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    playerId: player.id,
  };
};

export const generateAdvancedPlayerMetrics = async (
  player: Player,
  recentMatches: MatchResult[],
  personality: AIPersonality = 'balanced',
): Promise<PlayerPerformanceMetrics> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const prompt = `Calculate advanced performance metrics for this player:

PLAYER: ${player.name}
ROLE: ${player.roleId}
ATTRIBUTES: ${formatPlayerAttributes(player.attributes)}
CURRENT STATS: ${player.stats.goals} goals, ${player.stats.assists} assists, ${player.stats.matchesPlayed} matches
FORM: ${player.form}
MORALE: ${player.morale}

Calculate expected performance metrics, efficiency ratings, and advanced analytics 
based on the player's role, attributes, and current performance level.`;

  const systemInstruction = `You are an advanced soccer analytics expert specializing in expected metrics and player evaluation. 
  Calculate realistic performance metrics based on player attributes and role requirements.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      playerId: { type: Type.STRING },
      expectedGoals: { type: Type.NUMBER },
      expectedAssists: { type: Type.NUMBER },
      passCompletionRate: { type: Type.NUMBER },
      progressivePasses: { type: Type.NUMBER },
      defensiveActions: { type: Type.NUMBER },
      aerialDuelsWon: { type: Type.NUMBER },
      pressureResistance: { type: Type.NUMBER },
      creativeIndex: { type: Type.NUMBER },
      workRateIndex: { type: Type.NUMBER },
      consistencyRating: { type: Type.NUMBER },
    },
    required: [
      'playerId', 'expectedGoals', 'expectedAssists', 'passCompletionRate',
      'progressivePasses', 'defensiveActions', 'aerialDuelsWon',
      'pressureResistance', 'creativeIndex', 'workRateIndex', 'consistencyRating',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    playerId: player.id,
  };
};

// Export all advanced AI services
export const advancedAiService = {
  generatePlayerDevelopmentPrediction,
  generateFormationEffectivenessAnalysis,
  generateMatchPrediction,
  generateTacticalHeatMap,
  generateAdvancedPlayerMetrics,
  isAIAvailable: () => aiInstance !== null,
};