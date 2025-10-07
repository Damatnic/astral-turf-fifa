import React, { useState, useCallback, useMemo } from 'react';
import { useTacticsContext } from '../hooks';
import { ResponsivePage } from '../components/Layout/ResponsivePage';
import { TacticsErrorBoundary } from '../components/boundaries/TacticsErrorBoundary';
import { EnhancedToolbar } from '../components/toolbar/EnhancedToolbar';
import RosterGrid from '../components/roster/SmartRoster/RosterGrid';
import { ModernField } from '../components/tactics/ModernField';
import type { Player } from '../types';

/**
 * New Tactics Board Page with Enhanced Components
 * Uses the new EnhancedToolbar and RosterGrid components
 */
const TacticsBoardPageNew: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get current formation and players
  const currentFormation = tacticsState?.formations?.[tacticsState?.activeFormationIds?.home];
  const players = useMemo(() => tacticsState?.players || [], [tacticsState?.players]);

  // Toolbar Actions
  const handleSave = useCallback(() => {
    if (!currentFormation) {
      return;
    }
    
    const exportData = {
      id: Date.now().toString(),
      name: currentFormation.name || 'Custom Formation',
      formation: currentFormation,
      players,
      createdAt: new Date().toISOString(),
    };

    const savedFormations = JSON.parse(localStorage.getItem('savedFormations') || '[]');
    savedFormations.push(exportData);
    localStorage.setItem('savedFormations', JSON.stringify(savedFormations));
    
    // eslint-disable-next-line no-console
    console.log('Formation saved:', exportData.name);
  }, [currentFormation, players]);

  const handleLoad = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('Load formation');
  }, []);

  const handleExport = useCallback(() => {
    if (!currentFormation) {
      return;
    }
    
    const exportData = {
      formation: currentFormation,
      players,
      exportedAt: new Date().toISOString(),
    };

    const blob = new globalThis.Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formation-${currentFormation.name || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentFormation, players]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleFormationChange = useCallback((formationId: string) => {
    dispatch({
      type: 'SET_ACTIVE_FORMATION',
      payload: { team: 'home', formationId },
    });
  }, [dispatch]);

  // Player Selection
  const handlePlayerSelect = useCallback((playerId: string) => {
    setSelectedPlayerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
    
    // Also set as selected player for field
    const player = players.find(p => p.id === playerId);
    if (player) {
      setSelectedPlayer(player);
    }
  }, [players]);

  // Field handlers
  const handlePlayerMove = useCallback((
    playerId: string,
    position: { x: number; y: number },
    _targetPlayerId?: string
  ) => {
    dispatch({
      type: 'UPDATE_PLAYER_POSITION',
      payload: { playerId, position },
    });
  }, [dispatch]);

  const handleFieldPlayerSelect = useCallback((player: Player) => {
    setSelectedPlayer(player);
    setSelectedPlayerIds(new Set([player.id]));
  }, []);

  return (
    <TacticsErrorBoundary>
      <ResponsivePage>
        <div className="h-screen w-full flex flex-col bg-slate-900">
          {/* Enhanced Toolbar */}
          <EnhancedToolbar
            onSave={handleSave}
            onLoad={handleLoad}
            onExport={handleExport}
            onPrint={handlePrint}
            currentFormation={currentFormation}
            onFormationChange={handleFormationChange}
            availableFormations={Object.values(tacticsState?.formations || {})}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Player Roster Sidebar */}
            <div className="w-80 border-r border-slate-700 bg-slate-800/50 overflow-hidden">
              <RosterGrid
                players={players}
                selectedPlayerIds={selectedPlayerIds}
                comparisonPlayerIds={[]}
                gridColumns={1}
                viewMode="list"
                onPlayerSelect={handlePlayerSelect}
                onPlayerDoubleClick={(playerId) => {
                  const player = players.find(p => p.id === playerId);
                  if (player) {
                    handleFieldPlayerSelect(player);
                  }
                }}
                onPlayerDragStart={() => {}}
                onAddToComparison={() => {}}
                onRemoveFromComparison={() => {}}
                containerWidth={320}
                containerHeight={800}
              />
            </div>

            {/* Tactical Field */}
            <div className="flex-1 p-4 overflow-auto">
              <div className="w-full h-full flex items-center justify-center">
                <ModernField
                  formation={currentFormation}
                  players={players}
                  selectedPlayer={selectedPlayer}
                  onPlayerMove={handlePlayerMove}
                  onPlayerSelect={handleFieldPlayerSelect}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                  viewMode="standard"
                  showHeatMap={false}
                  showPlayerStats={false}
                />
              </div>
            </div>
          </div>
        </div>
      </ResponsivePage>
    </TacticsErrorBoundary>
  );
};

export default TacticsBoardPageNew;
