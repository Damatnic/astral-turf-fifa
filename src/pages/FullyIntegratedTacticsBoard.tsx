/**
 * 🎯 FULLY INTEGRATED TACTICS BOARD
 * 
 * Complete integration of all enhanced components:
 * - Ultimate Player Cards with progression
 * - Professional Roster System
 * - Enhanced Toolbar with formations
 * - Positioning System
 * - Enhanced Field Overlays
 * - Drag and Drop functionality
 * - Undo/Redo system
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTacticsContext } from '../hooks';
import { useFormationHistory, createHistorySnapshot } from '../hooks/useFormationHistory';
import { TacticsErrorBoundary } from '../components/boundaries/TacticsErrorBoundary';
import { EnhancedTacticsToolbar } from '../components/tactics/EnhancedTacticsToolbar';
import { ProfessionalRosterSystem } from '../components/roster/ProfessionalRosterSystem';
import { EnhancedFieldOverlays } from '../components/tactics/EnhancedFieldOverlays';
import { PositioningSystem } from '../systems/PositioningSystem';
import { UltimatePlayerCard } from '../components/player/UltimatePlayerCard';
import { FormationLibraryPanel } from '../components/tactics/FormationLibraryPanel';
import { TacticalSuggestionsPanel } from '../components/tactics/TacticalSuggestionsPanel';
import { AdvancedDrawingTools } from '../components/tactics/AdvancedDrawingTools';
import { PlayerStatsPopover } from '../components/tactics/PlayerStatsPopover';
import { KeyboardShortcutsGuide } from '../components/help/KeyboardShortcutsGuide';
import { analyzeFormation } from '../utils/formationAnalyzer';
import { PROFESSIONAL_FORMATIONS } from '../data/professionalFormations';
import type { Player } from '../types';
import type { RosterFilters } from '../types/roster';
import type { ProfessionalFormation } from '../data/professionalFormations';
import type { FormationAnalysis } from '../utils/formationAnalyzer';
import {
  X,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Grid3x3,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';

/**
 * Main Fully Integrated Tactics Board Component
 */
