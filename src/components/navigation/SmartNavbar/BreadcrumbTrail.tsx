/**
 * Breadcrumb Trail Component
 *
 * Navigation breadcrumbs with smart truncation
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { BreadcrumbTrailProps } from '../../../types/navigation';

const BreadcrumbTrail: React.FC<BreadcrumbTrailProps> = ({
  items,
  separator = '/',
  maxItems = 5,
  showHome = true,
  onNavigate,
  className = '',
}) => {
  // Truncate items if needed
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    // Keep first, last, and some middle items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 2));

    return [
      firstItem,
      { id: 'ellipsis', label: '...', isCurrentPage: false },
      ...lastItems,
    ];
  }, [items, maxItems]);

  return (
    <nav className={`breadcrumb-trail ${className}`}>
      <div className="breadcrumb-container">
        {showHome && (
          <>
            <motion.button
              className="breadcrumb-item home"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('/')}
            >
              🏠
            </motion.button>
            <span className="breadcrumb-separator">{separator}</span>
          </>
        )}

        {displayItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {item.id === 'ellipsis' ? (
              <span className="breadcrumb-ellipsis">{item.label}</span>
            ) : (
              <motion.button
                className={`breadcrumb-item ${item.isCurrentPage ? 'current' : ''}`}
                whileHover={!item.isCurrentPage ? { scale: 1.05 } : {}}
                whileTap={!item.isCurrentPage ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (!item.isCurrentPage && item.path) {
                    onNavigate(item.path);
                  }
                }}
                disabled={item.isCurrentPage}
              >
                {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                <span className="breadcrumb-label">{item.label}</span>
              </motion.button>
            )}

            {index < displayItems.length - 1 && (
              <span className="breadcrumb-separator">{separator}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <style>{`
        .breadcrumb-trail {
          padding: 0.5rem 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .breadcrumb-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          max-width: 1920px;
          margin: 0 auto;
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          scrollbar-width: thin;
        }

        .breadcrumb-container::-webkit-scrollbar {
          height: 4px;
        }

        .breadcrumb-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }

        .breadcrumb-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          background: none;
          border: none;
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .breadcrumb-item:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .breadcrumb-item.current {
          color: #00f5ff;
          cursor: default;
          font-weight: 500;
        }

        .breadcrumb-item.home {
          font-size: 1rem;
          padding: 0.25rem;
        }

        .breadcrumb-icon {
          font-size: 0.875rem;
        }

        .breadcrumb-separator {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.75rem;
          user-select: none;
        }

        .breadcrumb-ellipsis {
          color: rgba(255, 255, 255, 0.4);
          padding: 0.25rem 0.5rem;
          font-size: 0.8125rem;
        }

        @media (max-width: 768px) {
          .breadcrumb-trail {
            padding: 0.5rem 1rem;
          }

          .breadcrumb-item {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default BreadcrumbTrail;
