import type {
  Player,
  RootState,
  MentoringGroup,
  PlayerRelationshipType,
  Formation,
  TacticsState,
} from '../types';

export const calculateChemistryScore = (
  playerA: Player,
  playerB: Player,
  chemistryMatrix: RootState['tactics']['chemistry'],
  relationships: RootState['franchise']['relationships'],
  mentoringGroups: MentoringGroup[],
): number => {
  let score = 0;

  // 1. Base Chemistry from playing together (Max 40)
  const rawChemistry = chemistryMatrix[playerA.id]?.[playerB.id] || 0;
  score += Math.min(40, rawChemistry / 20); // Max points after ~1000 minutes

  // 2. Nationality (Max 20)
  if (playerA.nationality === playerB.nationality) {
    score += 20;
  }

  // 3. Mentoring (Max 15)
  const inSameGroup = mentoringGroups.some(
    group =>
      (group.mentorId === playerA.id && group.menteeIds.includes(playerB.id)) ||
      (group.mentorId === playerB.id && group.menteeIds.includes(playerA.id)) ||
      (group.menteeIds.includes(playerA.id) && group.menteeIds.includes(playerB.id)),
  );
  if (inSameGroup) {
    score += 15;
  }

  // 4. Player Traits (Max 10, Min -10)
  let traitModifier = 0;
  if (playerA.traits.includes('Leader') || playerB.traits.includes('Leader')) {
    traitModifier += 5;
  }
  if (playerA.traits.includes('Loyal') && playerB.traits.includes('Loyal')) {
    traitModifier += 5;
  }
  if (playerA.traits.includes('Temperamental') && playerB.traits.includes('Temperamental')) {
    traitModifier -= 10;
  }
  if (playerA.traits.includes('Ambitious') && playerB.traits.includes('Ambitious')) {
    traitModifier -= 5;
  }
  score += traitModifier;

  // 5. Dynamic Relationships (Strongest Factor)
  const relationship =
    relationships[playerA.id]?.[playerB.id] || relationships[playerB.id]?.[playerA.id];
  if (relationship === 'friendship') {
    score += 40; // Significant boost for friends
  } else if (relationship === 'rivalry') {
    score -= 50; // Significant penalty for rivals
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

export const calculateTeamChemistry = (
  players: Player[],
  formations: Record<string, Formation>,
  activeFormationIds: { home: string; away: string },
): Record<string, Record<string, number>> => {
  const chemistry: Record<string, Record<string, number>> = {};

  // Initialize chemistry matrix
  players.forEach(playerA => {
    chemistry[playerA.id] = {};
    players.forEach(playerB => {
      if (playerA.id !== playerB.id && playerA.team === playerB.team) {
        // Check if players are positioned close to each other
        const distance = Math.sqrt(
          Math.pow(playerA.position.x - playerB.position.x, 2) +
            Math.pow(playerA.position.y - playerB.position.y, 2),
        );

        // Players build chemistry when they play close together
        const proximityBonus = Math.max(0, 150 - distance); // Closer = higher bonus
        const currentChemistry = chemistry[playerA.id]?.[playerB.id] || 0;
        chemistry[playerA.id][playerB.id] = currentChemistry + proximityBonus * 0.1;
      } else {
        chemistry[playerA.id][playerB.id] = 0;
      }
    });
  });

  return chemistry;
};

export const getPositionalLinks = (player: Player, formation: Formation): string[] => {
  const playerSlot = formation.slots.find(slot => slot.playerId === player.id);
  if (!playerSlot) {
    return [];
  }

  // Find nearby positions based on formation layout
  const linkedPositions: string[] = [];
  const playerPos = playerSlot.defaultPosition;

  formation.slots.forEach(slot => {
    if (slot.playerId && slot.playerId !== player.id) {
      const distance = Math.sqrt(
        Math.pow(slot.defaultPosition.x - playerPos.x, 2) +
          Math.pow(slot.defaultPosition.y - playerPos.y, 2),
      );

      // Consider positions within ~100 units as linked
      if (distance <= 100) {
        linkedPositions.push(slot.playerId);
      }
    }
  });

  return linkedPositions;
};

export const calculateFormationChemistry = (
  players: Player[],
  formation: Formation,
  relationships: RootState['franchise']['relationships'],
  mentoringGroups: MentoringGroup[],
  chemistryMatrix: Record<string, Record<string, number>>,
): number => {
  let totalChemistry = 0;
  let links = 0;

  const onFieldPlayers = players.filter(p => formation.slots.some(slot => slot.playerId === p.id));

  // Calculate chemistry between all player pairs on the field
  for (let i = 0; i < onFieldPlayers.length; i++) {
    for (let j = i + 1; j < onFieldPlayers.length; j++) {
      const playerA = onFieldPlayers[i];
      const playerB = onFieldPlayers[j];

      const chemistry = calculateChemistryScore(
        playerA,
        playerB,
        chemistryMatrix,
        relationships,
        mentoringGroups,
      );

      totalChemistry += chemistry;
      links++;
    }
  }

  return links > 0 ? Math.round(totalChemistry / links) : 0;
};

export const suggestChemistryImprovements = (
  players: Player[],
  formation: Formation,
  relationships: RootState['franchise']['relationships'],
  mentoringGroups: MentoringGroup[],
): string[] => {
  const suggestions: string[] = [];

  // Find players with low chemistry
  const onFieldPlayers = players.filter(p => formation.slots.some(slot => slot.playerId === p.id));

  // Suggest mentoring groups for young players
  const youngPlayers = onFieldPlayers.filter(p => p.age < 23);
  const leaders = onFieldPlayers.filter(p => p.traits.includes('Leader') && p.age > 28);

  if (youngPlayers.length > 0 && leaders.length > 0) {
    suggestions.push(
      `Consider creating mentoring groups with experienced leaders like ${leaders[0].name} to help develop young talent.`,
    );
  }

  // Suggest nationality-based groupings
  const nationalities = [...new Set(onFieldPlayers.map(p => p.nationality))];
  const largeSameNationalityGroups = nationalities.filter(
    nat => onFieldPlayers.filter(p => p.nationality === nat).length >= 3,
  );

  if (largeSameNationalityGroups.length > 0) {
    suggestions.push(
      `Players from ${largeSameNationalityGroups[0]} have natural chemistry - consider positioning them close together.`,
    );
  }

  // Identify rivalry issues
  const rivalries: string[] = [];
  onFieldPlayers.forEach(playerA => {
    onFieldPlayers.forEach(playerB => {
      if (playerA.id !== playerB.id) {
        const relationship = relationships[playerA.id]?.[playerB.id];
        if (relationship === 'rivalry') {
          rivalries.push(
            `${playerA.name} and ${playerB.name} have a rivalry that may affect team chemistry.`,
          );
        }
      }
    });
  });

  if (rivalries.length > 0) {
    suggestions.push(...rivalries.slice(0, 2)); // Limit to first 2 rivalry warnings
  }

  return suggestions;
};

export const chemistryService = {
  calculateChemistryScore,
  calculateTeamChemistry,
  getPositionalLinks,
  calculateFormationChemistry,
  suggestChemistryImprovements,
};
