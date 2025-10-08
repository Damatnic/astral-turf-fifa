/**
 * Role-Based Navigation Configuration
 * 
 * Defines navigation items for different user roles:
 * - Coach: Full club management access
 * - Player: Personal stats, challenges, development
 * - Family: Limited view access for family members
 */

import type { UserRole } from '../../types/auth';

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  badge?: string | number;
  children?: NavItem[];
  divider?: boolean;
  roles: UserRole[]; // Roles that can see this item
}

// Complete navigation structure with role-based access
export const ROLE_BASED_NAVIGATION: NavItem[] = [
  // ===== DASHBOARD (Everyone) =====
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: '🏠',
    description: 'Overview & quick stats',
    roles: ['coach', 'player', 'family'],
  },

  // ===== TACTICS (Coach Only) =====
  {
    id: 'tactics',
    label: 'Tactics',
    path: '/tactics',
    icon: '⚽',
    description: 'Formation & tactical setup',
    roles: ['coach'],
  },

  // ===== SQUAD MANAGEMENT (Coach + Limited Family View) =====
  {
    id: 'squad',
    label: 'Squad',
    icon: '👥',
    description: 'Team management',
    roles: ['coach', 'family'],
    children: [
      { 
        id: 'training', 
        label: 'Training', 
        path: '/training', 
        icon: '🏃', 
        description: 'Training sessions',
        roles: ['coach']
      },
      { 
        id: 'medical', 
        label: 'Medical Center', 
        path: '/medical-center', 
        icon: '⚕️', 
        description: 'Player health & injuries',
        roles: ['coach', 'family']
      },
      { 
        id: 'mentoring', 
        label: 'Mentoring', 
        path: '/mentoring', 
        icon: '🎓', 
        description: 'Player development',
        roles: ['coach']
      },
      { 
        id: 'rankings', 
        label: 'Player Rankings', 
        path: '/player-ranking', 
        icon: '📊', 
        description: 'Performance rankings',
        roles: ['coach', 'family']
      },
    ],
  },

  // ===== PLAYER SECTION (Player + Family) =====
  {
    id: 'player',
    label: 'My Profile',
    icon: '⚽',
    description: 'Your player profile',
    roles: ['player', 'family'],
    children: [
      { 
        id: 'player-card', 
        label: 'Player Card', 
        path: '/player-card', 
        icon: '🎴', 
        description: 'View player card',
        roles: ['player', 'family']
      },
      { 
        id: 'player-challenges', 
        label: 'My Challenges', 
        path: '/skill-challenges', 
        icon: '🏅', 
        description: 'Personal challenges',
        roles: ['player', 'family']
      },
      { 
        id: 'player-stats', 
        label: 'Statistics', 
        path: '/player-ranking', 
        icon: '📊', 
        description: 'Performance stats',
        roles: ['player', 'family']
      },
      { 
        id: 'player-achievements', 
        label: 'Achievements', 
        path: '/challenge-hub', 
        icon: '🏆', 
        description: 'Awards & milestones',
        roles: ['player', 'family']
      },
    ],
  },

  // ===== CHALLENGES (Player + Coach) =====
  {
    id: 'challenges',
    label: 'Challenges',
    icon: '🎯',
    description: 'Skills & objectives',
    roles: ['player', 'coach'],
    children: [
      { 
        id: 'challenge-hub', 
        label: 'Challenge Hub', 
        path: '/challenge-hub', 
        icon: '🏅', 
        description: 'All challenges',
        roles: ['player', 'coach']
      },
      { 
        id: 'skill-challenges', 
        label: 'Skill Challenges', 
        path: '/skill-challenges', 
        icon: '⚡', 
        description: 'Test your skills',
        roles: ['player', 'coach']
      },
      { 
        id: 'challenge-manager', 
        label: 'Manage Challenges', 
        path: '/challenge-manager', 
        icon: '⚙️', 
        description: 'Create & manage challenges',
        roles: ['coach']
      },
    ],
  },

  // ===== ANALYTICS (Coach Only) =====
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    description: 'Data & insights',
    roles: ['coach'],
    children: [
      { 
        id: 'analytics-overview', 
        label: 'Overview', 
        path: '/analytics', 
        icon: '📊', 
        description: 'Analytics dashboard',
        roles: ['coach']
      },
      { 
        id: 'tactics-analytics', 
        label: 'Tactical Analytics', 
        path: '/tactics-analytics', 
        icon: '🎯', 
        description: 'Formation & tactical analysis',
        roles: ['coach']
      },
      { 
        id: 'advanced-analytics', 
        label: 'Advanced Analytics', 
        path: '/advanced-analytics', 
        icon: '🔬', 
        description: 'Deep dive analytics',
        roles: ['coach']
      },
      { 
        id: 'opposition', 
        label: 'Opposition Analysis', 
        path: '/opposition-analysis', 
        icon: '🎯', 
        description: 'Opponent scouting',
        roles: ['coach']
      },
    ],
  },

  // ===== TRANSFERS (Coach Only) =====
  {
    id: 'transfers',
    label: 'Transfers',
    path: '/transfers',
    icon: '🔄',
    description: 'Transfer market & scouting',
    roles: ['coach'],
  },

  // ===== COMPETITION (Coach + Family View) =====
  {
    id: 'competition',
    label: 'Competition',
    icon: '🏆',
    description: 'League & matches',
    roles: ['coach', 'family'],
    children: [
      { 
        id: 'league', 
        label: 'League Table', 
        path: '/league-table', 
        icon: '📋', 
        description: 'Standings & fixtures',
        roles: ['coach', 'family']
      },
      { 
        id: 'news', 
        label: 'News Feed', 
        path: '/news-feed', 
        icon: '📰', 
        description: 'Latest news',
        roles: ['coach', 'family']
      },
      { 
        id: 'press', 
        label: 'Press Conference', 
        path: '/press-conference', 
        icon: '🎤', 
        description: 'Media interactions',
        roles: ['coach']
      },
    ],
  },

  // ===== CLUB MANAGEMENT (Coach Only) =====
  {
    id: 'club',
    label: 'Club',
    icon: '🏛️',
    description: 'Club management',
    roles: ['coach'],
    children: [
      { 
        id: 'finances', 
        label: 'Finances', 
        path: '/finances', 
        icon: '💰', 
        description: 'Budget & revenue',
        roles: ['coach']
      },
      { 
        id: 'staff', 
        label: 'Staff', 
        path: '/staff', 
        icon: '👔', 
        description: 'Coaching staff',
        roles: ['coach']
      },
      { 
        id: 'stadium', 
        label: 'Stadium', 
        path: '/stadium', 
        icon: '🏟️', 
        description: 'Stadium management',
        roles: ['coach']
      },
      { 
        id: 'sponsorships', 
        label: 'Sponsorships', 
        path: '/sponsorships', 
        icon: '🤝', 
        description: 'Sponsor deals',
        roles: ['coach']
      },
      { 
        id: 'youth', 
        label: 'Youth Academy', 
        path: '/youth-academy', 
        icon: '🌱', 
        description: 'Youth development',
        roles: ['coach']
      },
      { 
        id: 'history', 
        label: 'Club History', 
        path: '/club-history', 
        icon: '📜', 
        description: 'Legacy & achievements',
        roles: ['coach', 'family']
      },
    ],
  },

  // ===== CAREER (Coach Only) =====
  {
    id: 'career',
    label: 'Career',
    icon: '📈',
    description: 'Your manager career',
    roles: ['coach'],
    children: [
      { 
        id: 'objectives', 
        label: 'Board Objectives', 
        path: '/board-objectives', 
        icon: '🎯', 
        description: 'Board expectations',
        roles: ['coach']
      },
      { 
        id: 'job-security', 
        label: 'Job Security', 
        path: '/job-security', 
        icon: '🔒', 
        description: 'Your standing',
        roles: ['coach']
      },
      { 
        id: 'international', 
        label: 'International', 
        path: '/international-management', 
        icon: '🌍', 
        description: 'National team',
        roles: ['coach']
      },
      { 
        id: 'inbox', 
        label: 'Inbox', 
        path: '/inbox', 
        icon: '📧', 
        description: 'Messages & notifications',
        roles: ['coach']
      },
    ],
  },

  // ===== SETTINGS (Everyone) =====
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '⚙️',
    description: 'App configuration',
    roles: ['coach', 'player', 'family'],
    divider: true,
  },
];

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(items: NavItem[], userRole: UserRole): NavItem[] {
  return items
    .filter(item => item.roles.includes(userRole))
    .map(item => {
      if (item.children) {
        const filteredChildren = filterNavigationByRole(item.children, userRole);
        // Only include parent if it has children after filtering
        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        }
        // If parent has a path, include it even without children
        if (item.path) {
          return { ...item, children: undefined };
        }
        // Otherwise exclude this item
        return null;
      }
      return item;
    })
    .filter((item): item is NavItem => item !== null);
}

/**
 * Get navigation items for specific role
 */
export function getNavigationForRole(userRole: UserRole): NavItem[] {
  return filterNavigationByRole(ROLE_BASED_NAVIGATION, userRole);
}

