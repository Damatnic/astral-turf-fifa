import { GoogleGenAI, Type } from "@google/genai";
import type {
  Player,
  Formation,
  TeamTactics,
  MatchResult,
  AIPersonality,
  MatchEvent,
  PlayerAttributes,
} from '../types';

// AI Service Instance
let aiInstance: GoogleGenAI | null = null;

try {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
} catch (_error) {
  console.error("Error initializing Match Strategy Service:", error);
  aiInstance = null;
}

export interface MatchStrategyPlan {
  matchId: string;
  opponent: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  recommendedFormation: string;
  recommendedTactics: TeamTactics;
  playerInstructions: Record<string, {
    role: string;
    specificInstructions: string[];
    keyFocus: string;
  }>;
  gamePhaseStrategies: {
    firstHalf: {
      mentality: string;
      keyInstructions: string[];
      expectedChallenges: string[];
    };
    secondHalf: {
      adaptations: string[];
      substitutionPlans: Array<{
        minute: number;
        playerOut: string;
        playerIn: string;
        reason: string;
      }>;
    };
    extraTime?: {
      formation: string;
      mentality: string;
      keyPlayers: string[];
    };
  };
  contingencyPlans: {
    ifWinning: string[];
    ifDrawing: string[];
    ifLosing: string[];
  };
  setPlayStrategies: {
    corners: string[];
    freeKicks: string[];
    penalties: string[];
  };
  predictionConfidence: number;
}

export interface LiveMatchAnalysis {
  matchId: string;
  currentMinute: number;
  currentScore: { home: number; away: number };
  gameState: 'dominating' | 'balanced' | 'under_pressure' | 'desperate';
  keyEvents: MatchEvent[];
  currentPerformance: Record<string, {
    playerId: string;
    rating: number;
    keyStats: Record<string, number>;
    recommendedAction: 'continue' | 'substitute' | 'change_instruction';
  }>;
  tacticalAdjustments: {
    urgent: string[];
    recommended: string[];
    risky: string[];
  };
  substitutionRecommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    playerOut: string;
    playerIn: string;
    reasoning: string;
    expectedImpact: string;
  }>;
  nextTenMinutes: {
    expectedScenarios: Array<{
      scenario: string;
      probability: number;
      recommendedResponse: string;
    }>;
  };
}

export interface OppositionAnalysisReport {
  opponentName: string;
  overallThreatLevel: number; // 1-10
  tacticalProfile: {
    preferredFormations: string[];
    playingStyle: string;
    tempo: 'slow' | 'medium' | 'fast';
    buildupStyle: 'direct' | 'possession' | 'mixed';
  };
  keyPlayers: Array<{
    name: string;
    position: string;
    threatLevel: number;
    keyStrengths: string[];
    exploitableWeaknesses: string[];
    neutralizationTactics: string[];
  }>;
  teamStrengths: string[];
  teamWeaknesses: string[];
  recentForm: {
    results: string[];
    goalsScoredAverage: number;
    goalsConcededAverage: number;
    cleanSheetPercentage: number;
  };
  tacticalVulnerabilities: {
    defensiveWeaknesses: string[];
    attackingLimitations: string[];
    transitionProblems: string[];
  };
  recommendedApproach: string;
}

async function generateJson(prompt: string, schema: unknown, systemInstruction: string) {
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
  } catch (_error) {
    console.error("Error generating JSON from Gemini API:", error);
    throw new Error("Failed to get a valid JSON response from the AI.");
  }
}

