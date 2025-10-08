/**
 * REDESIGNED TACTICS BOARD - INTEGRATION COMPONENT
 * 
 * This component integrates all the newly redesigned components:
 * - Phase 1: PositioningSystem (dual modes, collision, snapping)
 * - Phase 2: ProfessionalPlayerCard (4 sizes)
 * - Phase 3: ProfessionalRosterSystem (filtering, search)
 * - Phase 4: EnhancedTacticsToolbar + EnhancedFieldOverlays
 * 
 * Use this component instead of UnifiedTacticsBoard to see the redesign.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player, Formation } from '../../types';

// Import all new redesigned components
import { PositioningSystem } from '../../systems/PositioningSystem';
import { ProfessionalRosterSystem } from '../roster/ProfessionalRosterSystem';
import { EnhancedTacticsToolbar } from './EnhancedTacticsToolbar';
import { EnhancedFieldOverlays } from './EnhancedFieldOverlays';
import type { 
  Formation as ToolbarFormation,
  TacticalPreset,
  ViewOptions 
} from './EnhancedTacticsToolbar';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RedesignedTacticsBoardProps {
  initialPlayers?: Player[];
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RedesignedTacticsBoard: React.FC<RedesignedTacticsBoardProps> = ({
  initialPlayers = [],
  className = '',
}) => {
  // State
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [positionedPlayers, setPositionedPlayers] = useState<Player[]>([]);
  const [currentFormation, setCurrentFormation] = useState<ToolbarFormation | undefined>();
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showGrid: true,
    showZones: false,
    showHeatmap: false,
    showPassingLanes: false,
    showDefensiveLine: false,
    showPlayerNames: true,
    showPlayerRatings: true,
  });
  
  // History for undo/redo
  const [history, setHistory] = useState<Player[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Field dimensions
  const fieldDimensions = {
    width: 800,
    height: 600,
    gridSize: 50,
  };
  
  // Handlers
  const handlePlayerSelect = useCallback((player: Player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      }
      return [...prev, player];
    });
  }, []);
  
  const handlePlayerPosition = useCallback((player: Player, position: { x: number; y: number }) => {
    setPositionedPlayers(prev => {
      const newPlayers = prev.filter(p => p.id !== player.id);
      return [...newPlayers, { ...player, position }];
    });
    
    // Add to history
    setHistory(prev => [...prev.slice(0, historyIndex + 1), positionedPlayers]);
    setHistoryIndex(prev => prev + 1);
  }, [positionedPlayers, historyIndex]);
  
  const handleFormationChange = useCallback((formation: ToolbarFormation) => {
    setCurrentFormation(formation);
    // Apply formation positions to players
    // This would need formation position data
  }, []);
  
  const handlePresetApply = useCallback((preset: TacticalPreset) => {
    console.log('Applying preset:', preset);
    // Apply tactical preset
  }, []);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setPositionedPlayers(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setPositionedPlayers(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);
  
  const handleAutoFill = useCallback(() => {
    console.log('Auto-filling positions...');
    // Implement auto-fill logic
  }, []);
  
  const handleOptimize = useCallback(() => {
    console.log('Optimizing lineup...');
    // Implement optimization logic
  }, []);
  
  const handleClear = useCallback(() => {
    setPositionedPlayers([]);
    setHistory(prev => [...prev, []]);
    setHistoryIndex(prev => prev + 1);
  }, []);
  
  return (
    <div className={`redesigned-tactics-board h-screen flex flex-col bg-gray-950 ${className}`}>
      {/* Enhanced Toolbar */}
      <div className="flex-shrink-0">
        <EnhancedTacticsToolbar
          onFormationChange={handleFormationChange}
          onPresetApply={handlePresetApply}
          onSave={() => console.log('Saving...')}
          onLoad={() => console.log('Loading...')}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onViewChange={setViewOptions}
          onExport={() => console.log('Exporting...')}
          onShare={() => console.log('Sharing...')}
          onAutoFill={handleAutoFill}
          onClear={handleClear}
          onOptimize={handleOptimize}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          currentFormation={currentFormation}
          viewOptions={viewOptions}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Roster */}
        <div className="w-96 flex-shrink-0 overflow-hidden border-r border-gray-800">
          <ProfessionalRosterSystem
            players={players}
            selectedPlayers={selectedPlayers}
            onSelectPlayer={handlePlayerSelect}
            onSelectMultiple={setSelectedPlayers}
            onEdit={(player) => console.log('Edit:', player)}
            onCompare={(players) => console.log('Compare:', players)}
            onSwap={(p1, p2) => console.log('Swap:', p1, p2)}
            onFavorite={(player) => console.log('Favorite:', player)}
            onExport={(players) => console.log('Export:', players)}
            onImport={() => console.log('Import...')}
          />
        </div>
        
        {/* Center - Field with Overlays */}
        <div className="flex-1 relative bg-gradient-to-br from-green-900 via-green-800 to-green-900 overflow-auto">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            {/* Field Container */}
            <div 
              className="relative"
              style={{
                width: fieldDimensions.width,
                height: fieldDimensions.height,
              }}
            >
              {/* Enhanced Field Overlays */}
              <EnhancedFieldOverlays
                players={positionedPlayers}
                dimensions={fieldDimensions}
                showGrid={viewOptions.showGrid}
                showZones={viewOptions.showZones}
                showHeatmap={viewOptions.showHeatmap}
                showPassingLanes={viewOptions.showPassingLanes}
                showDefensiveLine={viewOptions.showDefensiveLine}
                showMeasurements={true}
              />
              
              {/* Positioning System */}
              <div className="absolute inset-0">
                <PositioningSystem
                  players={positionedPlayers}
                  onPlayerMove={handlePlayerPosition}
                  mode="formation"
                  fieldDimensions={fieldDimensions}
                  showPlayerNames={viewOptions.showPlayerNames}
                  showPlayerRatings={viewOptions.showPlayerRatings}
                />
              </div>
            </div>
          </div>
          
          {/* Info Overlay */}
          <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-xl">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Players Positioned:</span>
                <span className="text-white font-bold">{positionedPlayers.length}/11</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Formation:</span>
                <span className="text-cyan-400 font-medium">
                  {currentFormation?.name || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Overlays Active:</span>
                <span className="text-white font-bold">
                  {Object.values(viewOptions).filter(Boolean).length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Instructions Overlay */}
          {positionedPlayers.length === 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-cyan-500/50 rounded-2xl p-8 max-w-md text-center shadow-2xl">
                <div className="text-6xl mb-4">⚽</div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Welcome to the Redesigned Tactics Board!
                </h2>
                <p className="text-gray-300 mb-4">
                  This is the completely redesigned tactics board with:
                </p>
                <ul className="text-left text-gray-400 space-y-2 mb-6">
                  <li>• Professional dual-mode positioning</li>
                  <li>• Beautiful player cards (4 sizes)</li>
                  <li>• Advanced roster filtering</li>
                  <li>• 6 tactical overlays</li>
                  <li>• Formation quick-select</li>
                  <li>• Undo/redo system</li>
                </ul>
                <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-3">
                  <p className="text-cyan-300 text-sm font-medium">
                    👉 Select players from the roster and drag them onto the field!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-gray-400">Redesigned Tactics Board Active</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">
            Phase 1-4 Complete • {players.length} Players Available
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span>Press ? for shortcuts</span>
          <span>•</span>
          <span>Ctrl+Z/Y for undo/redo</span>
        </div>
      </div>
    </div>
  );
};

export default RedesignedTacticsBoard;

