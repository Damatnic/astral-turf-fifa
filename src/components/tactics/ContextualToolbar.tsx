import React from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  Sidebar,
  User,
  Settings,
  Eye,
  EyeOff,
  Grid3X3,
  Save,
  Share2,
  Undo,
  Redo,
} from 'lucide-react';
import { type Formation, type Player } from '../../types';

interface ContextualToolbarProps {
  selectedPlayer: Player | null;
  currentFormation: Formation | undefined;
  onFormationChange: (formation: Formation) => void;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  viewMode: 'standard' | 'fullscreen' | 'presentation';
}

const ContextualToolbar: React.FC<ContextualToolbarProps> = ({
  selectedPlayer,
  currentFormation,
  onFormationChange,
  showLeftSidebar,
  showRightSidebar,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  viewMode,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
      {/* Left Controls */}
      <div className="flex items-center gap-3">
        {/* Panel Toggles */}
        <button
          onClick={onToggleLeftSidebar}
          className={`
            p-2 rounded-lg transition-all
            ${ showLeftSidebar
              ? 'bg-blue-600/80 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }
          `}
          title="Toggle Left Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleRightSidebar}
          className={`
            p-2 rounded-lg transition-all
            ${ showRightSidebar
              ? 'bg-blue-600/80 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }
          `}
          title="Toggle Right Sidebar"
        >
          <Sidebar className="w-5 h-5" />
        </button>

        {/* Formation Info */}
        {currentFormation && (
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5">
            <div className="text-white font-medium text-sm">
              {currentFormation.name}
            </div>
            <div className="w-1 h-1 bg-slate-400 rounded-full" />
            <div className="text-slate-400 text-xs">
              {currentFormation.slots?.filter(slot => slot.playerId).length || 0}/{currentFormation.slots?.length || 11} players
            </div>
          </div>
        )}
      </div>

      {/* Center - Selected Player Info */}
      {selectedPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2"
        >
          <User className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-white font-medium text-sm">{selectedPlayer.name}</div>
            <div className="text-blue-300 text-xs">
              {selectedPlayer.roleId?.replace('-', ' ').toUpperCase() || 'Unknown Position'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <button
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-600" />

        <button
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          title="Toggle Grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <button
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          title="View Settings"
        >
          <Eye className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-600" />

        <button
          className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all text-sm"
          title="Save Formation"
        >
          <Save className="w-4 h-4" />
          Save
        </button>

        <button
          className="flex items-center gap-2 px-3 py-2 bg-blue-600/80 hover:bg-blue-700 text-white rounded-lg transition-all text-sm"
          title="Share Formation"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
};

export { ContextualToolbar };
export default ContextualToolbar;