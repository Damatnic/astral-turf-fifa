/**
 * Perfected Tactical Board Toolbar
 * 
 * Features:
 * - Formation selection with preview
 * - Quick actions (save, load, export, undo/redo)
 * - View modes (standard, presentation, 3D)
 * - Drawing tools
 * - AI assistance toggle
 * - Zoom controls
 * - Grid toggle
 * - Keyboard shortcuts display
 * - Responsive design
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  Undo2,
  Redo2,
  Grid3x3,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Pen,
  Eraser,
  Type,
  Circle,
  Square,
  Triangle,
  MousePointer,
  Sparkles,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Printer,
  Camera,
  Users,
} from 'lucide-react';
import type { Formation } from '../../types';

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  badge?: number | string;
  shortcut?: string;
  variant?: 'default' | 'primary' | 'danger' | 'success';
}

export interface ToolbarSection {
  id: string;
  title: string;
  actions: ToolbarAction[];
}

interface PerfectedToolbarProps {
  // Formation
  currentFormation: Formation | undefined;
  availableFormations: Formation[];
  onFormationChange: (formationId: string) => void;

  // History
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  // File Operations
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onImport: () => void;
  onPrint: () => void;
  onShare?: () => void;
  onScreenshot?: () => void;

  // View Controls
  viewMode?: 'standard' | 'presentation' | '3d';
  onViewModeChange?: (mode: 'standard' | 'presentation' | '3d') => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;

  // Display Options
  showGrid: boolean;
  onToggleGrid: () => void;
  showStats?: boolean;
  onToggleStats?: () => void;
  showHeatMap?: boolean;
  onToggleHeatMap?: () => void;

  // Drawing
  drawingTool?: string;
  onDrawingToolChange?: (tool: string) => void;
  onClearDrawings?: () => void;

  // AI
  showAIAssistant?: boolean;
  onToggleAI?: () => void;

  // Animation
  isAnimating?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;

  // Misc
  onShowHelp?: () => void;
  onShowSettings?: () => void;
  onToggleRoster?: () => void;
  className?: string;
}

const PerfectedToolbar: React.FC<PerfectedToolbarProps> = ({
  currentFormation,
  availableFormations,
  onFormationChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  onExport,
  onImport,
  onPrint,
  onShare,
  onScreenshot,
  viewMode = 'standard',
  onViewModeChange,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showGrid,
  onToggleGrid,
  showStats,
  onToggleStats,
  showHeatMap,
  onToggleHeatMap,
  drawingTool,
  onDrawingToolChange,
  onClearDrawings,
  showAIAssistant,
  onToggleAI,
  isAnimating,
  onPlay,
  onPause,
  onStop,
  onShowHelp,
  onShowSettings,
  onToggleRoster,
  className = '',
}) => {
  const [showFormationMenu, setShowFormationMenu] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const formattedZoom = `${Math.round(zoom * 100)}%`;

  return (
    <div className={`bg-slate-900 border-b border-slate-700 shadow-lg ${className}`}>
      {/* Main Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto custom-scrollbar">
        {/* File Operations */}
        <div className="flex items-center gap-1 pr-3 border-r border-slate-700">
          <ToolbarButton
            icon={Save}
            label="Save"
            onClick={onSave}
            shortcut="Ctrl+S"
            variant="primary"
            tooltip="Save formation"
          />
          <ToolbarButton
            icon={FolderOpen}
            label="Load"
            onClick={onLoad}
            shortcut="Ctrl+O"
            tooltip="Load saved formation"
          />
          <ToolbarButton
            icon={Download}
            label="Export"
            onClick={onExport}
            shortcut="Ctrl+E"
            tooltip="Export as JSON"
          />
          <ToolbarButton
            icon={Upload}
            label="Import"
            onClick={onImport}
            tooltip="Import formation"
          />
        </div>

        {/* History */}
        <div className="flex items-center gap-1 pr-3 border-r border-slate-700">
          <ToolbarButton
            icon={Undo2}
            label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
            shortcut="Ctrl+Z"
            tooltip="Undo last action"
          />
          <ToolbarButton
            icon={Redo2}
            label="Redo"
            onClick={onRedo}
            disabled={!canRedo}
            shortcut="Ctrl+Y"
            tooltip="Redo action"
          />
        </div>

        {/* Formation Selector */}
        <div className="relative pr-3 border-r border-slate-700">
          <button
            onClick={() => setShowFormationMenu(!showFormationMenu)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Layers className="w-4 h-4" />
            <span>{currentFormation?.name || 'Select Formation'}</span>
            <svg className={`w-4 h-4 transition-transform ${showFormationMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Formation Dropdown */}
          <AnimatePresence>
            {showFormationMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 bg-slate-800 rounded-lg border border-slate-700 shadow-2xl z-50 min-w-[250px] max-h-[400px] overflow-y-auto"
              >
                {availableFormations.map((formation) => (
                  <button
                    key={formation.id}
                    onClick={() => {
                      onFormationChange(formation.id);
                      setShowFormationMenu(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3
                      ${currentFormation?.id === formation.id ? 'bg-slate-700 border-l-4 border-cyan-400' : ''}
                    `}
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{formation.name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {formation.slots?.length || 0} positions
                      </div>
                    </div>
                    {currentFormation?.id === formation.id && (
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1 pr-3 border-r border-slate-700">
          <ToolbarButton
            icon={Grid3x3}
            label="Grid"
            onClick={onToggleGrid}
            active={showGrid}
            tooltip="Toggle grid (G)"
            shortcut="G"
          />
          {onToggleStats && (
            <ToolbarButton
              icon={BarChart3}
              label="Stats"
              onClick={onToggleStats}
              active={showStats}
              tooltip="Toggle stats overlay"
            />
          )}
          {onToggleHeatMap && (
            <ToolbarButton
              icon={Activity}
              label="Heat"
              onClick={onToggleHeatMap}
              active={showHeatMap}
              tooltip="Toggle heat map"
            />
          )}
        </div>

        {/* Zoom Controls */}
        {onZoomIn && onZoomOut && (
          <div className="flex items-center gap-1 pr-3 border-r border-slate-700">
            <ToolbarButton
              icon={ZoomOut}
              label="-"
              onClick={onZoomOut}
              tooltip="Zoom out (-)"
              disabled={zoom <= 0.5}
            />
            <div className="px-2 text-xs text-slate-300 font-mono min-w-[50px] text-center">
              {formattedZoom}
            </div>
            <ToolbarButton
              icon={ZoomIn}
              label="+"
              onClick={onZoomIn}
              tooltip="Zoom in (+)"
              disabled={zoom >= 3}
            />
            {onResetZoom && (
              <ToolbarButton
                icon={Maximize2}
                label="Reset"
                onClick={onResetZoom}
                tooltip="Reset zoom (0)"
                size="sm"
              />
            )}
          </div>
        )}

        {/* Drawing Tools */}
        {onDrawingToolChange && (
          <div className="relative pr-3 border-r border-slate-700">
            <ToolbarButton
              icon={Pen}
              label="Draw"
              onClick={() => setShowDrawingTools(!showDrawingTools)}
              active={showDrawingTools || !!drawingTool}
              tooltip="Drawing tools (D)"
            />

            <AnimatePresence>
              {showDrawingTools && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 bg-slate-800 rounded-lg border border-slate-700 shadow-2xl z-50 p-2"
                >
                  <div className="grid grid-cols-3 gap-1">
                    <DrawingToolButton
                      icon={MousePointer}
                      label="Select"
                      active={drawingTool === 'select'}
                      onClick={() => {
                        onDrawingToolChange('select');
                        setShowDrawingTools(false);
                      }}
                    />
                    <DrawingToolButton
                      icon={Pen}
                      label="Pen"
                      active={drawingTool === 'pen'}
                      onClick={() => onDrawingToolChange('pen')}
                    />
                    <DrawingToolButton
                      icon={Type}
                      label="Text"
                      active={drawingTool === 'text'}
                      onClick={() => onDrawingToolChange('text')}
                    />
                    <DrawingToolButton
                      icon={Circle}
                      label="Circle"
                      active={drawingTool === 'circle'}
                      onClick={() => onDrawingToolChange('circle')}
                    />
                    <DrawingToolButton
                      icon={Square}
                      label="Square"
                      active={drawingTool === 'square'}
                      onClick={() => onDrawingToolChange('square')}
                    />
                    <DrawingToolButton
                      icon={Triangle}
                      label="Arrow"
                      active={drawingTool === 'arrow'}
                      onClick={() => onDrawingToolChange('arrow')}
                    />
                  </div>
                  {onClearDrawings && drawingTool && (
                    <button
                      onClick={onClearDrawings}
                      className="w-full mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Eraser className="w-3 h-3" />
                      Clear All
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* AI Assistant */}
        {onToggleAI && (
          <div className="pr-3 border-r border-slate-700">
            <ToolbarButton
              icon={Sparkles}
              label="AI"
              onClick={onToggleAI}
              active={showAIAssistant}
              variant={showAIAssistant ? 'primary' : 'default'}
              tooltip="AI Assistant (A)"
            />
          </div>
        )}

        {/* Animation Controls */}
        {(onPlay || onPause) && (
          <div className="flex items-center gap-1 pr-3 border-r border-slate-700">
            {!isAnimating && onPlay && (
              <ToolbarButton
                icon={Play}
                label="Play"
                onClick={onPlay}
                variant="success"
                tooltip="Play animation (Space)"
              />
            )}
            {isAnimating && onPause && (
              <ToolbarButton
                icon={Pause}
                label="Pause"
                onClick={onPause}
                variant="primary"
                tooltip="Pause animation (Space)"
              />
            )}
            {onStop && (
              <ToolbarButton
                icon={RotateCcw}
                label="Reset"
                onClick={onStop}
                tooltip="Reset animation (R)"
              />
            )}
          </div>
        )}

        {/* Output */}
        <div className="flex items-center gap-1 pr-3 border-r border-slate-700">
          {onShare && (
            <ToolbarButton
              icon={Share2}
              label="Share"
              onClick={onShare}
              tooltip="Share formation"
            />
          )}
          <ToolbarButton
            icon={Printer}
            label="Print"
            onClick={onPrint}
            tooltip="Print view (Ctrl+P)"
          />
          {onScreenshot && (
            <ToolbarButton
              icon={Camera}
              label="Screenshot"
              onClick={onScreenshot}
              tooltip="Capture screenshot"
            />
          )}
        </div>

        {/* Right Side */}
        <div className="ml-auto flex items-center gap-1">
          {onToggleRoster && (
            <ToolbarButton
              icon={Users}
              label="Roster"
              onClick={onToggleRoster}
              tooltip="Toggle roster sidebar"
            />
          )}
          {onShowSettings && (
            <ToolbarButton
              icon={Settings}
              label="Settings"
              onClick={onShowSettings}
              tooltip="Board settings"
            />
          )}
          {onShowHelp && (
            <ToolbarButton
              icon={HelpCircle}
              label="Help"
              onClick={onShowHelp}
              tooltip="Keyboard shortcuts (F1)"
            />
          )}
        </div>
      </div>

      {/* Secondary Toolbar (if view mode buttons exist) */}
      {onViewModeChange && (
        <div className="px-3 py-2 bg-slate-800/50 border-t border-slate-700/50 flex items-center gap-2">
          <span className="text-xs text-slate-400 mr-2">View:</span>
          <div className="flex gap-1">
            <ViewModeButton
              label="Standard"
              active={viewMode === 'standard'}
              onClick={() => onViewModeChange('standard')}
            />
            <ViewModeButton
              label="Presentation"
              active={viewMode === 'presentation'}
              onClick={() => onViewModeChange('presentation')}
            />
            <ViewModeButton
              label="3D"
              active={viewMode === '3d'}
              onClick={() => onViewModeChange('3d')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Toolbar Button Component
 */

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  badge?: number | string;
  shortcut?: string;
  tooltip?: string;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md';
}

const ToolbarButton: React.FC<ToolbarButtonProps> = memo(({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  badge,
  shortcut,
  tooltip,
  variant = 'default',
  size = 'md',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const variantClasses = {
    default: active ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white',
    primary: 'bg-cyan-600 text-white hover:bg-cyan-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  const sizeClasses = {
    sm: 'px-2 py-1.5',
    md: 'px-3 py-2',
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          rounded-lg border border-slate-600 transition-all duration-150
          flex items-center gap-2 text-sm font-medium
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800
          ${active ? 'ring-2 ring-cyan-400/50' : ''}
        `}
        title={tooltip}
      >
        <Icon className="w-4 h-4" />
        {size === 'md' && <span className="hidden xl:inline">{label}</span>}
        
        {badge !== undefined && (
          <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
            {badge}
          </span>
        )}
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && tooltip && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none z-50"
          >
            <div className="bg-slate-950 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-slate-700">
              {tooltip}
              {shortcut && (
                <span className="ml-2 text-slate-400">({shortcut})</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ToolbarButton.displayName = 'ToolbarButton';

/**
 * View Mode Button
 */

interface ViewModeButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ViewModeButton: React.FC<ViewModeButtonProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
        ${active
          ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
        }
      `}
    >
      {label}
    </button>
  );
};

/**
 * Drawing Tool Button
 */

interface DrawingToolButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

const DrawingToolButton: React.FC<DrawingToolButtonProps> = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 p-2 rounded-lg transition-all
        ${active
          ? 'bg-cyan-600 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
        }
      `}
      title={label}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs">{label}</span>
    </button>
  );
};

export default memo(PerfectedToolbar);


