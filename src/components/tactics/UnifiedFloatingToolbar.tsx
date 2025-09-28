import React, { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  Sidebar,
  User,
  Grid3X3,
  Target,
  Activity,
  Save,
  Share2,
  Undo,
  Trash2,
  MousePointer2,
  ArrowRight,
  Minus,
  Square,
  Pen,
  Type,
  Palette,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { DrawingTool, DrawingShape, Formation, Player } from '../../types';
import { FormationAutoSave } from './FormationAutoSave';
import PlayerDisplaySettings, { PlayerDisplayConfig } from './PlayerDisplaySettings';

export type PositioningMode = 'snap' | 'free';

interface UnifiedFloatingToolbarProps {
  // Player and formation state
  selectedPlayer: Player | null;
  currentFormation: Formation | undefined;
  currentPlayers: Player[];
  onFormationChange: (formation: Formation) => void;
  onNotification?: (message: string, type: 'success' | 'error' | 'info') => void;

  // Sidebar toggles
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;

  // Drawing tools
  drawingTool: DrawingTool;
  drawingColor: string;
  drawings: DrawingShape[];
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onUndoDrawing: () => void;
  onClearDrawings: () => void;

  // View controls
  positioningMode: PositioningMode;
  isGridVisible: boolean;
  isFormationStrengthVisible: boolean;
  onPositioningModeToggle: () => void;
  onGridToggle: () => void;
  onFormationStrengthToggle: () => void;

  // Animation controls
  isAnimating: boolean;
  canPlayAnimation: boolean;
  onPlayAnimation: () => void;
  onResetAnimation: () => void;

  // View mode
  viewMode: 'standard' | 'fullscreen' | 'presentation';
  onToggleFullscreen?: () => void;

  // Player display settings
  playerDisplayConfig?: PlayerDisplayConfig;
  onPlayerDisplayConfigChange?: (config: PlayerDisplayConfig) => void;

  className?: string;
}

const ToolButton: React.FC<{
  label: string;
  shortcut?: string;
  tool?: DrawingTool;
  onClick: (tool?: DrawingTool) => void;
  isActive: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ label, shortcut, tool, isActive, onClick, disabled = false, children }) => (
  <button
    aria-label={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    onClick={() => onClick(tool)}
    disabled={disabled}
    className={`
      relative p-3 rounded-lg transition-all duration-200 flex items-center justify-center
      ${isActive
        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105'
        : disabled
        ? 'text-slate-500 cursor-not-allowed'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105'
      }
      ${!disabled && !isActive ? 'hover:shadow-md' : ''}
    `}
  >
    {children}
    {shortcut && (
      <span className="absolute -top-1 -right-1 text-xs bg-slate-600 text-white px-1 rounded text-[10px] leading-none py-0.5">
        {shortcut}
      </span>
    )}
  </button>
);

const ColorPicker: React.FC<{
  currentColor: string;
  onColorChange: (color: string) => void;
}> = ({ currentColor, onColorChange }) => {
  const predefinedColors = [
    '#ffffff', '#ef4444', '#f59e0b', '#eab308',
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f97316', '#10b981', '#6366f1'
  ];

  const sizeClass = 'w-8 h-8';

  return (
    <div className="relative group">
      <div className="flex items-center space-x-1">
        <div
          className={`${sizeClass} rounded-lg border-2 border-slate-500 cursor-pointer relative overflow-hidden`}
          style={{ backgroundColor: currentColor }}
        >
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Select drawing color"
          />
        </div>
        <Palette className="w-3 h-3 text-slate-400" />
      </div>
      
      {/* Predefined colors popup */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
        <div className="grid grid-cols-4 gap-1">
          {predefinedColors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-5 h-5 rounded border-2 transition-all ${
                currentColor === color ? 'border-white scale-110' : 'border-slate-500 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const UnifiedFloatingToolbar: React.FC<UnifiedFloatingToolbarProps> = ({
  selectedPlayer,
  currentFormation,
  currentPlayers,
  onFormationChange,
  onNotification = (message, type) => console.log(`${type}: ${message}`),
  showLeftSidebar,
  showRightSidebar,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  drawingTool,
  drawingColor,
  drawings,
  onToolChange,
  onColorChange,
  onUndoDrawing,
  onClearDrawings,
  positioningMode,
  isGridVisible,
  isFormationStrengthVisible,
  onPositioningModeToggle,
  onGridToggle,
  onFormationStrengthToggle,
  isAnimating,
  canPlayAnimation,
  onPlayAnimation,
  onResetAnimation,
  viewMode,
  onToggleFullscreen,
  playerDisplayConfig,
  onPlayerDisplayConfigChange,
  className = ''
}) => {
  // Keyboard shortcuts
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'v':
        onToolChange('select');
        break;
      case 'a':
        onToolChange('arrow');
        break;
      case 'l':
        onToolChange('line');
        break;
      case 'r':
        onToolChange('zone');
        break;
      case 'p':
        onToolChange('pen');
        break;
      case 't':
        onToolChange('text');
        break;
      case 'g':
        onGridToggle();
        break;
      case 'z':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onUndoDrawing();
        }
        break;
      case 'escape':
        onToolChange('select');
        break;
    }
  }, [onToolChange, onGridToggle, onUndoDrawing]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        fixed top-20 left-1/2 transform -translate-x-1/2 z-50
        bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-2xl
        flex items-center divide-x divide-slate-600/50
        ${className}
      `}
    >
      {/* Left Section - Sidebar Toggles & Formation Info */}
      <div className="flex items-center gap-2 px-3 py-2">
        <ToolButton
          label="Toggle Left Sidebar"
          isActive={showLeftSidebar}
          onClick={onToggleLeftSidebar}
          size="sm"
        >
          <Menu className="w-4 h-4" />
        </ToolButton>

        <ToolButton
          label="Toggle Right Sidebar"
          isActive={showRightSidebar}
          onClick={onToggleRightSidebar}
          size="sm"
        >
          <Sidebar className="w-4 h-4" />
        </ToolButton>

        {/* Formation Info */}
        {currentFormation && (
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-2 py-1">
            <div className="text-white font-medium text-xs">
              {currentFormation.name}
            </div>
            <div className="w-1 h-1 bg-slate-400 rounded-full" />
            <div className="text-slate-400 text-xs">
              {currentFormation.slots?.filter(slot => slot.playerId).length || 0}/{currentFormation.slots?.length || 11}
            </div>
          </div>
        )}
      </div>

      {/* Center Section - Drawing Tools */}
      <div className="flex items-center gap-1 px-3 py-2">
        <ToolButton 
          label="Select" 
          shortcut="V" 
          tool="select" 
          isActive={drawingTool === 'select'} 
          onClick={onToolChange}
        >
          <MousePointer2 className="w-5 h-5" />
        </ToolButton>
        <ToolButton 
          label="Arrow" 
          shortcut="A" 
          tool="arrow" 
          isActive={drawingTool === 'arrow'} 
          onClick={onToolChange}
        >
          <ArrowRight className="w-5 h-5" />
        </ToolButton>
        <ToolButton 
          label="Line" 
          shortcut="L" 
          tool="line" 
          isActive={drawingTool === 'line'} 
          onClick={onToolChange}
        >
          <Minus className="w-5 h-5" />
        </ToolButton>
        <ToolButton 
          label="Zone" 
          shortcut="R" 
          tool="zone" 
          isActive={drawingTool === 'zone'} 
          onClick={onToolChange}
        >
          <Square className="w-5 h-5" />
        </ToolButton>
        <ToolButton 
          label="Pen" 
          shortcut="P" 
          tool="pen" 
          isActive={drawingTool === 'pen'} 
          onClick={onToolChange}
        >
          <Pen className="w-5 h-5" />
        </ToolButton>
        <ToolButton 
          label="Text" 
          shortcut="T" 
          tool="text" 
          isActive={drawingTool === 'text'} 
          onClick={onToolChange}
        >
          <Type className="w-5 h-5" />
        </ToolButton>
        
        <ColorPicker currentColor={drawingColor} onColorChange={onColorChange} />
      </div>

      {/* Right Section - View Controls & Actions */}
      <div className="flex items-center gap-1 px-3 py-2">
        <ToolButton 
          label="Toggle Grid" 
          shortcut="G" 
          isActive={isGridVisible} 
          onClick={onGridToggle}
        >
          <Grid3X3 className="w-5 h-5" />
        </ToolButton>
        <ToolButton 
          label="Formation Strength" 
          isActive={isFormationStrengthVisible} 
          onClick={onFormationStrengthToggle}
        >
          <Activity className="w-5 h-5" />
        </ToolButton>
        <ToolButton
          label={`Positioning Mode: ${positioningMode === 'snap' ? 'Snap to Position' : 'Free Movement'}`}
          isActive={positioningMode === 'free'}
          onClick={onPositioningModeToggle}
        >
          <Target className="w-5 h-5" />
        </ToolButton>
      </div>

      {/* Animation Controls */}
      <div className="flex items-center gap-1 px-3 py-2">
        {isAnimating ? (
          <ToolButton 
            label="Reset Animation" 
            isActive={false} 
            onClick={onResetAnimation}
          >
            <RotateCcw className="w-5 h-5 text-red-400" />
          </ToolButton>
        ) : (
          <ToolButton 
            label="Play Animation" 
            disabled={!canPlayAnimation}
            isActive={false} 
            onClick={onPlayAnimation}
          >
            <Play className="w-5 h-5" />
          </ToolButton>
        )}
      </div>

      {/* Drawing Actions */}
      <div className="flex items-center gap-1 px-3 py-2">
        <ToolButton 
          label="Undo Last Drawing" 
          shortcut="Ctrl+Z"
          disabled={drawings.length === 0}
          isActive={false} 
          onClick={onUndoDrawing}
        >
          <Undo className="w-5 h-5" />
        </ToolButton>
        <ToolButton 
          label="Clear All Drawings" 
          disabled={drawings.length === 0}
          isActive={false} 
          onClick={onClearDrawings}
        >
          <Trash2 className="w-5 h-5 text-red-400" />
        </ToolButton>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 px-3 py-2">
        {onToggleFullscreen && (
          <ToolButton
            label={viewMode === 'fullscreen' ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            isActive={false}
            onClick={onToggleFullscreen}
            size="sm"
          >
            {viewMode === 'fullscreen' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </ToolButton>
        )}
        
        <FormationAutoSave
          currentFormation={currentFormation}
          currentPlayers={currentPlayers}
          onLoadFormation={onFormationChange}
          onNotification={onNotification}
        />
        
        <button className="flex items-center gap-1 px-2 py-1 bg-blue-600/80 hover:bg-blue-700 text-white rounded-lg transition-all text-xs">
          <Share2 className="w-3 h-3" />
          Share
        </button>
        
        {/* Player Display Settings */}
        {playerDisplayConfig && onPlayerDisplayConfigChange && (
          <PlayerDisplaySettings
            config={playerDisplayConfig}
            onConfigChange={onPlayerDisplayConfigChange}
          />
        )}
      </div>

      {/* Selected Player Info */}
      {selectedPlayer && (
        <div className="flex items-center gap-2 bg-blue-600/20 border-l border-blue-500/30 px-3 py-2">
          <User className="w-3 h-3 text-blue-400" />
          <div>
            <div className="text-white font-medium text-xs">{selectedPlayer.name}</div>
            <div className="text-blue-300 text-xs">
              {selectedPlayer.roleId?.replace('-', ' ').toUpperCase() || 'Unknown Position'}
            </div>
          </div>
        </div>
      )}

      {/* Stats indicator */}
      {drawings.length > 0 && (
        <div className="text-slate-400 text-xs px-2 py-1 bg-slate-700/50 rounded-r-xl">
          {drawings.length} shape{drawings.length !== 1 ? 's' : ''}
        </div>
      )}
    </motion.div>
  );
};

export default UnifiedFloatingToolbar;