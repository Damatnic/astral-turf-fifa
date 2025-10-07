import OpenAI from 'openai';
import type {
  Player,
  Formation,
  AIInsight,
  AIComparison,
  AISuggestedFormation,
  ChatMessage,
  PlayerRole,
  TeamTactics,
  AIOppositionReport,
  AISubstitutionSuggestion,
  AIPersonality,
  AIPostMatchAnalysis,
  MatchResult,
  HeadCoach,
  PlayerTrait,
  AIAgentResponse,
  AIPressConferenceResponse,
  TransferPlayer,
  AIScoutReport,
  AIDevelopmentSummary,
  PressNarrative,
  PromiseRequest,
  AITeamTalkResponse,
} from '../types';
import { PLAYER_ROLES, DETAILED_PLAYER_INSTRUCTIONS } from '../constants';

let openaiInstance: OpenAI | null = null;

try {
  const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
  if (apiKey) {
    openaiInstance = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // For client-side usage
    });
  } else {
    console.warn('OPENAI_API_KEY not found in process.env. AI features will be disabled.');
  }
} catch (error: any) {
  console.error('Error initializing OpenAI Service:', error);
  openaiInstance = null;
}

const promptCache = new Map<string, string>();

async function loadAndFormatPrompt(
  promptFile: string,
  replacements: Record<string, string>,
): Promise<string> {
  let template = promptCache.get(promptFile);
  if (!template) {
    // Since we can't read files in browser, we'll use inline prompts
    template = getInlinePrompt(promptFile);
    promptCache.set(promptFile, template);
  }

  let formattedPrompt = template;
  for (const [key, value] of Object.entries(replacements)) {
    formattedPrompt = formattedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return formattedPrompt;
}

function getInlinePrompt(promptFile: string): string {
  // Inline prompts for different use cases
  const prompts: Record<string, string> = {
    'tactical-analysis': `
You are an expert football tactical analyst. Analyze the given formation and provide insights.

formation:  {{formation}}
Players: {{players}}

Provide tactical insights focusing on:
1. Strengths and weaknesses
2. Recommended playing style
3. Key tactical points
4. Potential vulnerabilities

Respond in JSON format with structured analysis.
`,
    'player-comparison': `
Compare these football players and provide detailed analysis:

Player 1: {{player1}}
Player 2: {{player2}}

Provide comparison covering:
1. Overall rating comparison
2. Strengths and weaknesses
3. Position suitability
4. Recommended usage

Respond in JSON format.
`,
    'formation-suggestion': `
Based on the available players, suggest the best formation: 

Available Players: {{players}}
Team Style: {{teamStyle}}
Opposition: {{opposition}}

Suggest optimal formation with:
1. Formation type (e.g., 4-3-3, 4-4-2)
2. Player positions
3. Tactical reasoning
4. Alternative options

Respond in JSON format.
`,
    'match-analysis': `
Analyze this match result and provide insights:

Match Result: {{matchResult}}
Team Performance: {{teamStats}}
Opposition: {{opposition}}

Provide analysis covering:
1. Performance highlights
2. Areas for improvement
3. Tactical adjustments needed
4. Player performances

Respond in JSON format.
`,
    chat: `
You are an AI football manager assistant. Help the user with football management questions.

Context: {{context}}
Question: {{question}}

Provide helpful, accurate football management advice.
`,
  };

  return prompts[promptFile] || prompts['chat'];
}

async function callOpenAI(prompt: string, maxTokens: number = 1000): Promise<string> {
  if (!openaiInstance) {
    throw new Error('OpenAI service is not initialized');
  }

  try {
    const completion = await openaiInstance.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert football manager AI assistant. Provide detailed, accurate, and helpful responses about football tactics, player management, and team strategy.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return (completion.choices[0] as any)?.message?.content || '';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to get AI response');
  }
}

// Main AI functions - keeping the same interface as the original service

export async function analyzeFormation(
  formation: Formation,
  players: Player[],
): Promise<AIInsight[]> {
  if (!openaiInstance) {
    return generateFallbackInsights();
  }

  try {
    const prompt = await loadAndFormatPrompt('tactical-analysis', {
      formation: JSON.stringify(formation),
      players: JSON.stringify(
        players.map(p => ({
          name: p.name,
          position: p.position,
          overall: (p as any).overall,
          skills: (p as any).skills,
        })),
      ),
    });

    const response = await callOpenAI(prompt, 1500);

    // Parse response and return insights
    try {
      const parsed = JSON.parse(response);
      return parsed.insights || generateFallbackInsights();
    } catch {
      // If JSON parsing fails, generate insights from text
      return [
        {
          advantages: response.substring(0, 100),
          vulnerabilities: 'Unknown',
          recommendation: response.substring(0, 200),
          type: 'tactical',
          confidence: 0.8,
          priority: 'medium',
        },
      ];
    }
  } catch (error: any) {
    console.error('Error in analyzeformation: ', error);
    return generateFallbackInsights();
  }
}

export async function comparePlayers(player1: Player, player2: Player): Promise<AIComparison> {
  if (!openaiInstance) {
    return generateFallbackComparison(player1, player2);
  }

  try {
    const prompt = await loadAndFormatPrompt('player-comparison', {
      player1: JSON.stringify({
        name: player1.name,
        position: player1.position,
        overall: (player1 as any).overall,
        skills: (player1 as any).skills,
      }),
      player2: JSON.stringify({
        name: player2.name,
        position: player2.position,
        overall: (player2 as any).overall,
        skills: (player2 as any).skills,
      }),
    });

    const response = await callOpenAI(prompt, 1000);

    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      return generateFallbackComparison(player1, player2);
    }
  } catch (error: any) {
    console.error('Error in comparePlayers:', error);
    return generateFallbackComparison(player1, player2);
  }
}

