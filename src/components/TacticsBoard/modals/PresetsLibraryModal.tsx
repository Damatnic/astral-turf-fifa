import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTacticalPresets } from '../../../hooks/useTacticalPresets';
import type { TacticalPreset, PresetCategory } from '../../../types/presets';

interface PresetsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: TacticalPreset) => void;
}

const CATEGORY_ICONS: Record<PresetCategory, string> = {
  attacking: '⚔️',
  defensive: '🛡️',
  pressing: '🔥',
  'counter-attack': '⚡',
  possession: '🎯',
  balanced: '⚖️',
  custom: '⚙️',
};

const CATEGORY_COLORS: Record<PresetCategory, string> = {
  attacking: 'from-red-600 to-orange-600',
  defensive: 'from-blue-600 to-cyan-600',
  pressing: 'from-orange-600 to-yellow-600',
  'counter-attack': 'from-purple-600 to-pink-600',
  possession: 'from-green-600 to-teal-600',
  balanced: 'from-slate-600 to-gray-600',
  custom: 'from-indigo-600 to-purple-600',
};

export const PresetsLibraryModal: React.FC<PresetsLibraryModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
}) => {
  const {
    filteredPresets,
    filter,
    setFilter,
    clearFilter,
    searchPresets,
    filterByCategory,
    deletePreset,
    duplicatePreset,
    exportToFile,
    importFromFile,
    syncToCloud,
    syncStatus,
    getPresetStats,
  } = useTacticalPresets();

  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = getPresetStats();

  const handleCategoryClick = (category: PresetCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      clearFilter();
    } else {
      setSelectedCategory(category);
      filterByCategory(category);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importFromFile(file);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert('Failed to import presets');
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deletePreset(id);
    setShowDeleteConfirm(null);
  };

  const handleDuplicate = async (id: string) => {
    await duplicatePreset(id);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 ">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Tactical Presets Library</h2>
                <p className="text-blue-100 text-sm">
                  {stats.total} presets • {filteredPresets.length} showing
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sync Status */}
                {syncStatus.isSyncing ? (
                  <div className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-sm font-medium">Syncing...</span>
                  </div>
                ) : syncStatus.lastSyncedAt ? (
                  <button
                    onClick={syncToCloud}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
                  >
                    <span className="text-white text-sm">☁️ Synced</span>
                  </button>
                ) : (
                  <button
                    onClick={syncToCloud}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
                  >
                    <span className="text-white text-sm">☁️ Sync</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="text-white hover:text-slate-200 p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700">
            <div className="flex items-center justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search presets..."
                  value={filter.searchTerm || ''}
                  onChange={e => {
                    searchPresets(e.target.value);
                  }}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-slate-900 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('grid');
                  }}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => {
                    setViewMode('list');
                  }}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>

              {/* Import/Export */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  📥 Import
                </button>
                <button
                  onClick={() => {
                    exportToFile();
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  📤 Export
                </button>
              </div>
            </div>
          </div>

          {/* Categories Filter */}
          <div className="bg-slate-800/30 px-6 py-3 border-b border-slate-700 overflow-x-auto">
            <div className="flex gap-2">
              {(Object.keys(CATEGORY_ICONS) as PresetCategory[]).map(category => (
                <button
                  key={category}
                  onClick={() => {
                    handleCategoryClick(category);
                  }}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                    selectedCategory === category
                      ? `bg-gradient-to-r ${CATEGORY_COLORS[category]} text-white shadow-lg scale-105`
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                  <span className="font-medium capitalize">{category}</span>
                  <span className="bg-slate-700 px-2 py-0.5 rounded-full text-xs">
                    {stats.byCategory[category]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Presets Grid/List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
            {filteredPresets.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No presets found</h3>
                <p className="text-slate-400">Try adjusting your filters or create a new preset</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPresets.map(preset => (
                  <PresetCard
                    key={preset.metadata.id}
                    preset={preset}
                    onApply={() => {
                      onApplyPreset(preset);
                      onClose();
                    }}
                    onDelete={() => {
                      setShowDeleteConfirm(preset.metadata.id);
                    }}
                    onDuplicate={() => {
                      handleDuplicate(preset.metadata.id);
                    }}
                    onExport={() => {
                      exportToFile(preset.metadata.id);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPresets.map(preset => (
                  <PresetListItem
                    key={preset.metadata.id}
                    preset={preset}
                    onApply={() => {
                      onApplyPreset(preset);
                      onClose();
                    }}
                    onDelete={() => {
                      setShowDeleteConfirm(preset.metadata.id);
                    }}
                    onDuplicate={() => {
                      handleDuplicate(preset.metadata.id);
                    }}
                    onExport={() => {
                      exportToFile(preset.metadata.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 ">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 rounded-xl p-6 max-w-md border border-slate-700 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-2">Delete Preset?</h3>
                <p className="text-slate-400 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(showDeleteConfirm);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface PresetCardProps {
  preset: TacticalPreset;
  onApply: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onApply,
  onDelete,
  onDuplicate,
  onExport,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all group relative"
    >
      {/* Thumbnail */}
      <div
        className={`h-32 bg-gradient-to-br ${CATEGORY_COLORS[preset.metadata.category]} flex items-center justify-center relative`}
      >
        <span className="text-6xl opacity-50">{CATEGORY_ICONS[preset.metadata.category]}</span>
        <div className="absolute top-2 right-2">
          <button
            onClick={() => {
              setShowMenu(!showMenu);
            }}
            className="p-2 bg-slate-700 hover:bg-slate-800 rounded-lg text-white transition-colors"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-slate-900 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-10 min-w-[150px]">
              <button
                onClick={() => {
                  onDuplicate();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                📋 Duplicate
              </button>
              <button
                onClick={() => {
                  onExport();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                📤 Export
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-950 transition-colors flex items-center gap-2"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-white font-semibold text-lg">{preset.metadata.name}</h3>
          {preset.metadata.rating && (
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              ⭐ {preset.metadata.rating.toFixed(1)}
            </div>
          )}
        </div>

        <p className="text-slate-400 text-sm mb-3 line-clamp-2">
          {preset.metadata.description || 'No description'}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
            {preset.metadata.formation}
          </span>
          <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 capitalize">
            {preset.metadata.category}
          </span>
        </div>

        {preset.metadata.tags && preset.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {preset.metadata.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={onApply}
          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
        >
          Apply Preset
        </button>
      </div>
    </motion.div>
  );
};

interface PresetListItemProps extends PresetCardProps {}

const PresetListItem: React.FC<PresetListItemProps> = ({
  preset,
  onApply,
  onDelete,
  onDuplicate,
  onExport,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all group flex items-center gap-4"
    >
      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[preset.metadata.category]} flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-3xl">{CATEGORY_ICONS[preset.metadata.category]}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-white font-semibold text-lg">{preset.metadata.name}</h3>
          {preset.metadata.rating && (
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              ⭐ {preset.metadata.rating.toFixed(1)}
            </div>
          )}
        </div>

        <p className="text-slate-400 text-sm mb-2 line-clamp-1">
          {preset.metadata.description || 'No description'}
        </p>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
            {preset.metadata.formation}
          </span>
          <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 capitalize">
            {preset.metadata.category}
          </span>
          {preset.metadata.usageCount && preset.metadata.usageCount > 0 && (
            <span className="text-xs text-slate-400">Used {preset.metadata.usageCount} times</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 relative">
        <button
          onClick={onApply}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
        >
          Apply
        </button>

        <button
          onClick={() => {
            setShowMenu(!showMenu);
          }}
          className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors"
        >
          ⋯
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 bg-slate-900 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-10 min-w-[150px]">
            <button
              onClick={() => {
                onDuplicate();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              📋 Duplicate
            </button>
            <button
              onClick={() => {
                onExport();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              📤 Export
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-950 transition-colors flex items-center gap-2"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
