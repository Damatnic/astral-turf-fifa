import {
  LeagueTableEntry,
  LeagueTeam,
  Fixture,
  Season,
  HistoricalSeasonRecord,
  SeasonAwards,
  Player,
  MatchResult,
} from '../types';

export const createLeagueTable = (teams: LeagueTeam[]): Record<string, LeagueTableEntry> => {
  const table: Record<string, LeagueTableEntry> = {};

  teams.forEach(team => {
    table[team.name] = {
      teamName: team.name,
      isUserTeam: team.isUser,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  return table;
};

export const getSortedLeagueTable = (leagueTable: Record<string, LeagueTableEntry>): LeagueTableEntry[] => {
  return Object.values(leagueTable).sort((a, b) => {
    // Sort by points first
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // Then by goal difference
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    // Then by goals scored
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    // Finally by alphabetical order
    return a.teamName.localeCompare(b.teamName);
  });
};

export const getCurrentPosition = (leagueTable: Record<string, LeagueTableEntry>, teamName?: string): number => {
  const userTeam = teamName || Object.values(leagueTable).find(entry => entry.isUserTeam);
  if (!userTeam) {return -1;}

  const sortedTable = getSortedLeagueTable(leagueTable);
  const teamNameToFind = typeof userTeam === 'string' ? userTeam : userTeam.teamName;

  return sortedTable.findIndex(entry => entry.teamName === teamNameToFind) + 1;
};

export const getNextFixture = (
  fixtures: Fixture[],
  currentWeek: number,
  teamName?: string,
): Fixture | null => {
  const upcomingFixtures = fixtures.filter(fixture => fixture.week >= currentWeek);

  if (teamName) {
    return upcomingFixtures.find(
      fixture => fixture.homeTeam === teamName || fixture.awayTeam === teamName,
    ) || null;
  }

  return upcomingFixtures[0] || null;
};

export const getTeamForm = (
  fixtures: Fixture[],
  matchHistory: MatchResult[],
  teamName: string,
  games: number = 5,
): ('W' | 'D' | 'L')[] => {
  const recentFixtures = fixtures
    .filter(fixture =>
      (fixture.homeTeam === teamName || fixture.awayTeam === teamName) &&
      fixture.week < new Date().getTime(), // Assuming played fixtures
    )
    .slice(-games);

  const form: ('W' | 'D' | 'L')[] = [];

  recentFixtures.forEach(fixture => {
    // This is simplified - you'd need to match fixtures with actual results
    // For now, generating random form
    const isHome = fixture.homeTeam === teamName;
    const randomResult = Math.random();

    if (randomResult < 0.4) {
      form.push('W');
    } else if (randomResult < 0.7) {
      form.push('D');
    } else {
      form.push('L');
    }
  });

  return form;
};

export const calculateLeagueStats = (leagueTable: Record<string, LeagueTableEntry>) => {
  const entries = Object.values(leagueTable);

  const totalMatches = entries.reduce((sum, entry) => sum + entry.played, 0);
  const totalGoals = entries.reduce((sum, entry) => sum + entry.goalsFor, 0);
  const averageGoalsPerGame = totalMatches > 0 ? totalGoals / totalMatches : 0;

  // Find top scorer (this would need to be tracked separately in real implementation)
  const topScoringTeam = entries.reduce((top, entry) =>
    entry.goalsFor > top.goalsFor ? entry : top, entries[0] || { goalsFor: 0 },
  );

  // Best defense
  const bestDefense = entries.reduce((best, entry) =>
    entry.goalsAgainst < best.goalsAgainst ? entry : best, entries[0] || { goalsAgainst: 999 },
  );

  return {
    totalMatches: totalMatches / 2, // Divide by 2 because each match involves 2 teams
    totalGoals,
    averageGoalsPerGame,
    topScoringTeam: topScoringTeam.teamName,
    bestDefense: bestDefense.teamName,
  };
};

export const generateSeasonAwards = (
  leagueTable: Record<string, LeagueTableEntry>,
  allPlayers: Player[],
): SeasonAwards => {
  const sortedTable = getSortedLeagueTable(leagueTable);
  const champion = sortedTable[0]?.teamName || 'Unknown';
  const userPosition = getCurrentPosition(leagueTable);

  // Find best players (simplified - would need season stats)
  const playersByGoals = allPlayers
    .filter(p => p.stats.goals > 0)
    .sort((a, b) => b.stats.goals - a.stats.goals);

  const youngPlayers = allPlayers
    .filter(p => p.age <= 23 && p.stats.matchesPlayed > 10)
    .sort((a, b) => b.stats.goals - a.stats.goals);

  const topScorer = playersByGoals[0] || allPlayers[0];
  const youngPlayer = youngPlayers[0] || allPlayers.find(p => p.age <= 23) || allPlayers[0];
  const playerOfSeason = playersByGoals[0] || allPlayers[0];

  // Create team of the season (4-4-2 formation)
  const teamOfSeason: (string | null)[] = new Array(11).fill(null);
  const bestPlayersByPosition = {
    GK: allPlayers.filter(p => p.roleId === 'gk').sort((a, b) => b.stats.saves - a.stats.saves)[0],
    DF: allPlayers.filter(p => ['cb', 'fb'].includes(p.roleId)).sort((a, b) => b.stats.tacklesWon - a.stats.tacklesWon).slice(0, 4),
    MF: allPlayers.filter(p => ['dm', 'cm', 'wm', 'am'].includes(p.roleId)).sort((a, b) => b.stats.assists - a.stats.assists).slice(0, 4),
    FW: allPlayers.filter(p => ['w', 'st'].includes(p.roleId)).sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 2),
  };

  let index = 0;
  if (bestPlayersByPosition.GK) {teamOfSeason[index++] = bestPlayersByPosition.GK.id;}
  bestPlayersByPosition.DF.forEach(player => {
    if (player && index < 5) {teamOfSeason[index++] = player.id;}
  });
  bestPlayersByPosition.MF.forEach(player => {
    if (player && index < 9) {teamOfSeason[index++] = player.id;}
  });
  bestPlayersByPosition.FW.forEach(player => {
    if (player && index < 11) {teamOfSeason[index++] = player.id;}
  });

  return {
    champion,
    userPosition,
    playerOfTheSeason: { id: playerOfSeason.id, name: playerOfSeason.name },
    youngPlayerOfTheSeason: { id: youngPlayer.id, name: youngPlayer.name },
    topScorer: { id: topScorer.id, name: topScorer.name, goals: topScorer.stats.goals },
    teamOfTheSeason,
  };
};

export const predictLeagueTable = (
  currentTable: Record<string, LeagueTableEntry>,
  fixtures: Fixture[],
  currentWeek: number,
  teamStrengths: Record<string, number>,
): Record<string, LeagueTableEntry> => {
  const predictedTable = JSON.parse(JSON.stringify(currentTable));

  const remainingFixtures = fixtures.filter(fixture => fixture.week >= currentWeek);

  remainingFixtures.forEach(fixture => {
    const homeStrength = teamStrengths[fixture.homeTeam] || 50;
    const awayStrength = teamStrengths[fixture.awayTeam] || 50;

    // Simple prediction based on strength difference
    const strengthDiff = homeStrength - awayStrength + 5; // Home advantage

    let homePoints = 0;
    let awayPoints = 0;
    let homeGoals = 0;
    let awayGoals = 0;

    if (strengthDiff > 15) {
      // Strong home win
      homePoints = 3;
      homeGoals = 2;
      awayGoals = 0;
    } else if (strengthDiff > 5) {
      // Home win
      homePoints = 3;
      homeGoals = 2;
      awayGoals = 1;
    } else if (strengthDiff > -5) {
      // Draw
      homePoints = 1;
      awayPoints = 1;
      homeGoals = 1;
      awayGoals = 1;
    } else if (strengthDiff > -15) {
      // Away win
      awayPoints = 3;
      homeGoals = 1;
      awayGoals = 2;
    } else {
      // Strong away win
      awayPoints = 3;
      homeGoals = 0;
      awayGoals = 2;
    }

    // Update predicted table
    const homeEntry = predictedTable[fixture.homeTeam];
    const awayEntry = predictedTable[fixture.awayTeam];

    if (homeEntry && awayEntry) {
      homeEntry.played++;
      awayEntry.played++;
      homeEntry.points += homePoints;
      awayEntry.points += awayPoints;
      homeEntry.goalsFor += homeGoals;
      awayEntry.goalsFor += awayGoals;
      homeEntry.goalsAgainst += awayGoals;
      awayEntry.goalsAgainst += homeGoals;
      homeEntry.goalDifference = homeEntry.goalsFor - homeEntry.goalsAgainst;
      awayEntry.goalDifference = awayEntry.goalsFor - awayEntry.goalsAgainst;

      if (homePoints === 3) {
        homeEntry.won++;
        awayEntry.lost++;
      } else if (awayPoints === 3) {
        awayEntry.won++;
        homeEntry.lost++;
      } else {
        homeEntry.drawn++;
        awayEntry.drawn++;
      }
    }
  });

  return predictedTable;
};

export const getChampionsLeagueSpots = (
  leagueTable: Record<string, LeagueTableEntry>,
  spots: number = 4,
): string[] => {
  const sortedTable = getSortedLeagueTable(leagueTable);
  return sortedTable.slice(0, spots).map(entry => entry.teamName);
};

export const getRelegationZone = (
  leagueTable: Record<string, LeagueTableEntry>,
  spots: number = 3,
): string[] => {
  const sortedTable = getSortedLeagueTable(leagueTable);
  return sortedTable.slice(-spots).map(entry => entry.teamName);
};

export const generateRivalMatches = (
  fixtures: Fixture[],
  rivalries: Record<string, string[]>,
): Fixture[] => {
  return fixtures.filter(fixture => {
    const homeRivals = rivalries[fixture.homeTeam] || [];
    const awayRivals = rivalries[fixture.awayTeam] || [];

    return homeRivals.includes(fixture.awayTeam) || awayRivals.includes(fixture.homeTeam);
  });
};

export const calculatePointsNeededForSafety = (
  leagueTable: Record<string, LeagueTableEntry>,
  teamName: string,
  safetyMargin: number = 10,
): number => {
  const sortedTable = getSortedLeagueTable(leagueTable);
  const totalTeams = sortedTable.length;
  const relegationZoneStart = totalTeams - 3; // Assuming 3 teams get relegated

  const team = leagueTable[teamName];
  if (!team) {return 0;}

  // Estimate points needed for safety (typically around 40 points in most leagues)
  const estimatedSafetyPoints = 40;
  const currentPoints = team.points;

  return Math.max(0, estimatedSafetyPoints + safetyMargin - currentPoints);
};

export const leagueService = {
  createLeagueTable,
  getSortedLeagueTable,
  getCurrentPosition,
  getNextFixture,
  getTeamForm,
  calculateLeagueStats,
  generateSeasonAwards,
  predictLeagueTable,
  getChampionsLeagueSpots,
  getRelegationZone,
  generateRivalMatches,
  calculatePointsNeededForSafety,
};