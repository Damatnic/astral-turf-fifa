import React, { useMemo } from 'react';
import { useTacticsContext, useFranchiseContext } from '../../hooks';
import type { Team } from '../../types';
import { calculateChemistryScore } from '../../services/chemistryService';
import { HeartIcon, SwordsIcon } from '../ui/icons';
import { getFormationPlayerIds, isValidFormation } from '../../utils/tacticalDataGuards';

interface ChemistryViewProps {
  team: Team;
}

const ChemistryView: React.FC<ChemistryViewProps> = ({ team }) => {
  const { tacticsState } = useTacticsContext();
  const { franchiseState } = useFranchiseContext();
  const { players, formations, activeFormationIds, chemistry } = tacticsState;
  const { relationships, mentoringGroups } = franchiseState;

  const formation = formations[activeFormationIds[team]];
  const teamPlayers = useMemo(() => {
    if (!formation) {
      return [];
    }
    const playerIdsOnField = getFormationPlayerIds(formation);
    return players.filter(p => p && playerIdsOnField.has(p.id));
  }, [formation, players]);

  const chemistryPairs = useMemo(() => {
    try {
      const pairs: { p1: string; p2: string; score: number; relationship?: string }[] = [];

      if (!Array.isArray(teamPlayers) || teamPlayers.length === 0) {
        return [];
      }

      for (let i = 0; i < teamPlayers.length; i++) {
        for (let j = i + 1; j < teamPlayers.length; j++) {
          const p1 = teamPlayers[i];
          const p2 = teamPlayers[j];

          if (!p1 || !p2 || !p1.name || !p2.name) {
            continue;
          }

          const score = calculateChemistryScore(
            p1,
            p2,
            chemistry,
            relationships,
            mentoringGroups?.[team]
          );
          const relationship = relationships?.[p1.id]?.[p2.id] || relationships?.[p2.id]?.[p1.id];

          const payload: { p1: string; p2: string; score: number; relationship?: string } = {
            p1: p1.name || 'Unknown Player',
            p2: p2.name || 'Unknown Player',
            score: score || 0,
          };

          if (relationship) {
            payload.relationship = relationship;
          }

          pairs.push(payload);
        }
      }
      return pairs.sort((a, b) => (b.score || 0) - (a.score || 0));
    } catch (error) {
      console.error('Error calculating chemistry pairs:', error);
      return [];
    }
  }, [teamPlayers, chemistry, relationships, mentoringGroups, team]);

  const top5 = Array.isArray(chemistryPairs) ? chemistryPairs.slice(0, 5).filter(Boolean) : [];
  const bottom5 = Array.isArray(chemistryPairs)
    ? chemistryPairs.slice(-5).reverse().filter(Boolean)
    : [];

  const RelationshipIcon: React.FC<{ type?: string }> = ({ type }) => {
    if (type === 'friendship') {
      return <HeartIcon className="w-3 h-3 text-pink-400" />;
    }
    if (type === 'rivalry') {
      return <SwordsIcon className="w-3 h-3 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="p-2 space-y-4">
      <div>
        <h4 className="font-bold text-green-400 mb-2">Top 5 Chemistry Links</h4>
        <div className="space-y-1">
          {top5
            .map((pair, i) => {
              if (!pair || typeof pair !== 'object') {
                return null;
              }
              const p1Name = pair.p1 || 'Unknown Player';
              const p2Name = pair.p2 || 'Unknown Player';
              const score = pair.score || 0;

              return (
                <div
                  key={`top-${i}-${p1Name}-${p2Name}`}
                  className="flex items-center justify-between text-sm p-1 bg-gray-700/50 rounded"
                >
                  <div className="flex items-center truncate">
                    <RelationshipIcon type={pair.relationship || undefined} />
                    <span className="ml-1.5 truncate" title={`${p1Name} & ${p2Name}`}>
                      {p1Name} & {p2Name}
                    </span>
                  </div>
                  <span className="font-bold text-green-300">{score}</span>
                </div>
              );
            })
            .filter(Boolean)}
        </div>
      </div>
      <div>
        <h4 className="font-bold text-red-400 mb-2">Bottom 5 Chemistry Links</h4>
        <div className="space-y-1">
          {bottom5
            .map((pair, i) => {
              if (!pair || typeof pair !== 'object') {
                return null;
              }
              const p1Name = pair.p1 || 'Unknown Player';
              const p2Name = pair.p2 || 'Unknown Player';
              const score = pair.score || 0;

              return (
                <div
                  key={`bottom-${i}-${p1Name}-${p2Name}`}
                  className="flex items-center justify-between text-sm p-1 bg-gray-700/50 rounded"
                >
                  <div className="flex items-center truncate">
                    <RelationshipIcon type={pair.relationship || undefined} />
                    <span className="ml-1.5 truncate" title={`${p1Name} & ${p2Name}`}>
                      {p1Name} & {p2Name}
                    </span>
                  </div>
                  <span className="font-bold text-red-300">{score}</span>
                </div>
              );
            })
            .filter(Boolean)}
        </div>
      </div>
    </div>
  );
};

export default ChemistryView;
