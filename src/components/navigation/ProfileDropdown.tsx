/**
 * PROFILE DROPDOWN MENU
 * 
 * Professional user profile dropdown with:
 * - User info display
 * - Quick links (Profile, Settings, Help)
 * - Sign out functionality
 * - Avatar/initials display
 * - Status indicator
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Award,
  BarChart3,
  Bell,
  Zap,
} from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuthContext';

export const ProfileDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { authState, dispatch } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Logout function
  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get user initials
  const getUserInitials = () => {
    const email = authState.user?.email || 'Guest';
    return email.substring(0, 2).toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    return authState.user?.email?.split('@')[0] || 'Guest';
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      onClick: () => {
        navigate('/profile');
        setIsOpen(false);
      },
    },
    {
      id: 'stats',
      label: 'My Stats',
      icon: BarChart3,
      onClick: () => {
        navigate('/player-ranking');
        setIsOpen(false);
      },
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: Award,
      onClick: () => {
        navigate('/challenge-hub');
        setIsOpen(false);
      },
    },
    { id: 'divider1', divider: true },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        navigate('/settings');
        setIsOpen(false);
      },
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      onClick: () => {
        navigate('/help');
        setIsOpen(false);
      },
    },
    { id: 'divider2', divider: true },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: LogOut,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {getUserInitials()}
          </div>
          {/* Online Status */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
        </div>

        {/* User Info (Hidden on mobile) */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-white">{getDisplayName()}</div>
          <div className="text-xs text-gray-400">Coach</div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50"
          >
            {/* User Header */}
            <div className="p-4 border-b border-gray-800 bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {getUserInitials()}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{getDisplayName()}</div>
                  <div className="text-sm text-gray-400">{authState.user?.email}</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-lg font-bold text-cyan-400">12</div>
                  <div className="text-xs text-gray-400">Tactics</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-400">85</div>
                  <div className="text-xs text-gray-400">Win %</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-lg font-bold text-yellow-400">24</div>
                  <div className="text-xs text-gray-400">Awards</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item) => {
                if ('divider' in item) {
                  return <div key={item.id} className="border-t border-gray-800 my-2" />;
                }

                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      item.danger
                        ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;