export const generateMatchStrategy = async (
  ourTeam: {
    players: Player[];
    availableFormations: Formation[];
    currentTactics: TeamTactics;
  },
  opponentAnalysis: OppositionAnalysisReport,
  matchContext: {
    venue: 'home' | 'away' | 'neutral';
    importance: 'low' | 'medium' | 'high' | 'crucial';
    weather?: string;
    playerFitness: Record<string, number>;
  },
  personality: AIPersonality = 'balanced',
): Promise<MatchStrategyPlan> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const prompt = `Create a comprehensive match strategy plan:

OUR TEAM ANALYSIS:
Squad: ${ourTeam.players.map(p =>
  `${p.name} (${p.roleId}) - Rating: ${p.currentPotential}, Form: ${p.form}, Fitness: ${matchContext.playerFitness[p.id] || 100}%`,
).join('\n')}

Available Formations: ${ourTeam.availableFormations.map(f => f.name).join(', ')}
Current Tactics: ${Object.entries(ourTeam.currentTactics).map(([k, v]) => `${k}: ${v}`).join(', ')}

OPPONENT ANALYSIS:
${JSON.stringify(opponentAnalysis, null, 2)}

MATCH CONTEXT:
- Venue: ${matchContext.venue}
- Importance: ${matchContext.importance}
- Weather: ${matchContext.weather || 'Clear'}

Create a detailed match strategy that:
1. Selects optimal formation and tactics to counter the opponent
2. Provides specific player instructions and roles
3. Includes game phase strategies and adaptations
4. Plans for different match scenarios
5. Recommends substitution strategies
6. Addresses set piece situations

Focus on tactical intelligence and adaptive thinking.`;

  const systemInstruction = `You are a world-class tactical analyst and match strategist with expertise in soccer tactics. 
  Create comprehensive, adaptive match plans that maximize chances of success against specific opponents.
  Consider team strengths, opponent weaknesses, and contextual factors.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      matchId: { type: Type.STRING },
      opponent: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard', 'very_hard'] },
      recommendedFormation: { type: Type.STRING },
      recommendedTactics: {
        type: Type.OBJECT,
        properties: {
          mentality: { type: Type.STRING },
          pressing: { type: Type.STRING },
          defensiveLine: { type: Type.STRING },
          attackingWidth: { type: Type.STRING },
        },
      },
      playerInstructions: { type: Type.OBJECT },
      gamePhaseStrategies: {
        type: Type.OBJECT,
        properties: {
          firstHalf: { type: Type.OBJECT },
          secondHalf: { type: Type.OBJECT },
          extraTime: { type: Type.OBJECT, nullable: true },
        },
      },
      contingencyPlans: {
        type: Type.OBJECT,
        properties: {
          ifWinning: { type: Type.ARRAY, items: { type: Type.STRING } },
          ifDrawing: { type: Type.ARRAY, items: { type: Type.STRING } },
          ifLosing: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      setPlayStrategies: {
        type: Type.OBJECT,
        properties: {
          corners: { type: Type.ARRAY, items: { type: Type.STRING } },
          freeKicks: { type: Type.ARRAY, items: { type: Type.STRING } },
          penalties: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      predictionConfidence: { type: Type.NUMBER, minimum: 0, maximum: 100 },
    },
    required: [
      'matchId', 'opponent', 'difficulty', 'recommendedFormation', 'recommendedTactics',
      'playerInstructions', 'gamePhaseStrategies', 'contingencyPlans',
      'setPlayStrategies', 'predictionConfidence',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    opponent: opponentAnalysis.opponentName,
    matchId: `match_${Date.now()}`,
  };
};

export const analyzeLiveMatch = async (
  matchId: string,
  currentMinute: number,
  currentScore: { home: number; away: number },
  events: MatchEvent[],
  ourPlayers: Player[],
  benchPlayers: Player[],
  currentTactics: TeamTactics,
  personality: AIPersonality = 'balanced',
): Promise<LiveMatchAnalysis> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const prompt = `Provide live match analysis and tactical recommendations:

MATCH STATUS:
- Match ID: ${matchId}
- Current Minute: ${currentMinute}
- Score: ${currentScore.home} - ${currentScore.away}

RECENT EVENTS:
${events.slice(-10).map(e => `${e.minute}': ${e.type} - ${e.playerName} (${e.team}) - ${e.description}`).join('\n')}

