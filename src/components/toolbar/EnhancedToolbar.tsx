import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  FolderOpen,
  Download,
  Printer,
  Undo2,
  Redo2,
  Grid3x3,
  Zap,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Formation } from '../../types';

export interface EnhancedToolbarProps {
  // File operations
  onSave?: () => void;
  onLoad?: () => void;
  onExport?: () => void;
  onPrint?: () => void;

  // History
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;

  // Formation
  currentFormation?: Formation;
  availableFormations?: Formation[];
  onFormationChange?: (formationId: string) => void;

  // Quick actions
  onQuickAnalysis?: () => void;
  onAIAssist?: () => void;

  className?: string;
}

interface ToolbarButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  disabled,
  icon,
  label,
  shortcut,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
      'transition-all duration-200',
      'border border-slate-600/50 backdrop-blur-sm',
      disabled
        ? 'opacity-40 cursor-not-allowed bg-slate-800/30'
        : 'hover:bg-slate-700/50 hover:border-primary-500/50 active:scale-95',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
    )}
    title={shortcut ? `${label} (${shortcut})` : label}
  >
    {icon}
    <span className="hidden md:inline">{label}</span>
    {shortcut && (
      <span className="hidden lg:inline text-xs text-slate-400 ml-1">
        {shortcut}
      </span>
    )}
  </button>
);

export const EnhancedToolbar: React.FC<EnhancedToolbarProps> = ({
  onSave,
  onLoad,
  onExport,
  onPrint,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  currentFormation,
  availableFormations = [],
  onFormationChange,
  onQuickAnalysis,
  onAIAssist,
  className,
}) => {
  const handleFormationSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onFormationChange) {
        onFormationChange(e.target.value);
      }
    },
    [onFormationChange],
  );

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'w-full border-b border-slate-700 bg-slate-800/90 backdrop-blur-md',
        'shadow-lg',
        className,
      )}
    >
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* File Operations */}
        <div className="flex items-center gap-2">
          <ToolbarButton
            onClick={onSave}
            icon={<Save className="w-4 h-4" />}
            label="Save"
            shortcut="Ctrl+S"
          />
          <ToolbarButton
            onClick={onLoad}
            icon={<FolderOpen className="w-4 h-4" />}
            label="Load"
            shortcut="Ctrl+O"
          />
          <ToolbarButton
            onClick={onExport}
            icon={<Download className="w-4 h-4" />}
            label="Export"
          />
          <ToolbarButton
            onClick={onPrint}
            icon={<Printer className="w-4 h-4" />}
            label="Print"
            shortcut="Ctrl+P"
          />
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-slate-600/50" />

        {/* History */}
        <div className="flex items-center gap-2">
          <ToolbarButton
            onClick={onUndo}
            disabled={!canUndo}
            icon={<Undo2 className="w-4 h-4" />}
            label="Undo"
            shortcut="Ctrl+Z"
          />
          <ToolbarButton
            onClick={onRedo}
            disabled={!canRedo}
            icon={<Redo2 className="w-4 h-4" />}
            label="Redo"
            shortcut="Ctrl+Y"
          />
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-slate-600/50" />

        {/* Formation Selector */}
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-slate-400" />
          <select
            value={currentFormation?.id || ''}
            onChange={handleFormationSelect}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium',
              'bg-slate-700/50 border border-slate-600/50 text-slate-200',
              'hover:bg-slate-700 focus:bg-slate-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
              'transition-all duration-200',
            )}
          >
            <option value="">Select Formation</option>
            {availableFormations.map((formation) => (
              <option key={formation.id} value={formation.id}>
                {formation.name || `Formation ${formation.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {onQuickAnalysis && (
            <ToolbarButton
              onClick={onQuickAnalysis}
              icon={<Grid3x3 className="w-4 h-4" />}
              label="Analysis"
            />
          )}
          {onAIAssist && (
            <ToolbarButton
              onClick={onAIAssist}
              icon={<Zap className="w-4 h-4 text-yellow-400" />}
              label="AI Assist"
            />
          )}
        </div>

        {/* Formation Info */}
        {currentFormation && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <span className="text-xs text-slate-400">Current:</span>
            <span className="text-sm font-medium text-primary-400">
              {currentFormation.name || 'Untitled'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedToolbar;
