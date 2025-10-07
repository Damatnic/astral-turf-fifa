import type {
  Player,
  TeamTactics,
  MatchEvent,
  Team,
  PlayerRole,
  PositionRole,
  PlayerStats,
  RootState,
  MentoringGroup,
  MatchCommentary,
  MatchResult,
} from '../types';
import { PLAYER_ROLES } from '../constants';
import { calculateChemistryScore } from './chemistryService';

const TACTIC_MODIFIERS = {
  mentality: {
    'very-defensive': { goalChance: 0.7, defensiveAction: 1.3 },
    defensive: { goalChance: 0.85, defensiveAction: 1.15 },
    balanced: { goalChance: 1.0, defensiveAction: 1.0 },
    attacking: { goalChance: 1.15, defensiveAction: 0.85 },
    'very-attacking': { goalChance: 1.3, defensiveAction: 0.7 },
  },
  pressing: {
    low: { foulChance: 0.8, possessionGain: 0.9 },
    medium: { foulChance: 1.0, possessionGain: 1.0 },
    high: { foulChance: 1.2, possessionGain: 1.1 },
  },
  defensiveLine: {
    deep: { opponentShotQuality: 0.85, offsideChance: 0.8 },
    medium: { opponentShotQuality: 1.0, offsideChance: 1.0 },
    high: { opponentShotQuality: 1.15, offsideChance: 1.2 },
  },
};

const getModifier = (value: Player['form'] | Player['morale']): number => {
  const scale = {
    Excellent: 1.1,
    Good: 1.05,
    Okay: 1.0,
    Average: 1.0,
    Poor: 0.95,
    'Very Poor': 0.9,
  };
  return scale[value] || 1.0;
};

const getTeamStrengths = (
  players: Player[],
  tacticalFamiliarity: number,
  chemistryMatrix: RootState['tactics']['chemistry'],
  relationships: RootState['franchise']['relationships'],
  mentoringGroups: MentoringGroup[],
) => {
  if (players.length === 0) {
    return { attack: 0, defense: 0, midfield: 0, overallChemistry: 0 };
  }

  let attackSum = 0,
    defenseSum = 0,
    midfieldSum = 0;
  let attackCount = 0,
    defenseCount = 0,
    midfieldCount = 0;
  let totalChemistry = 0;
  let chemistryLinks = 0;

  const familiarityMod = 0.8 + (tacticalFamiliarity / 100) * 0.4; // 80% strength at 0 fam, 120% at 100 fam

  players.forEach(p => {
    const role = PLAYER_ROLES.find(r => r.id === p.roleId);
    if (!role) {
      return;
    }

    const moraleBoostEffect = p.moraleBoost ? p.moraleBoost.effect / 10 : 0; // e.g., 3 becomes 0.3
    const formMoraleMod = (getModifier(p.form) + getModifier(p.morale)) / 2 + moraleBoostEffect;
    const staminaMod = 0.7 + (p.stamina / 100) * 0.3; // 70% effectiveness at 0 stamina, 100% at 100 stamina

    if (role.category === 'FW') {
      attackSum +=
        ((p.attributes.shooting * 1.2 + p.attributes.dribbling + p.attributes.positioning) / 3) *
        formMoraleMod *
        staminaMod;
      attackCount++;
    }
    if (role.category === 'MF') {
      midfieldSum +=
        ((p.attributes.passing * 1.1 +
          p.attributes.positioning +
          p.attributes.dribbling +
          p.attributes.speed) /
          4) *
        formMoraleMod *
        staminaMod;
      midfieldCount++;
      if (['dm', 'dlp', 'b2b'].includes(p.roleId)) {
        defenseSum +=
          ((p.attributes.tackling * 1.1 + p.attributes.positioning) / 2) *
          formMoraleMod *
          staminaMod;
        defenseCount++;
      }
      if (['ap', 'b2b', 'wm'].includes(p.roleId)) {
        attackSum +=
          ((p.attributes.shooting + p.attributes.dribbling + p.attributes.passing) / 3) *
          formMoraleMod *
          staminaMod;
        attackCount++;
      }
    }
    if (role.category === 'DF') {
      defenseSum +=
        ((p.attributes.tackling * 1.2 + p.attributes.positioning + p.attributes.speed) / 3) *
        formMoraleMod *
        staminaMod;
      defenseCount++;
    }
    if (role.category === 'GK') {
      defenseSum += p.attributes.positioning * 1.5 * formMoraleMod * staminaMod; // GKs are crucial for defense
      defenseCount++;
    }

    // Calculate chemistry with other on-field players
    players.forEach(otherPlayer => {
      if (p.id < otherPlayer.id) {
        // Avoid double counting and self-comparison
        totalChemistry += calculateChemistryScore(
          p,
          otherPlayer,
          chemistryMatrix,
          relationships,
          mentoringGroups,
        );
        chemistryLinks++;
      }
    });
  });

  const overallChemistry = chemistryLinks > 0 ? totalChemistry / chemistryLinks : 50;
  const chemistryMod = 0.8 + (overallChemistry / 100) * 0.4; // 80% at 0 chem, 120% at 100 chem

  const attack = (attackCount > 0 ? attackSum / attackCount : 50) * familiarityMod * chemistryMod;
  const defense =
    (defenseCount > 0 ? defenseSum / defenseCount : 50) * familiarityMod * chemistryMod;
  const midfield =
    (midfieldCount > 0 ? midfieldSum / midfieldCount : 50) * familiarityMod * chemistryMod;

  return { attack, defense, midfield, overallChemistry };
};

