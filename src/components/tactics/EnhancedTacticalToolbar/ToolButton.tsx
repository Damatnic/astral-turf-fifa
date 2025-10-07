/**
 * Tool Button Component
 *
 * Individual tool button with icon, label, shortcut, and badge
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { ToolButtonProps } from '../../../types/toolbar';

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  isActive = false,
  isCompact = false,
  showLabel = true,
  showShortcut = true,
  onClick,
  className = '',
}) => {
  const isDisabled = tool.isEnabled === false;

  return (
    <motion.button
      className={`tool-button ${isActive ? 'active' : ''} ${isCompact ? 'compact' : ''} ${isDisabled ? 'disabled' : ''} ${className}`}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isDisabled}
      title={tool.description || tool.label}
      aria-label={tool.label}
      aria-pressed={isActive}
    >
      <span className="tool-icon">{tool.icon}</span>

      {showLabel && !isCompact && (
        <span className="tool-label">{tool.label}</span>
      )}

      {tool.badge && (
        <span className="tool-badge">{tool.badge}</span>
      )}

      {showShortcut && !isCompact && tool.shortcut && (
        <span className="tool-shortcut">{tool.shortcut}</span>
      )}

      <style>{`
        .tool-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .tool-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .tool-button.active {
          background: linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(0, 128, 255, 0.2));
          border-color: #00f5ff;
          color: #00f5ff;
          font-weight: 600;
        }

        .tool-button.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tool-button.compact {
          padding: 0.5rem;
          min-width: 40px;
          justify-content: center;
        }

        .tool-icon {
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .tool-label {
          font-weight: 500;
        }

        .tool-badge {
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
          line-height: 1;
        }

        .tool-shortcut {
          margin-left: auto;
          padding: 0.125rem 0.375rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          font-size: 0.625rem;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.5);
        }

        .tool-button.active .tool-shortcut {
          color: #00f5ff;
        }
      `}</style>
    </motion.button>
  );
};

export default ToolButton;
