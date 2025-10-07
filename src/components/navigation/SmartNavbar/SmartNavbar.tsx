/**
 * Smart Navigation Bar Component
 *
 * Context-aware navbar with intelligent menu adaptation,
 * role-based visibility, and responsive design
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SmartNavbarProps, NavigationItem } from '../../../types/navigation';
import ContextMenu from './ContextMenu';
import SearchBar from './SearchBar';
import BreadcrumbTrail from './BreadcrumbTrail';
import QuickActions from './QuickActions';
import UserProfile from './UserProfile';
import { useNavigationContext } from '../hooks/useNavigationContext';
import { filterItemsByRole, sortItemsByRelevance } from '../utils/navigationHelpers';

const SmartNavbar: React.FC<SmartNavbarProps> = ({
  currentPage,
  userRole,
  teamContext,
  isCollapsed = false,
  isMobile = false,
  showBreadcrumbs = true,
  showSearch = true,
  navigationItems,
  quickActions = [],
  onNavigate,
  onSearch,
  onQuickAction,
  logoSrc,
  brandName = 'Astral Turf',
  className = '',
}) => {
  // Navigation context for smart features
  const {
    breadcrumbs,
    recentPages,
    addRecentPage,
  } = useNavigationContext();

  // Local state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Filter navigation items by user role
  const visibleItems = filterItemsByRole(navigationItems, userRole);

  // Sort items by relevance to current context
  const contextualItems = sortItemsByRelevance(
    visibleItems,
    currentPage,
    teamContext,
    recentPages,
  );

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((path: string, item: NavigationItem) => {
    if (onNavigate) {
      onNavigate(path);
    }

    // Add to recent pages
    addRecentPage(item);

    // Close any open dropdowns
    setActiveDropdown(null);
    setIsSearchOpen(false);
  }, [onNavigate, addRecentPage]);

  // Handle dropdown toggle
  const handleDropdownToggle = useCallback((itemId: string) => {
    setActiveDropdown(current => current === itemId ? null : itemId);
  }, []);

  // Handle search toggle
  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen(current => !current);
    setActiveDropdown(null);
  }, []);

  // Handle quick action
  const handleQuickAction = useCallback((actionId: string) => {
    if (onQuickAction) {
      onQuickAction(actionId);
    }
  }, [onQuickAction]);

  return (
    <motion.nav
      className={`smart-navbar ${scrolled ? 'scrolled' : ''} ${isCollapsed ? 'collapsed' : ''} ${className}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Main navbar container */}
      <div className="navbar-container">
        {/* Left section - Logo & brand */}
        <div className="navbar-left">
          <motion.div
            className="brand-section"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {logoSrc && (
              <img src={logoSrc} alt={brandName} className="brand-logo" />
            )}
            {!isCollapsed && (
              <span className="brand-name">{brandName}</span>
            )}
          </motion.div>
        </div>

        {/* Center section - Navigation items */}
        {!isMobile && (
          <div className="navbar-center">
            <ContextMenu
              items={contextualItems}
              currentPage={currentPage}
              activeDropdown={activeDropdown}
              onNavigate={handleNavigate}
              onDropdownToggle={handleDropdownToggle}
              userRole={userRole}
            />
          </div>
        )}

        {/* Right section - Search, quick actions, user profile */}
        <div className="navbar-right">
          {/* Quick actions */}
          {quickActions.length > 0 && !isCollapsed && (
            <QuickActions
              actions={quickActions}
              onAction={handleQuickAction}
              compact={isMobile}
            />
          )}

          {/* Search bar */}
          {showSearch && onSearch && (
            <SearchBar
              isOpen={isSearchOpen}
              onToggle={handleSearchToggle}
              onSearch={onSearch}
              onResultClick={(result) => {
                if (result.path) {
                  handleNavigate(result.path, {
                    id: result.id,
                    label: result.title,
                    type: 'page',
                    path: result.path,
                  });
                } else if (result.onClick) {
                  result.onClick();
                }
              }}
              placeholder="Search formations, players, analytics..."
            />
          )}

          {/* User profile menu */}
          <UserProfile
            userName="Current User"
            userRole={userRole}
            menuItems={[
              { id: 'profile', label: 'Profile', type: 'page', path: '/profile' },
              { id: 'settings', label: 'Settings', type: 'page', path: '/settings' },
              { id: 'separator-1', label: '', type: 'separator' },
              { id: 'logout', label: 'Logout', type: 'action' },
            ]}
            onMenuItemClick={(itemId) => {
              // Handle user menu actions
              void itemId; // Placeholder - implement actual handling
            }}
          />
        </div>
      </div>

      {/* Breadcrumb trail (desktop only) */}
      {showBreadcrumbs && !isMobile && breadcrumbs.length > 0 && (
        <BreadcrumbTrail
          items={breadcrumbs}
          onNavigate={(path) => handleNavigate(path, { id: path, label: path, type: 'page', path })}
          maxItems={5}
          showHome={true}
        />
      )}

      {/* Search overlay (mobile) */}
      <AnimatePresence>
        {isSearchOpen && isMobile && (
          <motion.div
            className="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
          >
            <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
              {onSearch && (
                <SearchBar
                  isOpen={true}
                  onToggle={handleSearchToggle}
                  onSearch={onSearch}
                  onResultClick={(result) => {
                    if (result.path) {
                      handleNavigate(result.path, {
                        id: result.id,
                        label: result.title,
                        type: 'page',
                        path: result.path,
                      });
                    } else if (result.onClick) {
                      result.onClick();
                    }
                  }}
                  placeholder="Search..."
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .smart-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .smart-navbar.scrolled {
          background: rgba(26, 26, 46, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .smart-navbar.collapsed {
          width: 80px;
        }

        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          max-width: 1920px;
          margin: 0 auto;
          gap: 2rem;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .brand-logo {
          height: 40px;
          width: auto;
        }

        .brand-name {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #00f5ff 0%, #0080ff 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          white-space: nowrap;
        }

        .navbar-center {
          flex: 1;
          display: flex;
          justify-content: center;
          max-width: 800px;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        .search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 20vh;
          z-index: 2000;
        }

        .search-overlay-content {
          width: 90%;
          max-width: 600px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .navbar-container {
            padding: 0.5rem 1rem;
            gap: 1rem;
          }

          .brand-name {
            font-size: 1rem;
          }

          .navbar-right {
            gap: 0.5rem;
          }
        }
      `}</style>
    </motion.nav>
  );
};

export default SmartNavbar;
