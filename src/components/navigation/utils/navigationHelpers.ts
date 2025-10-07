/**
 * Navigation Helper Utilities
 *
 * Helper functions for smart navigation features
 */

import type { NavigationItem, UserRole, Team } from '../../../types/navigation';

/**
 * Filter navigation items by user role
 */
export function filterItemsByRole(
  items: NavigationItem[],
  userRole: UserRole,
): NavigationItem[] {
  return items.filter(item => {
    // No role requirement = visible to all
    if (!item.requiredRole || item.requiredRole.length === 0) {
      return true;
    }

    // Check if user role is in required roles
    return item.requiredRole.includes(userRole);
  }).map(item => ({
    ...item,
    // Recursively filter children
    children: item.children
      ? filterItemsByRole(item.children, userRole)
      : undefined,
  }));
}

/**
 * Sort items by relevance to current context
 */
export function sortItemsByRelevance(
  items: NavigationItem[],
  currentPage: string,
  teamContext?: Team,
  recentPages: NavigationItem[] = [],
): NavigationItem[] {
  return [...items].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Active page gets highest priority
    if (a.path === currentPage) {scoreA += 1000;}
    if (b.path === currentPage) {scoreB += 1000;}

    // Recent pages get medium priority
    const recentIndexA = recentPages.findIndex(p => p.id === a.id);
    const recentIndexB = recentPages.findIndex(p => p.id === b.id);

    if (recentIndexA !== -1) {scoreA += (100 - recentIndexA * 10);}
    if (recentIndexB !== -1) {scoreB += (100 - recentIndexB * 10);}

    // Team context relevance
    if (teamContext && a.metadata?.team === teamContext) {scoreA += 50;}
    if (teamContext && b.metadata?.team === teamContext) {scoreB += 50;}

    // Badge priority
    if (a.badge) {scoreA += 20;}
    if (b.badge) {scoreB += 20;}

    return scoreB - scoreA;
  });
}

/**
 * Build breadcrumb trail from current path
 */
export function buildBreadcrumbs(
  path: string,
  navigationItems: NavigationItem[],
): Array<{ id: string; label: string; path?: string }> {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ id: string; label: string; path?: string }> = [];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Find matching navigation item
    const item = findItemByPath(navigationItems, currentPath);

    breadcrumbs.push({
      id: segment,
      label: item?.label || formatSegment(segment),
      path: currentPath,
    });
  }

  return breadcrumbs;
}

/**
 * Find navigation item by path
 */
function findItemByPath(
  items: NavigationItem[],
  path: string,
): NavigationItem | undefined {
  for (const item of items) {
    if (item.path === path) {
      return item;
    }

    if (item.children) {
      const found = findItemByPath(item.children, path);
      if (found) {return found;}
    }
  }

  return undefined;
}

/**
 * Format URL segment to readable label
 */
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get navigation analytics
 */
export function getNavigationMetrics(navigationHistory: NavigationItem[]): {
  mostVisited: Array<{ page: string; visits: number }>;
  averageTimePerPage: number;
  totalNavigations: number;
} {
  const visitCounts = new Map<string, number>();

  navigationHistory.forEach(item => {
    const count = visitCounts.get(item.id) || 0;
    visitCounts.set(item.id, count + 1);
  });

  const mostVisited = Array.from(visitCounts.entries())
    .map(([page, visits]) => ({ page, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  return {
    mostVisited,
    averageTimePerPage: 0, // Would need timestamp tracking
    totalNavigations: navigationHistory.length,
  };
}

/**
 * Check if path matches route pattern
 */
export function matchesRoute(path: string, pattern: string): boolean {
  // Simple pattern matching (can be enhanced with regex)
  const pathSegments = path.split('/').filter(Boolean);
  const patternSegments = pattern.split('/').filter(Boolean);

  if (pathSegments.length !== patternSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => {
    // :param style parameters
    if (segment.startsWith(':')) {
      return true;
    }

    return segment === pathSegments[index];
  });
}

/**
 * Generate smart menu items based on context
 */
export function getContextualMenuItems(
  baseItems: NavigationItem[],
  context: {
    currentPage: string;
    userRole: UserRole;
    teamContext?: Team;
  },
): NavigationItem[] {
  // Filter by role
  let items = filterItemsByRole(baseItems, context.userRole);

  // Add contextual items based on current page
  if (context.currentPage.includes('/tactics')) {
    items = [
      ...items,
      {
        id: 'tactics-quick',
        label: 'Quick Save',
        type: 'action',
        icon: '💾',
        badge: undefined,
      },
    ];
  }

  return items;
}
