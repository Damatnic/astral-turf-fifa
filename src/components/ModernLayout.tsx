/**
 * Modern Layout Component with Sidebar Navigation
 * Uses the new ModernNavigation component following UI/UX best practices
 */

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useUIContext, useResponsive } from '../hooks';
import { ModernNavigation } from './ui/ModernNavigation';
import NotificationContainer from './ui/NotificationContainer';
import { cn } from '../utils/cn';

// Import design system CSS
import '../styles/design-system.css';

interface LayoutProps {
  children?: React.ReactNode;
}

export const ModernLayout: React.FC<LayoutProps> = ({ children }) => {
  const { uiState } = useUIContext();
  const { isMobile, isTablet } = useResponsive();
  const { theme, isPresentationMode } = uiState;

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Hide navigation in presentation mode
  if (isPresentationMode) {
    return (
      <div className="min-h-screen bg-slate-900">
        <main className="h-screen overflow-auto">
          {children || <Outlet />}
        </main>
        <NotificationContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <ModernNavigation />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-200',
          isMobile || isTablet
            ? 'pt-14' // Mobile: top bar height
            : 'pl-64', // Desktop: sidebar width (non-collapsed)
        )}
      >
        <div className="h-full">
          {children || <Outlet />}
        </div>
      </main>

      {/* Notifications */}
      <NotificationContainer />
    </div>
  );
};

export default ModernLayout;
