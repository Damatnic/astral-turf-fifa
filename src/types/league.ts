// League, season, and competition related types

export interface LeagueTeam {
  name: string;
  isUser: boolean;
  strength: number; // 1-100 overall rating
}

export interface LeagueTableEntry {
  teamName: string;
  isUserTeam: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Fixture {
  id?: string;
  week: number;
  homeTeam: string;
  awayTeam: string;
  competition?: string;
  date?: string;
}

export interface Season {
  year: number;
  leagueTeams: readonly LeagueTeam[];
  leagueTable: Record<string, LeagueTableEntry>;
  fixtures: readonly Fixture[];
}

export interface HistoricalSeasonRecord {
  season: number;
  champions: string;
  userPosition: number;
  topScorer: { name: string; goals: number } | null;
}

export interface SeasonAwards {
  champion: string;
  userPosition: number;
  playerOfTheSeason: { id: string; name: string };
  youngPlayerOfTheSeason: { id: string; name: string };
  topScorer: { id: string; name: string; goals: number };
  teamOfTheSeason: (string | null)[]; // Array of player IDs for a 4-4-2
}

// Board and management
export interface BoardObjective {
  id: string;
  description: string;
  isMet: boolean;
  isCritical: boolean;
}

export interface Manager {
  name: string;
  reputation: number; // 1-100
  trophyCabinet: readonly string[];
}

// Opposition scouting
export interface ScoutingAssignment {
  opponentName: string;
  dueWeek: number;
  report: unknown | null; // AIOppositionReport when AI types are imported
}

// Press and media
export interface PressNarrative {
  id: string;
  title: string;
  content: string;
  tone: 'positive' | 'negative' | 'neutral';
  weekGenerated: number;
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'transfer' | 'injury' | 'result' | 'rumor' | 'social_media';
}