export const simulateMatch = (
  homePlayers: Player[],
  awayPlayers: Player[],
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  homeFamiliarity: number,
  awayFamiliarity: number,
  chemistry: RootState['tactics']['chemistry'],
  relationships: RootState['franchise']['relationships'],
  mentoring: RootState['franchise']['mentoringGroups'],
  onUpdate: (event: MatchEvent | MatchCommentary) => void,
): MatchResult => {
  const events: MatchEvent[] = [];
  const commentaryLog: MatchCommentary[] = [];
  let homeScore = 0;
  let awayScore = 0;

  // Create mutable copies for simulation
  const simHomePlayers = JSON.parse(JSON.stringify(homePlayers)) as Player[];
  const simAwayPlayers = JSON.parse(JSON.stringify(awayPlayers)) as Player[];

  const midfieldFactorInitial =
    getTeamStrengths(simHomePlayers, homeFamiliarity, chemistry, relationships, mentoring.home)
      .midfield /
    (getTeamStrengths(simHomePlayers, homeFamiliarity, chemistry, relationships, mentoring.home)
      .midfield +
      getTeamStrengths(simAwayPlayers, awayFamiliarity, chemistry, relationships, mentoring.away)
        .midfield || 1);

  let possession: Team = midfieldFactorInitial > 0.5 ? 'home' : 'away';

  for (let minute = 1; minute <= 90; minute++) {
    // Decay morale boost
    [...simHomePlayers, ...simAwayPlayers].forEach(p => {
      if (p.moraleBoost && p.moraleBoost.duration > 0) {
        p.moraleBoost.duration--;
      }
      if (p.moraleBoost && p.moraleBoost.duration <= 0) {
        p.moraleBoost = null;
      }
    });

    const homeStrengths = getTeamStrengths(
      simHomePlayers,
      homeFamiliarity,
      chemistry,
      relationships,
      mentoring.home,
    );
    const awayStrengths = getTeamStrengths(
      simAwayPlayers,
      awayFamiliarity,
      chemistry,
      relationships,
      mentoring.away,
    );

    const homeTacticMods = {
      goalChance: TACTIC_MODIFIERS.mentality[homeTactics.mentality].goalChance,
      defensiveAction: TACTIC_MODIFIERS.mentality[homeTactics.mentality].defensiveAction,
      foulChance: TACTIC_MODIFIERS.pressing[homeTactics.pressing].foulChance,
    };
    const awayTacticMods = {
      goalChance: TACTIC_MODIFIERS.mentality[awayTactics.mentality].goalChance,
      defensiveAction: TACTIC_MODIFIERS.mentality[awayTactics.mentality].defensiveAction,
      foulChance: TACTIC_MODIFIERS.pressing[awayTactics.pressing].foulChance,
    };

    const midfieldFactor =
      homeStrengths.midfield / (homeStrengths.midfield + awayStrengths.midfield || 1);
    const homePossessionAdvantage = Math.pow(midfieldFactor, 1.5);

    const possessionChangeChance = 0.3;
    if (Math.random() < possessionChangeChance) {
      possession = possession === 'home' ? 'away' : 'home';
      const possessingTeamName = possession === 'home' ? 'Home' : 'Away';
      const commentary = { minute, text: `${possessingTeamName} regain possession in midfield.` };
      commentaryLog.push(commentary);
      onUpdate(commentary);
    }

    const chanceCreation =
      possession === 'home' ? 0.1 * homePossessionAdvantage : 0.1 * (1 - homePossessionAdvantage);
    if (Math.random() < chanceCreation) {
      const [attackers, defenders, strengths, tacticMods] =
        possession === 'home'
          ? [simHomePlayers, simAwayPlayers, homeStrengths, homeTacticMods]
          : [simAwayPlayers, simHomePlayers, awayStrengths, awayTacticMods];
      const [defendingStrengths, defendingTacticMods] =
        possession === 'home' ? [awayStrengths, awayTacticMods] : [homeStrengths, homeTacticMods];

      const attackRating = strengths.attack * tacticMods.goalChance;
      const defenseRating = defendingStrengths.defense * defendingTacticMods.defensiveAction;
      const goalProbability = 0.1 * Math.pow(attackRating / (defenseRating || 1), 2);

      const attacker =
        attackers
          .filter(p => ['MF', 'FW'].includes(PLAYER_ROLES.find(r => r.id === p.roleId)!.category))
          .sort((a, b) => b.attributes.positioning - a.attributes.positioning)[0] || attackers[0];

      if (Math.random() < goalProbability) {
        const scorers = attackers.filter(p =>
          ['FW', 'MF'].includes(PLAYER_ROLES.find(r => r.id === p.roleId)!.category),
        );
        const scorer =
          scorers.length > 0 ? scorers[Math.floor(Math.random() * scorers.length)] : attackers[0];
        let assister: Player | null = null;
        const potentialAssisters = attackers.filter(
          p =>
            p.id !== scorer.id &&
            ['MF', 'FW', 'DF'].includes(PLAYER_ROLES.find(r => r.id === p.roleId)!.category),
        );
        if (potentialAssisters.length > 0 && Math.random() < 0.7) {
          assister = potentialAssisters[Math.floor(Math.random() * potentialAssisters.length)];
        }
        const goalCommentary = {
          minute,
          text: assister
            ? `GOAL! ${scorer.name} finishes it off, assisted by ${assister.name}!`
            : `GOAL! A brilliant solo effort from ${scorer.name}!`,
        };
        commentaryLog.push(goalCommentary);
        onUpdate(goalCommentary);
        const event: MatchEvent = {
          minute,
          type: 'Goal',
          team: possession,
          playerName: scorer.name,
          description: assister ? `scored a goal, assisted by ${assister.name}.` : 'scored a goal.',
          assisterName: assister?.name,
        };
        events.push(event);
        onUpdate(event);
        if (possession === 'home') {
          homeScore++;
        } else {
          awayScore++;
        }
      } else {
        const defender =
          defenders
            .filter(p => ['DF', 'MF'].includes(PLAYER_ROLES.find(r => r.id === p.roleId)!.category))
            .sort((a, b) => b.attributes.tackling - a.attributes.tackling)[0] || defenders[0];
        const commentary = {
          minute,
          text: `${attacker.name} goes on a run, but is stopped by a great tackle from ${defender.name}.`,
        };
        commentaryLog.push(commentary);
        onUpdate(commentary);
      }
    }

    const allPlayers = [...simHomePlayers, ...simAwayPlayers];
    allPlayers.forEach(player => {
      const baseFoulChance = 0.001;
      const tacticMod =
        player.team === 'home' ? homeTacticMods.foulChance : awayTacticMods.foulChance;
      let playerFoulChance = baseFoulChance * tacticMod;
      if (player.traits.includes('Temperamental')) {
        playerFoulChance *= 1.5;
      }
      if (Math.random() < playerFoulChance) {
        const commentary: MatchCommentary = {
          minute,
          text: `A late challenge from ${player.name} earns him a yellow card.`,
        };
        commentaryLog.push(commentary);
        onUpdate(commentary);
        const event: MatchEvent = {
          minute,
          type: 'Yellow Card',
          team: player.team,
          playerName: player.name,
          description: 'received a yellow card for a late challenge.',
        };
        events.push(event);
        onUpdate(event);
      }
    });
  }

  const playerStats: Record<string, Partial<PlayerStats>> = {};
  [...homePlayers, ...awayPlayers].forEach(player => {
    const playerEvents = events.filter(e => e.playerName === player.name);
    playerStats[player.id] = {
      goals: playerEvents.filter(e => e.type === 'Goal').length,
      assists: events.filter(e => e.type === 'Goal' && e.assisterName === player.name).length,
    };
  });

  return {
    homeScore,
    awayScore,
    events,
    commentaryLog,
    isRivalry: Math.random() < 0.2,
    playerStats,
  };
};

