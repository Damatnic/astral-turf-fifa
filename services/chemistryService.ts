
import { Player, RootState, MentoringGroup, PlayerRelationshipType } from '../types';

export const calculateChemistryScore = (
    playerA: Player,
    playerB: Player,
    chemistryMatrix: RootState['tactics']['chemistry'],
    relationships: RootState['franchise']['relationships'],
    mentoringGroups: MentoringGroup[]
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
    const inSameGroup = mentoringGroups.some(group => 
        (group.mentorId === playerA.id && group.menteeIds.includes(playerB.id)) ||
        (group.mentorId === playerB.id && group.menteeIds.includes(playerA.id)) ||
        (group.menteeIds.includes(playerA.id) && group.menteeIds.includes(playerB.id))
    );
    if (inSameGroup) {
        score += 15;
    }

    // 4. Player Traits (Max 10, Min -10)
    let traitModifier = 0;
    if ((playerA.traits.includes('Leader') || playerB.traits.includes('Leader'))) {
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
    const relationship = relationships[playerA.id]?.[playerB.id] || relationships[playerB.id]?.[playerA.id];
    if (relationship === 'friendship') {
        score += 40; // Significant boost for friends
    } else if (relationship === 'rivalry') {
        score -= 50; // Significant penalty for rivals
    }

    return Math.max(0, Math.min(100, Math.round(score)));
};
