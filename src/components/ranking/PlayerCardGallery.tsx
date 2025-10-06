// Player Card Gallery - Collection view with filtering and sorting

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid3x3,
  List,
  Star,
  TrendingUp,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import EnhancedPlayerRankingCard, { type CardRarity } from './EnhancedPlayerRankingCard';
import PlayerCardComparison from './PlayerCardComparison';
import type { Player } from '../../types/player';
import type { PlayerRankingProfile } from '../../types/challenges';

interface PlayerCardGalleryProps {
  players: Player[];
  profiles: Map<string, PlayerRankingProfile>;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'level' | 'xp' | 'challenges' | 'name' | 'rarity';
type FilterRarity = CardRarity | 'all';

const PlayerCardGallery: React.FC<PlayerCardGalleryProps> = ({
  players,
  profiles,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('level');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  // Calculate rarity for each player based on level and achievements
  const calculateRarity = (profile: PlayerRankingProfile): CardRarity => {
    const level = profile.currentLevel;
    const badges = profile.badges.length;
    const challenges = profile.totalStats.totalChallengesCompleted;

    if (level >= 80 || badges >= 50 || challenges >= 500) {
      return 'legendary';
    }
    if (level >= 60 || badges >= 30 || challenges >= 250) {
      return 'epic';
    }
    if (level >= 40 || badges >= 15 || challenges >= 100) {
      return 'rare';
    }
    if (level >= 20 || badges >= 5 || challenges >= 25) {
      return 'uncommon';
    }
    return 'common';
  };

  // Enrich players with profiles and rarities
  const enrichedPlayers = useMemo(() => {
    return players
      .map(player => {
        const profile = profiles.get(player.id);
        if (!profile) {
          return null;
        }
        return {
          player,
          profile,
          rarity: calculateRarity(profile),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [players, profiles]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = enrichedPlayers;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        ({ player }) =>
          player.name.toLowerCase().includes(query) ||
          player.nationality.toLowerCase().includes(query),
      );
    }

    // Rarity filter
    if (filterRarity !== 'all') {
      result = result.filter(({ rarity }) => rarity === filterRarity);
    }

    // Sort
    result.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'level':
          compareValue = a.profile.currentLevel - b.profile.currentLevel;
          break;
        case 'xp':
          compareValue = a.profile.totalXP - b.profile.totalXP;
          break;
        case 'challenges':
          compareValue =
            a.profile.totalStats.totalChallengesCompleted -
            b.profile.totalStats.totalChallengesCompleted;
          break;
        case 'name':
          compareValue = a.player.name.localeCompare(b.player.name);
          break;
        case 'rarity': {
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
          compareValue = rarityOrder[a.rarity] - rarityOrder[b.rarity];
          break;
        }
      }
      return sortDesc ? -compareValue : compareValue;
    });

    return result;
  }, [enrichedPlayers, searchQuery, filterRarity, sortBy, sortDesc]);

  // Toggle card selection for comparison
  const toggleCardSelection = (playerId: string) => {
    setSelectedCards(prev => {
      const newSelection = prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : prev.length < 4
          ? [...prev, playerId]
          : prev;
      return newSelection;
    });
  };

  // Toggle card flip
  const toggleCardFlip = (playerId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  // Get rarity stats
  const rarityStats = useMemo(() => {
    const stats = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    enrichedPlayers.forEach(({ rarity }) => {
      stats[rarity]++;
    });
    return stats;
  }, [enrichedPlayers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Star className="text-yellow-400" size={36} />
              Player Card Collection
            </h1>
            <p className="text-gray-400">
              {filteredPlayers.length} of {enrichedPlayers.length} cards
              {selectedCards.length > 0 && ` • ${selectedCards.length} selected`}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white appearance-none focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="level">Sort by Level</option>
              <option value="xp">Sort by XP</option>
              <option value="challenges">Sort by Challenges</option>
              <option value="rarity">Sort by Rarity</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {sortDesc ? <SortDesc size={18} /> : <SortAsc size={18} />}
            </button>
          </div>

          {/* Rarity Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <select
              value={filterRarity}
              onChange={e => setFilterRarity(e.target.value as FilterRarity)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white appearance-none focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Rarities ({enrichedPlayers.length})</option>
              <option value="legendary">Legendary ({rarityStats.legendary})</option>
              <option value="epic">Epic ({rarityStats.epic})</option>
              <option value="rare">Rare ({rarityStats.rare})</option>
              <option value="uncommon">Uncommon ({rarityStats.uncommon})</option>
              <option value="common">Common ({rarityStats.common})</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {selectedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <button
              onClick={() => setShowComparison(true)}
              disabled={selectedCards.length < 2}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center gap-2 transition-all"
            >
              <TrendingUp size={18} />
              Compare Cards ({selectedCards.length})
            </button>
            <button
              onClick={() => setSelectedCards([])}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              Clear Selection
            </button>
          </motion.div>
        )}
      </div>

      {/* Cards Grid/List */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlayers.map(({ player, profile, rarity }, index) => {
                const isSelected = selectedCards.includes(player.id);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCardSelection(player.id)}
                        className="w-5 h-5 rounded border-2 border-white bg-gray-900/80 backdrop-blur-sm checked:bg-blue-600 checked:border-blue-600 cursor-pointer"
                      />
                    </div>

                    <EnhancedPlayerRankingCard
                      player={player}
                      profile={profile}
                      rarity={rarity}
                      showStats
                      is3D
                      isFlipped={flippedCards.has(player.id)}
                      onFlip={() => toggleCardFlip(player.id)}
                    />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlayers.map(({ player, profile, rarity }, index) => {
                const isSelected = selectedCards.includes(player.id);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative"
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCardSelection(player.id)}
                        className="w-5 h-5 rounded border-2 border-white bg-gray-900/80 backdrop-blur-sm checked:bg-blue-600 checked:border-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="ml-10">
                      <EnhancedPlayerRankingCard
                        player={player}
                        profile={profile}
                        rarity={rarity}
                        compact
                        onFlip={() => toggleCardFlip(player.id)}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* No Results */}
        {filteredPlayers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Search className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-xl text-gray-400">No cards found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
          </motion.div>
        )}
      </div>

      {/* Card Comparison Modal */}
      <AnimatePresence>
        {showComparison && selectedCards.length >= 2 && (
          <PlayerCardComparison
            players={selectedCards
              .map(id => {
                const player = players.find(p => p.id === id);
                const profile = profiles.get(id);
                const enriched = enrichedPlayers.find(ep => ep.player.id === id);
                if (!player || !profile) {
                  return null;
                }
                return {
                  player,
                  profile,
                  rarity: enriched?.rarity,
                };
              })
              .filter((p): p is NonNullable<typeof p> => p !== null)}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerCardGallery;
