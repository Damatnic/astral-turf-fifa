/**
 * Shortcut Panel Component
 *
 * Modal panel displaying all keyboard shortcuts
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ShortcutPanelProps } from '../../../types/toolbar';

const ShortcutPanel: React.FC<ShortcutPanelProps> = ({
  shortcuts,
  isOpen,
  onClose,
  className = '',
}) => {
  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups = new Map<string, typeof shortcuts>();

    shortcuts.forEach(shortcut => {
      const category = shortcut.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(shortcut);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      shortcuts: items,
    }));
  }, [shortcuts]);

  // Format shortcut display
  const formatShortcut = (shortcut: typeof shortcuts[0]) => {
    const parts: string[] = [];

    if (shortcut.modifiers) {
      parts.push(...shortcut.modifiers.map(m =>
        m === 'ctrl' ? 'Ctrl' :
        m === 'shift' ? 'Shift' :
        m === 'alt' ? 'Alt' :
        m === 'meta' ? 'Cmd' : m,
      ));
    }

    parts.push(shortcut.key.toUpperCase());

    return parts.join(' + ');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="shortcut-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <style>{`
              .shortcut-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
              }
            `}</style>
          </motion.div>

          {/* Panel */}
          <motion.div
            className={`shortcut-panel ${className}`}
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="panel-header">
              <h2 className="panel-title">Keyboard Shortcuts</h2>
              <button
                className="panel-close"
                onClick={onClose}
                aria-label="Close shortcuts panel"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="panel-content">
              {groupedShortcuts.map(group => (
                <div key={group.category} className="shortcut-group">
                  <h3 className="group-title">{group.category}</h3>
                  <div className="shortcut-list">
                    {group.shortcuts.map(shortcut => (
                      <div key={shortcut.toolId} className="shortcut-item">
                        <span className="shortcut-description">
                          {shortcut.description}
                        </span>
                        <kbd className="shortcut-keys">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <style>{`
              .shortcut-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 2001;
                background: #1a1a2e;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                width: 90%;
                max-width: 700px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
              }

              .panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              }

              .panel-title {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 700;
                background: linear-gradient(135deg, #00f5ff 0%, #0080ff 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }

              .panel-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                padding: 0.5rem;
                font-size: 1.5rem;
                transition: color 0.2s;
                line-height: 1;
              }

              .panel-close:hover {
                color: #fff;
              }

              .panel-content {
                overflow-y: auto;
                padding: 1.5rem;
              }

              .panel-content::-webkit-scrollbar {
                width: 8px;
              }

              .panel-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.02);
              }

              .panel-content::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
              }

              .shortcut-group {
                margin-bottom: 2rem;
              }

              .shortcut-group:last-child {
                margin-bottom: 0;
              }

              .group-title {
                margin: 0 0 1rem 0;
                font-size: 0.875rem;
                font-weight: 600;
                color: #00f5ff;
                text-transform: uppercase;
                letter-spacing: 1px;
              }

              .shortcut-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
              }

              .shortcut-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                transition: background 0.2s;
              }

              .shortcut-item:hover {
                background: rgba(255, 255, 255, 0.05);
              }

              .shortcut-description {
                color: rgba(255, 255, 255, 0.8);
                font-size: 0.875rem;
              }

              .shortcut-keys {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.375rem 0.75rem;
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                font-family: monospace;
                font-size: 0.75rem;
                font-weight: 600;
                color: #00f5ff;
                white-space: nowrap;
              }

              @media (max-width: 768px) {
                .shortcut-panel {
                  width: 95%;
                  max-height: 90vh;
                }

                .panel-header {
                  padding: 1rem;
                }

                .panel-title {
                  font-size: 1.25rem;
                }

                .panel-content {
                  padding: 1rem;
                }

                .shortcut-item {
                  flex-direction: column;
                  align-items: flex-start;
                  gap: 0.5rem;
                }
              }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShortcutPanel;
