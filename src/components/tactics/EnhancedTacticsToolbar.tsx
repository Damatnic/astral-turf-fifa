/**
 * ENHANCED TACTICS TOOLBAR
 * 
 * Professional toolbar system with:
 * - Formation quick-select with previews
 * - Tactical presets (attacking, balanced, defensive)
 * - Save/Load functionality with cloud sync
 * - Undo/Redo system with history
 * - View controls (grid, zones, heatmap)
 * - Export/Share options
 * - Quick actions (auto-fill, clear, optimize)
 * 
 * Based on FIFA and FM24 toolbar designs.
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Upload,
  Download,
  Undo,
  Redo,
  Grid3x3,
  Eye,
  EyeOff,
  Zap,
  Target,
  Shield,
  Activity,
  TrendingUp,
  Users,
  Copy,
  Share2,
  Settings,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Sparkles,
  List,
  ChevronDown,
  Check,
  X,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  Layers,
  Map,
  Compass,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Formation {
  id: string;
  name: string;
  positions: Array<{ x: number; y: number; role: string }>;
  style: 'attacking' | 'balanced' | 'defensive';
  preview: string; // SVG or emoji representation
}

export interface TacticalPreset {
  id: string;
  name: string;
  description: string;
  formation: string;
  instructions: Record<string, any>;
  mentality: 'ultra-attacking' | 'attacking' | 'balanced' | 'defensive' | 'ultra-defensive';
}

export interface ViewOptions {
  showGrid: boolean;
  showZones: boolean;
  showHeatmap: boolean;
  showPassingLanes: boolean;
  showDefensiveLine: boolean;
  showPlayerNames: boolean;
  showPlayerRatings: boolean;
}

export interface EnhancedToolbarProps {
  onFormationChange?: (formation: Formation) => void;
  onPresetApply?: (preset: TacticalPreset) => void;
  onSave?: () => void;
  onLoad?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onViewChange?: (options: ViewOptions) => void;
  onExport?: () => void;
  onShare?: () => void;
  onAutoFill?: () => void;
  onClear?: () => void;
  onOptimize?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  currentFormation?: Formation;
  viewOptions?: ViewOptions;
  className?: string;
}

// ============================================================================
// COMMON FORMATIONS
// ============================================================================

const FORMATIONS: Formation[] = [
  {
    id: '4-3-3',
    name: '4-3-3',
    positions: [],
    style: 'attacking',
    preview: '4️⃣3️⃣3️⃣',
  },
  {
    id: '4-4-2',
    name: '4-4-2',
    positions: [],
    style: 'balanced',
    preview: '4️⃣4️⃣2️⃣',
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    positions: [],
    style: 'attacking',
    preview: '4️⃣2️⃣3️⃣1️⃣',
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    positions: [],
    style: 'balanced',
    preview: '3️⃣5️⃣2️⃣',
  },
  {
    id: '5-3-2',
    name: '5-3-2',
    positions: [],
    style: 'defensive',
    preview: '5️⃣3️⃣2️⃣',
  },
  {
    id: '4-1-4-1',
    name: '4-1-4-1',
    positions: [],
    style: 'balanced',
    preview: '4️⃣1️⃣4️⃣1️⃣',
  },
];

const TACTICAL_PRESETS: TacticalPreset[] = [
  {
    id: 'tiki-taka',
    name: 'Tiki-Taka',
    description: 'Possession-based passing game',
    formation: '4-3-3',
    instructions: {},
    mentality: 'attacking',
  },
  {
    id: 'counter-attack',
    name: 'Counter Attack',
    description: 'Fast transitions, direct play',
    formation: '4-4-2',
    instructions: {},
    mentality: 'defensive',
  },
  {
    id: 'high-press',
    name: 'High Press',
    description: 'Aggressive pressing, high line',
    formation: '4-2-3-1',
    instructions: {},
    mentality: 'ultra-attacking',
  },
  {
    id: 'park-bus',
    name: 'Park the Bus',
    description: 'Deep defensive block',
    formation: '5-3-2',
    instructions: {},
    mentality: 'ultra-defensive',
  },
];

// ============================================================================
// FORMATION SELECTOR
// ============================================================================

const FormationSelector: React.FC<{
  formations: Formation[];
  currentFormation?: Formation;
  onSelect: (formation: Formation) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ formations, currentFormation, onSelect, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl z-50"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
        >
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-white">Select Formation</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {formations.map((formation) => (
              <button
                key={formation.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  currentFormation?.id === formation.id
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
                onClick={() => {
                  onSelect(formation);
                  onClose();
                }}
              >
                <div className="text-3xl mb-2">{formation.preview}</div>
                <div className="font-bold text-white">{formation.name}</div>
                <div className={`text-xs mt-1 capitalize ${
                  formation.style === 'attacking' ? 'text-red-400' :
                  formation.style === 'balanced' ? 'text-blue-400' :
                  'text-green-400'
                }`}>
                  {formation.style}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// TACTICAL PRESETS
// ============================================================================

const TacticalPresetSelector: React.FC<{
  presets: TacticalPreset[];
  onSelect: (preset: TacticalPreset) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ presets, onSelect, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-full left-0 mt-2 w-96 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl z-50"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
        >
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Tactical Presets
            </h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {presets.map((preset) => (
              <button
                key={preset.id}
                className="w-full p-4 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-all duration-200 text-left"
                onClick={() => {
                  onSelect(preset);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-white">{preset.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{preset.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    preset.mentality.includes('attacking') ? 'bg-red-500/20 text-red-400' :
                    preset.mentality.includes('defensive') ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {preset.mentality.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </div>
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  {preset.formation}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// VIEW OPTIONS PANEL
// ============================================================================

const ViewOptionsPanel: React.FC<{
  options: ViewOptions;
  onChange: (options: ViewOptions) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ options, onChange, isOpen, onClose }) => {
  const toggleOption = (key: keyof ViewOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };
  
  const viewOptionsList = [
    { key: 'showGrid' as const, label: 'Grid Lines', icon: Grid3x3 },
    { key: 'showZones' as const, label: 'Tactical Zones', icon: Layers },
    { key: 'showHeatmap' as const, label: 'Heat Map', icon: Activity },
    { key: 'showPassingLanes' as const, label: 'Passing Lanes', icon: Target },
    { key: 'showDefensiveLine' as const, label: 'Defensive Line', icon: Shield },
    { key: 'showPlayerNames' as const, label: 'Player Names', icon: Users },
    { key: 'showPlayerRatings' as const, label: 'Player Ratings', icon: TrendingUp },
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-full right-0 mt-2 w-72 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl z-50"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
        >
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              View Options
            </h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="p-4 space-y-2">
            {viewOptionsList.map(({ key, label, icon: Icon }) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center">
                  <Icon className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-white">{label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggleOption(key)}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                />
              </label>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-700 flex justify-between">
            <button
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              onClick={() => {
                onChange({
                  showGrid: false,
                  showZones: false,
                  showHeatmap: false,
                  showPassingLanes: false,
                  showDefensiveLine: false,
                  showPlayerNames: false,
                  showPlayerRatings: false,
                });
              }}
            >
              Clear All
            </button>
            <button
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN TOOLBAR
// ============================================================================

export const EnhancedTacticsToolbar: React.FC<EnhancedToolbarProps> = ({
  onFormationChange,
  onPresetApply,
  onSave,
  onLoad,
  onUndo,
  onRedo,
  onViewChange,
  onExport,
  onShare,
  onAutoFill,
  onClear,
  onOptimize,
  canUndo = false,
  canRedo = false,
  currentFormation,
  viewOptions = {
    showGrid: true,
    showZones: false,
    showHeatmap: false,
    showPassingLanes: false,
    showDefensiveLine: false,
    showPlayerNames: true,
    showPlayerRatings: true,
  },
  className = '',
}) => {
  const [showFormations, setShowFormations] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  
  return (
    <div className={`enhanced-tactics-toolbar ${className}`}>
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-3 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          {/* Left Section - Formation & Presets */}
          <div className="flex items-center space-x-2">
            {/* Formation Selector */}
            <div className="relative">
              <button
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center"
                onClick={() => setShowFormations(!showFormations)}
              >
                <Users className="w-4 h-4 mr-2" />
                {currentFormation?.name || 'Formation'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              <FormationSelector
                formations={FORMATIONS}
                currentFormation={currentFormation}
                onSelect={(f) => onFormationChange?.(f)}
                isOpen={showFormations}
                onClose={() => setShowFormations(false)}
              />
            </div>
            
            {/* Tactical Presets */}
            <div className="relative">
              <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center"
                onClick={() => setShowPresets(!showPresets)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Presets
              </button>
              <TacticalPresetSelector
                presets={TACTICAL_PRESETS}
                onSelect={(p) => onPresetApply?.(p)}
                isOpen={showPresets}
                onClose={() => setShowPresets(false)}
              />
            </div>
            
            {/* Divider */}
            <div className="h-8 w-px bg-gray-600" />
            
            {/* Undo/Redo */}
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
              <button
                className={`p-2 rounded transition-colors ${
                  canUndo
                    ? 'hover:bg-gray-600 text-white'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded transition-colors ${
                  canRedo
                    ? 'hover:bg-gray-600 text-white'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              <button
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                onClick={onAutoFill}
                title="Auto-fill positions"
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                onClick={onOptimize}
                title="Optimize lineup"
              >
                <Target className="w-4 h-4" />
              </button>
              <button
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                onClick={onClear}
                title="Clear all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Right Section - Save/Load & View */}
          <div className="flex items-center space-x-2">
            {/* Save/Load */}
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
              <button
                className="p-2 rounded hover:bg-gray-600 text-white transition-colors"
                onClick={onSave}
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded hover:bg-gray-600 text-white transition-colors"
                onClick={onLoad}
                title="Load"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
            
            {/* Divider */}
            <div className="h-8 w-px bg-gray-600" />
            
            {/* View Options */}
            <div className="relative">
              <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center"
                onClick={() => setShowViewOptions(!showViewOptions)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
                {Object.values(viewOptions).filter(Boolean).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-cyan-400 text-black text-xs rounded-full font-bold">
                    {Object.values(viewOptions).filter(Boolean).length}
                  </span>
                )}
              </button>
              <ViewOptionsPanel
                options={viewOptions}
                onChange={(opts) => onViewChange?.(opts)}
                isOpen={showViewOptions}
                onClose={() => setShowViewOptions(false)}
              />
            </div>
            
            {/* Export/Share */}
            <div className="flex items-center space-x-1">
              <button
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                onClick={onExport}
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                onClick={onShare}
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            
            {/* Compact Toggle */}
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              onClick={() => setIsCompact(!isCompact)}
              title={isCompact ? 'Expand toolbar' : 'Compact toolbar'}
            >
              {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Compact Mode Info Bar */}
        {!isCompact && (
          <motion.div
            className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center space-x-6 text-gray-400">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>11/11 Players</span>
              </div>
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                <span>Avg Overall: 82</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>Team Chemistry: 95</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                Valid Formation
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTacticsToolbar;