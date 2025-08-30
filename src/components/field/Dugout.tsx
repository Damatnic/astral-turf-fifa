
import React from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import PlayerToken from './PlayerToken';
import type { Player } from '../../types';

interface DugoutSectionProps {
    title: string;
    players: Player[];
    team: 'home' | 'away';
    selectedPlayerId: string | null;
    highlightedPlayerIds: string[];
    onDrop: (e: React.DragEvent<HTMLDivElement>, team: 'home' | 'away') => void;
}

const DugoutSection: React.FC<DugoutSectionProps> = ({ title, players, team, selectedPlayerId, highlightedPlayerIds, onDrop }) => {
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e?.preventDefault();
        if (e?.dataTransfer) e.dataTransfer.dropEffect = 'move';
    };

    return (
        <div 
            className="flex-1 h-full bg-black/20 rounded-lg p-2 flex flex-col"
            onDrop={(e) => onDrop(e, team)}
            onDragOver={handleDragOver}
            data-is-interactive-zone="true"
        >
            <h3 className={`text-xs font-bold uppercase text-center mb-2 ${team === 'home' ? 'text-blue-400' : 'text-red-400'}`}>{title}</h3>
            <div className="flex-grow flex flex-wrap items-start content-start gap-2 p-1 overflow-y-auto">
                {(players ?? []).map(player => player && (
                    <PlayerToken
                        key={player?.id}
                        player={player}
                        isSelected={selectedPlayerId === player?.id}
                        isHighlightedByAI={highlightedPlayerIds?.includes(player?.id) ?? false}
                    />
                ))}
            </div>
        </div>
    );
};


const Dugout: React.FC = () => {
    const { tacticsState, dispatch } = useTacticsContext();
    const { uiState } = useUIContext();
    const { players, formations, activeFormationIds, playbook } = tacticsState;
    const { activePlaybookItemId, activeStepIndex, selectedPlayerId, highlightedByAIPlayerIds } = uiState;


    // Determine benched players
    const playersOnFieldIds = React.useMemo(() => {
        if (activePlaybookItemId && activeStepIndex !== null) {
            const item = playbook?.[activePlaybookItemId];
            const step = item?.steps?.[activeStepIndex];
            if (step?.playerPositions) {
                return new Set(Object.keys(step.playerPositions).filter(pId => {
                    const position = step.playerPositions?.[pId];
                    return position && position.x > -1;
                }));
            }
        }
        
        const onFieldIds = new Set<string>();
        const homeFormation = formations?.[activeFormationIds?.home];
        if (homeFormation?.slots) {
            homeFormation.slots.forEach(slot => {
                if (slot?.playerId) onFieldIds.add(slot.playerId);
            });
        }
        
        const awayFormation = formations?.[activeFormationIds?.away];
        if (awayFormation?.slots) {
            awayFormation.slots.forEach(slot => {
                if (slot?.playerId) onFieldIds.add(slot.playerId);
            });
        }

        return onFieldIds;
    }, [activeFormationIds, formations, activePlaybookItemId, activeStepIndex, playbook]);

    const homeBenched = (players ?? []).filter(p => p?.team === 'home' && !playersOnFieldIds.has(p?.id));
    const awayBenched = (players ?? []).filter(p => p?.team === 'away' && !playersOnFieldIds.has(p?.id));

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, team: 'home' | 'away') => {
        e?.preventDefault();
        const playerId = e?.dataTransfer?.getData('text/plain');
        if (!playerId) return;

        const droppedPlayer = players?.find(p => p?.id === playerId);
        if (!droppedPlayer) return;

        // If player is already on the bench, we might just be reassigning their team.
        if (!playersOnFieldIds.has(playerId)) {
            if(droppedPlayer?.team !== team) {
                dispatch({ type: 'ASSIGN_PLAYER_TEAM', payload: { playerId, team } });
            }
        } else { // Player is coming from the field
            dispatch({ type: 'BENCH_PLAYER', payload: { playerId } });
            // If they are dropped in the opposing team's dugout, also change their team
             if(droppedPlayer?.team !== team) {
                dispatch({ type: 'ASSIGN_PLAYER_TEAM', payload: { playerId, team } });
            }
        }
    };
    
    return (
        <div className="w-full h-32 mt-4 flex-shrink-0 bg-slate-800/50 border-t-2 border-slate-700 rounded-lg p-2 flex gap-2">
            <DugoutSection 
                title="Home Bench" 
                players={homeBenched} 
                team="home" 
                selectedPlayerId={selectedPlayerId}
                highlightedPlayerIds={highlightedByAIPlayerIds}
                onDrop={handleDrop} 
            />
            <div className="w-px bg-slate-700 h-full flex-shrink-0" />
            <DugoutSection 
                title="Away Bench" 
                players={awayBenched} 
                team="away" 
                selectedPlayerId={selectedPlayerId}
                highlightedPlayerIds={highlightedByAIPlayerIds}
                onDrop={handleDrop} 
            />
        </div>
    );
};

export default Dugout;
