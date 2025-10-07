/**
 * Context Menu Component
 *
 * Renders context-aware navigation menu with role-based filtering
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { NavigationItem, UserRole } from '../../../types/navigation';

interface ContextMenuProps {
  items: NavigationItem[];
  currentPage: string;
  activeDropdown: string | null;
  onNavigate: (path: string, item: NavigationItem) => void;
  onDropdownToggle: (itemId: string) => void;
  userRole: UserRole;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  currentPage,
  activeDropdown,
  onNavigate,
  onDropdownToggle,
}) => {
  return (
    <div className="context-menu">
      {items.map((item) => {
        const isActive = item.path === currentPage;
        const hasChildren = item.children && item.children.length > 0;
        const isDropdownOpen = activeDropdown === item.id;

        if (item.type === 'separator') {
          return <div key={item.id} className="menu-separator" />;
        }

        return (
          <div key={item.id} className="menu-item-wrapper">
            <motion.div
              className={`menu-item ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (hasChildren) {
                  onDropdownToggle(item.id);
                } else if (item.path) {
                  onNavigate(item.path, item);
                } else if (item.onClick) {
                  item.onClick();
                }
              }}
            >
              {item.icon && <span className="menu-icon">{item.icon}</span>}
              <span className="menu-label">{item.label}</span>
              {item.badge && (
                <span className="menu-badge">{item.badge}</span>
              )}
              {hasChildren && (
                <span className={`menu-chevron ${isDropdownOpen ? 'open' : ''}`}>
                  ▼
                </span>
              )}
            </motion.div>

            {/* Dropdown menu */}
            {hasChildren && isDropdownOpen && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {item.children?.map((child) => (
                  <div
                    key={child.id}
                    className={`dropdown-item ${child.path === currentPage ? 'active' : ''}`}
                    onClick={() => {
                      if (child.path) {
                        onNavigate(child.path, child);
                      } else if (child.onClick) {
                        child.onClick();
                      }
                    }}
                  >
                    {child.icon && <span className="dropdown-icon">{child.icon}</span>}
                    <span className="dropdown-label">{child.label}</span>
                    {child.badge && (
                      <span className="dropdown-badge">{child.badge}</span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}

      <style>{`
        .context-menu {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .menu-item-wrapper {
          position: relative;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .menu-item.active {
          background: linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(0, 128, 255, 0.2));
          color: #00f5ff;
          font-weight: 600;
        }

        .menu-icon {
          font-size: 1.125rem;
        }

        .menu-badge {
          background: #ff4444;
          color: #fff;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }

        .menu-chevron {
          font-size: 0.625rem;
          transition: transform 0.2s;
          margin-left: 0.25rem;
        }

        .menu-chevron.open {
          transform: rotate(180deg);
        }

        .menu-separator {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 0.5rem;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 0.5rem;
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          min-width: 200px;
          z-index: 1100;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .dropdown-item.active {
          background: rgba(0, 245, 255, 0.1);
          color: #00f5ff;
        }

        .dropdown-icon {
          font-size: 1rem;
        }

        .dropdown-label {
          flex: 1;
        }

        .dropdown-badge {
          background: #ff4444;
          color: #fff;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ContextMenu;
