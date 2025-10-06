import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Save,
  Trash2,
  Download,
  Upload,
  Star,
  Calendar,
  Users,
  Target,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { type Formation, type Player } from '../../types';

type FormationExport = any;

interface TacticalPlaybookProps {
  currentFormation?: Formation;
  currentPlayers?: Player[];
  onLoadFormation: (formation: Formation) => void;
  onClose: () => void;
  isOpen: boolean;
}

const TacticalPlaybook: React.FC<TacticalPlaybookProps> = ({
  currentFormation,
  currentPlayers,
  onLoadFormation,
  onClose,
  isOpen,
}) => {
  const [savedFormations, setSavedFormations] = useState<FormationExport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'favorite' | 'recent'>('all');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [formationName, setFormationName] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load saved formations on component mount
  useEffect(() => {
    if (isOpen) {
      loadSavedFormations();
      loadFavorites();
    }
  }, [isOpen]);

  const loadSavedFormations = () => {
    try {
      const saved = localStorage.getItem('savedFormations');
      if (saved) {
        setSavedFormations(JSON.parse(saved));
      }
    } catch (error) {
      // console.error('Failed to load saved formations:', error);
    }
  };

  const loadFavorites = () => {
    try {
      const favs = localStorage.getItem('favoriteFormations');
      if (favs) {
        setFavorites(new Set(JSON.parse(favs)));
      }
    } catch (error) {
      // console.error('Failed to load favorites:', error);
    }
  };

  const saveFavorites = (newFavorites: Set<string>) => {
    try {
      localStorage.setItem('favoriteFormations', JSON.stringify([...newFavorites]));
      setFavorites(newFavorites);
    } catch (error) {
      // console.error('Failed to save favorites:', error);
    }
  };

  const handleSaveCurrentFormation = async () => {
    if (!currentFormation || !formationName.trim()) {
      return;
    }

    try {
      const players = currentPlayers || [];
      const formationData = {
        ...currentFormation,
        name: formationName.trim(),
        players,
        savedAt: new Date().toISOString(),
      };

      const updatedFormations = [...savedFormations, formationData];
      setSavedFormations(updatedFormations);
      localStorage.setItem('savedFormations', JSON.stringify(updatedFormations));

      setShowSaveDialog(false);
      setFormationName('');
    } catch (error) {
      // console.error('Failed to save formation:', error);
    }
  };

  const handleDeleteFormation = (id: string) => {
    const updatedFormations = savedFormations.filter(f => f.id !== id);
    setSavedFormations(updatedFormations);
    localStorage.setItem('savedFormations', JSON.stringify(updatedFormations));

    // Remove from favorites if exists
    if (favorites.has(id)) {
      const newFavorites = new Set(favorites);
      newFavorites.delete(id);
      saveFavorites(newFavorites);
    }
  };

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    saveFavorites(newFavorites);
  };

  const handleImportFormation = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new (window as any).FileReader();
        reader.onload = (e: any) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);
            if (importedData.formation) {
              const updatedFormations = [...savedFormations, importedData];
              setSavedFormations(updatedFormations);
              localStorage.setItem('savedFormations', JSON.stringify(updatedFormations));
            }
          } catch (error) {
            // console.error('Failed to import formation:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportFormation = (formation: FormationExport) => {
    const blob = new (window as any).Blob([JSON.stringify(formation, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formation.name}-formation.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter and search formations
  const filteredFormations = useMemo(() => {
    let filtered = savedFormations;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(formation =>
        formation.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'favorite':
        filtered = filtered.filter(formation => favorites.has(formation.id));
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
        break;
    }

    return filtered;
  }, [savedFormations, searchTerm, filterBy, favorites]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Tactical Playbook</h2>
              <span className="text-sm text-slate-400">
                ({filteredFormations.length} formations)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSaveDialog(true)}
                disabled={!currentFormation}
                className="px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Current
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleImportFormation}
                className="px-4 py-2 bg-green-600/80 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search formations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterBy}
                  onChange={e => setFilterBy(e.target.value as 'all' | 'favorite' | 'recent')}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">All</option>
                  <option value="favorite">Favorites</option>
                  <option value="recent">Recent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Formations Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredFormations.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-400 mb-2">No formations found</h3>
                <p className="text-slate-500">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Save your first formation to get started'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFormations.map(formation => (
                  <motion.div
                    key={formation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white truncate">{formation.name}</h3>

                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleFavorite(formation.id)}
                          className={`p-1 rounded ${favorites.has(formation.id) ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={favorites.has(formation.id) ? 'currentColor' : 'none'}
                          />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleExportFormation(formation)}
                          className="p-1 text-slate-500 hover:text-blue-400"
                        >
                          <Download className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteFormation(formation.id)}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Users className="w-3 h-3" />
                        <span>{formation.players.length} players</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Target className="w-3 h-3" />
                        <span>Effectiveness: {formation.analysis.effectiveness}%</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(formation.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onLoadFormation(formation.formation);
                          onClose();
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                      >
                        Load Formation
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Save Dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
              onClick={e => e.target === e.currentTarget && setShowSaveDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900/95 border border-slate-700/50 rounded-xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Save Formation</h3>

                <input
                  type="text"
                  placeholder="Enter formation name..."
                  value={formationName}
                  onChange={e => setFormationName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 mb-4"
                  autoFocus
                />

                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveCurrentFormation}
                    disabled={!formationName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Formation
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export { TacticalPlaybook };
export default TacticalPlaybook;