OUR TEAM ON FIELD:
${ourPlayers.map(p =>
  `${p.name} (${p.roleId}) - Form: ${p.form}, Stamina: ${p.stamina}%, Rating: ${p.currentPotential}`,
).join('\n')}

AVAILABLE SUBSTITUTES:
${benchPlayers.map(p =>
  `${p.name} (${p.roleId}) - Form: ${p.form}, Fresh: Yes, Rating: ${p.currentPotential}`,
).join('\n')}

CURRENT TACTICS: ${Object.entries(currentTactics).map(([k, v]) => `${k}: ${v}`).join(', ')}

Provide:
1. Assessment of current game state and momentum
2. Individual player performance evaluation
3. Urgent and recommended tactical adjustments
4. Substitution recommendations with reasoning
5. Predictions for next 10 minutes with responses

Focus on actionable insights for immediate tactical decisions.`;

  const systemInstruction = `You are a live match analyst providing real-time tactical analysis and recommendations. 
  Focus on immediate actionable insights that can change the course of the match.
  Consider momentum, fatigue, form, and tactical adjustments.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      matchId: { type: Type.STRING },
      currentMinute: { type: Type.NUMBER },
      currentScore: {
        type: Type.OBJECT,
        properties: {
          home: { type: Type.NUMBER },
          away: { type: Type.NUMBER },
        },
      },
      gameState: { type: Type.STRING, enum: ['dominating', 'balanced', 'under_pressure', 'desperate'] },
      keyEvents: { type: Type.ARRAY },
      currentPerformance: { type: Type.OBJECT },
      tacticalAdjustments: {
        type: Type.OBJECT,
        properties: {
          urgent: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommended: { type: Type.ARRAY, items: { type: Type.STRING } },
          risky: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      substitutionRecommendations: { type: Type.ARRAY },
      nextTenMinutes: {
        type: Type.OBJECT,
        properties: {
          expectedScenarios: { type: Type.ARRAY },
        },
      },
    },
    required: [
      'matchId', 'currentMinute', 'currentScore', 'gameState', 'keyEvents',
      'currentPerformance', 'tacticalAdjustments', 'substitutionRecommendations', 'nextTenMinutes',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    matchId,
    currentMinute,
    currentScore,
    keyEvents: events.slice(-5), // Keep last 5 events
  };
};

