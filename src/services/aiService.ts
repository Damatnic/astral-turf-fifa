import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { Player, Formation, AIInsight, AIComparison, AISuggestedFormation, ChatMessage, PlayerRole, TeamTactics, AIOppositionReport, AISubstitutionSuggestion, AIPersonality, AIPostMatchAnalysis, MatchResult, HeadCoach, PlayerTrait, AIAgentResponse, AIPressConferenceResponse, TransferPlayer, AIScoutReport, AIDevelopmentSummary, PressNarrative, PromiseRequest, AITeamTalkResponse } from '../types';
import { PLAYER_ROLES, DETAILED_PLAYER_INSTRUCTIONS } from "../constants";

let aiInstance: GoogleGenAI | null = null;

try {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
  } else {
    // // console.warn("API_KEY not found in process.env. AI features will be disabled.");
  }
} catch (_error) {
  console.error("Error initializing AI Service:", error);
  aiInstance = null;
}

const promptCache = new Map<string, string>();

async function loadAndFormatPrompt(promptFile: string, replacements: Record<string, string>): Promise<string> {
    let template = promptCache.get(promptFile);
    if (!template) {
        try {
            const response = await fetch(`/prompts/${promptFile}`);
            if (!response.ok) {throw new Error(`Failed to fetch prompt: ${response.statusText}`);}
            template = await response.text();
            promptCache.set(promptFile, template);
        } catch (_error) {
            console.error(`Error loading prompt file ${promptFile}:`, error);
            return `Error: Could not load prompt template '${promptFile}'.`;
        }
    }
    let formattedPrompt = template;
    for (const key in replacements) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        formattedPrompt = formattedPrompt.replace(new RegExp(escapedKey, 'g'), replacements[key]);
    }
    return formattedPrompt;
}

const getOfflineResponse = (feature: string) => ({
  advantages: "AI is offline.",
  vulnerabilities: `Please set up your API key to enable ${feature}.`,
  recommendation: "Check your configuration.",
  comparison: "AI is offline.",
  reasoning: "AI is offline.",
  formationName: "4-4-2", playerIds: [],
  text: "AI is offline.",
  playerIdsToHighlight: [],
  keyPlayers: 'N/A', tacticalApproach: 'N/A', weaknesses: 'N/A',
  playerOutId: '', playerInId: '',
  summary: 'AI is offline.', keyMoment: 'N/A', advice: 'N/A',
  question: 'AI is offline. Could not generate question.',
  options: [{ text: 'Continue', outcome: 'Offline mode', fanConfidenceEffect: 0, teamMoraleEffect: 0 }],
  response: 'AI is offline. Cannot negotiate.',
  isDealAccepted: false,
});

async function getSystemInstruction(personality: AIPersonality): Promise<string> {
    if (personality === 'balanced') {return "You are a helpful and balanced soccer tactician.";}
    const promptFile = `ai_personality_${personality}.md`;
    let template = promptCache.get(promptFile);
    if (!template) {
        const response = await fetch(`/prompts/${promptFile}`);
        template = await response.text();
        promptCache.set(promptFile, template);
    }
    return template;
}

function getPlayerRole(roleId: string): PlayerRole | undefined {
    return PLAYER_ROLES.find(r => r.id === roleId);
}

function formatPlayerForPrompt(player: Player | TransferPlayer): string {
  const { id, name, jerseyNumber, roleId, instructions, attributes, morale, form, traits, currentPotential } = player;
  const role = getPlayerRole(roleId);
  const roleName = role ? role.name : 'Unknown Role';

  const instructionNames = Object.entries(instructions)
    .map(([instrId, optionId]) => {
        const instruction = DETAILED_PLAYER_INSTRUCTIONS[instrId];
        if (!instruction || optionId === 'default') {return null;}
        const option = instruction.options.find(o => o.id === optionId);
        return option ? option.name : null;
    })
    .filter(Boolean)
    .join(', ');

  const atts = Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join(', ');

  let details = `Role: ${roleName}, Current Ability: ${currentPotential}, Morale: ${morale}, Form: ${form}`;
  if (traits.length > 0) {details += `, Traits: ${traits.join(', ')}`;}
  if (instructionNames) {details += `, Instructions: ${instructionNames}`;}
  details += `, Attributes: ${atts}`;

  let baseString = `- Player ID: ${id}, #${jerseyNumber} ${name} (${details})`;
  if ('askingPrice' in player) {
      baseString += `, Asking Price: $${player.askingPrice.toLocaleString()}`;
  }
  return baseString;
}

