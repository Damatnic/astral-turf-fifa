import React, { useMemo } from 'react';
import { useTacticsContext, useFranchiseContext } from '../../hooks';
import type { Team } from '../../types';
import { calculateChemistryScore } from '../../services/chemistryService';
import { HeartIcon, SwordsIcon } from '../ui/icons';

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
    const playerIdsOnField = new Set(formation.slots.map(s => s.playerId).filter(Boolean));
    return players.filter(p => playerIdsOnField.has(p.id));
  }, [formation, players]);

  const chemistryPairs = useMemo(() => {
    const pairs: { p1: string; p2: string; score: number; relationship?: string }[] = [];
    for (let i = 0; i < teamPlayers.length; i++) {
      for (let j = i + 1; j < teamPlayers.length; j++) {
        const p1 = teamPlayers[i];
        const p2 = teamPlayers[j];
        const score = calculateChemistryScore(
          p1,
          p2,
          chemistry,
          relationships,
          mentoringGroups[team]
        );
        const relationship = relationships[p1.id]?.[p2.id] || relationships[p2.id]?.[p1.id];
        pairs.push({ p1: p1.name, p2: p2.name, score, relationship });
      }
    }
    return pairs.sort((a, b) => b.score - a.score);
  }, [teamPlayers, chemistry, relationships, mentoringGroups, team]);

  const top5 = chemistryPairs.slice(0, 5);
  const bottom5 = chemistryPairs.slice(-5).reverse();

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
          {top5.map((pair, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm p-1 bg-gray-700/50 rounded"
            >
              <div className="flex items-center truncate">
                <RelationshipIcon type={pair.relationship} />
                <span className="ml-1.5 truncate" title={`${pair.p1} & ${pair.p2}`}>
                  {pair.p1} & {pair.p2}
                </span>
              </div>
              <span className="font-bold text-green-300">{pair.score}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-bold text-red-400 mb-2">Bottom 5 Chemistry Links</h4>
        <div className="space-y-1">
          {bottom5.map((pair, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm p-1 bg-gray-700/50 rounded"
            >
              <div className="flex items-center truncate">
                <RelationshipIcon type={pair.relationship} />
                <span className="ml-1.5 truncate" title={`${pair.p1} & ${pair.p2}`}>
                  {pair.p1} & {pair.p2}
                </span>
              </div>
              <span className="font-bold text-red-300">{pair.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChemistryView;
