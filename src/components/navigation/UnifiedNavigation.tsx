import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useAuthContext } from '../../hooks/useAuthContext';
import { getNavigationForRole, type NavItem } from './RoleBasedNavigation';

// Note: Navigation structure moved to RoleBasedNavigation.tsx
// This component now uses role-based filtering

// Legacy navigation structure (will be removed)
const LEGACY_SITE_NAVIGATION: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: '🏠',
    description: 'Overview & quick stats',
    roles: ['coach', 'player', 'family'], // Everyone
  },
  {
    id: 'tactics',
    label: 'Tactics',
    path: '/tactics',
    icon: '⚽',
    description: 'Formation & tactical setup',
    roles: ['coach'], // Coach only
  },
  {
    id: 'squad',
    label: 'Squad',
    icon: '👥',
    description: 'Team management',
    children: [
      { id: 'training', label: 'Training', path: '/training', icon: '🏃', description: 'Training sessions' },
      { id: 'medical', label: 'Medical Center', path: '/medical-center', icon: '⚕️', description: 'Player health & injuries' },
      { id: 'mentoring', label: 'Mentoring', path: '/mentoring', icon: '🎓', description: 'Player development' },
      { id: 'rankings', label: 'Player Rankings', path: '/player-ranking', icon: '📊', description: 'Performance rankings' },
    ],
  },
  {
    id: 'player',
    label: 'Player',
    icon: '⚽',
    description: 'Your player profile',
    children: [
      { id: 'player-card', label: 'Player Card', path: '/player-card', icon: '🎴', description: 'View your player card' },
      { id: 'player-challenges', label: 'My Challenges', path: '/skill-challenges', icon: '🏅', description: 'Personal challenges' },
      { id: 'player-stats', label: 'Statistics', path: '/player-ranking', icon: '📊', description: 'Your performance stats' },
      { id: 'player-achievements', label: 'Achievements', path: '/challenge-hub', icon: '🏆', description: 'Awards & milestones' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    description: 'Data & insights',
    children: [
      { id: 'analytics-overview', label: 'Overview', path: '/analytics', icon: '📊', description: 'Analytics dashboard' },
      { id: 'advanced-analytics', label: 'Advanced Analytics', path: '/advanced-analytics', icon: '🔬', description: 'Deep dive analytics' },
      { id: 'opposition', label: 'Opposition Analysis', path: '/opposition-analysis', icon: '🎯', description: 'Opponent scouting' },
    ],
  },
  {
    id: 'transfers',
    label: 'Transfers',
    path: '/transfers',
    icon: '🔄',
    description: 'Transfer market & scouting',
  },
  {
    id: 'competition',
    label: 'Competition',
    icon: '🏆',
    description: 'League & matches',
    children: [
      { id: 'league', label: 'League Table', path: '/league-table', icon: '📋', description: 'Standings & fixtures' },
      { id: 'news', label: 'News Feed', path: '/news-feed', icon: '📰', description: 'Latest news' },
      { id: 'press', label: 'Press Conference', path: '/press-conference', icon: '🎤', description: 'Media interactions' },
    ],
  },
  {
    id: 'club',
    label: 'Club',
    icon: '🏛️',
    description: 'Club management',
    children: [
      { id: 'finances', label: 'Finances', path: '/finances', icon: '💰', description: 'Budget & revenue' },
      { id: 'staff', label: 'Staff', path: '/staff', icon: '👔', description: 'Coaching staff' },
      { id: 'stadium', label: 'Stadium', path: '/stadium', icon: '🏟️', description: 'Stadium management' },
      { id: 'sponsorships', label: 'Sponsorships', path: '/sponsorships', icon: '🤝', description: 'Sponsor deals' },
      { id: 'youth', label: 'Youth Academy', path: '/youth-academy', icon: '🌱', description: 'Youth development' },
      { id: 'history', label: 'Club History', path: '/club-history', icon: '📜', description: 'Legacy & achievements' },
    ],
  },
  {
    id: 'career',
    label: 'Career',
    icon: '📈',
    description: 'Your manager career',
    children: [
      { id: 'objectives', label: 'Board Objectives', path: '/board-objectives', icon: '🎯', description: 'Board expectations' },
      { id: 'job-security', label: 'Job Security', path: '/job-security', icon: '🔒', description: 'Your standing' },
      { id: 'international', label: 'International', path: '/international-management', icon: '🌍', description: 'National team' },
      { id: 'inbox', label: 'Inbox', path: '/inbox', icon: '📧', description: 'Messages & notifications' },
    ],
  },
  {
    id: 'challenges',
    label: 'Challenges',
    icon: '🎯',
    description: 'Skills & objectives',
    children: [
      { id: 'challenge-hub', label: 'Challenge Hub', path: '/challenge-hub', icon: '🏅', description: 'All challenges' },
      { id: 'skill-challenges', label: 'Skill Challenges', path: '/skill-challenges', icon: '⚡', description: 'Test your skills' },
      { id: 'challenge-manager', label: 'Challenge Manager', path: '/challenge-manager', icon: '⚙️', description: 'Manage challenges' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '⚙️',
    description: 'App configuration',
    divider: true,
  },
];

interface UnifiedNavigationProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'mobile';
  showSearch?: boolean;
  onClose?: () => void;
}

export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({
  className,
  variant = 'header',
  showSearch = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuthContext();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get role-based navigation
  const roleBasedNav = useMemo(() => {
    const userRole = authState.user?.role || 'player'; // Default to player if no role
    return getNavigationForRole(userRole);
  }, [authState.user?.role]);

  // Filter navigation items based on search
  const filteredNavigation = useMemo(() => {
    if (!searchQuery) {return roleBasedNav;}

    const query = searchQuery.toLowerCase();
    return roleBasedNav.map(item => {
      const matchesItem = item.label.toLowerCase().includes(query) ||
                         item.description?.toLowerCase().includes(query);

      if (item.children) {
        const filteredChildren = item.children.filter(child =>
          child.label.toLowerCase().includes(query) ||
          child.description?.toLowerCase().includes(query),
        );

        if (filteredChildren.length > 0 || matchesItem) {
          return { ...item, children: filteredChildren };
        }
        return null;
      }

      return matchesItem ? item : null;
    }).filter(Boolean) as NavItem[];
  }, [searchQuery]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const toggleSubmenu = (itemId: string) => {
    setOpenSubmenu(openSubmenu === itemId ? null : itemId);
  };

  const isActive = (item: NavItem): boolean => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some(child => child.path === location.pathname);
    }
    return false;
  };

  // Header variant (horizontal)
  if (variant === 'header') {
    return (
      <nav className={cn('flex items-center space-x-1', className)}>
        {filteredNavigation.map((item) => (
          <div key={item.id} className="relative group">
            {item.path ? (
              // Direct navigation item
              <button
                onClick={() => handleNavigate(item.path!)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-slate-700 hover:text-white',
                  'flex items-center space-x-2',
                  isActive(item)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900'
                    : 'text-slate-300',
                )}
              >
                <span>{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ) : (
              // Dropdown menu item
              <>
                <button
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    'hover:bg-slate-700 hover:text-white',
                    'flex items-center space-x-2',
                    isActive(item)
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300',
                  )}
                >
                  <span>{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="text-xs ml-1">▼</span>
                </button>

                {/* Dropdown menu */}
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] border border-slate-700">
                  <div className="p-2">
                    {item.description && (
                      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700 mb-2">
                        {item.description}
                      </div>
                    )}
                    {item.children?.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => handleNavigate(child.path!)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md transition-all duration-200',
                          'hover:bg-slate-700 hover:text-white',
                          'flex items-center space-x-3',
                          location.pathname === child.path
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300',
                        )}
                      >
                        <span className="text-lg">{child.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{child.label}</div>
                          {child.description && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {child.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </nav>
    );
  }

  // Sidebar variant (vertical)
  if (variant === 'sidebar') {
    return (
      <nav className={cn('flex flex-col space-y-1 p-3', className)}>
        {filteredNavigation.map((item) => (
          <div key={item.id}>
            {item.divider && <div className="border-t border-slate-700 my-2" />}

            {item.path ? (
              // Direct navigation item
              <button
                onClick={() => handleNavigate(item.path!)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg transition-all duration-200',
                  'hover:bg-slate-700 hover:text-white',
                  'flex items-center space-x-3',
                  isActive(item)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900'
                    : 'text-slate-300',
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ) : (
              // Expandable menu item
              <>
                <button
                  onClick={() => toggleSubmenu(item.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg transition-all duration-200',
                    'hover:bg-slate-700 hover:text-white',
                    'flex items-center space-x-3',
                    isActive(item) || openSubmenu === item.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300',
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <motion.span
                    animate={{ rotate: openSubmenu === item.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm"
                  >
                    ▼
                  </motion.span>
                </button>

                {/* Submenu */}
                <AnimatePresence>
                  {openSubmenu === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-700 pl-3">
                        {item.children?.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleNavigate(child.path!)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-lg transition-all duration-200',
                              'hover:bg-slate-700 hover:text-white text-sm',
                              'flex items-center space-x-2',
                              location.pathname === child.path
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400',
                            )}
                          >
                            <span>{child.icon}</span>
                            <span>{child.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        ))}
      </nav>
    );
  }

  // Mobile variant (full screen)
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search bar */}
      {showSearch && (
        <div className="p-4 border-b border-slate-700">
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col p-3 space-y-1">
          {filteredNavigation.map((item) => (
            <div key={item.id}>
              {item.divider && <div className="border-t border-slate-700 my-3" />}

              {item.path ? (
                <button
                  onClick={() => handleNavigate(item.path!)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
                    'hover:bg-slate-700',
                    'flex items-center space-x-3',
                    isActive(item)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900'
                      : 'text-slate-300',
                  )}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{item.label}</div>
                    {item.description && (
                      <div className="text-sm text-slate-400 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
                      'hover:bg-slate-700',
                      'flex items-center space-x-3',
                      isActive(item) || openSubmenu === item.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-300',
                    )}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-base">{item.label}</div>
                      {item.description && (
                        <div className="text-sm text-slate-400 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <motion.span
                      animate={{ rotate: openSubmenu === item.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ▼
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {openSubmenu === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-8 mt-2 space-y-1">
                          {item.children?.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => handleNavigate(child.path!)}
                              className={cn(
                                'w-full text-left px-4 py-2 rounded-lg transition-all duration-200',
                                'hover:bg-slate-700',
                                'flex items-center space-x-3',
                                location.pathname === child.path
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-400',
                              )}
                            >
                              <span className="text-lg">{child.icon}</span>
                              <span className="text-sm">{child.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default UnifiedNavigation;
