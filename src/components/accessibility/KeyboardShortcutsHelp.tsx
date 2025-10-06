/**
 * Keyboard Shortcuts Help Component
 *
 * Displays all available keyboard shortcuts in a searchable modal
 * Activated by pressing '?' key
 */

import React, { useState, useMemo } from 'react';
import { useKeyboardShortcutsStore, formatShortcut } from '@/hooks/useKeyboardShortcuts';
import { useFocusTrap, useFocusRestoration } from '@/hooks/useFocusManagement';

interface KeyboardShortcutsHelpProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Keyboard Shortcuts Help Modal
 *
 * @example
 * ```tsx
 * function App() {
 *   const [showHelp, setShowHelp] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setShowHelp(true)}>
 *         Show Shortcuts (?)
 *       </button>
 *       <KeyboardShortcutsHelp
 *         isOpen={showHelp}
 *         onClose={() => setShowHelp(false)}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function KeyboardShortcutsHelp({
  isOpen: controlledOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const store = useKeyboardShortcutsStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Use controlled or store state
  const isOpen = controlledOpen !== undefined ? controlledOpen : store.helpModalOpen;
  const handleClose = onClose || (() => store.toggleHelpModal(false));

  // Focus management
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  useFocusRestoration();

  // Get shortcuts by category
  const categories = useMemo(() => {
    return store.getShortcutsByCategory();
  }, [store]);

  // Filter shortcuts by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase();

    return categories
      .map(category => ({
        ...category,
        shortcuts: category.shortcuts.filter(
          shortcut =>
            shortcut.description.toLowerCase().includes(query) ||
            formatShortcut(shortcut).toLowerCase().includes(query) ||
            category.name.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.shortcuts.length > 0);
  }, [categories, searchQuery]);

  // Category display names
  const categoryNames: Record<string, string> = {
    global: 'Global',
    navigation: 'Navigation',
    'tactical-board': 'Tactical Board',
    forms: 'Forms',
    modals: 'Modals',
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 id="shortcuts-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={handleClose}
                aria-label="Close keyboard shortcuts help"
                data-modal-close
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Search */}
            <input
              type="search"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search keyboard shortcuts"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredCategories.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No shortcuts found matching &quot;{searchQuery}&quot;
              </p>
            ) : (
              <div className="space-y-6">
                {filteredCategories.map(category => (
                  <div key={category.name}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {categoryNames[category.name] || category.name}
                    </h3>
                    <div className="space-y-2">
                      {category.shortcuts.map(shortcut => (
                        <div
                          key={`${category.name}-${shortcut.key}-${shortcut.description}`}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {shortcut.description}
                          </span>
                          <kbd className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-500 font-mono text-sm font-semibold">
                            {formatShortcut(shortcut)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Press{' '}
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
                Escape
              </kbd>{' '}
              or click outside to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Keyboard Shortcuts Help Button
 *
 * Quick access button to open shortcuts help
 */
export function KeyboardShortcutsButton({ className = '' }: { className?: string }) {
  const store = useKeyboardShortcutsStore();

  return (
    <button
      onClick={() => store.toggleHelpModal(true)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors ${className}`}
      aria-label="Show keyboard shortcuts"
      title="Show keyboard shortcuts (?)"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
      <span className="hidden sm:inline">Keyboard Shortcuts</span>
      <kbd className="hidden sm:inline px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-xs font-mono">
        ?
      </kbd>
    </button>
  );
}

/**
 * Global Keyboard Shortcuts Help
 *
 * Listens for '?' key globally and shows help modal
 * Add this to your app root
 */
export function GlobalKeyboardShortcutsHelp() {
  const store = useKeyboardShortcutsStore();

  return (
    <KeyboardShortcutsHelp
      isOpen={store.helpModalOpen}
      onClose={() => store.toggleHelpModal(false)}
    />
  );
}

export default KeyboardShortcutsHelp;