function formatTacticsForPrompt(tactics: TeamTactics): string {
    return `Mentality: ${tactics.mentality}, Pressing: ${tactics.pressing}, Defensive Line: ${tactics.defensiveLine}, Attacking Width: ${tactics.attackingWidth}`;
}

const generateJson = async (prompt: string, schema: unknown, systemInstruction: string) => {
    const ai = aiInstance;
    if (!ai) {throw new Error("AI is offline.");}
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.8,
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
};

export const getTeamTalkOptions = async (
    teamPlayers: Player[],
    opponentName: string,
    isHalftime: boolean,
    currentScore: string,
    personality: AIPersonality,
): Promise<AITeamTalkResponse> => {
    if (!aiInstance) {throw new Error("AI is offline.");}

    const prompt = await loadAndFormatPrompt('team_talk_options.md', {
        '{{YOUR_TEAM_ROSTER}}': teamPlayers.map(formatPlayerForPrompt).join('\n'),
        '{{OPPONENT_NAME}}': opponentName,
        '{{MATCH_CONTEXT}}': isHalftime ? `It's halftime and the score is ${currentScore}.` : "The match is about to begin.",
    });

    const systemInstruction = `You are an expert assistant manager with a ${personality} personality. Provide team talk options.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            options: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        tone: { type: Type.STRING },
                        message: { type: Type.STRING },
                        moraleEffect: { type: Type.INTEGER },
                    },
                    required: ["tone", "message", "moraleEffect"],
                },
            },
        },
        required: ["options"],
    };

    return generateJson(prompt, schema, systemInstruction);
};


export const getAIDevelopmentSummary = async (player: Player): Promise<AIDevelopmentSummary> => {
    if (!aiInstance) {throw new Error("AI is offline.");}

    const attributeHistoryText = player.attributeHistory
        .map(log => `Week ${log.week}: ${JSON.stringify(log.attributes)}`)
        .join('\n');

    const prompt = await loadAndFormatPrompt('player_development_summary.md', {
        '{{PLAYER_DATA}}': formatPlayerForPrompt(player),
        '{{ATTRIBUTE_HISTORY}}': attributeHistoryText || 'No history recorded yet.',
    });

    const systemInstruction = "You are an expert youth development coach providing a summary of a player's progress.";
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["summary", "strengths", "areasForImprovement"],
    };

    return generateJson(prompt, schema, systemInstruction);
};

export const generatePlayerBio = async (player: Player): Promise<string> => {
    if (!aiInstance) {return "AI is offline. Bio cannot be generated.";}

    const prompt = await loadAndFormatPrompt('player_bio.md', {
        '{{PLAYER_NAME}}': player.name,
        '{{PLAYER_AGE}}': player.age.toString(),
        '{{PLAYER_NATIONALITY}}': player.nationality,
        '{{PLAYER_ROLE}}': getPlayerRole(player.roleId)?.name || 'Unknown Role',
        '{{PLAYER_ATTRIBUTES}}': Object.entries(player.attributes).map(([key, value]) => `${key}: ${value}`).join(', '),
        '{{PLAYER_TRAITS}}': player.traits.join(', ') || 'None',
    });

    const systemInstruction = "You are a poetic sports writer, creating a short, evocative biography for a soccer player's profile based on their data. Be creative and focus on their style of play. Keep it to 2-3 sentences.";

    try {
        const response: GenerateContentResponse = await aiInstance.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.9,
            },
        });
        const text = response.text.trim();
        if (!text) {
             throw new Error("AI returned an empty response.");
        }
        return text;
    } catch (_error) {
        console.error("Error generating player bio from Gemini API:", error);
        throw new Error("Failed to get a valid response from the AI for the player bio.");
    }
};

export const getTacticalAdvice = async (
    homePlayers: Player[], awayPlayers: Player[], homeFormation: Formation, awayFormation: Formation,
    homeTactics: TeamTactics, awayTactics: TeamTactics, personality: AIPersonality, coach: HeadCoach | null,
): Promise<AIInsight> => {
  if (!aiInstance) {return getOfflineResponse('Tactical Analysis') as AIInsight;}
  const prompt = await loadAndFormatPrompt('tactical_analysis.md', {
    '{{HOME_FORMATION_NAME}}': homeFormation.name,
    '{{AWAY_FORMATION_NAME}}': awayFormation.name,
    '{{HOME_TEAM_ROSTER}}': homePlayers.map(formatPlayerForPrompt).join('\n') || 'No players.',
    '{{AWAY_TEAM_ROSTER}}': awayPlayers.map(formatPlayerForPrompt).join('\n') || 'No players.',
    '{{HOME_TEAM_TACTICS}}': formatTacticsForPrompt(homeTactics),
    '{{AWAY_TEAM_TACTICS}}': formatTacticsForPrompt(awayTactics),
    '{{COACH_SPECIALTY}}': coach?.specialty || 'None',
  });
  const systemInstruction = await getSystemInstruction(personality);
  const schema = {
    type: Type.OBJECT, properties: {
        advantages: { type: Type.STRING },
        vulnerabilities: { type: Type.STRING },
        recommendation: { type: Type.STRING },
    }, required: ["advantages", "vulnerabilities", "recommendation"],
  };
  return generateJson(prompt, schema, systemInstruction);
};

export const getAIPlayerComparison = async (player1: Player, player2: Player, formation: Formation, personality: AIPersonality): Promise<AIComparison> => {
    if (!aiInstance) {return getOfflineResponse('Player Comparison') as AIComparison;}
    const prompt = await loadAndFormatPrompt('player_comparison.md', {
        '{{FORMATION_NAME}}': formation.name,
        '{{PLAYER_1_ROLE}}': getPlayerRole(player1.roleId)?.name || player1.roleId,
        '{{PLAYER_2_ROLE}}': getPlayerRole(player2.roleId)?.name || player2.roleId,
        '{{PLAYER_1_DATA}}': formatPlayerForPrompt(player1),
        '{{PLAYER_2_DATA}}': formatPlayerForPrompt(player2),
    });
    const systemInstruction = await getSystemInstruction(personality);
    const schema = {
        type: Type.OBJECT, properties: {
            comparison: { type: Type.STRING },
            recommendation: { type: Type.STRING },
        }, required: ["comparison", "recommendation"],
    };
    return generateJson(prompt, schema, systemInstruction);
};

export const getAIFormationSuggestion = async (allPlayers: Player[], personality: AIPersonality): Promise<AISuggestedFormation> => {
    if (!aiInstance) {return getOfflineResponse('Formation Suggestion') as AISuggestedFormation;}
    const prompt = await loadAndFormatPrompt('formation_suggestion.md', {
        '{{PLAYER_ROSTER}}': allPlayers.map(formatPlayerForPrompt).join('\n'),
    });
    const systemInstruction = await getSystemInstruction(personality);
    const schema = {
        type: Type.OBJECT, properties: {
            formationName: { type: Type.STRING },
            playerIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING },
        }, required: ["formationName", "playerIds", "reasoning"],
    };
    const parsedData = await generateJson(prompt, schema, systemInstruction) as AISuggestedFormation;
    if (!['4-4-2', '4-3-3', '3-5-2'].includes(parsedData.formationName) || parsedData.playerIds.length !== 11) {
        throw new Error("AI returned an invalid formation or player count.");
    }
    return parsedData;
};

export const getAIChatResponse = async (
  chatHistory: ChatMessage[], playersInFormation: Player[], formation: Formation, personality: AIPersonality,
): Promise<{ text: string, playerIdsToHighlight: string[] }> => {
  if (!aiInstance) {return getOfflineResponse('AI Chat') as { text: string, playerIdsToHighlight: string[] };}
  const prompt = await loadAndFormatPrompt('chat_response.md', {
      '{{FORMATION_NAME}}': formation.name,
      '{{PLAYER_ROSTER}}': playersInFormation.map(formatPlayerForPrompt).join('\n'),
      '{{CHAT_HISTORY}}': chatHistory.map(m => `${m.sender === 'user' ? 'User' : 'Astral AI'}: ${m.text}`).join('\n'),
  });
  const systemInstruction = await getSystemInstruction(personality);
  const schema = {
    type: Type.OBJECT, properties: {
        response: { type: Type.STRING },
        highlightedPlayerIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    }, required: ["response", "highlightedPlayerIds"],
  };
  const parsedData = await generateJson(prompt, schema, systemInstruction);
  return { text: parsedData.response, playerIdsToHighlight: parsedData.highlightedPlayerIds || [] };
};

export const getAIPlayerConversationResponse = async (
    player: Player,
    userMessage: string,
    personality: AIPersonality, // manager personality
): Promise<{ response: string; moraleEffect: number, promiseRequest?: PromiseRequest }> => {
    if (!aiInstance) {return { response: 'AI is offline. Player is unavailable to talk.', moraleEffect: 0 };}

    const prompt = await loadAndFormatPrompt('player_conversation.md', {
        '{{PLAYER_DATA}}': formatPlayerForPrompt(player),
        '{{CONVERSATION_HISTORY}}': player.conversationHistory.map(m => `${m.sender === 'user' ? 'Manager' : player.name}: ${m.text}`).join('\n'),
        '{{USER_MESSAGE}}': userMessage,
    });

    const systemInstruction = `You are a professional soccer player with a distinct personality based on your traits and morale. Your manager's personality is ${personality}. Respond accordingly.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            response: { type: Type.STRING },
            moraleEffect: { type: Type.INTEGER },
            promiseRequest: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['playing_time'] },
                    description: { type: Type.STRING },
                },
                nullable: true,
            },
        },
        required: ["response", "moraleEffect"],
    };

    return generateJson(prompt, schema, systemInstruction);
};


