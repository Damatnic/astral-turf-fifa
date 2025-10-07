/**
 * LoadFormationModal Component
 * Modal for loading saved formations
 */

import React, { useState, useCallback, useMemo } from 'react';
import { X, FolderOpen, Trash2, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SavedFormation {
  id: string;
  name: string;
  formation: any;
  players: any[];
  createdAt: string;
  notes?: string;
}

export interface LoadFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (formation: SavedFormation) => void;
  onDelete?: (id: string) => void;
}

export const LoadFormationModal: React.FC<LoadFormationModalProps> = ({
  isOpen,
  onClose,
  onLoad,
  onDelete,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load saved formations from localStorage
  const savedFormations = useMemo<SavedFormation[]>(() => {
    try {
      const stored = localStorage.getItem('savedFormations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedFormation = useMemo(
    () => savedFormations.find(f => f.id === selectedId),
    [savedFormations, selectedId],
  );

  const handleLoad = useCallback(() => {
    if (selectedFormation) {
      onLoad(selectedFormation);
      onClose();
      setSelectedId(null);
    }
  }, [selectedFormation, onLoad, onClose]);

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete(id);
      }
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [onDelete, selectedId],
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
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
              className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FolderOpen size={20} className="text-blue-400" />
                  Load Formation
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
              <div className="flex-1 overflow-hidden flex">
                {/* Formations List */}
                <div className="w-1/2 border-r border-slate-700 overflow-y-auto">
                  {savedFormations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
                      <FolderOpen size={48} className="mb-4 opacity-50" />
                      <p className="text-center">No saved formations</p>
                      <p className="text-sm text-center mt-2">Save formations to load them later</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {savedFormations.map((formation) => (
                        <button
                          key={formation.id}
                          onClick={() => setSelectedId(formation.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedId === formation.id
                              ? 'bg-blue-600/20 border-blue-500 border'
                              : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                          }`}
                          type="button"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{formation.name}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                <Calendar size={12} />
                                {formatDate(formation.createdAt)}
                              </div>
                            </div>
                            {onDelete && (
                              <button
                                onClick={(e) => handleDelete(formation.id, e)}
                                className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
                                type="button"
                                title="Delete formation"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview Panel */}
                <div className="w-1/2 p-4 overflow-y-auto">
                  {selectedFormation ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Formation Name</h3>
                        <p className="text-white">{selectedFormation.name}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Created</h3>
                        <p className="text-white text-sm">{formatDate(selectedFormation.createdAt)}</p>
                      </div>

                      {selectedFormation.notes && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                            <FileText size={14} />
                            Notes
                          </h3>
                          <p className="text-white text-sm whitespace-pre-wrap">{selectedFormation.notes}</p>
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Players</h3>
                        <p className="text-white">{selectedFormation.players?.length || 0} players</p>
                      </div>

                      {selectedFormation.formation && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-2">Formation Type</h3>
                          <p className="text-white">{selectedFormation.formation.name || 'Custom'}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <p className="text-center">Select a formation to preview</p>
                    </div>
                  )}
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
                  onClick={handleLoad}
                  disabled={!selectedFormation}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                  type="button"
                >
                  <FolderOpen size={16} />
                  Load Formation
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoadFormationModal;
