/**
 * Mobile-First Navigation Component
 * Optimized touch interactions with swipe gestures and responsive design
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useMobileCapabilities, useTouchGestures, useMobileViewport } from '../../utils/mobileOptimizations';
import {
  Menu,
  X,
  Home,
  Users,
  BarChart3,
  Settings,
  Share2,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  User,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  badge?: number;
  isActive?: boolean;
  children?: NavigationItem[];
}

interface MobileNavigationProps {
  items: NavigationItem[];
  currentPath?: string;
  onNavigate: (item: NavigationItem) => void;
  onMenuToggle?: (isOpen: boolean) => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserProfile?: boolean;
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  currentPath = '',
  onNavigate,
  onMenuToggle,
  showSearch = true,
  showNotifications = true,
  showUserProfile = true,
  className = '',
}) => {
  const capabilities = useMobileCapabilities();
  const viewport = useMobileViewport();
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Navigation state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Handle menu toggle with haptic feedback
  const toggleMenu = useCallback(() => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    onMenuToggle?.(newState);
    
    if (capabilities.hasHapticFeedback) {
      navigator.vibrate(newState ? 25 : 15);
    }
  }, [isMenuOpen, onMenuToggle, capabilities.hasHapticFeedback]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setActiveSubmenu(null);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Swipe gestures for menu
  useTouchGestures(menuRef, {
    onSwipe: useCallback((event: TouchEvent, direction: string, velocity: number) => {
      if (velocity > 0.5) {
        if (direction === 'left' && isMenuOpen) {
          setIsMenuOpen(false);
          setSwipeDirection('left');
          
          if (capabilities.hasHapticFeedback) {
            navigator.vibrate(15);
          }
        } else if (direction === 'right' && !isMenuOpen) {
          setIsMenuOpen(true);
          setSwipeDirection('right');
          
          if (capabilities.hasHapticFeedback) {
            navigator.vibrate(25);
          }
        }
      }
    }, [isMenuOpen, capabilities.hasHapticFeedback]),
  });

  // Handle navigation item selection
  const handleNavigationSelect = useCallback((item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else {
      onNavigate(item);
      setIsMenuOpen(false);
      setActiveSubmenu(null);
    }
    
    if (capabilities.hasHapticFeedback) {
      navigator.vibrate(10);
    }
  }, [activeSubmenu, onNavigate, capabilities.hasHapticFeedback]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Implement search logic here
  }, []);

  // Navigation item component
  const NavigationItem: React.FC<{ 
    item: NavigationItem; 
    level?: number;
    onSelect: (item: NavigationItem) => void;
  }> = ({ item, level = 0, onSelect }) => {
    const isActive = currentPath === item.href || item.isActive;
    const hasChildren = item.children && item.children.length > 0;
    const isSubmenuOpen = activeSubmenu === item.id;

    return (
      <div className="w-full">
        <motion.button
          className={`
            w-full flex items-center justify-between p-4 text-left transition-colors
            ${isActive 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            }
            ${level > 0 ? 'pl-8 bg-gray-50' : ''}
          `}
          style={{
            minHeight: '48px', // Minimum touch target
            paddingLeft: level > 0 ? `${32 + (level * 16)}px` : '16px',
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(item)}
          role="menuitem"
          aria-expanded={hasChildren ? isSubmenuOpen : undefined}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                {item.badge}
              </span>
            )}
          </div>
          
          {hasChildren && (
            <ChevronRight 
              className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-90' : ''}`}
            />
          )}
        </motion.button>

        {/* Submenu */}
        <AnimatePresence>
          {hasChildren && isSubmenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {item.children!.map((childItem) => (
                <NavigationItem
                  key={childItem.id}
                  item={childItem}
                  level={level + 1}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <motion.header
        className={`
          fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm
          ${className}
        `}
        style={{
          paddingTop: viewport.safeAreaTop,
          height: `${48 + viewport.safeAreaTop}px`,
        }}
        initial={false}
        animate={{
          backgroundColor: isMenuOpen ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,1)',
        }}
      >
        <div className="flex items-center justify-between h-12 px-4">
          {/* Menu Toggle */}
          <motion.button
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            whileTap={{ scale: 0.9 }}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Logo/Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-gray-900">Astral Turf</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {showSearch && (
              <motion.button
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <Search className="w-5 h-5" />
              </motion.button>
            )}

            {showNotifications && (
              <motion.button
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                whileTap={{ scale: 0.9 }}
                aria-label="Notifications"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </motion.button>
            )}

            {showUserProfile && (
              <motion.button
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                whileTap={{ scale: 0.9 }}
                aria-label="Profile"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <User className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200"
            style={{
              paddingTop: `${48 + viewport.safeAreaTop}px`,
              height: `${96 + viewport.safeAreaTop}px`,
            }}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ minHeight: '48px' }}
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-30 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              ref={menuRef}
              className="fixed top-0 left-0 bottom-0 z-40 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto"
              style={{
                paddingTop: `${48 + viewport.safeAreaTop}px`,
                paddingBottom: viewport.safeAreaBottom,
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              drag="x"
              dragConstraints={{ left: -320, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(event, info) => {
                if (info.offset.x < -100 || info.velocity.x < -500) {
                  setIsMenuOpen(false);
                }
              }}
            >
              {/* Drag Handle */}
              <div className="absolute top-1/2 -right-6 transform -translate-y-1/2">
                <div className="w-1 h-12 bg-gray-300 rounded-r" />
              </div>

              {/* Menu Content */}
              <nav className="py-4" role="menu">
                {items.map((item) => (
                  <NavigationItem
                    key={item.id}
                    item={item}
                    onSelect={handleNavigationSelect}
                  />
                ))}
              </nav>

              {/* Bottom Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
                <motion.button
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Handle settings or main action
                    setIsMenuOpen(false);
                  }}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Swipe Edge for Menu */}
      {!isMenuOpen && capabilities.isMobile && (
        <div
          className="fixed top-0 left-0 bottom-0 w-4 z-20"
          style={{
            paddingTop: viewport.safeAreaTop,
            paddingBottom: viewport.safeAreaBottom,
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch.clientX < 20) {
              setIsMenuOpen(true);
            }
          }}
        />
      )}

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-2 bg-black/70 text-white text-xs p-2 rounded z-50">
          <div>Viewport: {viewport.width}x{viewport.height}</div>
          <div>Safe Areas: T{viewport.safeAreaTop} B{viewport.safeAreaBottom}</div>
          <div>Touch: {capabilities.supportsTouchEvents ? 'Yes' : 'No'}</div>
        </div>
      )}
    </>
  );
};

// Default navigation items
export const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: Home,
    href: '/',
    isActive: true,
  },
  {
    id: 'tactics',
    label: 'Tactics',
    icon: Users,
    children: [
      { id: 'tactics-board', label: 'Tactical Board', icon: Users, href: '/tactics' },
      { id: 'formations', label: 'Formations', icon: Users, href: '/formations' },
      { id: 'playbook', label: 'Playbook', icon: Users, href: '/playbook' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    badge: 3,
  },
  {
    id: 'share',
    label: 'Share & Export',
    icon: Share2,
    href: '/share',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

export default memo(MobileNavigation);