/**
 * Keyboard Shortcuts Guide
 * 
 * Interactive guide showing all available keyboard shortcuts
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Search, Command } from 'lucide-react';

interface KeyboardShortcutsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'tactics' | 'drawing' | 'general';
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['Ctrl', 'K'], description: 'Open global search', category: 'navigation' },
  { keys: ['Ctrl', 'H'], description: 'Go to dashboard', category: 'navigation' },
  { keys: ['Ctrl', 'T'], description: 'Go to tactics board', category: 'navigation' },
  { keys: ['Ctrl', 'P'], description: 'Go to player card', category: 'navigation' },
  { keys: ['Ctrl', 'S'], description: 'Open settings', category: 'navigation' },
  { keys: ['Esc'], description: 'Close modals/menus', category: 'navigation' },
  { keys: ['?'], description: 'Show this shortcuts guide', category: 'navigation' },
  
  // Tactics Board
  { keys: ['V'], description: 'Select tool', category: 'tactics' },
  { keys: ['A'], description: 'Arrow tool', category: 'tactics' },
  { keys: ['L'], description: 'Line tool', category: 'tactics' },
  { keys: ['R'], description: 'Rectangle tool', category: 'tactics' },
  { keys: ['P'], description: 'Pen tool', category: 'tactics' },
  { keys: ['T'], description: 'Text tool', category: 'tactics' },
  { keys: ['G'], description: 'Toggle grid', category: 'tactics' },
  { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'tactics' },
  { keys: ['Ctrl', 'Y'], description: 'Redo', category: 'tactics' },
  { keys: ['Ctrl', 'F'], description: 'Open formation library', category: 'tactics' },
  { keys: ['Delete'], description: 'Delete selected', category: 'tactics' },
  { keys: ['Ctrl', 'A'], description: 'Select all', category: 'tactics' },
  
  // Drawing
  { keys: ['Shift', 'Drag'], description: 'Constrain to straight line', category: 'drawing' },
  { keys: ['Alt', 'Drag'], description: 'Duplicate', category: 'drawing' },
  { keys: ['Ctrl', 'Drag'], description: 'Snap to grid', category: 'drawing' },
  { keys: ['+'], description: 'Zoom in', category: 'drawing' },
  { keys: ['-'], description: 'Zoom out', category: 'drawing' },
  { keys: ['0'], description: 'Reset zoom', category: 'drawing' },
  { keys: ['Space', 'Drag'], description: 'Pan view', category: 'drawing' },
  
  // General
  { keys: ['Ctrl', 'S'], description: 'Save formation', category: 'general' },
  { keys: ['Ctrl', 'E'], description: 'Export formation', category: 'general' },
  { keys: ['Ctrl', 'N'], description: 'New formation', category: 'general' },
  { keys: ['Ctrl', '/'], description: 'Toggle sidebar', category: 'general' },
  { keys: ['F'], description: 'Fullscreen mode', category: 'general' },
];

export const KeyboardShortcutsGuide: React.FC<KeyboardShortcutsGuideProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | Shortcut['category']>('all');

  // Listen for ? key to open guide
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !isOpen) {
        e.preventDefault();
        // Trigger open from parent component
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const filteredShortcuts = SHORTCUTS.filter(shortcut => {
    const matchesSearch = searchQuery === '' ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All', icon: '📚' },
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
    { id: 'tactics', label: 'Tactics Board', icon: '⚽' },
    { id: 'drawing', label: 'Drawing', icon: '✏️' },
    { id: 'general', label: 'General', icon: '⚙️' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <Keyboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Keyboard Shortcuts</h2>
                  <p className="text-sm text-white/80">Master Astral Turf with keyboard shortcuts</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shortcuts..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex space-x-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Shortcuts List */}
          <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
            {filteredShortcuts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No shortcuts found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredShortcuts.map((shortcut, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center justify-between bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <span className="text-gray-300">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm shadow-md">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-gray-500">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-800 border-t border-gray-700 p-4 text-center">
            <p className="text-sm text-gray-400">
              Press <kbd className="px-2 py-1 bg-gray-700 rounded text-white font-mono text-xs">?</kbd> anytime to open this guide
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KeyboardShortcutsGuide;

