/**
 * Modern Navigation Component
 * Following Material Design 3 and modern UI/UX best practices
 * - Responsive sidebar navigation
 * - Collapsible on desktop
 * - Full-screen drawer on mobile
 * - Clear visual hierarchy
 * - Accessible with ARIA labels
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import {
  LogoIcon,
  GridIcon,
  CogIcon,
  MoonIcon,
  SunIcon,
  PresentationIcon,
  ResetIcon,
} from './icons';
import { useUIContext, useAuthContext, useResponsive } from '../../hooks';

// Navigation Icons (Material Design Style)
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TeamIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  badge?: string | number;
}

const primaryNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Tactics Board', path: '/tactics', icon: GridIcon },
  { name: 'Analytics', path: '/analytics', icon: ChartIcon },
  { name: 'Team', path: '/team-selection', icon: TeamIcon },
  { name: 'Settings', path: '/settings', icon: CogIcon },
];

export const ModernNavigation: React.FC = () => {
  const location = useLocation();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const { dispatch: authDispatch } = useAuthContext();
  const { isMobile, isTablet } = useResponsive();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTacticsPage = location.pathname === '/tactics';

  const handleLogout = () => {
    authDispatch({ type: 'LOGOUT' });
  };

  const NavLink: React.FC<{ item: NavItem; collapsed?: boolean; mobile?: boolean }> = ({
    item,
    collapsed = false,
    mobile = false,
  }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        onClick={() => mobile && setMobileMenuOpen(false)}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-secondary-700/50 active:scale-95',
          isActive
            ? 'bg-primary-600/20 text-primary-400 shadow-glow-primary'
            : 'text-secondary-300 hover:text-white',
          collapsed && !mobile && 'justify-center px-2',
        )}
        aria-label={item.name}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-400')} />
        {(!collapsed || mobile) && (
          <span className="font-medium text-sm">{item.name}</span>
        )}
        {item.badge && (!collapsed || mobile) && (
          <span className="ml-auto bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
            {item.badge}
          </span>
        )}
        {collapsed && !mobile && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-800 text-white text-sm rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity whitespace-nowrap z-50 shadow-lg">
            {item.name}
          </div>
        )}
      </Link>
    );
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 h-screen bg-secondary-900/95 backdrop-blur-md',
        'border-r border-secondary-800 z-40 flex flex-col',
        'shadow-2xl',
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-800">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <LogoIcon className="w-8 h-8 text-primary-400" />
            <span className="font-bold text-lg text-white">Astral Turf</span>
          </Link>
        )}
        {isCollapsed && (
          <Link to="/dashboard" className="flex items-center justify-center w-full">
            <LogoIcon className="w-8 h-8 text-primary-400" />
          </Link>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
        {primaryNavItems.map((item) => (
          <NavLink key={item.path} item={item} collapsed={isCollapsed} />
        ))}

        {/* Tactics-specific actions */}
        {isTacticsPage && !isCollapsed && (
          <div className="mt-6 pt-6 border-t border-secondary-800 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-secondary-400 uppercase tracking-wider">
              Tactics Tools
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset the tactics board?')) {
                  // Add reset logic
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-all"
            >
              <ResetIcon className="w-5 h-5" />
              <span className="text-sm">Reset Board</span>
            </button>
            <button
              onClick={() => {
                uiDispatch({ type: 'ENTER_PRESENTATION_MODE' });
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-all"
            >
              <PresentationIcon className="w-5 h-5" />
              <span className="text-sm">Present Mode</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-secondary-800 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={() => uiDispatch({ type: 'TOGGLE_THEME' })}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-all',
            isCollapsed && 'justify-center px-2',
          )}
          aria-label="Toggle theme"
        >
          {uiState.theme === 'dark' ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
          {!isCollapsed && <span className="text-sm">Toggle Theme</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-all',
            isCollapsed && 'justify-center px-2',
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );

  // Mobile Top Bar
  const MobileTopBar = () => (
    <header className="fixed top-0 left-0 right-0 h-14 bg-secondary-900/95 backdrop-blur-md border-b border-secondary-800 z-50 flex items-center justify-between px-4">
      <Link to="/dashboard" className="flex items-center gap-2">
        <LogoIcon className="w-7 h-7 text-primary-400" />
        <span className="font-bold text-base text-white">Astral Turf</span>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={() => uiDispatch({ type: 'TOGGLE_THEME' })}
          className="p-2 rounded-lg text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-all"
          aria-label="Toggle theme"
        >
          {uiState.theme === 'dark' ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-all"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <CloseIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </header>
  );

  // Mobile Drawer
  const MobileDrawer = () => (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-14 right-0 bottom-0 w-80 bg-secondary-900 z-50 overflow-y-auto shadow-2xl"
          >
            <nav className="p-4 space-y-1">
              {primaryNavItems.map((item) => (
                <NavLink key={item.path} item={item} mobile />
              ))}

              {/* Tactics-specific actions */}
              {isTacticsPage && (
                <div className="mt-6 pt-6 border-t border-secondary-800 space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-secondary-400 uppercase tracking-wider">
                    Tactics Tools
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Reset the tactics board?')) {
                        // Add reset logic
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-all"
                  >
                    <ResetIcon className="w-5 h-5" />
                    <span className="text-sm">Reset Board</span>
                  </button>
                  <button
                    onClick={() => {
                      uiDispatch({ type: 'ENTER_PRESENTATION_MODE' });
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-all"
                  >
                    <PresentationIcon className="w-5 h-5" />
                    <span className="text-sm">Present Mode</span>
                  </button>
                </div>
              )}

              {/* Logout */}
              <div className="mt-6 pt-6 border-t border-secondary-800">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-error-400 hover:text-error-300 hover:bg-error-900/20 transition-all"
                >
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (isMobile || isTablet) {
    return (
      <>
        <MobileTopBar />
        <MobileDrawer />
      </>
    );
  }

  return <DesktopSidebar />;
};
