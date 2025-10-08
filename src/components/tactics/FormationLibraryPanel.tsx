/**
 * Formation Library Panel
 * 
 * Professional formation library with 20+ professional formations
 * Allows browsing, searching, and applying formations to the tactics board
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Star, TrendingUp, Shield, Zap,
  X, Check, Info, ChevronDown, Grid3x3, List
} from 'lucide-react';
import {
  PROFESSIONAL_FORMATIONS,
  getFormationsByCategory,
  getFormationsByDifficulty,
  getPopularFormations,
  searchFormations,
  type ProfessionalFormation
} from '../../data/professionalFormations';

interface FormationLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormation: (formation: ProfessionalFormation) => void;
  currentFormationId?: string;
}

type ViewMode = 'grid' | 'list';
type FilterCategory = 'all' | 'defensive' | 'balanced' | 'attacking' | 'modern' | 'classic';
type FilterDifficulty = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const FormationLibraryPanel: React.FC<FormationLibraryPanelProps> = ({
  isOpen,
  onClose,
  onSelectFormation,
  currentFormationId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<FilterDifficulty>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFormation, setSelectedFormation] = useState<ProfessionalFormation | null>(null);

  // Filter formations
  const filteredFormations = useMemo(() => {
    let formations = PROFESSIONAL_FORMATIONS;

    // Search filter
    if (searchQuery) {
      formations = searchFormations(searchQuery);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      formations = formations.filter(f => f.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      formations = formations.filter(f => f.difficulty === difficultyFilter);
    }

    return formations.sort((a, b) => b.popularity - a.popularity);
  }, [searchQuery, categoryFilter, difficultyFilter]);

  const handleApplyFormation = (formation: ProfessionalFormation) => {
    onSelectFormation(formation);
    onClose();
  };

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

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-gray-900 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <Grid3x3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Formation Library</h2>
                  <p className="text-sm text-white/80">{filteredFormations.length} professional formations</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search formations..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
                >
                  <option value="all">All Categories</option>
                  <option value="defensive">Defensive</option>
                  <option value="balanced">Balanced</option>
                  <option value="attacking">Attacking</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                </select>

                {/* Difficulty Filter */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as FilterDifficulty)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>

                {/* View Mode Toggle */}
                <div className="ml-auto flex items-center space-x-2 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {filteredFormations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No formations found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {filteredFormations.map((formation) => (
                  <FormationCard
                    key={formation.id}
                    formation={formation}
                    viewMode={viewMode}
                    isSelected={formation.id === selectedFormation?.id}
                    isCurrent={formation.id === currentFormationId}
                    onClick={() => setSelectedFormation(formation)}
                    onApply={() => handleApplyFormation(formation)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Formation Detail Modal */}
          <AnimatePresence>
            {selectedFormation && (
              <FormationDetailModal
                formation={selectedFormation}
                onClose={() => setSelectedFormation(null)}
                onApply={() => handleApplyFormation(selectedFormation)}
                isCurrent={selectedFormation.id === currentFormationId}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Formation Card Component
const FormationCard: React.FC<{
  formation: ProfessionalFormation;
  viewMode: ViewMode;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
  onApply: () => void;
}> = ({ formation, viewMode, isSelected, isCurrent, onClick, onApply }) => {
  const categoryColors = {
    defensive: 'from-blue-600 to-blue-800',
    balanced: 'from-green-600 to-green-800',
    attacking: 'from-red-600 to-red-800',
    modern: 'from-purple-600 to-purple-800',
    classic: 'from-yellow-600 to-yellow-800',
  };

  const categoryIcons = {
    defensive: Shield,
    balanced: Check,
    attacking: Zap,
    modern: TrendingUp,
    classic: Star,
  };

  const Icon = categoryIcons[formation.category];

  if (viewMode === 'list') {
    return (
      <div
        className={`bg-gray-800 rounded-lg p-4 border transition-all cursor-pointer ${
          isCurrent
            ? 'border-green-500 bg-green-900/20'
            : isSelected
            ? 'border-blue-500'
            : 'border-gray-700 hover:border-gray-600'
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`bg-gradient-to-br ${categoryColors[formation.category]} rounded-lg p-3`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{formation.displayName}</h3>
              <p className="text-sm text-gray-400">{formation.description.substring(0, 80)}...</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right mr-4">
              <div className="text-xs text-gray-400 capitalize">{formation.difficulty}</div>
              <div className="text-xs text-gray-500">★ {formation.popularity}/10</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onApply(); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {isCurrent ? 'Current' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gray-800 rounded-xl overflow-hidden border transition-all cursor-pointer ${
        isCurrent
          ? 'border-green-500 shadow-lg shadow-green-500/20'
          : isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border-gray-700 hover:border-gray-600'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className={`bg-gradient-to-br ${categoryColors[formation.category]} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-6 h-6 text-white" />
          <div className="flex items-center space-x-1 text-white">
            {[...Array(formation.popularity)].map((_, i) => (
              <Star key={i} className="w-3 h-3" fill="currentColor" />
            ))}
          </div>
        </div>
        <h3 className="text-xl font-black text-white mb-1">{formation.displayName}</h3>
        <p className="text-xs text-white/80 capitalize">{formation.category} • {formation.difficulty}</p>
      </div>

      {/* Mini Field Preview */}
      <div className="relative bg-green-900/20 h-40 border-y border-gray-700">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Field lines */}
          <rect x="0" y="0" width="100" height="100" fill="#0a4d2e" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
          
          {/* Player positions */}
          {formation.positions.map((pos, idx) => (
            <circle
              key={idx}
              cx={pos.x}
              cy={pos.y}
              r="3"
              fill="white"
              opacity="0.9"
            />
          ))}
        </svg>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{formation.description}</p>
        
        {/* Quick Stats */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            Used by {formation.famousTeams.length} famous team{formation.famousTeams.length !== 1 ? 's' : ''}
          </span>
          {isCurrent && (
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold">
              ✓ ACTIVE
            </span>
          )}
        </div>

        {/* Apply Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onApply(); }}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Check className="w-4 h-4" />
          <span>{isCurrent ? 'Applied' : 'Apply Formation'}</span>
        </button>
      </div>
    </motion.div>
  );
};

// Formation Detail Modal
const FormationDetailModal: React.FC<{
  formation: ProfessionalFormation;
  onClose: () => void;
  onApply: () => void;
  isCurrent: boolean;
}> = ({ formation, onClose, onApply }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white mb-1">{formation.displayName}</h2>
            <p className="text-white/80">{formation.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Strengths */}
          <div>
            <h3 className="font-bold text-white mb-3 flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Strengths</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-2">
              {formation.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div>
            <h3 className="font-bold text-white mb-3 flex items-center space-x-2">
              <Info className="w-5 h-5 text-red-400" />
              <span>Weaknesses</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-2">
              {formation.weaknesses.map((weakness, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-gray-300">
                  <X className="w-4 h-4 text-red-400" />
                  <span className="text-sm">{weakness}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best For */}
          <div>
            <h3 className="font-bold text-white mb-3">Best For</h3>
            <div className="flex flex-wrap gap-2">
              {formation.bestFor.map((use, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                  {use}
                </span>
              ))}
            </div>
          </div>

          {/* Famous Teams */}
          <div>
            <h3 className="font-bold text-white mb-3">Famous Teams</h3>
            <div className="flex flex-wrap gap-2">
              {formation.famousTeams.map((team, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                  {team}
                </span>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={onApply}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center space-x-2"
          >
            <Check className="w-6 h-6" />
            <span>Apply This Formation</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FormationLibraryPanel;

