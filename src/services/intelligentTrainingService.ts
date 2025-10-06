import { GoogleGenAI, Type } from '@google/genai';
import type {
  Player,
  WeeklySchedule,
  TrainingDrill,
  DailySchedule,
  PlayerAttributes,
  AIPersonality,
  TeamTactics,
  Formation,
} from '../types';

// AI Service Instance
let aiInstance: GoogleGenAI | null = null;

try {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
} catch (_error) {
  console.error('Error initializing Intelligent Training Service:', _error);
  aiInstance = null;
}

export interface IntelligentTrainingPlan {
  playerId: string;
  playerName: string;
  planName: string;
  duration: number; // weeks
  objectives: string[];
  schedule: WeeklySchedule;
  adaptiveModifications: {
    fatigueThreshold: number;
    performanceBasedAdjustments: boolean;
    injuryPreventionFocus: boolean;
  };
  expectedOutcomes: {
    attributeImprovements: Partial<Record<keyof PlayerAttributes, number>>;
    fitnessImprovement: number;
    injuryRiskReduction: number;
    estimatedTimeToGoals: number; // weeks
  };
  alternativeScenarios: {
    lightWorkload: WeeklySchedule;
    intensiveWorkload: WeeklySchedule;
  };
  keyPerformanceIndicators: string[];
}

export interface TeamTrainingOptimization {
  teamName: string;
  formation: string;
  tacticalFocus: string[];
  playerSpecificPlans: IntelligentTrainingPlan[];
  teamWidePlans: {
    tacticalSessions: string[];
    physicalConditioning: string[];
    technicalSkills: string[];
    mentalPreparation: string[];
  };
  periodization: {
    preseason: WeeklySchedule;
    inseason: WeeklySchedule;
    postseason: WeeklySchedule;
  };
  loadManagement: {
    rotationRecommendations: Array<{
      playerId: string;
      restFrequency: string;
      optimalMinutes: number;
    }>;
    recoveryProtocols: string[];
  };
}

export interface TrainingSessionAnalytics {
  sessionId: string;
  date: string;
  participants: string[];
  drillsPerformed: string[];
  intensityLevel: 'low' | 'medium' | 'high';
  playerFeedback: Record<
    string,
    {
      fatigueLevel: number;
      enjoymentRating: number;
      perceivedEffectiveness: number;
    }
  >;
  coachObservations: string[];
  suggestedAdjustments: string[];
  nextSessionRecommendations: string[];
}

async function generateJson(prompt: string, schema: unknown, systemInstruction: string) {
  const ai = aiInstance;
  if (!ai) {
    throw new Error('AI is offline.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.6,
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error('AI returned an empty response.');
    }
    return JSON.parse(jsonText);
  } catch (_error) {
    console.error('Error generating JSON from Gemini API:', _error);
    throw new Error('Failed to get a valid JSON response from the AI.');
  }
}

function formatPlayerForTraining(player: Player): string {
  return `${player.name} (Age: ${player.age}, Role: ${player.roleId})
  - Current Rating: ${player.currentPotential}
  - Physical Attributes: Speed ${player.attributes.speed}, Stamina ${player.attributes.stamina}
  - Technical Attributes: Passing ${player.attributes.passing}, Dribbling ${player.attributes.dribbling}
  - Mental Attributes: Positioning ${player.attributes.positioning}
  - Defensive: Tackling ${player.attributes.tackling}
  - Attacking: Shooting ${player.attributes.shooting}
  - Form: ${player.form}, Morale: ${player.morale}
  - Traits: ${player.traits.join(', ') || 'None'}
  - Fatigue Level: ${player.fatigue}/100
  - Injury Risk: ${player.injuryRisk}/100`;
}

