import type { RoutePermission, UserRole } from '../types/auth';

/**
 * Route permission configuration for role-based access control
 * Defines which user roles can access which routes and fallback behavior
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Public routes (accessible to all authenticated users)
  {
    path: '/dashboard',
    allowedRoles: ['coach', 'player', 'family'],
  },
  {
    path: '/settings',
    allowedRoles: ['coach', 'player', 'family'],
  },
  {
    path: '/inbox',
    allowedRoles: ['coach', 'player', 'family'],
  },
  {
    path: '/player/:playerId',
    allowedRoles: ['coach', 'player', 'family'],
    requiredPermissions: ['canViewPlayer'],
  },

  // Coach-only routes
  {
    path: '/tactics',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/training',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/transfers',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/staff',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/finances',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/youth-academy',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/stadium',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/sponsorships',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/board-objectives',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/job-security',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/international-management',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/opposition-analysis',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/press-conference',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/mentoring',
    allowedRoles: ['coach'],
    fallbackPath: '/dashboard',
  },

  // Shared routes with different access levels
  {
    path: '/analytics',
    allowedRoles: ['coach', 'player', 'family'],
  },
  {
    path: '/league-table',
    allowedRoles: ['coach', 'player', 'family'],
  },
  {
    path: '/news-feed',
    allowedRoles: ['coach', 'player', 'family'],
  },
  {
    path: '/club-history',
    allowedRoles: ['coach', 'player', 'family'],
  },
  {
    path: '/medical-center',
    allowedRoles: ['coach', 'player', 'family'],
    requiredPermissions: ['canViewMedical'],
  },
  {
    path: '/skill-challenges',
    allowedRoles: ['coach', 'player'],
    fallbackPath: '/dashboard',
  },

  // Player-specific routes
  {
    path: '/my-training',
    allowedRoles: ['player'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/my-development',
    allowedRoles: ['player'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/my-schedule',
    allowedRoles: ['player'],
    fallbackPath: '/dashboard',
  },

  // Family-specific routes
  {
    path: '/child-overview',
    allowedRoles: ['family'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/family-communication',
    allowedRoles: ['family'],
    fallbackPath: '/dashboard',
  },
  {
    path: '/fee-management',
    allowedRoles: ['family'],
    fallbackPath: '/dashboard',
  },
];

/**
 * Check if a user role can access a specific route
 */
export const canAccessRoute = (
  path: string,
  userRole: UserRole,
  userPermissions?: string[],
): { canAccess: boolean; fallbackPath?: string } => {
  // Find matching route permission (exact match first, then pattern match)
  const permission = ROUTE_PERMISSIONS.find(p => {
    if (p.path === path) {
      return true;
    }
    // Handle dynamic routes like /player/:playerId
    const pattern = p.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });

  if (!permission) {
    // If no specific permission found, default to allowing access
    return { canAccess: true };
  }

  // Check if user role is allowed
  if (!permission.allowedRoles.includes(userRole)) {
    return {
      canAccess: false,
      fallbackPath: permission.fallbackPath || '/dashboard',
    };
  }

  // Check required permissions if specified
  if (permission.requiredPermissions && userPermissions) {
    const hasRequiredPermissions = permission.requiredPermissions.every(perm =>
      userPermissions.includes(perm),
    );
    if (!hasRequiredPermissions) {
      return {
        canAccess: false,
        fallbackPath: permission.fallbackPath || '/dashboard',
      };
    }
  }

  return { canAccess: true };
};

/**
 * Get available routes for a specific user role
 */
export const getAvailableRoutes = (userRole: UserRole): string[] => {
  return ROUTE_PERMISSIONS.filter(permission => permission.allowedRoles.includes(userRole)).map(
    permission => permission.path,
  );
};

/**
 * Role-specific navigation menu configuration
 */
export const ROLE_NAVIGATION: Record<
  UserRole,
  Array<{
    path: string;
    label: string;
    icon?: string;
    group?: string;
  }>
> = {
  coach: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', group: 'main' },
    { path: '/tactics', label: 'Tactics Board', icon: 'tactics', group: 'main' },
    { path: '/training', label: 'Training', icon: 'training', group: 'team' },
    { path: '/transfers', label: 'Transfers', icon: 'transfers', group: 'team' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics', group: 'team' },
    { path: '/staff', label: 'Staff', icon: 'staff', group: 'management' },
    { path: '/finances', label: 'Finances', icon: 'finances', group: 'management' },
    { path: '/youth-academy', label: 'Youth Academy', icon: 'youth', group: 'development' },
    { path: '/mentoring', label: 'Mentoring', icon: 'mentoring', group: 'development' },
    { path: '/medical-center', label: 'Medical Center', icon: 'medical', group: 'team' },
    { path: '/league-table', label: 'League Table', icon: 'league', group: 'competition' },
    {
      path: '/opposition-analysis',
      label: 'Opposition Analysis',
      icon: 'analysis',
      group: 'competition',
    },
    { path: '/press-conference', label: 'Press Conference', icon: 'press', group: 'media' },
    { path: '/news-feed', label: 'News Feed', icon: 'news', group: 'media' },
    { path: '/inbox', label: 'Inbox', icon: 'inbox', group: 'communication' },
  ],
  player: [
    { path: '/dashboard', label: 'My Dashboard', icon: 'dashboard', group: 'main' },
    { path: '/my-training', label: 'My Training', icon: 'training', group: 'development' },
    { path: '/my-development', label: 'Development', icon: 'development', group: 'development' },
    { path: '/my-schedule', label: 'Schedule', icon: 'schedule', group: 'main' },
    { path: '/analytics', label: 'My Performance', icon: 'analytics', group: 'performance' },
    {
      path: '/skill-challenges',
      label: 'Skill Challenges',
      icon: 'challenges',
      group: 'development',
    },
    { path: '/medical-center', label: 'Medical Center', icon: 'medical', group: 'health' },
    { path: '/league-table', label: 'League Table', icon: 'league', group: 'team' },
    { path: '/news-feed', label: 'Team News', icon: 'news', group: 'team' },
    { path: '/club-history', label: 'Club History', icon: 'history', group: 'team' },
    { path: '/inbox', label: 'Messages', icon: 'inbox', group: 'communication' },
  ],
  family: [
    { path: '/dashboard', label: 'Family Dashboard', icon: 'dashboard', group: 'main' },
    { path: '/child-overview', label: 'Child Overview', icon: 'overview', group: 'main' },
    { path: '/analytics', label: 'Performance', icon: 'analytics', group: 'performance' },
    { path: '/my-schedule', label: 'Schedule', icon: 'schedule', group: 'main' },
    {
      path: '/family-communication',
      label: 'Communication',
      icon: 'communication',
      group: 'communication',
    },
    { path: '/fee-management', label: 'Fees & Payments', icon: 'payments', group: 'admin' },
    { path: '/medical-center', label: 'Medical Center', icon: 'medical', group: 'health' },
    { path: '/league-table', label: 'League Table', icon: 'league', group: 'team' },
    { path: '/news-feed', label: 'Team News', icon: 'news', group: 'team' },
    { path: '/club-history', label: 'Club History', icon: 'history', group: 'team' },
    { path: '/inbox', label: 'Messages', icon: 'inbox', group: 'communication' },
  ],
};
