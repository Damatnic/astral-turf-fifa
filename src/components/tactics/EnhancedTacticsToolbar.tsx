import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Zap,
  Brain,
  Save,
  Share2,
  BarChart3,
  Eye,
  Grid3x3,
  Layers,
  Settings,
  Maximize2,
  Play,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield,
  Target,
  Activity,
  Heart,
  Trophy,
  Download,
  Upload,
  Undo2,
  Redo2,
  Copy,
  FileText,
} from 'lucide-react';

interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  isActive?: boolean;
  disabled?: boolean;
  badge?: number | string;
  color?: string;
  category?: 'primary' | 'analysis' | 'tools' | 'export';
  tooltip?: string;
  shortcut?: string;
}

interface EnhancedTacticsToolbarProps {
  actions: ToolbarAction[];
  onHistoryUndo?: () => void;
  onHistoryRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  formationStrength?: number;
  validationStatus?: 'valid' | 'warning' | 'error';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const EnhancedTacticsToolbar: React.FC<EnhancedTacticsToolbarProps> = ({
  actions,
  onHistoryUndo,
  onHistoryRedo,
  canUndo = false,
  canRedo = false,
  formationStrength,
  validationStatus = 'valid',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Group actions by category
  const groupedActions = actions.reduce((acc, action) => {
    const category = action.category || 'tools';
    if (!acc[category]) {acc[category] = [];}
    acc[category].push(action);
    return acc;
  }, {} as Record<string, ToolbarAction[]>);

  const categories = [
    { id: 'primary', label: 'Quick Actions', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
    { id: 'analysis', label: 'Analysis', icon: BarChart3, color: 'from-blue-500 to-cyan-500' },
    { id: 'tools', label: 'Tools', icon: Settings, color: 'from-green-500 to-emerald-500' },
    { id: 'export', label: 'Export & Share', icon: Share2, color: 'from-orange-500 to-red-500' },
  ];

  const handleActionClick = useCallback((action: ToolbarAction) => {
    if (!action.disabled) {
      action.action();
    }
  }, []);

  const getValidationColor = () => {
    switch (validationStatus) {
      case 'error':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-green-500 bg-green-500/10 border-green-500/30';
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) {return 'text-green-500';}
    if (strength >= 60) {return 'text-blue-500';}
    if (strength >= 40) {return 'text-yellow-500';}
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative"
    >
      {/* Main Toolbar Container */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-xl">
        {/* Top Bar - Stats & History */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700/50">
          {/* Left: History Controls */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onHistoryUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-all ${
                canUndo
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-white'
                  : 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onHistoryRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-all ${
                canRedo
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-white'
                  : 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={18} />
            </motion.button>
          </div>

          {/* Center: Formation Stats */}
          <div className="flex items-center gap-6">
            {formationStrength !== undefined && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50"
              >
                <div className="flex items-center gap-2">
                  <Shield size={18} className={getStrengthColor(formationStrength)} />
                  <span className="text-sm font-medium text-gray-300">Formation Strength</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${formationStrength}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full ${
                        formationStrength >= 80
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : formationStrength >= 60
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          : formationStrength >= 40
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          : 'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                    />
                  </div>
                  <span className={`text-lg font-bold ${getStrengthColor(formationStrength)}`}>
                    {formationStrength}%
                  </span>
                </div>
              </motion.div>
            )}

            {/* Validation Status */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`px-4 py-2 rounded-xl border ${getValidationColor()}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span className="text-sm font-medium">
                  {validationStatus === 'valid' && 'Formation Valid'}
                  {validationStatus === 'warning' && 'Minor Issues'}
                  {validationStatus === 'error' && 'Invalid Formation'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: Collapse Button */}
          {onToggleCollapse && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleCollapse}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-white transition-all"
            >
              <ChevronDown
                size={18}
                className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              />
            </motion.button>
          )}
        </div>

        {/* Main Actions Grid */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map(category => {
                    const categoryActions = groupedActions[category.id] || [];
                    if (categoryActions.length === 0) {return null;}

                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                      >
                        {/* Category Header */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${category.color} bg-opacity-10`}>
                          <category.icon size={16} className="text-white" />
                          <span className="text-sm font-semibold text-white">{category.label}</span>
                        </div>

                        {/* Category Actions */}
                        <div className="space-y-1">
                          {categoryActions.slice(0, 4).map(action => (
                            <motion.button
                              key={action.id}
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleActionClick(action)}
                              disabled={action.disabled}
                              onMouseEnter={() => setShowTooltip(action.id)}
                              onMouseLeave={() => setShowTooltip(null)}
                              className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                transition-all duration-200 group relative
                                ${
                                  action.isActive
                                    ? `bg-gradient-to-r ${category.color} bg-opacity-20 border border-white/20`
                                    : 'bg-gray-800/30 hover:bg-gray-700/50 border border-transparent'
                                }
                                ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              `}
                            >
                              {/* Icon */}
                              <div className={`
                                p-1.5 rounded-lg transition-all
                                ${action.isActive ? 'bg-white/10' : 'group-hover:bg-white/5'}
                              `}>
                                <action.icon
                                  size={16}
                                  className={action.isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                                />
                              </div>

                              {/* Label */}
                              <span className={`text-sm font-medium flex-1 text-left ${
                                action.isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                              }`}>
                                {action.label}
                              </span>

                              {/* Badge */}
                              {action.badge && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                  {action.badge}
                                </span>
                              )}

                              {/* Shortcut */}
                              {action.shortcut && showTooltip === action.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 border border-gray-700"
                                >
                                  {action.shortcut}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent border-b-gray-900" />
                                </motion.div>
                              )}

                              {/* Active Indicator */}
                              {action.isActive && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white"
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                              )}
                            </motion.button>
                          ))}

                          {/* Show More Button */}
                          {categoryActions.length > 4 && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              onClick={() => setExpandedCategory(
                                expandedCategory === category.id ? null : category.id,
                              )}
                              className="w-full px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                              <span>
                                {expandedCategory === category.id ? 'Show Less' : `+${categoryActions.length - 4} More`}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform ${expandedCategory === category.id ? 'rotate-180' : ''}`}
                              />
                            </motion.button>
                          )}

                          {/* Expanded Actions */}
                          <AnimatePresence>
                            {expandedCategory === category.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-1 overflow-hidden"
                              >
                                {categoryActions.slice(4).map(action => (
                                  <motion.button
                                    key={action.id}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleActionClick(action)}
                                    disabled={action.disabled}
                                    className={`
                                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                      transition-all duration-200 group
                                      ${
                                        action.isActive
                                          ? 'bg-blue-500/20 border border-blue-500/30'
                                          : 'bg-gray-800/30 hover:bg-gray-700/50 border border-transparent'
                                      }
                                      ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                  >
                                    <div className="p-1.5 rounded-lg bg-white/5">
                                      <action.icon size={16} className="text-gray-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-300 group-hover:text-white flex-1 text-left">
                                      {action.label}
                                    </span>
                                    {action.badge && (
                                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                        {action.badge}
                                      </span>
                                    )}
                                  </motion.button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Access Floating Buttons */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -bottom-6 right-4 flex gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all"
          title="Quick Settings"
        >
          <Settings size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all"
          title="Maximize View"
        >
          <Maximize2 size={20} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedTacticsToolbar;