export const getOppositionAnalysis = async (opponentName: string, formation: string, keyPlayers: string, personality: AIPersonality, scoutRating: number): Promise<AIOppositionReport> => {
    if (!aiInstance) {return getOfflineResponse('Opposition Scouting') as AIOppositionReport;}
    const prompt = await loadAndFormatPrompt('opposition_analysis.md', {
        '{{OPPONENT_NAME}}': opponentName,
        '{{OPPONENT_FORMATION}}': formation,
        '{{KEY_PLAYERS}}': keyPlayers,
        '{{SCOUT_RATING}}': scoutRating.toString(),
    });
    const systemInstruction = await getSystemInstruction(personality);
    const schema = {
        type: Type.OBJECT, properties: {
            keyPlayers: { type: Type.STRING },
            tacticalApproach: { type: Type.STRING },
            weaknesses: { type: Type.STRING },
        }, required: ["keyPlayers", "tacticalApproach", "weaknesses"],
    };
    return generateJson(prompt, schema, systemInstruction);
};

export const getAISubstitutionSuggestion = async (onFieldPlayers: Player[], benchedPlayers: Player[], personality: AIPersonality): Promise<AISubstitutionSuggestion> => {
    if (!aiInstance) {return { playerInId: '', playerOutId: '', reasoning: 'AI is offline.' };}
    const prompt = await loadAndFormatPrompt('substitution_suggestion.md', {
        '{{ON_FIELD_ROSTER}}': onFieldPlayers.map(formatPlayerForPrompt).join('\n'),
        '{{BENCHED_ROSTER}}': benchedPlayers.map(formatPlayerForPrompt).join('\n'),
    });
    const systemInstruction = await getSystemInstruction(personality);
    const schema = {
        type: Type.OBJECT, properties: {
            playerOutId: { type: Type.STRING },
            playerInId: { type: Type.STRING },
            reasoning: { type: Type.STRING },
        }, required: ["playerOutId", "playerInId", "reasoning"],
    };
    return generateJson(prompt, schema, systemInstruction);
};