const FullyIntegratedTacticsBoard: React.FC = () => {
  const tacticsContextData = useTacticsContext();
  
  // Null safety check
  if (!tacticsContextData) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Loading Tactics Board...</p>
        </div>
      </div>
    );
  }
  
  const { tacticsState, dispatch } = tacticsContextData;
  
  // UI State
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showRoster, setShowRoster] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // New Feature States
  const [showFormationLibrary, setShowFormationLibrary] = useState(false);
  const [showTacticalSuggestions, setShowTacticalSuggestions] = useState(false);
  const [showShortcutsGuide, setShowShortcutsGuide] = useState(false);
  const [formationAnalysis, setFormationAnalysis] = useState<FormationAnalysis | null>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [statsPopoverPosition, setStatsPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Roster Filters
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

  // Get current formation and players with null safety
  const currentFormation = useMemo(() => {
    try {
      return tacticsState?.formations?.[tacticsState?.activeFormationIds?.home];
    } catch (error) {
      console.error('Error getting formation:', error);
      return undefined;
    }
  }, [tacticsState]);
  
  const allPlayers = useMemo(() => {
    try {
      return Array.isArray(tacticsState?.players) ? tacticsState.players : [];
    } catch (error) {
      console.error('Error getting players:', error);
      return [];
    }
  }, [tacticsState]);

  // Formation History System (Undo/Redo)
  const historySystem = useFormationHistory(
    createHistorySnapshot(
      currentFormation || { id: '', name: '', positions: [] },
      allPlayers,
      [],
    ),
    {
      enableKeyboardShortcuts: true,
      onUndo: (state) => {
        if (state.formation && state.players) {
          dispatch({
            type: 'SET_ACTIVE_FORMATION',
            payload: { team: 'home', formationId: state.formation.id },
          });
          state.players.forEach(player => {
            dispatch({
              type: 'UPDATE_PLAYER_POSITION',
              payload: { 
                playerId: player.id, 
                position: player.fieldPosition,
              },
            });
          });
        }
      },
      onRedo: (state) => {
        if (state.formation && state.players) {
          dispatch({
            type: 'SET_ACTIVE_FORMATION',
            payload: { team: 'home', formationId: state.formation.id },
          });
          state.players.forEach(player => {
            dispatch({
              type: 'UPDATE_PLAYER_POSITION',
              payload: { 
                playerId: player.id, 
                position: player.fieldPosition,
              },
            });
          });
        }
      },
    },
  );

  // Handle formation selection from library
  const handleFormationSelect = useCallback((formation: ProfessionalFormation) => {
    // Get first available professional formation or create one
    const profFormation = PROFESSIONAL_FORMATIONS.find(f => f.id === formation.id);
    if (!profFormation) return;

    // Analyze the formation
    const analysis = analyzeFormation(profFormation, allPlayers);
    setFormationAnalysis(analysis);
    
    // Show tactical suggestions
    setShowTacticalSuggestions(true);
    
    // Formation successfully analyzed and ready to apply
    // TODO: Apply formation positions to players automatically
  }, [allPlayers]);

  // Keyboard shortcut for help
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !showShortcutsGuide) {
        e.preventDefault();
        setShowShortcutsGuide(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showShortcutsGuide]);

  // Handle player selection and card display
  const handlePlayerClick = useCallback((player: Player) => {
    setSelectedPlayer(player);
    setShowPlayerCard(true);
  }, []);

  // Handle player drag start
  const handleDragStart = useCallback((player: Player) => {
    setIsDragging(true);
    setSelectedPlayer(player);
  }, []);

  // Handle player drag end
  const handleDragEnd = useCallback((player: Player, newPosition: { x: number; y: number }) => {
    setIsDragging(false);
    
    // Save current state to history
    historySystem.saveState(
      createHistorySnapshot(
        currentFormation || { id: '', name: '', positions: [] },
        allPlayers,
        [],
      )
    );
    
    // Update player position
    dispatch({
      type: 'UPDATE_PLAYER_POSITION',
      payload: { 
        playerId: player.id, 
        position: newPosition,
      },
    });
  }, [dispatch, historySystem, currentFormation, allPlayers]);

  // Handle formation change
  const handleFormationChange = useCallback((formationId: string) => {
    historySystem.saveState(
      createHistorySnapshot(
        currentFormation || { id: '', name: '', positions: [] },
        allPlayers,
        [],
      )
    );
    
    dispatch({
      type: 'SET_ACTIVE_FORMATION',
      payload: { team: 'home', formationId },
    });
  }, [dispatch, historySystem, currentFormation, allPlayers]);

  // Handle save formation
  const handleSaveFormation = useCallback(() => {
    const formationData = {
      id: Date.now().toString(),
      name: currentFormation?.name || 'Custom Formation',
      formation: currentFormation,
      players: allPlayers,
      createdAt: new Date().toISOString(),
    };
    
    // Save to localStorage
    const savedFormations = JSON.parse(localStorage.getItem('savedFormations') || '[]');
    savedFormations.push(formationData);
    localStorage.setItem('savedFormations', JSON.stringify(savedFormations));
    
    // Show success notification
    dispatch({
      type: 'SET_NOTIFICATION',
      payload: {
        type: 'success',
        message: 'Formation saved successfully!',
      },
    });
  }, [currentFormation, allPlayers, dispatch]);

  // Handle roster player click (add to field)
  const handleRosterPlayerClick = useCallback((player: Player) => {
    // Find an available position on the field
    const occupiedPositions = new Set(
      allPlayers
        .filter(p => p.fieldPosition)
        .map(p => `${p.fieldPosition?.x},${p.fieldPosition?.y}`)
    );
    
    // Find first available position
    let availablePosition = null;
    for (let y = 20; y <= 80; y += 10) {
      for (let x = 20; x <= 80; x += 10) {
        const key = `${x},${y}`;
        if (!occupiedPositions.has(key)) {
          availablePosition = { x, y };
          break;
        }
      }
      if (availablePosition) break;
    }
    
    if (availablePosition) {
      dispatch({
        type: 'UPDATE_PLAYER_POSITION',
        payload: { 
          playerId: player.id, 
          position: availablePosition,
        },
      });
    }
  }, [allPlayers, dispatch]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <TacticsErrorBoundary>
      <div className="flex flex-col h-screen bg-slate-900">
        {/* Enhanced Toolbar */}
        <EnhancedTacticsToolbar
          currentFormation={currentFormation}
          onFormationChange={handleFormationChange}
          onSave={handleSaveFormation}
          onUndo={historySystem.undo}
          onRedo={historySystem.redo}
          canUndo={historySystem.canUndo}
          canRedo={historySystem.canRedo}
          onToggleOverlays={() => setShowOverlays(!showOverlays)}
          onToggleRoster={() => setShowRoster(!showRoster)}
          showOverlays={showOverlays}
          showRoster={showRoster}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Roster */}
          <AnimatePresence>
            {showRoster && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto"
              >
                <ProfessionalRosterSystem
                  players={allPlayers}
                  filters={filters}
                  onFiltersChange={setFilters}
                  onPlayerClick={handleRosterPlayerClick}
                  onPlayerDragStart={handleDragStart}
                  selectedPlayerId={selectedPlayer?.id}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center - Field with Positioning System */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Enhanced Field Overlays */}
            {showOverlays && (
              <EnhancedFieldOverlays
                currentFormation={currentFormation}
                players={allPlayers.filter(p => p.fieldPosition)}
              />
            )}

            {/* Positioning System */}
            <PositioningSystem
              players={allPlayers}
              currentFormation={currentFormation}
              onPlayerClick={handlePlayerClick}
              onPlayerDragStart={handleDragStart}
              onPlayerDragEnd={handleDragEnd}
              isDragging={isDragging}
              selectedPlayer={selectedPlayer}
            />

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg backdrop-blur-sm transition-colors z-10"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {/* Overlay Toggle */}
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className="absolute top-4 right-16 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg backdrop-blur-sm transition-colors z-10"
              title={showOverlays ? 'Hide Overlays' : 'Show Overlays'}
            >
              {showOverlays ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Player Card Modal */}
        <AnimatePresence>
          {showPlayerCard && selectedPlayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowPlayerCard(false)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: 'spring', damping: 20 }}
                className="relative max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowPlayerCard(false)}
                  className="absolute -top-4 -right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg z-10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Ultimate Player Card */}
                <UltimatePlayerCard
                  player={selectedPlayer}
                  showProgression={true}
                  size="xl"
                  interactive={true}
                  showChallenges={true}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Action Buttons */}
        <div className="absolute top-20 right-4 flex flex-col space-y-2 z-10">
          {/* Formation Library Button */}
          <button
            onClick={() => setShowFormationLibrary(true)}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg backdrop-blur-sm transition-colors shadow-lg group relative"
            title="Formation Library (12 Formations)"
          >
            <Grid3x3 className="w-5 h-5" />
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Formation Library
            </span>
          </button>

          {/* AI Suggestions Button */}
          <button
            onClick={() => setShowTacticalSuggestions(true)}
            className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg backdrop-blur-sm transition-colors shadow-lg group relative"
            title="AI Tactical Suggestions"
          >
            <Lightbulb className="w-5 h-5" />
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              AI Suggestions
            </span>
          </button>

          {/* Help Button */}
          <button
            onClick={() => setShowShortcutsGuide(true)}
            className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg backdrop-blur-sm transition-colors shadow-lg group relative"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Help (Press ?)
            </span>
          </button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-lg text-xs text-gray-400 z-10">
          <div className="flex items-center space-x-4">
            <span><kbd className="px-2 py-1 bg-slate-700 rounded">Ctrl+Z</kbd> Undo</span>
            <span><kbd className="px-2 py-1 bg-slate-700 rounded">Ctrl+Y</kbd> Redo</span>
            <span><kbd className="px-2 py-1 bg-slate-700 rounded">R</kbd> Toggle Roster</span>
            <span><kbd className="px-2 py-1 bg-slate-700 rounded">O</kbd> Toggle Overlays</span>
            <span><kbd className="px-2 py-1 bg-slate-700 rounded">?</kbd> Help</span>
          </div>
        </div>

        {/* Formation Library Modal */}
        <FormationLibraryPanel
          isOpen={showFormationLibrary}
          onClose={() => setShowFormationLibrary(false)}
          onSelectFormation={handleFormationSelect}
        />

        {/* Tactical Suggestions Panel */}
        {formationAnalysis && (
          <TacticalSuggestionsPanel
            analysis={formationAnalysis}
            isOpen={showTacticalSuggestions}
            onClose={() => setShowTacticalSuggestions(false)}
          />
        )}

        {/* Keyboard Shortcuts Guide */}
        <KeyboardShortcutsGuide
          isOpen={showShortcutsGuide}
          onClose={() => setShowShortcutsGuide(false)}
        />

        {/* Player Stats Popover */}
        {hoveredPlayer && statsPopoverPosition && (
          <PlayerStatsPopover
            player={hoveredPlayer}
            position={statsPopoverPosition}
            onClose={() => {
              setHoveredPlayer(null);
              setStatsPopoverPosition(null);
            }}
          />
        )}
      </div>
    </TacticsErrorBoundary>
  );
};

export default FullyIntegratedTacticsBoard;

