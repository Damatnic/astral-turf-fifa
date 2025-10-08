import React, { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MousePointer2,
  ArrowRight,
  Minus,
  Square,
  Circle,
  Pen,
  Type,
  Grid3X3,
  Target,
  Play,
  RotateCcw,
  Undo,
  Trash2,
  Palette,
  Activity,
} from 'lucide-react';
import type { DrawingTool, DrawingShape } from '../../types';

export type PositioningMode = 'snap' | 'free';

export interface DrawingState {
  tool: DrawingTool;
  color: string;
  isDrawing: boolean;
  shapes: DrawingShape[];
}

interface TacticalToolbarProps {
  drawingTool: DrawingTool;
  drawingColor: string;
  positioningMode: PositioningMode;
  isGridVisible: boolean;
  isFormationStrengthVisible: boolean;
  isAnimating: boolean;
  canPlayAnimation: boolean;
  drawings: DrawingShape[];
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onPositioningModeToggle: () => void;
  onGridToggle: () => void;
  onFormationStrengthToggle: () => void;
  onPlayAnimation: () => void;
  onResetAnimation: () => void;
  onUndoDrawing: () => void;
  onClearDrawings: () => void;
  className?: string;
}

const ToolButton: React.FC<{
  label: string;
  shortcut?: string;
  tool?: DrawingTool;
  onClick: (tool: DrawingTool) => void;
  isActive: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ label, shortcut, tool, isActive, onClick, disabled = false, children }) => (
  <button
    aria-label={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    onClick={() => tool && onClick(tool)}
    disabled={disabled}
    className={`
      relative p-3 rounded-lg transition-all duration-200 flex items-center justify-center
      ${
        isActive
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
    '#ffffff',
    '#ef4444',
    '#f59e0b',
    '#eab308',
    '#22c55e',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#f97316',
    '#10b981',
    '#6366f1',
  ];

  return (
    <div className="relative group">
      <div className="flex items-center space-x-1">
        <div
          className="w-8 h-8 rounded-lg border-2 border-slate-500 cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: currentColor }}
        >
          <input
            type="color"
            value={currentColor}
            onChange={e => onColorChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Select drawing color"
          />
        </div>
        <Palette className="w-4 h-4 text-slate-400" />
      </div>

      {/* Predefined colors popup */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
        <div className="grid grid-cols-4 gap-1">
          {predefinedColors.map(color => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-6 h-6 rounded border-2 transition-all ${
                currentColor === color
                  ? 'border-white scale-110'
                  : 'border-slate-500 hover:scale-105'
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

const TacticalToolbar: React.FC<TacticalToolbarProps> = ({
  drawingTool,
  drawingColor,
  positioningMode,
  isGridVisible,
  isFormationStrengthVisible,
  isAnimating,
  canPlayAnimation,
  drawings,
  onToolChange,
  onColorChange,
  onPositioningModeToggle,
  onGridToggle,
  onFormationStrengthToggle,
  onPlayAnimation,
  onResetAnimation,
  onUndoDrawing,
  onClearDrawings,
  className = '',
}) => {
  // Keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
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
    },
    [onToolChange, onGridToggle, onUndoDrawing],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30
        bg-slate-800/95  border border-slate-600/50 rounded-xl shadow-2xl
        flex items-center p-3 space-x-3
        ${className}
      `}
    >
      {/* Drawing Tools */}
      <div className="flex items-center space-x-1">
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
      </div>

      <div className="w-px h-8 bg-slate-600"></div>

      {/* View Options */}
      <div className="flex items-center space-x-1">
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
        <ColorPicker currentColor={drawingColor} onColorChange={onColorChange} />
      </div>

      <div className="w-px h-8 bg-slate-600"></div>

      {/* Animation Controls */}
      <div className="flex items-center space-x-1">
        {isAnimating ? (
          <ToolButton label="Reset Animation" isActive={false} onClick={onResetAnimation}>
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

      <div className="w-px h-8 bg-slate-600"></div>

      {/* Drawing Actions */}
      <div className="flex items-center space-x-1">
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

      {/* Stats indicator */}
      {drawings.length > 0 && (
        <div className="text-slate-400 text-xs px-2 py-1 bg-slate-700 rounded">
          {drawings.length} shape{drawings.length !== 1 ? 's' : ''}
        </div>
      )}
    </motion.div>
  );
};

export default TacticalToolbar;
