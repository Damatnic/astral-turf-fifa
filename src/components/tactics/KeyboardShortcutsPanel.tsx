/**
 * Keyboard Shortcuts Panel Component
 *
 * Displays all available keyboard shortcuts organized by category.
 * Can be triggered by pressing '?' or from the toolbar.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Search } from 'lucide-react';
import {
  KEYBOARD_SHORTCUTS,
  getCategories,
  getCategoryDisplayName,
  formatShortcut,
} from '../../constants/keyboardShortcuts';

export interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter shortcuts based on search query
  const filteredShortcuts = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return KEYBOARD_SHORTCUTS;
    }

    const query = searchQuery.toLowerCase();
    return KEYBOARD_SHORTCUTS.filter(
      shortcut =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.key.toLowerCase().includes(query) ||
        formatShortcut(shortcut).toLowerCase().includes(query),
    );
  }, [searchQuery]);

  // Group filtered shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, typeof KEYBOARD_SHORTCUTS> = {};

    filteredShortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });

    return groups;
  }, [filteredShortcuts]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-700">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Keyboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                  <p className="text-sm text-slate-400">
                    {filteredShortcuts.length} shortcut{filteredShortcuts.length !== 1 ? 's' : ''}{' '}
                    available
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search shortcuts..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
            {Object.keys(groupedShortcuts).length === 0 ? (
              <div className="text-center py-12">
                <Keyboard className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No shortcuts found</p>
                <p className="text-sm text-slate-500 mt-2">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getCategories().map(category => {
                  const categoryShortcuts = groupedShortcuts[category];
                  if (!categoryShortcuts || categoryShortcuts.length === 0) {
                    return null;
                  }

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                    >
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                        {getCategoryDisplayName(category)}
                      </h3>

                      <div className="space-y-2">
                        {categoryShortcuts.map(shortcut => (
                          <div
                            key={`${category}-${shortcut.key}-${shortcut.description}`}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
                          >
                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                              {shortcut.description}
                            </span>

                            <kbd className="inline-flex items-center px-2.5 py-1 text-xs font-mono bg-slate-900 text-slate-300 border border-slate-600 rounded shadow-sm group-hover:border-blue-500 group-hover:text-blue-400 transition-all">
                              {formatShortcut(shortcut)}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-400">
                Press{' '}
                <kbd className="px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded">
                  ?
                </kbd>{' '}
                anytime to toggle this panel
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * Hook to manage keyboard shortcuts panel state
 */
export function useKeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open panel with '?' key
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
