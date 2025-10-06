// Challenge Hub Page - Browse and accept challenges

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChallengeContext } from '../context/ChallengeContext';
import { useTacticsContext, useAuthContext } from '../hooks';
import ChallengeCard from '../components/challenges/ChallengeCard';
import ChallengeLeaderboard from '../components/challenges/ChallengeLeaderboard';
import type { ChallengeCategory, ChallengeDifficulty, ChallengeFilters } from '../types/challenges';
import type { Player } from '../types/player';

type ViewMode = 'grid' | 'list';
type TabType = 'all' | 'daily' | 'weekly' | 'special' | 'team' | 'leaderboard';

const ChallengeHubPage: React.FC = () => {
  const { state, loadChallenges, getAvailableChallenges, startChallenge, updateLeaderboard } =
    useChallengeContext();
  const { tacticsState } = useTacticsContext();
  const { authState } = useAuthContext();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filters, setFilters] = useState<ChallengeFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize with first player
  useEffect(() => {
    if (!selectedPlayer && tacticsState.players.length > 0) {
      setSelectedPlayer(tacticsState.players[0]);
    }
  }, [tacticsState.players, selectedPlayer]);

  // Load challenges based on filters
  useEffect(() => {
    const activeFilters: ChallengeFilters = {
      ...filters,
      search: searchQuery || undefined,
    };

    // Add tab-specific filters
    switch (activeTab) {
      case 'daily':
        activeFilters.frequencies = ['daily'];
        break;
      case 'weekly':
        activeFilters.frequencies = ['weekly'];
        break;
      case 'special':
        activeFilters.frequencies = ['special'];
        break;
      case 'team':
        activeFilters.teamChallenges = true;
        break;
    }

    loadChallenges(activeFilters);
  }, [filters, searchQuery, activeTab, loadChallenges]);

  // Update leaderboard when tab changes
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      const playerIds = tacticsState.players.map(p => p.id);
      updateLeaderboard(playerIds, 'total');
    }
  }, [activeTab, tacticsState.players, updateLeaderboard]);

  const availableChallenges = selectedPlayer
    ? getAvailableChallenges(selectedPlayer.id).filter(c => {
        // Apply additional client-side filters if needed
        if (activeTab === 'daily' && c.frequency !== 'daily') {
          return false;
        }
        if (activeTab === 'weekly' && c.frequency !== 'weekly') {
          return false;
        }
        if (activeTab === 'special' && c.frequency !== 'special') {
          return false;
        }
        if (activeTab === 'team' && !c.teamChallenge) {
          return false;
        }
        return true;
      })
    : [];

  const handleStartChallenge = (challengeId: string) => {
    if (selectedPlayer) {
      startChallenge(selectedPlayer.id, challengeId);
    }
  };

  const handleCategoryFilter = (category: ChallengeCategory) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...(prev.categories || []), category],
    }));
  };

  const handleDifficultyFilter = (difficulty: ChallengeDifficulty) => {
    setFilters(prev => ({
      ...prev,
      difficulties: prev.difficulties?.includes(difficulty)
        ? prev.difficulties.filter(d => d !== difficulty)
        : [...(prev.difficulties || []), difficulty],
    }));
  };

  const handleSortChange = (sortBy: ChallengeFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const categories: ChallengeCategory[] = ['fitness', 'technical', 'tactical', 'mental'];
  const difficulties: ChallengeDifficulty[] = ['easy', 'medium', 'hard', 'elite'];

  return (
    <div className="w-full h-full bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Challenge Hub</h1>
              <p className="text-gray-400">
                Complete challenges to earn XP and improve your skills
              </p>
            </div>

            {/* Player Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm text-gray-400">Active Player:</label>
              <select
                value={selectedPlayer?.id || ''}
                onChange={e => {
                  const player = tacticsState.players.find(p => p.id === e.target.value);
                  setSelectedPlayer(player || null);
                }}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {tacticsState.players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} (#{player.jerseyNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {(['all', 'daily', 'weekly', 'special', 'team', 'leaderboard'] as TabType[]).map(
                tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {tab === 'all' ? 'All Challenges' : tab}
                  </button>
                )
              )}
            </div>

            {/* View Mode Toggle */}
            {activeTab !== 'leaderboard' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        {activeTab !== 'leaderboard' && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search challenges..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  Filters
                </button>

                <select
                  value={filters.sortBy || 'newest'}
                  onChange={e => handleSortChange(e.target.value as ChallengeFilters['sortBy'])}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                  <option value="xp">Highest XP</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="expiring">Expiring Soon</option>
                </select>

                {filters.categories?.length || filters.difficulties?.length || searchQuery ? (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700 pt-4"
              >
                <div className="space-y-4">
                  {/* Category Filters */}
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => handleCategoryFilter(category)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                            filters.categories?.includes(category)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Filters */}
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-2 block">
                      Difficulty
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {difficulties.map(difficulty => (
                        <button
                          key={difficulty}
                          onClick={() => handleDifficultyFilter(difficulty)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                            filters.difficulties?.includes(difficulty)
                              ? difficulty === 'easy'
                                ? 'bg-green-600 text-white'
                                : difficulty === 'medium'
                                  ? 'bg-blue-600 text-white'
                                  : difficulty === 'hard'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {difficulty}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'leaderboard' ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ChallengeLeaderboard
                entries={state.leaderboard}
                currentPlayerId={selectedPlayer?.id}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {state.isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : availableChallenges.length > 0 ? (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {availableChallenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      playerId={selectedPlayer?.id || ''}
                      viewMode={viewMode}
                      onStart={() => handleStartChallenge(challenge.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No Challenges Available
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || filters.categories?.length || filters.difficulties?.length
                      ? 'Try adjusting your filters to see more challenges'
                      : 'Check back later for new challenges'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        {selectedPlayer && state.currentPlayerProfile && activeTab !== 'leaderboard' && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-xs text-gray-500">Active Challenges</p>
                  <p className="text-lg font-bold text-white">
                    {state.currentPlayerProfile.challengesActive.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completed Today</p>
                  <p className="text-lg font-bold text-green-400">
                    {state.currentPlayerProfile.weeklyProgress.dailyActivity.filter(
                      d => new Date(d.date).toDateString() === new Date().toDateString()
                    )[0]?.challengesCompleted.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Streak</p>
                  <p className="text-lg font-bold text-blue-400">
                    {state.currentPlayerProfile.streakDays} days
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Weekly XP</p>
                  <p className="text-lg font-bold text-purple-400">
                    {state.currentPlayerProfile.weeklyProgress.xpEarned}
                  </p>
                </div>
              </div>

              <button
                onClick={() => (window.location.href = `/player-ranking/${selectedPlayer.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Full Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeHubPage;
