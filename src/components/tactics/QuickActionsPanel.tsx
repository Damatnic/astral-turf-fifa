import React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  icon: LucideIcon;
  label: string;
  action: () => void;
  isActive?: boolean;
}

interface QuickActionsPanelProps {
  actions: QuickAction[];
  position: 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ actions, position }) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
    'bottom-left': 'bottom-6 left-6'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed ${positionClasses[position]} z-40`}
    >
      <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-2xl">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className={`
                relative p-3 rounded-lg transition-all duration-200 group
                ${action.isActive
                  ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                }
              `}
              title={action.label}
            >
              <IconComponent className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-slate-900/95 text-white text-xs px-2 py-1 rounded border border-slate-700/50 whitespace-nowrap">
                  {action.label}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-slate-900/95" />
                </div>
              </div>

              {/* Active indicator */}
              {action.isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-lg border-2 border-blue-400"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export { QuickActionsPanel };
export default QuickActionsPanel;