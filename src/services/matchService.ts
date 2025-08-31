import {
  MatchResult,
  MatchEvent,
  MatchCommentary,
  Player,
  TeamTactics,
  Fixture,
  LeagueTableEntry,
  Season,
  AIOppositionReport,
  AIPostMatchAnalysis,
  PlayerStats,
} from '../types';
import { simulationService } from './simulationService';

export const generateFixtures = (teams: string[]): Fixture[] => {
  const fixtures: Fixture[] = [];
  const totalTeams = teams.length;
  const roundsNeeded = totalTeams % 2 === 0 ? totalTeams - 1 : totalTeams;

  // Create a round-robin tournament
  for (let week = 1; week <= roundsNeeded; week++) {
    const weekFixtures = generateWeekFixtures(teams, week);
    fixtures.push(...weekFixtures);
  }

  // Second half of season (return fixtures)
  const firstHalfEnd = roundsNeeded;
  fixtures.forEach((fixture, index) => {
    if (fixture.week <= firstHalfEnd) {
      fixtures.push({
        week: fixture.week + firstHalfEnd,
        homeTeam: fixture.awayTeam,
        awayTeam: fixture.homeTeam,
      });
    }
  });

  return fixtures.sort((a, b) => a.week - b.week);
};

const generateWeekFixtures = (teams: string[], week: number): Fixture[] => {
  const fixtures: Fixture[] = [];
  const totalTeams = teams.length;

  if (totalTeams % 2 !== 0) {
    teams = [...teams, 'BYE']; // Add bye for odd number of teams
  }

  const half = teams.length / 2;
  const round = (week - 1) % (teams.length - 1);

  // Rotate teams except the first one
  const rotatedTeams = [teams[0]];
  for (let i = 1; i < teams.length; i++) {
    const newIndex = ((i - 1 + round) % (teams.length - 1)) + 1;
    rotatedTeams.push(teams[newIndex]);
  }

  // Pair teams
  for (let i = 0; i < half; i++) {
    const homeTeam = rotatedTeams[i];
    const awayTeam = rotatedTeams[teams.length - 1 - i];

    if (homeTeam !== 'BYE' && awayTeam !== 'BYE') {
      fixtures.push({
        week,
        homeTeam,
        awayTeam,
      });
    }
  }

  return fixtures;
};

export const updateLeagueTable = (
  leagueTable: Record<string, LeagueTableEntry>,
  result: MatchResult,
  homeTeam: string,
  awayTeam: string,
): Record<string, LeagueTableEntry> => {
  const updatedTable = { ...leagueTable };

  const homeEntry = { ...updatedTable[homeTeam] };
  const awayEntry = { ...updatedTable[awayTeam] };

  // Update match statistics
  homeEntry.played++;
  awayEntry.played++;
  homeEntry.goalsFor += result.homeScore;
  awayEntry.goalsFor += result.awayScore;
  homeEntry.goalsAgainst += result.awayScore;
  awayEntry.goalsAgainst += result.homeScore;
  homeEntry.goalDifference = homeEntry.goalsFor - homeEntry.goalsAgainst;
  awayEntry.goalDifference = awayEntry.goalsFor - awayEntry.goalsAgainst;

  // Update points and results
  if (result.homeScore > result.awayScore) {
    // Home win
    homeEntry.won++;
    awayEntry.lost++;
    homeEntry.points += 3;
  } else if (result.awayScore > result.homeScore) {
    // Away win
    awayEntry.won++;
    homeEntry.lost++;
    awayEntry.points += 3;
  } else {
    // Draw
    homeEntry.drawn++;
    awayEntry.drawn++;
    homeEntry.points++;
    awayEntry.points++;
  }

  updatedTable[homeTeam] = homeEntry;
  updatedTable[awayTeam] = awayEntry;

  return updatedTable;
};