export const calculateMatchOutcome = (
  homeStrength: number,
  awayStrength: number,
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
): { homeWinProbability: number; drawProbability: number; awayWinProbability: number } => {
  const strengthDiff = homeStrength - awayStrength;

  // Tactical modifiers
  const homeMentality = TACTIC_MODIFIERS.mentality[homeTactics.mentality];
  const awayMentality = TACTIC_MODIFIERS.mentality[awayTactics.mentality];

  const tacticalBalance =
    homeMentality.goalChance /
    awayMentality.defensiveAction /
    (awayMentality.goalChance / homeMentality.defensiveAction);

  const adjustedDiff = strengthDiff * tacticalBalance;

  // Convert to probabilities
  let homeWin = 0.5 + adjustedDiff / 200; // Base 50% for even teams
  homeWin = Math.max(0.1, Math.min(0.9, homeWin)); // Clamp between 10% and 90%

  const draw = Math.max(0.1, 0.4 - Math.abs(adjustedDiff) / 100); // More draws for closer matches
  const awayWin = 1 - homeWin - draw;

  return {
    homeWinProbability: Math.round(homeWin * 100) / 100,
    drawProbability: Math.round(draw * 100) / 100,
    awayWinProbability: Math.round(awayWin * 100) / 100,
  };
};