export const generateIntelligentTrainingPlan = async (
  player: Player,
  objectives: string[],
  duration: number,
  currentFormation: Formation,
  teamTactics: TeamTactics,
  personality: AIPersonality = 'balanced'
): Promise<IntelligentTrainingPlan> => {
  if (!aiInstance) {
    throw new Error('AI is offline.');
  }

  const prompt = `Create a comprehensive, intelligent training plan for this player:

PLAYER PROFILE:
${formatPlayerForTraining(player)}

TRAINING OBJECTIVES:
${objectives.map(obj => `- ${obj}`).join('\n')}

TACTICAL CONTEXT:
- Team Formation: ${currentFormation.name}
- Team Mentality: ${teamTactics.mentality}
- Pressing Style: ${teamTactics.pressing}
- Defensive Line: ${teamTactics.defensiveLine}
- Attacking Width: ${teamTactics.attackingWidth}

PLAN DURATION: ${duration} weeks

Create a personalized training plan that:
1. Addresses the player's specific weaknesses and builds on strengths
2. Aligns with tactical requirements and role demands
3. Manages fatigue and injury risk intelligently
4. Provides adaptive modifications based on performance
5. Includes alternative scenarios for different workload needs

Focus on evidence-based training methods and modern sports science principles.`;

  const systemInstruction = `You are an elite sports scientist and training specialist with expertise in soccer player development. 
  Create comprehensive, adaptive training plans that optimize performance while minimizing injury risk. 
  Consider individual player needs, tactical requirements, and load management principles.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      playerId: { type: Type.STRING },
      playerName: { type: Type.STRING },
      planName: { type: Type.STRING },
      duration: { type: Type.NUMBER },
      objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
      schedule: {
        type: Type.OBJECT,
        properties: {
          monday: { type: Type.OBJECT },
          tuesday: { type: Type.OBJECT },
          wednesday: { type: Type.OBJECT },
          thursday: { type: Type.OBJECT },
          friday: { type: Type.OBJECT },
          saturday: { type: Type.OBJECT },
          sunday: { type: Type.OBJECT },
        },
      },
      adaptiveModifications: {
        type: Type.OBJECT,
        properties: {
          fatigueThreshold: { type: Type.NUMBER },
          performanceBasedAdjustments: { type: Type.BOOLEAN },
          injuryPreventionFocus: { type: Type.BOOLEAN },
        },
      },
      expectedOutcomes: {
        type: Type.OBJECT,
        properties: {
          attributeImprovements: { type: Type.OBJECT },
          fitnessImprovement: { type: Type.NUMBER },
          injuryRiskReduction: { type: Type.NUMBER },
          estimatedTimeToGoals: { type: Type.NUMBER },
        },
      },
      alternativeScenarios: {
        type: Type.OBJECT,
        properties: {
          lightWorkload: { type: Type.OBJECT },
          intensiveWorkload: { type: Type.OBJECT },
        },
      },
      keyPerformanceIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      'playerId',
      'playerName',
      'planName',
      'duration',
      'objectives',
      'schedule',
      'adaptiveModifications',
      'expectedOutcomes',
      'alternativeScenarios',
      'keyPerformanceIndicators',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    playerId: player.id,
    playerName: player.name,
  };
};

export const optimizeTeamTraining = async (
  players: Player[],
  formation: Formation,
  teamTactics: TeamTactics,
  upcomingOpponents: string[],
  seasonPhase: 'preseason' | 'inseason' | 'postseason',
  personality: AIPersonality = 'balanced'
): Promise<TeamTrainingOptimization> => {
  if (!aiInstance) {
    throw new Error('AI is offline.');
  }

  const prompt = `Design comprehensive team training optimization:

TEAM SQUAD:
${players.map(p => formatPlayerForTraining(p)).join('\n\n')}

TACTICAL SETUP:
- Formation: ${formation.name}
- Team Tactics: ${Object.entries(teamTactics)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')}

SEASON CONTEXT:
- Current Phase: ${seasonPhase}
- Upcoming Opponents: ${upcomingOpponents.join(', ')}

Create a team-wide training optimization that:
1. Balances individual player needs with team tactical requirements
2. Manages squad fatigue and rotation intelligently  
3. Prepares for specific upcoming challenges
4. Incorporates periodization principles
5. Maximizes team chemistry and tactical understanding

Focus on creating synergy between individual development and collective performance.`;

  const systemInstruction = `You are a world-class team training coordinator with expertise in tactical periodization and squad management. 
  Design comprehensive training programs that optimize both individual and collective performance.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      teamName: { type: Type.STRING },
      formation: { type: Type.STRING },
      tacticalFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
      playerSpecificPlans: { type: Type.ARRAY, items: { type: Type.OBJECT } },
      teamWidePlans: {
        type: Type.OBJECT,
        properties: {
          tacticalSessions: { type: Type.ARRAY, items: { type: Type.STRING } },
          physicalConditioning: { type: Type.ARRAY, items: { type: Type.STRING } },
          technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          mentalPreparation: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      periodization: {
        type: Type.OBJECT,
        properties: {
          preseason: { type: Type.OBJECT },
          inseason: { type: Type.OBJECT },
          postseason: { type: Type.OBJECT },
        },
      },
      loadManagement: {
        type: Type.OBJECT,
        properties: {
          rotationRecommendations: { type: Type.ARRAY },
          recoveryProtocols: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    required: [
      'teamName',
      'formation',
      'tacticalFocus',
      'playerSpecificPlans',
      'teamWidePlans',
      'periodization',
      'loadManagement',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return result;
};

export const analyzeTrainingSession = async (
  sessionDate: string,
  participants: Player[],
  drillsPerformed: string[],
  coachObservations: string[],
  personality: AIPersonality = 'balanced'
): Promise<TrainingSessionAnalytics> => {
  if (!aiInstance) {
    throw new Error('AI is offline.');
  }

  const prompt = `Analyze this training session and provide comprehensive feedback:

SESSION DETAILS:
- Date: ${sessionDate}
- Participants: ${participants.map(p => `${p.name} (${p.roleId}, Form: ${p.form})`).join(', ')}
- Drills Performed: ${drillsPerformed.join(', ')}

COACH OBSERVATIONS:
${coachObservations.map(obs => `- ${obs}`).join('\n')}

PLAYER STATUS PRE-SESSION:
${participants.map(p => `${p.name}: Fatigue ${p.fatigue}/100, Morale ${p.morale}`).join('\n')}

Provide detailed analysis including:
1. Session effectiveness assessment
2. Individual player performance insights
3. Fatigue and recovery recommendations
4. Tactical learning outcomes
5. Suggested adjustments for future sessions
6. Next session recommendations

Focus on actionable insights that improve both performance and wellbeing.`;

  const systemInstruction = `You are an elite performance analyst specializing in training session evaluation and optimization. 
  Provide comprehensive analysis that helps coaches make data-driven decisions about training effectiveness.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      sessionId: { type: Type.STRING },
      date: { type: Type.STRING },
      participants: { type: Type.ARRAY, items: { type: Type.STRING } },
      drillsPerformed: { type: Type.ARRAY, items: { type: Type.STRING } },
      intensityLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
      playerFeedback: { type: Type.OBJECT },
      coachObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
      suggestedAdjustments: { type: Type.ARRAY, items: { type: Type.STRING } },
      nextSessionRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      'sessionId',
      'date',
      'participants',
      'drillsPerformed',
      'intensityLevel',
      'playerFeedback',
      'coachObservations',
      'suggestedAdjustments',
      'nextSessionRecommendations',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    date: sessionDate,
    participants: participants.map(p => p.id),
    drillsPerformed,
    coachObservations,
  };
};

// Adaptive training adjustment based on performance data
export const adaptTrainingPlan = async (
  currentPlan: IntelligentTrainingPlan,
  player: Player,
  recentPerformance: {
    matchesPlayed: number;
    averageRating: number;
    fatigueLevel: number;
    injuryIncidents: number;
  },
  personality: AIPersonality = 'balanced'
): Promise<IntelligentTrainingPlan> => {
  if (!aiInstance) {
    throw new Error('AI is offline.');
  }

  const prompt = `Adapt and optimize this training plan based on recent performance data:

CURRENT TRAINING PLAN:
- Plan Name: ${currentPlan.planName}
- Duration: ${currentPlan.duration} weeks
- Objectives: ${currentPlan.objectives.join(', ')}

PLAYER CURRENT STATUS:
${formatPlayerForTraining(player)}

RECENT PERFORMANCE DATA:
- Matches Played: ${recentPerformance.matchesPlayed}
- Average Match Rating: ${recentPerformance.averageRating}/10
- Current Fatigue: ${recentPerformance.fatigueLevel}/100
- Recent Injury Incidents: ${recentPerformance.injuryIncidents}

Modify the training plan to:
1. Address performance trends (positive or negative)
2. Adjust training load based on fatigue and injury risk
3. Optimize for current form and confidence levels
4. Maintain long-term development goals
5. Incorporate lessons learned from recent matches

Provide an updated, adaptive training plan that responds to the player's current situation.`;

  const systemInstruction = `You are an adaptive training specialist who excels at modifying training plans based on real-world performance data and player feedback. 
  Create dynamic, responsive training adjustments that optimize both short-term performance and long-term development.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      playerId: { type: Type.STRING },
      playerName: { type: Type.STRING },
      planName: { type: Type.STRING },
      duration: { type: Type.NUMBER },
      objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
      schedule: { type: Type.OBJECT },
      adaptiveModifications: { type: Type.OBJECT },
      expectedOutcomes: { type: Type.OBJECT },
      alternativeScenarios: { type: Type.OBJECT },
      keyPerformanceIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      'playerId',
      'playerName',
      'planName',
      'duration',
      'objectives',
      'schedule',
      'adaptiveModifications',
      'expectedOutcomes',
      'alternativeScenarios',
      'keyPerformanceIndicators',
    ],
  };

  const result = await generateJson(prompt, schema, systemInstruction);
  return {
    ...result,
    playerId: player.id,
    playerName: player.name,
  };
};

export const intelligentTrainingService = {
  generateIntelligentTrainingPlan,
  optimizeTeamTraining,
  analyzeTrainingSession,
  adaptTrainingPlan,
  isAIAvailable: () => aiInstance !== null,
};
