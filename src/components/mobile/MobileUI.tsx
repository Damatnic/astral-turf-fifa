import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';

interface MobileNavigationProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile-optimized bottom navigation bar
 */
export const MobileBottomNav: React.FC<MobileNavigationProps> = ({ children, className = '' }) => {
  const { isMobile, safeArea } = useResponsive();

  if (!isMobile) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 ${className}`}
      style={{ paddingBottom: `${safeArea.bottom}px` }}
    >
      <div className="flex items-center justify-around h-16 px-4">{children}</div>
    </motion.nav>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
}

export const MobileNavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active = false,
  onClick,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-colors ${
        active ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
      }`}
    >
      <div className="relative">
        <div className="text-2xl">{icon}</div>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-xs mt-1 font-medium truncate max-w-full">{label}</span>
    </button>
  );
};

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: 'left' | 'right' | 'bottom';
}

/**
 * Mobile drawer/slide-out panel
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  position = 'left',
}) => {
  const { safeArea } = useResponsive();

  const variants = {
    left: {
      closed: { x: '-100%' },
      open: { x: 0 },
    },
    right: {
      closed: { x: '100%' },
      open: { x: 0 },
    },
    bottom: {
      closed: { y: '100%' },
      open: { y: 0 },
    },
  };

  const drawerClass =
    position === 'bottom'
      ? 'inset-x-0 bottom-0 h-[80vh] rounded-t-2xl'
      : `inset-y-0 ${position}-0 w-[85vw] max-w-sm`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={variants[position].closed}
            animate={variants[position].open}
            exit={variants[position].closed}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed ${drawerClass} bg-gray-900 shadow-2xl z-50 overflow-hidden flex flex-col`}
            style={{
              paddingTop: position !== 'bottom' ? `${safeArea.top}px` : undefined,
              paddingBottom: `${safeArea.bottom}px`,
            }}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            )}

            {/* Drag indicator for bottom drawer */}
            {position === 'bottom' && (
              <div className="flex justify-center py-2">
                <div className="w-12 h-1 bg-gray-600 rounded-full" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface MobileHeaderProps {
  title: string;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  rightAction?: React.ReactNode;
}

/**
 * Mobile app header with hamburger menu
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onMenuClick,
  onBackClick,
  rightAction,
}) => {
  const { isMobile, safeArea } = useResponsive();

  if (!isMobile) {
    return null;
  }

  return (
    <header
      className="sticky top-0 left-0 right-0 bg-gray-900 border-b border-gray-700 z-30"
      style={{ paddingTop: `${safeArea.top}px` }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left action */}
        <div className="w-10">
          {onBackClick ? (
            <button
              onClick={onBackClick}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-2xl">←</span>
            </button>
          ) : onMenuClick ? (
            <button
              onClick={onMenuClick}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-2xl">☰</span>
            </button>
          ) : null}
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-white truncate flex-1 text-center px-2">
          {title}
        </h1>

        {/* Right action */}
        <div className="w-10 flex justify-end">{rightAction}</div>
      </div>
    </header>
  );
};

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Heights in percentages
}

/**
 * Mobile bottom sheet with drag-to-dismiss
 */
export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [90],
}) => {
  const { safeArea } = useResponsive();
  const [currentSnap, setCurrentSnap] = useState(0);
  const [dragY, setDragY] = useState(0);

  const height = `${snapPoints[currentSnap]}vh`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: dragY }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              } else {
                setDragY(0);
              }
            }}
            className="fixed inset-x-0 bottom-0 bg-gray-900 rounded-t-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            style={{
              height,
              paddingBottom: `${safeArea.bottom}px`,
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface MobileFabProps {
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  badge?: number;
}

/**
 * Mobile floating action button
 */
export const MobileFAB: React.FC<MobileFabProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  badge,
}) => {
  const { isMobile, safeArea } = useResponsive();

  if (!isMobile) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  };

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`fixed ${positionClasses[position]} w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-30 flex items-center justify-center`}
      style={{ marginBottom: `${safeArea.bottom}px` }}
    >
      <div className="relative">
        <div className="text-2xl">{icon}</div>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
    </motion.button>
  );
};

/**
 * Mobile-optimized card with touch feedback
 */
interface MobileCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  elevated?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  onClick,
  className = '',
  elevated = false,
}) => {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`bg-gray-800 rounded-lg p-4 ${
        elevated ? 'shadow-lg' : 'shadow'
      } ${onClick ? 'cursor-pointer active:bg-gray-750' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Pull-to-refresh component for mobile
 */
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = React.useRef(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: isPulling || isRefreshing ? pullDistance : 0 }}
        className="flex items-center justify-center text-gray-400"
      >
        {isRefreshing ? (
          <div className="text-blue-400 animate-spin text-2xl">↻</div>
        ) : (
          <div
            className="transition-transform"
            style={{ transform: `rotate(${(pullDistance / threshold) * 180}deg)` }}
          >
            ↓
          </div>
        )}
      </motion.div>

      {children}
    </div>
  );
};

/**
 * Mobile-optimized tabs with swipe navigation
 */
interface MobileTabsProps {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleSwipe = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? activeIndex + 1 : activeIndex - 1;
    if (newIndex >= 0 && newIndex < tabs.length) {
      onTabChange(tabs[newIndex].id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab headers */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-shrink-0 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
              tab.id === activeTab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content with swipe */}
      <motion.div
        key={activeTab}
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -50, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-auto"
      >
        {children}
      </motion.div>
    </div>
  );
};