export const getPostMatchAnalysis = async (result: MatchResult, homeTeamName: string, awayTeamName: string, personality: AIPersonality): Promise<AIPostMatchAnalysis> => {
    if (!aiInstance) {return getOfflineResponse('Post-Match Analysis') as AIPostMatchAnalysis;}
    const prompt = await loadAndFormatPrompt('post_match_analysis.md', {
        '{{HOME_TEAM_NAME}}': homeTeamName,
        '{{AWAY_TEAM_NAME}}': awayTeamName,
        '{{FINAL_SCORE}}': `${result.homeScore} - ${result.awayScore}`,
        '{{EVENT_LOG}}': result.events.map(e => `Minute ${e.minute}: [${e.team}] ${e.type} - ${e.playerName} - ${e.description}`).join('\n'),
    });
    const systemInstruction = await getSystemInstruction(personality);
    const schema = {
        type: Type.OBJECT, properties: {
            summary: { type: Type.STRING },
            keyMoment: { type: Type.STRING },
            advice: { type: Type.STRING },
        }, required: ["summary", "keyMoment", "advice"],
    };
    return generateJson(prompt, schema, systemInstruction);
};

export const getAgentNegotiationResponse = async (playerName: string, playerValue: number, agentPersonality: string, userOffer: string, conversationHistory: string): Promise<AIAgentResponse> => {
    if (!aiInstance) {return getOfflineResponse('Agent Negotiation') as AIAgentResponse;}
    const prompt = await loadAndFormatPrompt('agent_negotiation.md', {
        '{{PLAYER_NAME}}': playerName,
        '{{PLAYER_VALUE}}': playerValue.toString(),
        '{{AGENT_PERSONALITY}}': agentPersonality,
        '{{CONVERSATION_HISTORY}}': conversationHistory,
        '{{USER_OFFER}}': userOffer,
    });
    const systemInstruction = "You are a player agent in a contract negotiation.";
    const schema = {
        type: Type.OBJECT, properties: {
            response: { type: Type.STRING },
            isDealAccepted: { type: Type.BOOLEAN },
        }, required: ["response", "isDealAccepted"],
    };
    return generateJson(prompt, schema, systemInstruction);
};

