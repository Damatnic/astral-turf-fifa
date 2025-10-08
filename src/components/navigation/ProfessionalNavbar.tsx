/**
 * Professional Navigation Bar
 * 
 * Modern, feature-rich navbar with:
 * - Responsive logo
 * - Role-based menu
 * - Global search
 * - Notification center
 * - User profile dropdown
 * - Theme toggle
 * - Mobile-optimized
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Menu, X, Sun, Moon, Trophy, Zap,
  MessageSquare, Settings, HelpCircle, ChevronDown
} from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { getNavigationForRole } from './RoleBasedNavigation';
import ProfileDropdown from './ProfileDropdown';

export const ProfessionalNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuthContext();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Get role-based navigation
  const userRole = authState.user?.role || 'player';
  const navigation = getNavigationForRole(userRole);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock notifications (replace with real data)
  const notifications = [
    { id: '1', type: 'challenge', title: 'Challenge Completed!', message: 'You earned 500 XP', time: '2m ago', read: false },
    { id: '2', type: 'level', title: 'Level Up!', message: 'You reached Level 15', time: '1h ago', read: false },
    { id: '3', type: 'achievement', title: 'New Achievement', message: 'Challenge Master unlocked', time: '3h ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 backdrop-blur-lg bg-gray-900/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo & Main Nav */}
            <div className="flex items-center space-x-8">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo */}
              <div
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-3 cursor-pointer group"
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">
                    ASTRAL TURF
                  </h1>
                  <p className="text-xs text-gray-400 -mt-1">Tactical Excellence</p>
                </div>
              </div>

              {/* Desktop Main Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {navigation.slice(0, 5).map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.path}
                    onClick={() => {
                      console.log('🔍 Nav Click:', item.label, 'Path:', item.path);
                      
                      if (item.path) {
                        console.log('✅ Navigating to:', item.path);
                        navigate(item.path);
                      } else if (item.children && item.children.length > 0) {
                        // Navigate to first child if parent has no path
                        const firstChild = item.children[0];
                        console.log('📁 Parent has children, navigating to first:', firstChild.path);
                        if (firstChild.path) {
                          navigate(firstChild.path);
                        }
                      } else {
                        console.warn('⚠️ No path or children for:', item.label);
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Right Section - Search, Notifications, Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search Button */}
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white relative"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
                    >
                      <form onSubmit={handleSearch} className="p-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search everything..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                            autoFocus
                          />
                        </div>
                        <div className="mt-3 text-xs text-gray-400">
                          <p>Quick shortcuts: Players, Challenges, Tactics</p>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs text-blue-400 font-medium">{unreadCount} unread</span>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-gray-700 last:border-0 hover:bg-gray-700/50 transition-colors cursor-pointer ${
                              !notif.read ? 'bg-blue-900/10' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${
                                notif.type === 'challenge' ? 'bg-cyan-600' :
                                notif.type === 'level' ? 'bg-yellow-600' :
                                'bg-purple-600'
                              }`}>
                                {notif.type === 'challenge' ? <Trophy className="w-4 h-4 text-white" /> :
                                 notif.type === 'level' ? <Zap className="w-4 h-4 text-white" /> :
                                 <Trophy className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{notif.title}</h4>
                                <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-gray-900 text-center">
                        <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                          View All Notifications
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden sm:block p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Profile */}
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-80 h-full bg-gray-900 shadow-2xl overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">ASTRAL TURF</h2>
                    <p className="text-xs text-white/80">Tactical Excellence</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* User Info */}
              {authState.user && (
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {authState.user.email?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{authState.user.email?.split('@')[0]}</p>
                      <p className="text-sm text-gray-400 capitalize">{authState.user.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="p-4 space-y-2">
                {navigation.map((item) => (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    onNavigate={(path) => {
                      navigate(path);
                      setMobileMenuOpen(false);
                    }}
                    isActive={location.pathname === item.path}
                  />
                ))}
              </div>

              {/* Footer Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
                >
                  <span className="flex items-center space-x-2">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Desktop nav button component
const NavButton: React.FC<{ item: any; isActive: boolean; onClick: () => void }> = ({ item, isActive, onClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);
  
  if (item.children && item.children.length > 0) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            isActive || showDropdown
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>{item.icon}</span>
            <span>{item.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </span>
        </button>
        
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50"
            >
              <div className="p-2">
                {item.description && (
                  <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700 mb-2">
                    {item.description}
                  </div>
                )}
                {item.children.map((child: any) => (
                  <button
                    key={child.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔍 Child Nav Click:', child.label, 'Path:', child.path);
                      
                      if (child.path) {
                        console.log('✅ Navigating to child:', child.path);
                        navigate(child.path);
                        setShowDropdown(false);
                      } else {
                        console.warn('⚠️ Child has no path:', child.label);
                      }
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left text-gray-300 hover:text-white"
                  >
                    <span>{child.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{child.label}</div>
                      {child.description && (
                        <div className="text-xs text-gray-400 mt-0.5">{child.description}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
          : 'text-gray-300 hover:text-white hover:bg-gray-800'
      }`}
    >
      <span className="flex items-center space-x-2">
        <span>{item.icon}</span>
        <span>{item.label}</span>
      </span>
    </button>
  );
};

// Mobile nav item component
const MobileNavItem: React.FC<{ 
  item: any; 
  onNavigate: (path: string) => void; 
  isActive: boolean 
}> = ({ item, onNavigate, isActive }) => {
  const [expanded, setExpanded] = useState(false);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
        >
          <span className="flex items-center space-x-3 text-white">
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-4 mt-1 space-y-1"
            >
              {item.children.map((child: any) => (
                <button
                  key={child.id}
                  onClick={() => child.path && onNavigate(child.path)}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left text-gray-300 hover:text-white"
                >
                  <span>{child.icon}</span>
                  <span className="text-sm">{child.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      onClick={() => item.path && onNavigate(item.path)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <span className="text-xl">{item.icon}</span>
      <span className="font-medium">{item.label}</span>
    </button>
  );
};

export default ProfessionalNavbar;

