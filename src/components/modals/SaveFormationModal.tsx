/**
 * SaveFormationModal Component
 * Modal for saving formations with custom names and notes
 */

import React, { useState, useCallback } from 'react';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SaveFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, notes?: string) => void;
  defaultName?: string;
}

export const SaveFormationModal: React.FC<SaveFormationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName = 'Custom Formation',
}) => {
  const [name, setName] = useState(defaultName);
  const [notes, setNotes] = useState('');

  const handleSave = useCallback(() => {
    if (name.trim()) {
      onSave(name.trim(), notes.trim() || undefined);
      onClose();
      setName(defaultName);
      setNotes('');
    }
  }, [name, notes, onSave, onClose, defaultName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSave();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleSave, onClose],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-800  z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div
              className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Save size={20} className="text-blue-400" />
                  Save Formation
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Formation Name */}
                <div>
                  <label htmlFor="formation-name" className="block text-sm font-medium text-slate-300 mb-2">
                    Formation Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="formation-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter formation name..."
                    autoFocus
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="formation-notes" className="block text-sm font-medium text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="formation-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add any notes or tactics description..."
                  />
                </div>

                {/* Keyboard Shortcut Hint */}
                <div className="text-xs text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Ctrl+Enter</kbd> to save
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                  type="button"
                >
                  <Save size={16} />
                  Save Formation
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SaveFormationModal;