export const getPressConferenceQuestions = async (personality: AIPersonality, narratives: PressNarrative[]): Promise<AIPressConferenceResponse> => {
    if (!aiInstance) {return getOfflineResponse('Press Conference') as AIPressConferenceResponse;}

    const narrativeText = narratives.length > 0
        ? narratives.map(n => `- ID: ${n.id}, Tone: (${n.tone.toUpperCase()}) ${n.title}: ${n.content}`).join('\n')
        : 'No specific narratives are currently surrounding the club.';

    const prompt = await loadAndFormatPrompt('press_conference.md', {
        '{{AI_PERSONALITY}}': personality,
        '{{MEDIA_NARRATIVES}}': narrativeText,
    });

    const systemInstruction = "You are a sports journalist asking a question in a press conference. Base your question on one of the provided media narratives.";
    const schema = {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        outcome: { type: Type.STRING },
                        fanConfidenceEffect: { type: Type.NUMBER },
                        teamMoraleEffect: { type: Type.NUMBER },
                    },
                    required: ["text", "outcome", "fanConfidenceEffect", "teamMoraleEffect"],
                },
            },
            narrativeId: { type: Type.STRING, nullable: true },
        },
        required: ["question", "options"],
    };
    return generateJson(prompt, schema, systemInstruction);
};