export const generateOppositionReport = async (
  opponentName: string,
  availableData: {
    recentResults?: string[];
    knownPlayers?: string[];
    playingStyle?: string;
    formations?: string[];
  },
  personality: AIPersonality = 'balanced',
): Promise<OppositionAnalysisReport> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const prompt = `Generate comprehensive opposition analysis report:

OPPONENT: ${opponentName}

AVAILABLE DATA:
- Recent Results: ${availableData.recentResults?.join(', ') || 'Not available'}
- Known Players: ${availableData.knownPlayers?.join(', ') || 'Not available'}
- Playing Style: ${availableData.playingStyle || 'Unknown'}
- Common Formations: ${availableData.formations?.join(', ') || 'Not available'}

Create detailed opposition analysis including:
1. Overall threat assessment and difficulty rating
2. Tactical profile and preferred approach
3. Key player analysis with strengths and weaknesses
4. Team-level strengths and vulnerabilities
5. Recent form analysis
6. Specific tactical vulnerabilities to exploit
7. Recommended approach to neutralize their threats

Use realistic soccer knowledge and tactical understanding.`;

  const systemInstruction = `You are a professional soccer scout and analyst specializing in opposition analysis. 
  Create detailed, realistic scouting reports that help teams prepare tactically for opponents.
  Focus on actionable intelligence that can be used for tactical planning.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      opponentName: { type: Type.STRING },
      overallThreatLevel: { type: Type.NUMBER, minimum: 1, maximum: 10 },
      tacticalProfile: {
        type: Type.OBJECT,
        properties: {
          preferredFormations: { type: Type.ARRAY, items: { type: Type.STRING } },
          playingStyle: { type: Type.STRING },
          tempo: { type: Type.STRING, enum: ['slow', 'medium', 'fast'] },
          buildupStyle: { type: Type.STRING, enum: ['direct', 'possession', 'mixed'] },
        },
      },
      keyPlayers: { type: Type.ARRAY },
      teamStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      teamWeaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      recentForm: {
        type: Type.OBJECT,
        properties: {
          results: { type: Type.ARRAY, items: { type: Type.STRING } },
          goalsScoredAverage: { type: Type.NUMBER },
          goalsConcededAverage: { type: Type.NUMBER },
          cleanSheetPercentage: { type: Type.NUMBER },
        },
      },
      tacticalVulnerabilities: {
        type: Type.OBJECT,
        properties: {
          defensiveWeaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          attackingLimitations: { type: Type.ARRAY, items: { type: Type.STRING } },
          transitionProblems: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      recommendedApproach: { type: Type.STRING },
    },
    required: [
      'opponentName', 'overallThreatLevel', 'tacticalProfile', 'keyPlayers',
      'teamStrengths', 'teamWeaknesses', 'recentForm', 'tacticalVulnerabilities',
      'recommendedApproach',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    opponentName,
  };
};

export const predictMatchOutcome = async (
  homeTeam: {
    name: string;
    players: Player[];
    formation: Formation;
    tactics: TeamTactics;
    recentForm: number[];
  },
  awayTeam: {
    name: string;
    players: Player[];
    formation: Formation;
    tactics: TeamTactics;
    recentForm: number[];
  },
  matchContext: {
    venue: 'home' | 'away' | 'neutral';
    importance: string;
    weather?: string;
  },
  personality: AIPersonality = 'balanced',
): Promise<{
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  expectedScore: { home: number; away: number };
  keyFactors: string[];
  confidenceLevel: number;
}> => {
  if (!aiInstance) {throw new Error("AI is offline.");}

  const prompt = `Predict match outcome with detailed probability analysis:

HOME TEAM: ${homeTeam.name}
Formation: ${homeTeam.formation.name}
Tactics: ${Object.entries(homeTeam.tactics).map(([k, v]) => `${k}: ${v}`).join(', ')}
Key Players: ${homeTeam.players.slice(0, 5).map(p => `${p.name} (${p.currentPotential})`).join(', ')}
Recent Form: ${homeTeam.recentForm.join(', ')} (last 5 matches)

AWAY TEAM: ${awayTeam.name}
Formation: ${awayTeam.formation.name}  
Tactics: ${Object.entries(awayTeam.tactics).map(([k, v]) => `${k}: ${v}`).join(', ')}
Key Players: ${awayTeam.players.slice(0, 5).map(p => `${p.name} (${p.currentPotential})`).join(', ')}
Recent Form: ${awayTeam.recentForm.join(', ')} (last 5 matches)

MATCH CONTEXT:
- Venue: ${matchContext.venue}
- Importance: ${matchContext.importance}
- Weather: ${matchContext.weather || 'Clear'}

Provide realistic match prediction with probabilities, expected score, key determining factors, and confidence level.`;

  const systemInstruction = `You are a professional match prediction analyst with expertise in soccer analytics and probability modeling.
  Provide realistic, well-reasoned match predictions based on team strength, form, tactics, and contextual factors.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      homeWinProbability: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      drawProbability: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      awayWinProbability: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      expectedScore: {
        type: Type.OBJECT,
        properties: {
          home: { type: Type.NUMBER },
          away: { type: Type.NUMBER },
        },
      },
      keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
      confidenceLevel: { type: Type.NUMBER, minimum: 0, maximum: 100 },
    },
    required: [
      'homeWinProbability', 'drawProbability', 'awayWinProbability',
      'expectedScore', 'keyFactors', 'confidenceLevel',
    ],
  };

  return await generateJson(prompt, schema, systemInstruction);
};

export const matchStrategyService = {
  generateMatchStrategy,
  analyzeLiveMatch,
  generateOppositionReport,
  predictMatchOutcome,
  isAIAvailable: () => aiInstance !== null,
};