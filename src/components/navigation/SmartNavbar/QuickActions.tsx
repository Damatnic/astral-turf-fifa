/**
 * Quick Actions Component
 *
 * Context-sensitive quick action buttons
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { QuickAction } from '../../../types/navigation';

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (actionId: string) => void;
  compact?: boolean;
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  onAction,
  compact = false,
  className = '',
}) => {
  const enabledActions = actions.filter(action => action.isEnabled !== false);

  return (
    <div className={`quick-actions ${compact ? 'compact' : ''} ${className}`}>
      {enabledActions.slice(0, compact ? 3 : 5).map((action) => (
        <motion.button
          key={action.id}
          className="quick-action-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAction(action.id)}
          title={action.description || action.label}
        >
          <span className="action-icon">{action.icon}</span>
          {!compact && <span className="action-label">{action.label}</span>}
          {action.badge && (
            <span className="action-badge">{action.badge}</span>
          )}
          {action.shortcut && !compact && (
            <span className="action-shortcut">{action.shortcut}</span>
          )}
        </motion.button>
      ))}

      <style>{`
        .quick-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .quick-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #00f5ff;
          color: #fff;
        }

        .action-icon {
          font-size: 1rem;
        }

        .action-label {
          font-weight: 500;
          white-space: nowrap;
        }

        .action-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ff4444;
          color: #fff;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }

        .action-shortcut {
          margin-left: auto;
          padding: 0.125rem 0.375rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          font-size: 0.625rem;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.5);
        }

        .quick-actions.compact .quick-action-btn {
          padding: 0.5rem;
        }

        @media (max-width: 768px) {
          .quick-actions {
            gap: 0.25rem;
          }

          .quick-action-btn {
            padding: 0.375rem;
          }

          .action-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickActions;