export const getPlayerScoutingReport = async (player: TransferPlayer, formation: Formation, tactics: TeamTactics, personality: AIPersonality): Promise<AIScoutReport> => {
    if (!aiInstance) {throw new Error("AI is offline.");}

    const prompt = await loadAndFormatPrompt('scout_report.md', {
        '{{PLAYER_DATA}}': formatPlayerForPrompt(player),
        '{{TEAM_FORMATION}}': formation.name,
        '{{TEAM_TACTICS}}': formatTacticsForPrompt(tactics),
    });

    const systemInstruction = "You are a professional soccer scout providing a detailed player report.";
    const schema = {
        type: Type.OBJECT,
        properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            potentialFit: { type: Type.STRING },
            estimatedValue: { type: Type.NUMBER },
        },
        required: ["strengths", "weaknesses", "summary", "potentialFit", "estimatedValue"],
    };

    return generateJson(prompt, schema, systemInstruction);
};

export const generatePressNarratives = async (
  managerName: string,
  lastMatchResult: MatchResult | null,
  upcomingOpponent: string,
  leaguePosition: number,
  topScorer: { name: string; goals: number } | null,
  playerInPoorForm: Player | null,
): Promise<PressNarrative[]> => {
  if (!aiInstance) {return [];}

  const prompt = await loadAndFormatPrompt('media_narrative_generation.md', {
    '{{MANAGER_NAME}}': managerName,
    '{{LAST_MATCH_RESULT}}': lastMatchResult ? `A ${lastMatchResult.homeScore}-${lastMatchResult.awayScore} result.` : 'No recent match.',
    '{{UPCOMING_OPPONENT}}': upcomingOpponent,
    '{{LEAGUE_POSITION}}': leaguePosition.toString(),
    '{{TOP_SCORER_INFO}}': topScorer ? `${topScorer.name} with ${topScorer.goals} goals.` : 'N/A',
    '{{PLAYER_IN_POOR_FORM_INFO}}': playerInPoorForm ? `${playerInPoorForm.name} (Form: ${playerInPoorForm.form})` : 'N/A',
    '{{TRANSFER_RUMORS}}': 'The transfer window is approaching, speculation is mounting about potential signings.',
  });

  const systemInstruction = "You are an AI that generates a realistic set of media narratives for a soccer club based on a weekly summary.";
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        tone: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] },
      },
      required: ['title', 'content', 'tone'],
    },
  };

  const generatedNarratives = await generateJson(prompt, schema, systemInstruction);

  // Add unique IDs to the narratives
  return generatedNarratives.map((narrative: unknown) => ({
    ...narrative,
    id: `narrative_${Date.now()}_${Math.random()}`,
  }));
};

export const generateSocialMediaReactions = async (
  matchResult: MatchResult,
  homeTeam: string,
  awayTeam: string,
  keyPlayers: Player[],
): Promise<string[]> => {
  if (!aiInstance) {return ['AI is offline - cannot generate social media reactions'];}

  const prompt = await loadAndFormatPrompt('social_media_reaction.md', {
    '{{HOME_TEAM}}': homeTeam,
    '{{AWAY_TEAM}}': awayTeam,
    '{{FINAL_SCORE}}': `${matchResult.homeScore}-${matchResult.awayScore}`,
    '{{KEY_EVENTS}}': matchResult.events.slice(0, 3).map(e => `${e.minute}': ${e.playerName} ${e.type}`).join(', '),
    '{{KEY_PLAYERS}}': keyPlayers.map(p => p.name).join(', '),
  });

  const systemInstruction = "Generate realistic social media reactions from fans about a soccer match. Make them varied in tone and emotion.";
  const schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
  };

  return generateJson(prompt, schema, systemInstruction);
};