export const generateMatchCommentary = (
  events: MatchEvent[],
  homeTeam: string = 'Home',
  awayTeam: string = 'Away',
): MatchCommentary[] => {
  const commentary: MatchCommentary[] = [];

  // Opening commentary
  commentary.push({
    minute: 0,
    text: `Welcome to today's match between ${homeTeam} and ${awayTeam}! The teams are taking the field now.`,
  });

  // Add commentary for key events
  events.forEach(event => {
    let text = '';
    const teamName = event.team === 'home' ? homeTeam : awayTeam;

    switch (event.type) {
      case 'Goal':
        if (event.assisterName) {
          text = `${event.minute}' - GOAL! ${event.playerName} finds the back of the net with an assist from ${event.assisterName}! ${teamName} take the lead!`;
        } else {
          text = `${event.minute}' - GOAL! What a strike from ${event.playerName}! A brilliant individual effort puts ${teamName} ahead!`;
        }
        break;
      case 'Yellow Card':
        text = `${event.minute}' - Yellow card for ${event.playerName} from ${teamName}. The referee has had a word.`;
        break;
      case 'Red Card':
        text = `${event.minute}' - RED CARD! ${event.playerName} is sent off! ${teamName} will have to continue with 10 men!`;
        break;
      case 'Injury':
        text = `${event.minute}' - ${event.playerName} is down injured. The medical team is attending to the ${teamName} player.`;
        break;
    }

    if (text) {
      commentary.push({ minute: event.minute, text });
    }
  });

  // Half-time and full-time commentary
  commentary.push({
    minute: 45,
    text: "That's the end of the first half. Both teams head to the dressing rooms.",
  });

  commentary.push({
    minute: 90,
    text: "Full time! An exciting match comes to an end.",
  });

  return commentary.sort((a, b) => a.minute - b.minute);
};

export const calculateMatchRating = (
  player: Player,
  events: MatchEvent[],
  result: MatchResult,
): number => {
  let rating = 6.0; // Base rating

  const playerEvents = events.filter(e => e.playerName === player.name);
  const playerStats = result.playerStats[player.id];

  // Goals and assists
  if (playerStats?.goals) {
    rating += playerStats.goals * 1.0;
  }
  if (playerStats?.assists) {
    rating += playerStats.assists * 0.7;
  }

  // Cards negatively impact rating
  const yellowCards = playerEvents.filter(e => e.type === 'Yellow Card').length;
  const redCards = playerEvents.filter(e => e.type === 'Red Card').length;
  rating -= yellowCards * 0.3 + redCards * 2.0;

  // Position-specific adjustments
  const role = player.roleId;
  if (role === 'gk') {
    // Goalkeepers rated on clean sheets and saves
    const goalsConceded = player.team === 'home' ? result.awayScore : result.homeScore;
    if (goalsConceded === 0) {
      rating += 1.0; // Clean sheet bonus
    }
    if (playerStats?.saves && playerStats.saves > 3) {
      rating += (playerStats.saves - 3) * 0.2;
    }
  }

  // Team performance affects individual ratings
  const teamWon = (player.team === 'home' && result.homeScore > result.awayScore) ||
                  (player.team === 'away' && result.awayScore > result.homeScore);
  const teamLost = (player.team === 'home' && result.homeScore < result.awayScore) ||
                   (player.team === 'away' && result.awayScore < result.homeScore);

  if (teamWon) {
    rating += 0.5;
  } else if (teamLost) {
    rating -= 0.3;
  }

  // Apply form and morale modifiers
  const formMultipliers = { 'Excellent': 1.1, 'Good': 1.05, 'Average': 1.0, 'Poor': 0.95, 'Very Poor': 0.9 };
  const moraleMultipliers = { 'Excellent': 1.1, 'Good': 1.05, 'Okay': 1.0, 'Poor': 0.95, 'Very Poor': 0.9 };

  rating *= formMultipliers[player.form] * moraleMultipliers[player.morale];

  // Cap rating between 1.0 and 10.0
  return Math.max(1.0, Math.min(10.0, Math.round(rating * 10) / 10));
};

