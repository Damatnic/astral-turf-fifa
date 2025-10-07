/**
 * Navigation Type Definitions
 *
 * Comprehensive type system for modern navigation components
 * Supports smart navigation, breadcrumbs, search, and mobile optimization
 */

import type { Team } from './player';

// Re-export Team for convenience
export type { Team };

// ============================================================================
// Navigation Item Types
// ============================================================================

export type NavigationItemType =
  | 'page'
  | 'action'
  | 'dropdown'
  | 'separator'
  | 'external';

export type UserRole =
  | 'coach'
  | 'analyst'
  | 'player'
  | 'admin'
  | 'viewer';

export interface NavigationItem {
  id: string;
  label: string;
  type: NavigationItemType;
  icon?: string;
  path?: string;
  badge?: number | string;
  isActive?: boolean;
  isVisible?: boolean;
  requiredRole?: UserRole[];
  onClick?: () => void;
  children?: NavigationItem[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Breadcrumb Types
// ============================================================================

export interface BreadcrumbItem {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  isCurrentPage?: boolean;
}

export interface BreadcrumbConfig {
  items: BreadcrumbItem[];
  separator?: string;
  maxItems?: number;
  showHome?: boolean;
}

// ============================================================================
// Search Types
// ============================================================================

export type SearchResultType =
  | 'formation'
  | 'player'
  | 'match'
  | 'analytics'
  | 'page'
  | 'action';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  path?: string;
  category?: string;
  relevance?: number;
  metadata?: Record<string, unknown>;
  onClick?: () => void;
}

export interface SearchFilter {
  type?: SearchResultType[];
  category?: string[];
  dateRange?: { start: Date; end: Date };
}

export interface SearchState {
  query: string;
  isOpen: boolean;
  isLoading: boolean;
  results: SearchResult[];
  recentSearches: string[];
  filters: SearchFilter;
}

// ============================================================================
// Quick Action Types
// ============================================================================

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
  shortcut?: string;
  onClick: () => void;
  isEnabled?: boolean;
  badge?: number | string;
}

export interface QuickActionGroup {
  id: string;
  label: string;
  actions: QuickAction[];
  isCollapsible?: boolean;
  isExpanded?: boolean;
}

// ============================================================================
// Navigation State Types
// ============================================================================

export interface NavigationContext {
  currentPage: string;
  currentTeam?: Team;
  userRole: UserRole;
  breadcrumbs: BreadcrumbItem[];
  recentPages: NavigationItem[];
  favoritePages: NavigationItem[];
}

export interface NavigationState {
  context: NavigationContext;
  search: SearchState;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  activeDropdown: string | null;
  recentPages: NavigationItem[];
  favoritePages: NavigationItem[];
}

// ============================================================================
// Navigation Component Props
// ============================================================================

export interface SmartNavbarProps {
  // Context
  currentPage: string;
  userRole: UserRole;
  teamContext?: Team;

  // State
  isCollapsed?: boolean;
  isMobile?: boolean;
  showBreadcrumbs?: boolean;
  showSearch?: boolean;

  // Navigation items
  navigationItems: NavigationItem[];
  quickActions?: QuickAction[];

  // Callbacks
  onNavigate?: (path: string) => void;
  onSearch?: (query: string) => Promise<SearchResult[]>;
  onQuickAction?: (actionId: string) => void;

  // Customization
  logoSrc?: string;
  brandName?: string;
  className?: string;
}

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  currentPage: string;
  userRole: UserRole;
}

export interface BottomTabBarProps {
  items: NavigationItem[];
  currentPage: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultClick: (result: SearchResult) => void;
  recentSearches?: string[];
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export interface BreadcrumbTrailProps {
  items: BreadcrumbItem[];
  separator?: string;
  maxItems?: number;
  showHome?: boolean;
  onNavigate: (path: string) => void;
  className?: string;
}

export interface UserProfileProps {
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  menuItems: NavigationItem[];
  onMenuItemClick: (itemId: string) => void;
  className?: string;
}

// ============================================================================
// Navigation Configuration
// ============================================================================

export interface NavigationConfig {
  // Main navigation
  mainMenu: NavigationItem[];

  // Mobile navigation
  mobileMenu?: NavigationItem[];
  bottomTabBar?: NavigationItem[];

  // Quick actions
  quickActions: QuickActionGroup[];

  // Search configuration
  searchEnabled: boolean;
  searchPlaceholder?: string;
  searchFilters?: SearchFilter;

  // Breadcrumb configuration
  breadcrumbsEnabled: boolean;
  breadcrumbSeparator?: string;
  breadcrumbMaxItems?: number;

  // Branding
  logoSrc?: string;
  brandName?: string;

  // Feature flags
  features: {
    recentPages: boolean;
    favoritePages: boolean;
    contextualMenu: boolean;
    keyboardShortcuts: boolean;
  };
}

// ============================================================================
// Helper Types
// ============================================================================

export type NavigationMode = 'desktop' | 'tablet' | 'mobile';

export interface NavigationMetrics {
  totalNavigations: number;
  averageTimePerPage: number;
  mostVisitedPages: Array<{ page: string; visits: number }>;
  searchUsage: number;
  quickActionUsage: Record<string, number>;
}

export interface NavigationPreferences {
  favoritePages: string[];
  collapsedSections: string[];
  customShortcuts: Record<string, string>;
  defaultLandingPage?: string;
}
