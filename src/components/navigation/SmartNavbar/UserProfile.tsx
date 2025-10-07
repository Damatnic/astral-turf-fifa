/**
 * User Profile Component
 *
 * User profile menu with role badge and dropdown
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfileProps } from '../../../types/navigation';

const UserProfile: React.FC<UserProfileProps> = ({
  userName,
  userRole,
  userAvatar,
  menuItems,
  onMenuItemClick,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as HTMLElement)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuItemClick = (itemId: string) => {
    onMenuItemClick(itemId);
    setIsMenuOpen(false);
  };

  // Get role color
  const getRoleColor = () => {
    switch (userRole) {
      case 'admin': return '#ff4444';
      case 'coach': return '#00f5ff';
      case 'analyst': return '#9f7aea';
      case 'player': return '#48bb78';
      default: return '#a0aec0';
    }
  };

  return (
    <div ref={menuRef} className={`user-profile ${className}`}>
      <motion.button
        className="profile-trigger"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {userAvatar ? (
          <img src={userAvatar} alt={userName} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="profile-info">
          <span className="profile-name">{userName}</span>
          <span className="profile-role" style={{ color: getRoleColor() }}>
            {userRole}
          </span>
        </div>
        <span className={`profile-chevron ${isMenuOpen ? 'open' : ''}`}>
          ▼
        </span>
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="profile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {menuItems.map((item) => {
              if (item.type === 'separator') {
                return <div key={item.id} className="menu-separator" />;
              }

              return (
                <motion.button
                  key={item.id}
                  className="menu-item"
                  whileHover={{ x: 4 }}
                  onClick={() => handleMenuItemClick(item.id)}
                >
                  {item.icon && <span className="menu-icon">{item.icon}</span>}
                  <span className="menu-label">{item.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .user-profile {
          position: relative;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .profile-avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00f5ff 0%, #0080ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.125rem;
        }

        .profile-name {
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .profile-role {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-chevron {
          font-size: 0.625rem;
          color: rgba(255, 255, 255, 0.5);
          transition: transform 0.2s;
        }

        .profile-chevron.open {
          transform: rotate(180deg);
        }

        .profile-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 200px;
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 1200;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .menu-icon {
          font-size: 1rem;
        }

        .menu-label {
          flex: 1;
        }

        .menu-separator {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0.5rem 0;
        }

        @media (max-width: 768px) {
          .profile-info {
            display: none;
          }

          .profile-chevron {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default UserProfile;
