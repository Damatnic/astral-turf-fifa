import React, { useState, useCallback, useMemo } from 'react';
import { useTacticsContext } from '../hooks';
import { useFormationHistory, createHistorySnapshot } from '../hooks/useFormationHistory';
import { TacticsErrorBoundary } from '../components/boundaries/TacticsErrorBoundary';
import { EnhancedToolbar } from '../components/toolbar/EnhancedToolbar';
import RosterGrid from '../components/roster/SmartRoster/RosterGridSimple';
import FilterPanel from '../components/roster/SmartRoster/FilterPanel';
import ComparisonView from '../components/roster/SmartRoster/ComparisonView';
import { ModernField } from '../components/tactics/ModernField';
import { SaveFormationModal } from '../components/modals/SaveFormationModal';
import { LoadFormationModal } from '../components/modals/LoadFormationModal';
import type { Player } from '../types';
import type { RosterFilters, FilterPreset } from '../types/roster';

/**
 * New Tactics Board Page with Enhanced Components
 * Uses the new EnhancedToolbar and RosterGrid components
 */
const TacticsBoardPageNew: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPlayerIds, setComparisonPlayerIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<RosterFilters>({
    searchQuery: '',
    positions: { positions: [], includeAll: true },
    overall: { min: 0, max: 100, enabled: false },
    pace: { min: 0, max: 100, enabled: false },
    stamina: { min: 0, max: 100, enabled: false },
    morale: { min: 0, max: 100, enabled: false },
    fitness: { min: 0, max: 100, enabled: false },
    age: { min: 16, max: 40, enabled: false },
    status: { available: true, injured: false, suspended: false, tired: false },
  });
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Get current formation and players
  const currentFormation = tacticsState?.formations?.[tacticsState?.activeFormationIds?.home];
  const allPlayers = useMemo(() => tacticsState?.players || [], [tacticsState?.players]);
  
  // Filter players based on current filters
  const players = useMemo(() => {
    let filtered = [...allPlayers];
    
    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.positionRole?.toLowerCase().includes(query)
      );
    }
    
    // Overall rating filter
    if (filters.overall.enabled) {
      filtered = filtered.filter(p => {
        const overall = p.overall || 0;
        return overall >= filters.overall.min && overall <= filters.overall.max;
      });
    }
    
    // Age filter
    if (filters.age.enabled) {
      filtered = filtered.filter(p => {
        const age = p.age || 25;
        return age >= filters.age.min && age <= filters.age.max;
      });
    }
    
    return filtered;
  }, [allPlayers, filters]);

  // Formation History System
  const historySystem = useFormationHistory(
    createHistorySnapshot(
      currentFormation || { id: '', name: '', positions: [] },
      players,
      [], // drawings - not used yet
    ),
    {
      enableKeyboardShortcuts: true,
      onUndo: (state) => {
        // Restore formation and player positions from history
        if (state.formation && state.players) {
          dispatch({
            type: 'SET_ACTIVE_FORMATION',
            payload: { team: 'home', formationId: state.formation.id },
          });
          // Update player positions
          state.players.forEach(player => {
            dispatch({
              type: 'UPDATE_PLAYER_POSITION',
              payload: { playerId: player.id, position: player.position },
            });
          });
        }
      },
      onRedo: (state) => {
        // Restore formation and player positions from history
        if (state.formation && state.players) {
          dispatch({
            type: 'SET_ACTIVE_FORMATION',
            payload: { team: 'home', formationId: state.formation.id },
          });
          // Update player positions
          state.players.forEach(player => {
            dispatch({
              type: 'UPDATE_PLAYER_POSITION',
              payload: { playerId: player.id, position: player.position },
            });
          });
        }
      },
    },
  );

  // Toolbar Actions
  const handleSave = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const handleSaveFormation = useCallback(
    (name: string, notes?: string) => {
      if (!currentFormation) {
        return;
      }

      const exportData = {
        id: Date.now().toString(),
        name,
        formation: currentFormation,
        players,
        createdAt: new Date().toISOString(),
        notes,
      };

      const savedFormations = JSON.parse(localStorage.getItem('savedFormations') || '[]');
      savedFormations.push(exportData);
      localStorage.setItem('savedFormations', JSON.stringify(savedFormations));

      // eslint-disable-next-line no-console
      console.log('Formation saved:', name);
    },
    [currentFormation, players],
  );

  const handleLoad = useCallback(() => {
    setShowLoadModal(true);
  }, []);

  const handleLoadFormation = useCallback(
    (savedFormation: any) => {
      if (savedFormation.formation) {
        dispatch({
          type: 'SET_ACTIVE_FORMATION',
          payload: { team: 'home', formationId: savedFormation.formation.id },
        });
      }

      // Update player positions if available
      if (savedFormation.players) {
        savedFormation.players.forEach((player: Player) => {
          dispatch({
            type: 'UPDATE_PLAYER_POSITION',
            payload: { playerId: player.id, position: player.position },
          });
        });
      }

      // eslint-disable-next-line no-console
      console.log('Formation loaded:', savedFormation.name);
    },
    [dispatch],
  );

  const handleDeleteFormation = useCallback((id: string) => {
    const savedFormations = JSON.parse(localStorage.getItem('savedFormations') || '[]');
    const updated = savedFormations.filter((f: any) => f.id !== id);
    localStorage.setItem('savedFormations', JSON.stringify(updated));
    // Force re-render by closing and reopening modal
    setShowLoadModal(false);
    setTimeout(() => setShowLoadModal(true), 0);
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

  const handleFormationChange = useCallback(
    (formationId: string) => {
      dispatch({
        type: 'SET_ACTIVE_FORMATION',
        payload: { team: 'home', formationId },
      });
      
      // Push to history
      historySystem.pushState(
        createHistorySnapshot(
          tacticsState?.formations?.[formationId] || currentFormation || { id: '', name: '', positions: [] },
          players,
          [],
        ),
      );
    },
    [dispatch, historySystem, tacticsState, currentFormation, players],
  );

  // History Actions
  const handleUndo = useCallback(() => {
    historySystem.undo();
  }, [historySystem]);

  const handleRedo = useCallback(() => {
    historySystem.redo();
  }, [historySystem]);

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
  const handlePlayerMove = useCallback(
    (
      playerId: string,
      position: { x: number; y: number },
      _targetPlayerId?: string,
    ) => {
      dispatch({
        type: 'UPDATE_PLAYER_POSITION',
        payload: { playerId, position },
      });

      // Push to history after player movement
      const updatedPlayers = players.map(p =>
        p.id === playerId ? { ...p, position } : p,
      );
      historySystem.pushState(
        createHistorySnapshot(
          currentFormation || { id: '', name: '', positions: [] },
          updatedPlayers,
          [],
        ),
      );
    },
    [dispatch, historySystem, currentFormation, players],
  );

  const handleFieldPlayerSelect = useCallback((player: Player) => {
    setSelectedPlayer(player);
    setSelectedPlayerIds(new Set([player.id]));
  }, []);

  // Filter handlers
  const handleFilterChange = useCallback((newFilters: Partial<RosterFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      positions: { positions: [], includeAll: true },
      overall: { min: 0, max: 100, enabled: false },
      pace: { min: 0, max: 100, enabled: false },
      stamina: { min: 0, max: 100, enabled: false },
      morale: { min: 0, max: 100, enabled: false },
      fitness: { min: 0, max: 100, enabled: false },
      age: { min: 16, max: 40, enabled: false },
      status: { available: true, injured: false, suspended: false, tired: false },
    });
  }, []);

  const handleSaveFilterPreset = useCallback((name: string, description?: string) => {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      description,
      filters: { ...filters },
      createdAt: new Date(),
    };
    setFilterPresets(prev => [...prev, preset]);
    setActivePresetId(preset.id);
  }, [filters]);

  const handleLoadFilterPreset = useCallback((presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      setActivePresetId(presetId);
    }
  }, [filterPresets]);

  const handleDeleteFilterPreset = useCallback((presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
  }, [activePresetId]);

  // Comparison handlers
  const handleAddToComparison = useCallback((playerId: string) => {
    setComparisonPlayerIds(prev => {
      if (prev.includes(playerId) || prev.length >= 4) {
        return prev;
      }
      const updated = [...prev, playerId];
      if (updated.length > 0) {
        setShowComparison(true);
      }
      return updated;
    });
  }, []);

  const handleRemoveFromComparison = useCallback((playerId: string) => {
    setComparisonPlayerIds(prev => {
      const updated = prev.filter(id => id !== playerId);
      if (updated.length === 0) {
        setShowComparison(false);
      }
      return updated;
    });
  }, []);

  const handleClearComparison = useCallback(() => {
    setComparisonPlayerIds([]);
    setShowComparison(false);
  }, []);

  return (
    <TacticsErrorBoundary>
      <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden">
        {/* Enhanced Toolbar */}
        <EnhancedToolbar
            onSave={handleSave}
            onLoad={handleLoad}
            onExport={handleExport}
            onPrint={handlePrint}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historySystem.canUndo}
            canRedo={historySystem.canRedo}
            currentFormation={currentFormation}
            onFormationChange={handleFormationChange}
            availableFormations={Object.values(tacticsState?.formations || {})}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Player Roster Sidebar */}
            <div className="w-80 border-r border-slate-700 bg-slate-800/50 overflow-hidden flex flex-col">
              {/* Filter Panel (Collapsible) */}
              {showFilters && (
                <div className="border-b border-slate-700">
                  <FilterPanel
                    filters={filters}
                    presets={filterPresets}
                    activePresetId={activePresetId}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    onSavePreset={handleSaveFilterPreset}
                    onLoadPreset={handleLoadFilterPreset}
                    onDeletePreset={handleDeleteFilterPreset}
                    isExpanded={true}
                    onToggleExpanded={() => setShowFilters(false)}
                  />
                </div>
              )}

              {/* Filter Toggle Button */}
              {!showFilters && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 border-b border-slate-700 transition-colors"
                  type="button"
                >
                  <span>Show Filters</span>
                </button>
              )}

              {/* Roster Grid */}
              <div className="flex-1 overflow-hidden">
                <RosterGrid
                  players={players}
                  selectedPlayerIds={selectedPlayerIds}
                  comparisonPlayerIds={comparisonPlayerIds}
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
                  onAddToComparison={handleAddToComparison}
                  onRemoveFromComparison={handleRemoveFromComparison}
                  containerWidth={320}
                  containerHeight={800}
                />
              </div>

              {/* Comparison Toggle Button */}
              {comparisonPlayerIds.length > 0 && !showComparison && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 border-t border-slate-700 transition-colors"
                  type="button"
                >
                  <span>Compare {comparisonPlayerIds.length} Players</span>
                </button>
              )}
            </div>

            {/* Comparison View (Modal/Sidebar) */}
            {showComparison && comparisonPlayerIds.length > 0 && (
              <div className="w-96 border-r border-slate-700 bg-slate-800 overflow-auto">
                <ComparisonView
                  players={allPlayers.filter(p => comparisonPlayerIds.includes(p.id))}
                  onRemovePlayer={handleRemoveFromComparison}
                  onClearAll={handleClearComparison}
                  maxPlayers={4}
                />
                <button
                  onClick={() => setShowComparison(false)}
                  className="w-full px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 border-t border-slate-700 transition-colors"
                  type="button"
                >
                  Hide Comparison
                </button>
              </div>
            )}

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

        {/* Modals */}
        <SaveFormationModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveFormation}
          defaultName={currentFormation?.name || 'Custom Formation'}
        />

        <LoadFormationModal
          isOpen={showLoadModal}
          onClose={() => setShowLoadModal(false)}
          onLoad={handleLoadFormation}
          onDelete={handleDeleteFormation}
        />
    </TacticsErrorBoundary>
  );
};

export default TacticsBoardPageNew;