export const generateInjuryReport = async (
  player: Player,
  injuryType: 'Minor Injury' | 'Major Injury',
): Promise<{
  description: string;
  estimatedRecovery: string;
  treatmentPlan: string[];
}> => {
  if (!aiInstance) {return {
    description: 'AI is offline - cannot generate injury report',
    estimatedRecovery: 'Unknown',
    treatmentPlan: ['Rest'],
  };}

  const prompt = `Generate a realistic injury report for soccer player ${player.name} (${player.roleId}) who has sustained a ${injuryType}. 
  Consider the player's traits: ${player.traits.join(', ') || 'None'}.
  The player is ${player.age} years old.`;

  const systemInstruction = "You are a sports medicine doctor providing a professional injury assessment.";
  const schema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING },
      estimatedRecovery: { type: Type.STRING },
      treatmentPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['description', 'estimatedRecovery', 'treatmentPlan'],
  };

  return generateJson(prompt, schema, systemInstruction);
};

export const generateSeasonReview = async (
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
}> => {
  if (!aiInstance) {return {
    overallAssessment: 'AI is offline',
    keyAchievements: ['Season completed'],
    areasForImprovement: ['Enable AI features'],
    nextSeasonGoals: ['Try again next season'],
  };}

  const prompt = `Provide a comprehensive season review:
  - Final League Position: ${finalPosition} out of ${totalTeams}
  - Top Scorer: ${topScorer.name} with ${topScorer.goals} goals
  - Season Highlights: ${seasonHighlights.join(', ')}
  
  Analyze the season's performance and provide insights for improvement.`;

  const systemInstruction = await getSystemInstruction(personality);
  const schema = {
    type: Type.OBJECT,
    properties: {
      overallAssessment: { type: Type.STRING },
      keyAchievements: { type: Type.ARRAY, items: { type: Type.STRING } },
      areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
      nextSeasonGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['overallAssessment', 'keyAchievements', 'areasForImprovement', 'nextSeasonGoals'],
  };

  return generateJson(prompt, schema, systemInstruction);
};

export const analyzePlayerCompatibility = async (
  player1: Player,
  player2: Player,
  relationshipType: 'potential_signing' | 'formation_pairing' | 'mentorship',
  personality: AIPersonality,
): Promise<{
  compatibilityScore: number;
  reasoning: string;
  recommendations: string[];
}> => {
  if (!aiInstance) {return {
    compatibilityScore: 50,
    reasoning: 'AI is offline',
    recommendations: ['Enable AI features for detailed analysis'],
  };}

  const prompt = `Analyze the compatibility between these two players for ${relationshipType}:
  
  Player 1: ${formatPlayerForPrompt(player1)}
  Player 2: ${formatPlayerForPrompt(player2)}
  
  Consider their attributes, traits, ages, and how they would work together.`;

  const systemInstruction = await getSystemInstruction(personality);
  const schema = {
    type: Type.OBJECT,
    properties: {
      compatibilityScore: { type: Type.INTEGER, minimum: 0, maximum: 100 },
      reasoning: { type: Type.STRING },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['compatibilityScore', 'reasoning', 'recommendations'],
  };

  return generateJson(prompt, schema, systemInstruction);
};

export const aiService = {
  // Tactical Analysis
  getTacticalAdvice,
  getAIFormationSuggestion,
  getAISubstitutionSuggestion,

  // Player Analysis
  getAIPlayerComparison,
  getAIDevelopmentSummary,
  generatePlayerBio,
  getPlayerScoutingReport,
  analyzePlayerCompatibility,

  // Match Analysis
  getPostMatchAnalysis,
  getOppositionAnalysis,
  generateSocialMediaReactions,
  generateSeasonReview,

  // Communication
  getAIChatResponse,
  getAIPlayerConversationResponse,
  getTeamTalkOptions,
  getPressConferenceQuestions,
  getAgentNegotiationResponse,

  // Narrative Generation
  generatePressNarratives,
  generateInjuryReport,

  // Utility
  isAIAvailable: () => aiInstance !== null,
};