export async function suggestFormation(
  players: Player[],
  teamTactics: TeamTactics,
  oppositionStyle?: string,
): Promise<AISuggestedFormation> {
  if (!openaiInstance) {
    return generateFallbackFormation(players);
  }

  try {
    const prompt = await loadAndFormatPrompt('formation-suggestion', {
      players: JSON.stringify(
        players.map(p => ({
          name: p.name,
          position: p.position,
          overall: (p as any).overall,
          skills: (p as any).skills,
        })),
      ),
      teamStyle: JSON.stringify(teamTactics),
      opposition: oppositionStyle || 'unknown',
    });

    const response = await callOpenAI(prompt, 1200);

    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      return generateFallbackFormation(players);
    }
  } catch (error: any) {
    console.error('Error in suggestformation: ', error);
    return generateFallbackFormation(players);
  }
}

export async function chatWithAI(messages: ChatMessage[], context?: string): Promise<string> {
  if (!openaiInstance) {
    return 'AI service is currently unavailable. Please check your API configuration.';
  }

  try {
    const lastMessage = messages[messages.length - 1];
    const prompt = await loadAndFormatPrompt('chat', {
      context: context || '',
      question: (lastMessage as any).content,
    });

    return await callOpenAI(prompt, 800);
  } catch (error: any) {
    console.error('Error in chatWithAI:', error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again.";
  }
}

// Fallback functions for when AI is unavailable
function generateFallbackInsights(): AIInsight[] {
  return [
    {
      type: 'tactical' as any,
      advantages: 'Formation analysis unavailable',
      vulnerabilities: 'AI service not configured',
      recommendation: 'Configure OpenAI API for detailed tactical insights',
      confidence: 0.5,
      priority: 'low',
    },
  ];
}

function generateFallbackComparison(player1: Player, player2: Player): AIComparison {
  const p1Overall = (player1 as Player & { overall?: number }).overall ?? 70;
  const p2Overall = (player2 as Player & { overall?: number }).overall ?? 70;
  return {
    comparison: `${player1.name} vs ${player2.name} comparison`,
    winner: p1Overall > p2Overall ? player1.name : player2.name,
    reasoning: `Based on overall ratings: ${player1.name} (${p1Overall}) vs ${player2.name} (${p2Overall})`,
    strengths: {
      [player1.name]: ['Higher overall rating'],
      [player2.name]: ['Good alternative option'],
    },
    weaknesses: {
      [player1.name]: ['AI analysis unavailable'],
      [player2.name]: ['AI analysis unavailable'],
    },
    recommendation: 'Configure AI service for detailed analysis',
  };
}

function generateFallbackFormation(_players: Player[]): AISuggestedFormation {
  return {
    formationName: '4-4-2',
    playerIds: [],
    formation: '4-4-2',
    positions: {},
    reasoning: 'Default formation - AI service not configured',
    confidence: 0.5,
    alternatives: ['4-3-3', '3-5-2'],
  };
}

// Export all functions with the same interface as the original service
export { callOpenAI as callAI, loadAndFormatPrompt };

// Additional AI functions that may be used by other services
export async function generateMatchAnalysis(
  _matchResult: MatchResult,
): Promise<AIPostMatchAnalysis> {
  // Implementation for match analysis
  return {
    summary: 'Match analysis unavailable - configure OpenAI API',
    keyMoment: 'AI service not configured',
    advice: 'Configure OpenAI API for detailed analysis',
    overallRating: 7.5,
    keyMoments: [],
    playerRatings: [],
    improvements: ['Configure OpenAI API for detailed analysis'],
  };
}

export async function generateScoutReport(player: TransferPlayer): Promise<AIScoutReport> {
  // Implementation for scout reports
  const playerValue = (player as TransferPlayer & { value?: number }).value ?? 0;
  return {
    overallAssessment: 'AI analysis unavailable - configure OpenAI API',
    strengths: [],
    weaknesses: [],
    summary: 'Scout report unavailable',
    potentialFit: 'Unknown fit - configure AI service',
    estimatedValue: playerValue,
    recommendation: 'unknown' as const,
    confidence: 0.5,
    marketValue: playerValue,
  };
}

export async function generateTeamTalk(
  context: string,
  personality: AIPersonality,
): Promise<AITeamTalkResponse> {
  if (!openaiInstance) {
    return {
      options: [],
      message: 'Team talk unavailable - configure OpenAI API',
      tone: 'neutral',
      effectiveness: 0.5,
    };
  }

  try {
    const prompt = `Generate a motivational team talk for a football team.
    Context: ${context}
    Personality: ${personality}
    
    Provide an inspiring message that fits the situation and personality type.`;

    const response = await callOpenAI(prompt, 600);

    return {
      options: [],
      message: response,
      tone: personality,
      effectiveness: 0.8,
    };
  } catch {
    // Error generating team talk
    return {
      options: [],
      message: 'Stay focused and play your best football!',
      tone: 'neutral',
      effectiveness: 0.5,
    };
  }
}

// Missing function implementations
export async function generateTacticalAnalysis(
  formation: Formation,
  players: Player[],
): Promise<AIInsight[]> {
  return analyzeFormation(formation, players);
}

export async function generateFormationSuggestion(
  players: Player[],
  teamTactics: TeamTactics,
  oppositionStyle?: string,
): Promise<AISuggestedFormation> {
  return suggestFormation(players, teamTactics, oppositionStyle);
}

export async function getFormationAnalysis(
  formation: Formation,
  players: Player[],
): Promise<AIInsight[]> {
  return analyzeFormation(formation, players);
}

export async function getPlayerComparison(player1: Player, player2: Player): Promise<AIComparison> {
  return comparePlayers(player1, player2);
}

export async function optimizeFormation(
  players: Player[],
  teamTactics: TeamTactics,
): Promise<AISuggestedFormation> {
  return suggestFormation(players, teamTactics);
}

export async function generateChat(messages: ChatMessage[], context?: string): Promise<string> {
  return chatWithAI(messages, context);
}

// Export the service object
export const openAiService = {
  generateTacticalAnalysis,
  generateFormationSuggestion,
  getFormationAnalysis,
  getPlayerComparison,
  optimizeFormation,
  generateChat,
  generateTeamTalk,
};
