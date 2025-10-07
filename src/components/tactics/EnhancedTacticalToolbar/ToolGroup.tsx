/**
 * Tool Group Component
 *
 * Collapsible group of related tools
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolGroupProps } from '../../../types/toolbar';
import ToolButton from './ToolButton';

const ToolGroup: React.FC<ToolGroupProps> = ({
  group,
  activeTool,
  isCompact = false,
  isExpanded = true,
  onToolSelect,
  onToggleExpand,
  className = '',
}) => {
  const hasExpandedTools = group.isCollapsible && group.tools.length > 3;

  return (
    <div className={`tool-group ${className}`}>
      {/* Group Header (if collapsible) */}
      {group.isCollapsible && onToggleExpand && (
        <button
          className="group-header"
          onClick={() => onToggleExpand(group.id)}
          aria-expanded={isExpanded}
        >
          <span className="group-label">{group.label}</span>
          <span className={`group-chevron ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
      )}

      {/* Group Tools */}
      <AnimatePresence>
        {(isExpanded || !group.isCollapsible) && (
          <motion.div
            className="group-tools"
            initial={hasExpandedTools ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {group.tools.map(tool => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={activeTool === tool.id}
                isCompact={isCompact}
                showLabel={!isCompact}
                showShortcut={!isCompact}
                onClick={() => onToolSelect(tool.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .tool-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .group-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: none;
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .group-header:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
        }

        .group-label {
          flex: 1;
        }

        .group-chevron {
          font-size: 0.625rem;
          transition: transform 0.2s;
        }

        .group-chevron.expanded {
          transform: rotate(180deg);
        }

        .group-tools {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ToolGroup;