export const generateMatchReport = (
  result: MatchResult,
  homeTeam: string,
  awayTeam: string,
  homePlayers: Player[],
  awayPlayers: Player[],
): {
  summary: string;
  keyMoments: string[];
  playerRatings: Record<string, number>;
  motm: string;
} => {
  const homeScore = result.homeScore;
  const awayScore = result.awayScore;

  let summary = '';
  if (homeScore > awayScore) {
    summary = `${homeTeam} secured a ${homeScore}-${awayScore} victory over ${awayTeam} in an entertaining match.`;
  } else if (awayScore > homeScore) {
    summary = `${awayTeam} came away with a ${awayScore}-${homeScore} win against ${homeTeam}.`;
  } else {
    summary = `${homeTeam} and ${awayTeam} played out a ${homeScore}-${awayScore} draw.`;
  }

  const keyMoments: string[] = [];
  const goals = result.events.filter(e => e.type === 'Goal');
  goals.forEach(goal => {
    const teamName = goal.team === 'home' ? homeTeam : awayTeam;
    if (goal.assisterName) {
      keyMoments.push(`${goal.minute}' - ${goal.playerName} scores for ${teamName}, assisted by ${goal.assisterName}`);
    } else {
      keyMoments.push(`${goal.minute}' - ${goal.playerName} scores for ${teamName}`);
    }
  });

  const cards = result.events.filter(e => e.type === 'Yellow Card' || e.type === 'Red Card');
  cards.forEach(card => {
    const teamName = card.team === 'home' ? homeTeam : awayTeam;
    keyMoments.push(`${card.minute}' - ${card.type} for ${card.playerName} (${teamName})`);
  });

  // Calculate player ratings
  const playerRatings: Record<string, number> = {};
  [...homePlayers, ...awayPlayers].forEach(player => {
    playerRatings[player.id] = calculateMatchRating(player, result.events, result);
  });

  // Find man of the match (highest rating among players with significant contribution)
  let motmId = '';
  let highestRating = 0;
  Object.entries(playerRatings).forEach(([playerId, rating]) => {
    const player = [...homePlayers, ...awayPlayers].find(p => p.id === playerId);
    if (player && rating > highestRating) {
      highestRating = rating;
      motmId = playerId;
    }
  });

  const motm = [...homePlayers, ...awayPlayers].find(p => p.id === motmId)?.name || 'Unknown';

  return {
    summary,
    keyMoments,
    playerRatings,
    motm,
  };
};

export const simulateAIMatch = (
  homeTeam: string,
  awayTeam: string,
  homeStrength: number,
  awayStrength: number,
): MatchResult => {
  const strengthDiff = homeStrength - awayStrength;
  const homeAdvantage = 5; // Small home advantage
  const adjustedHomeDiff = strengthDiff + homeAdvantage;

  // Calculate basic score probabilities
  let homeGoalExpectancy = 1.5 + (adjustedHomeDiff / 50);
  let awayGoalExpectancy = 1.5 - (adjustedHomeDiff / 50);

  // Ensure minimum goal expectancy
  homeGoalExpectancy = Math.max(0.3, homeGoalExpectancy);
  awayGoalExpectancy = Math.max(0.3, awayGoalExpectancy);

  // Generate scores using Poisson distribution approximation
  const homeScore = Math.max(0, Math.round(homeGoalExpectancy + (Math.random() - 0.5) * 2));
  const awayScore = Math.max(0, Math.round(awayGoalExpectancy + (Math.random() - 0.5) * 2));

  // Generate basic events
  const events: MatchEvent[] = [];
  const totalGoals = homeScore + awayScore;

  for (let i = 0; i < totalGoals; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const scoringTeam = i < homeScore ? 'home' : 'away';
    const playerName = `Player ${Math.floor(Math.random() * 11) + 1}`;

    events.push({
      minute,
      type: 'Goal',
      team: scoringTeam,
      playerName,
      description: 'scored a goal.',
    });
  }

  // Sort events by minute
  events.sort((a, b) => a.minute - b.minute);

  const commentary = generateMatchCommentary(events, homeTeam, awayTeam);

  return {
    homeScore,
    awayScore,
    events,
    commentaryLog: commentary,
    isRivalry: false,
    playerStats: {},
  };
};

export const getUpcomingFixtures = (
  fixtures: Fixture[],
  currentWeek: number,
  teamName?: string,
  count: number = 5,
): Fixture[] => {
  let upcomingFixtures = fixtures.filter(fixture => fixture.week >= currentWeek);

  if (teamName) {
    upcomingFixtures = upcomingFixtures.filter(
      fixture => fixture.homeTeam === teamName || fixture.awayTeam === teamName,
    );
  }

  return upcomingFixtures.slice(0, count);
};

export const getRecentResults = (
  fixtures: Fixture[],
  matchHistory: MatchResult[],
  currentWeek: number,
  teamName?: string,
  count: number = 5,
): Array<Fixture & { result?: MatchResult }> => {
  let recentFixtures = fixtures.filter(fixture => fixture.week < currentWeek);

  if (teamName) {
    recentFixtures = recentFixtures.filter(
      fixture => fixture.homeTeam === teamName || fixture.awayTeam === teamName,
    );
  }

  const fixturesWithResults = recentFixtures
    .slice(-count)
    .map(fixture => {
      const result = matchHistory.find(
        match => match &&
        // You might need to add additional matching logic here
        // This is a simplified version
        true,
      );
      return { ...fixture, result };
    });

  return fixturesWithResults;
};

export const matchService = {
  generateFixtures,
  updateLeagueTable,
  generateMatchCommentary,
  calculateMatchRating,
  generateMatchReport,
  simulateAIMatch,
  getUpcomingFixtures,
  getRecentResults,
};