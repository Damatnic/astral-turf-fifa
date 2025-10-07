/**
 * Enhanced Tactical Toolbar Component
 *
 * Context-sensitive toolbar with smart tool grouping,
 * keyboard shortcuts, and floating palettes
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  EnhancedTacticalToolbarProps,
  ToolId,
  Tool,
  ToolbarState,
} from '../../../types/toolbar';
import ToolButton from './ToolButton';
import ToolGroupComponent from './ToolGroup';
import FloatingPaletteComponent from './FloatingPalette';
import ShortcutPanel from './ShortcutPanel';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getContextualTools, getDefaultToolGroups } from '../utils/toolbarHelpers';

const EnhancedTacticalToolbar: React.FC<EnhancedTacticalToolbarProps> = ({
  mode,
  interactionMode,
  selectedPlayers = [],
  formation,
  activeTool,
  enabledTools = [],
  isCompact = false,
  isMobile = false,
  canUndo = false,
  canRedo = false,
  zoomLevel = 1,
  minZoom = 0.5,
  maxZoom = 2,
  onToolSelect,
  onUndo,
  onRedo,
  onZoom,
  onSave,
  onExport,
  toolGroups,
  shortcuts = [],
  floatingPalettes = [],
  className = '',
}) => {
  // State
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    activeTool: activeTool || null,
    enabledTools: new Set(enabledTools),
    expandedGroups: new Set(['formation', 'view']),
    isCompact,
    showLabels: !isCompact,
    showShortcuts: !isMobile,
    pinnedTools: ['select', 'move', 'undo', 'redo'],
    recentTools: [],
  });

  const [showShortcutPanel, setShowShortcutPanel] = useState(false);
  const [visiblePalettes, setVisiblePalettes] = useState<Set<string>>(new Set());

  // Get contextual tool groups
  const contextualGroups = useMemo(() => {
    if (toolGroups) {return toolGroups;}

    const defaultGroups = getDefaultToolGroups({
      onToolSelect,
      onUndo,
      onRedo,
      onZoom,
      onSave,
      onExport,
    });

    return getContextualTools(defaultGroups, {
      mode,
      interactionMode,
      selectedPlayers,
      formation,
      canUndo,
      canRedo,
      zoomLevel,
    });
  }, [
    toolGroups,
    mode,
    interactionMode,
    selectedPlayers,
    formation,
    canUndo,
    canRedo,
    zoomLevel,
    onToolSelect,
    onUndo,
    onRedo,
    onZoom,
    onSave,
    onExport,
  ]);

  // Handle tool selection
  const handleToolSelect = useCallback((toolId: ToolId) => {
    onToolSelect(toolId);

    // Update recent tools
    setToolbarState(prev => ({
      ...prev,
      activeTool: toolId,
      recentTools: [
        toolId,
        ...prev.recentTools.filter(id => id !== toolId),
      ].slice(0, 5),
    }));
  }, [onToolSelect]);

  // Handle group toggle
  const handleToggleGroup = useCallback((groupId: string) => {
    setToolbarState(prev => {
      const newExpanded = new Set(prev.expandedGroups);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return { ...prev, expandedGroups: newExpanded };
    });
  }, []);

  // Handle palette toggle
  const handleTogglePalette = useCallback((paletteId: string) => {
    setVisiblePalettes(prev => {
      const newVisible = new Set(prev);
      if (newVisible.has(paletteId)) {
        newVisible.delete(paletteId);
      } else {
        newVisible.add(paletteId);
      }
      return newVisible;
    });
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts,
    onShortcutTrigger: handleToolSelect,
    enabled: !showShortcutPanel,
  });

  // Update active tool when prop changes
  useEffect(() => {
    setToolbarState(prev => ({ ...prev, activeTool: activeTool || null }));
  }, [activeTool]);

  // Quick access tools (pinned + recent)
  const quickAccessTools = useMemo(() => {
    const allTools = contextualGroups.flatMap(g => g.tools);
    const pinnedToolsData = toolbarState.pinnedTools
      .map(id => allTools.find(t => t.id === id))
      .filter(Boolean) as Tool[];

    return pinnedToolsData;
  }, [contextualGroups, toolbarState.pinnedTools]);

  return (
    <motion.div
      className={`enhanced-tactical-toolbar ${isCompact ? 'compact' : ''} ${isMobile ? 'mobile' : ''} ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="toolbar-container">
        {/* Quick Access Tools */}
        {!isMobile && quickAccessTools.length > 0 && (
          <div className="quick-access">
            {quickAccessTools.map(tool => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={toolbarState.activeTool === tool.id}
                isCompact={toolbarState.isCompact}
                showLabel={toolbarState.showLabels}
                showShortcut={toolbarState.showShortcuts}
                onClick={() => handleToolSelect(tool.id)}
              />
            ))}
            <div className="separator" />
          </div>
        )}

        {/* Tool Groups */}
        <div className="tool-groups">
          {contextualGroups.map(group => (
            <ToolGroupComponent
              key={group.id}
              group={group}
              activeTool={toolbarState.activeTool ?? undefined}
              isCompact={toolbarState.isCompact}
              isExpanded={toolbarState.expandedGroups.has(group.id)}
              onToolSelect={handleToolSelect}
              onToggleExpand={handleToggleGroup}
            />
          ))}
        </div>

        {/* Utility Actions */}
        <div className="utility-actions">
          {/* Zoom Controls */}
          {onZoom && (
            <div className="zoom-controls">
              <button
                className="zoom-btn"
                onClick={() => onZoom(Math.max(minZoom, zoomLevel - 0.1))}
                disabled={zoomLevel <= minZoom}
                title="Zoom Out (Ctrl+-)"
              >
                🔍-
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button
                className="zoom-btn"
                onClick={() => onZoom(Math.min(maxZoom, zoomLevel + 0.1))}
                disabled={zoomLevel >= maxZoom}
                title="Zoom In (Ctrl++)"
              >
                🔍+
              </button>
            </div>
          )}

          {/* Keyboard Shortcuts Button */}
          {shortcuts.length > 0 && (
            <button
              className="shortcut-btn"
              onClick={() => setShowShortcutPanel(true)}
              title="Keyboard Shortcuts (Ctrl+/)"
            >
              ⌨️
            </button>
          )}

          {/* Floating Palettes Toggle */}
          {floatingPalettes.length > 0 && (
            <button
              className="palette-btn"
              onClick={() => handleTogglePalette(floatingPalettes[0].id)}
              title="Toggle Floating Palette"
            >
              🎨
            </button>
          )}
        </div>
      </div>

      {/* Floating Palettes */}
      <AnimatePresence>
        {floatingPalettes.map(palette => (
          visiblePalettes.has(palette.id) && (
            <FloatingPaletteComponent
              key={palette.id}
              {...palette}
              activeTool={toolbarState.activeTool ?? undefined}
              onToolSelect={handleToolSelect}
              onClose={() => handleTogglePalette(palette.id)}
            />
          )
        ))}
      </AnimatePresence>

      {/* Keyboard Shortcuts Panel */}
      <ShortcutPanel
        shortcuts={shortcuts}
        isOpen={showShortcutPanel}
        onClose={() => setShowShortcutPanel(false)}
        onShortcutTrigger={handleToolSelect}
      />

      <style>{`
        .enhanced-tactical-toolbar {
          position: sticky;
          top: 0;
          z-index: 900;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .toolbar-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          max-width: 1920px;
          margin: 0 auto;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .toolbar-container::-webkit-scrollbar {
          height: 4px;
        }

        .toolbar-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }

        .toolbar-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .quick-access {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .separator {
          width: 1px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 0.25rem;
        }

        .tool-groups {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .utility-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: auto;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        .zoom-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .zoom-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .zoom-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .zoom-level {
          font-size: 0.75rem;
          color: #00f5ff;
          font-weight: 600;
          min-width: 45px;
          text-align: center;
        }

        .shortcut-btn,
        .palette-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 0.5rem;
          font-size: 1.125rem;
          transition: all 0.2s;
        }

        .shortcut-btn:hover,
        .palette-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #00f5ff;
          color: #fff;
        }

        /* Compact Mode */
        .enhanced-tactical-toolbar.compact .toolbar-container {
          padding: 0.5rem;
        }

        .enhanced-tactical-toolbar.compact .tool-groups {
          gap: 0.5rem;
        }

        /* Mobile Mode */
        .enhanced-tactical-toolbar.mobile {
          position: fixed;
          bottom: 0;
          top: auto;
          left: 0;
          right: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: none;
        }

        .enhanced-tactical-toolbar.mobile .toolbar-container {
          padding: 0.5rem;
          justify-content: space-around;
        }

        .enhanced-tactical-toolbar.mobile .quick-access {
          display: none;
        }

        .enhanced-tactical-toolbar.mobile .separator {
          display: none;
        }

        @media (max-width: 768px) {
          .zoom-level {
            display: none;
          }

          .utility-actions {
            gap: 0.5rem;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default EnhancedTacticalToolbar;
