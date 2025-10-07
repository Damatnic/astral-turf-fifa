/**
 * Smart Navigation System - Main Export
 *
 * Exports all navigation components, hooks, and utilities
 */

export { default as SmartNavbar } from './SmartNavbar/SmartNavbar';
export { default as ContextMenu } from './SmartNavbar/ContextMenu';
export { default as SearchBar } from './SmartNavbar/SearchBar';
export { default as BreadcrumbTrail } from './SmartNavbar/BreadcrumbTrail';
export { default as QuickActions } from './SmartNavbar/QuickActions';
export { default as UserProfile } from './SmartNavbar/UserProfile';

export { useNavigationContext } from './hooks/useNavigationContext';

export {
  filterItemsByRole,
  sortItemsByRelevance,
  buildBreadcrumbs,
  getNavigationMetrics,
  matchesRoute,
  getContextualMenuItems,
} from './utils/navigationHelpers';

export type {
  NavigationItem,
  NavigationItemType,
  UserRole,
  BreadcrumbItem,
  BreadcrumbConfig,
  SearchResult,
  SearchResultType,
  SearchFilter,
  SearchState,
  QuickAction,
  QuickActionGroup,
  NavigationContext,
  NavigationState,
  SmartNavbarProps,
  MobileNavDrawerProps,
  BottomTabBarProps,
  SearchBarProps,
  BreadcrumbTrailProps,
  UserProfileProps,
  NavigationConfig,
  NavigationMode,
  NavigationMetrics,
  NavigationPreferences,
  Team,
} from '../../types/navigation';