export const generateMatchPreview = (
  homePlayers: Player[],
  awayPlayers: Player[],
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  homeFamiliarity: number,
  awayFamiliarity: number,
  chemistry: RootState['tactics']['chemistry'],
  relationships: RootState['franchise']['relationships'],
  mentoring: RootState['franchise']['mentoringGroups'],
): {
  homeStrengths: ReturnType<typeof getTeamStrengths>;
  awayStrengths: ReturnType<typeof getTeamStrengths>;
  outcome: ReturnType<typeof calculateMatchOutcome>;
  keyPlayers: { home: Player[]; away: Player[] };
  tacticalMismatch: string[];
} => {
  const homeStrengths = getTeamStrengths(
    homePlayers,
    homeFamiliarity,
    chemistry,
    relationships,
    mentoring.home,
  );
  const awayStrengths = getTeamStrengths(
    awayPlayers,
    awayFamiliarity,
    chemistry,
    relationships,
    mentoring.away,
  );

  const outcome = calculateMatchOutcome(
    (homeStrengths.attack + homeStrengths.defense + homeStrengths.midfield) / 3,
    (awayStrengths.attack + awayStrengths.defense + awayStrengths.midfield) / 3,
    homeTactics,
    awayTactics,
  );

  // Identify key players
  const homeKeyPlayers = homePlayers
    .sort((a, b) => {
      const aOverall =
        (a.attributes.shooting +
          a.attributes.passing +
          a.attributes.tackling +
          a.attributes.positioning) /
        4;
      const bOverall =
        (b.attributes.shooting +
          b.attributes.passing +
          b.attributes.tackling +
          b.attributes.positioning) /
        4;
      return bOverall - aOverall;
    })
    .slice(0, 3);

  const awayKeyPlayers = awayPlayers
    .sort((a, b) => {
      const aOverall =
        (a.attributes.shooting +
          a.attributes.passing +
          a.attributes.tackling +
          a.attributes.positioning) /
        4;
      const bOverall =
        (b.attributes.shooting +
          b.attributes.passing +
          b.attributes.tackling +
          b.attributes.positioning) /
        4;
      return bOverall - aOverall;
    })
    .slice(0, 3);

  // Analyze tactical mismatches
  const tacticalMismatch: string[] = [];

  if (homeTactics.mentality === 'very-attacking' && awayTactics.defensiveLine === 'deep') {
    tacticalMismatch.push(
      "Home team's attacking mentality may struggle against away team's deep defense",
    );
  }

  if (awayTactics.pressing === 'high' && homeTactics.mentality === 'very-attacking') {
    tacticalMismatch.push(
      "Away team's high pressing could exploit home team's aggressive approach",
    );
  }

  if (homeStrengths.overallChemistry < 30) {
    tacticalMismatch.push("Home team's poor chemistry could be a deciding factor");
  }

  if (awayStrengths.overallChemistry < 30) {
    tacticalMismatch.push("Away team's poor chemistry could be exploited");
  }

  return {
    homeStrengths,
    awayStrengths,
    outcome,
    keyPlayers: { home: homeKeyPlayers, away: awayKeyPlayers },
    tacticalMismatch,
  };
};

export const simulationService = {
  simulateMatch,
  calculateMatchOutcome,
  generateMatchPreview,
  getTeamStrengths,
};
