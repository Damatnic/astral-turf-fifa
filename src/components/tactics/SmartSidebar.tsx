import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Layers, Users, Trophy, BarChart3 } from 'lucide-react';

export interface SmartSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeTab?: 'formations' | 'players' | 'challenges' | 'analytics';
  onTabChange?: (tab: 'formations' | 'players' | 'challenges' | 'analytics') => void;
  onFormationSelect?: (formationId: string) => void;
  onPlayerSelect?: (playerId: string) => void;
  onChallengeSelect?: (challengeId: string) => void;
  onAnalyticsView?: () => void;
  className?: string;
}

/**
 * SmartSidebar - Adaptive sidebar component for tactical board navigation
 * Provides collapsible navigation with multiple tabs for formations, players, challenges, and analytics
 */
export const SmartSidebar: React.FC<SmartSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  activeTab = 'formations',
  onTabChange,
  onFormationSelect: _onFormationSelect,
  onPlayerSelect: _onPlayerSelect,
  onChallengeSelect: _onChallengeSelect,
  onAnalyticsView: _onAnalyticsView,
  className = '',
}) => {
  const [isPeeking, setIsPeeking] = useState(false);

  const handleToggle = () => {
    onToggleCollapse?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isCollapsed) {
      onToggleCollapse?.();
    }
  };

  const handleMouseEnter = () => {
    if (isCollapsed) {
      setIsPeeking(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      setIsPeeking(false);
    }
  };

  const tabs = [
    { id: 'formations' as const, label: 'Formations', icon: Layers },
    { id: 'players' as const, label: 'Players', icon: Users },
    { id: 'challenges' as const, label: 'Challenges', icon: Trophy },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  const currentState = isCollapsed ? (isPeeking ? 'peek' : 'collapsed') : 'expanded';

  return (
    <aside
      data-testid="smart-sidebar"
      data-state={currentState}
      className={`
        relative bg-slate-900 border-r border-slate-700 flex flex-col transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-80'}
        ${className}
      `}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
    >
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        aria-label="Toggle sidebar"
        className="absolute -right-3 top-6 z-10 bg-slate-800 border border-slate-600 rounded-full p-1 hover:bg-slate-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-slate-300" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        )}
      </button>

      {/* Navigation Tabs */}
      <div className="flex flex-col space-y-2 p-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                ${isActive ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-800'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
              aria-label={tab.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'formations' && (
                <div data-testid="formations-content">
                  <h3 className="text-lg font-semibold text-white mb-3">Formations</h3>
                  <div className="text-sm text-slate-400">
                    <p>Select and manage your tactical formations</p>
                  </div>
                </div>
              )}

              {activeTab === 'players' && (
                <div data-testid="players-content">
                  <h3 className="text-lg font-semibold text-white mb-3">Players</h3>
                  <div className="text-sm text-slate-400">
                    <p>View and manage your squad</p>
                  </div>
                </div>
              )}

              {activeTab === 'challenges' && (
                <div data-testid="challenges-content">
                  <h3 className="text-lg font-semibold text-white mb-3">Challenges</h3>
                  <div className="text-sm text-slate-400">
                    <p>Complete tactical challenges</p>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div data-testid="analytics-content">
                  <h3 className="text-lg font-semibold text-white mb-3">Analytics</h3>
                  <div className="text-sm text-slate-400">
                    <p>View performance analytics</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default SmartSidebar;
