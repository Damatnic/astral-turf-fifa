// My Player Ranking Page - Main player progression dashboard

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChallengeContext } from '../context/ChallengeContext';
import { useTacticsContext, useAuthContext } from '../hooks';
import PlayerRankingCard from '../components/ranking/PlayerRankingCard';
import AttributeProgressChart from '../components/ranking/AttributeProgressChart';
import XPProgressBar from '../components/ranking/XPProgressBar';
import BadgeShowcase from '../components/ranking/BadgeShowcase';
import RankingComparison from '../components/ranking/RankingComparison';
import ChallengeCard from '../components/challenges/ChallengeCard';
import ChallengeProgressBar from '../components/challenges/ChallengeProgressBar';
import type { Player } from '../types/player';

type TabType = 'overview' | 'attributes' | 'badges' | 'challenges' | 'comparison';

const MyPlayerRankingPage: React.FC = () => {
  const { playerId } = useParams<{ playerId?: string }>();
  const navigate = useNavigate();
  const { tacticsState } = useTacticsContext();
  const { authState } = useAuthContext();
  const { state, dispatch, getActiveChallenges, getRecommendedChallenges, spendAttributePoints } =
    useChallengeContext();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [comparePlayerId, setComparePlayerId] = useState<string | null>(null);
  const [showAttributeSpend, setShowAttributeSpend] = useState(false);

  // Get current player
  useEffect(() => {
    if (playerId) {
      const player = tacticsState.players.find(p => p.id === playerId);
      if (player) {
        setSelectedPlayer(player);
        dispatch({ type: 'SET_CURRENT_PLAYER', payload: playerId });
      } else {
        // If no playerId or player not found, select first player
        const firstPlayer = tacticsState.players[0];
        if (firstPlayer) {
          setSelectedPlayer(firstPlayer);
          dispatch({ type: 'SET_CURRENT_PLAYER', payload: firstPlayer.id });
        }
      }
    } else {
      // No playerId in params, use first player
      const firstPlayer = tacticsState.players[0];
      if (firstPlayer) {
        setSelectedPlayer(firstPlayer);
        dispatch({ type: 'SET_CURRENT_PLAYER', payload: firstPlayer.id });
      }
    }
  }, [playerId, tacticsState.players, dispatch]);

  if (!selectedPlayer || !state.currentPlayerProfile) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Player Selected</h3>
          <p className="text-gray-500">Please select a player to view their ranking profile.</p>
        </div>
      </div>
    );
  }

  const profile = state.currentPlayerProfile;
  const activeChallenges = getActiveChallenges(selectedPlayer.id);
  const recommendedChallenges = getRecommendedChallenges(selectedPlayer.id);

  const handleAttributeSpend = (
    attribute: keyof typeof selectedPlayer.attributes,
    points: number,
  ) => {
    spendAttributePoints(selectedPlayer.id, attribute, points);
    setShowAttributeSpend(false);
  };

  const getCombinedAttributes = () => {
    const combined = { ...selectedPlayer.attributes };
    Object.entries(profile.earnedAttributes).forEach(([key, value]) => {
      if (value && key in combined) {
        combined[key as keyof typeof combined] += value;
      }
    });
    return combined;
  };

  return (
    <div className="w-full h-full bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {/* Player Avatar */}
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-24 h-24 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {selectedPlayer.jerseyNumber}
                  </span>
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full w-10 h-10 flex items-center justify-center border-2 border-gray-800">
                  <span className="text-sm font-bold text-gray-900">{profile.currentLevel}</span>
                </div>
              </div>

              {/* Player Info */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{selectedPlayer.name}</h1>
                <div className="flex items-center space-x-4 text-gray-400 mb-3">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Level {profile.currentLevel}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {profile.streakDays} Day Streak
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {profile.badges.length} Badges
                  </span>
                </div>

                {/* XP Progress */}
                <XPProgressBar
                  currentXP={profile.totalXP}
                  xpToNextLevel={profile.xpToNextLevel}
                  currentLevel={profile.currentLevel}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {profile.totalStats.totalChallengesCompleted}
                </p>
                <p className="text-xs text-gray-500">Challenges</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {profile.unspentAttributePoints}
                </p>
                <p className="text-xs text-gray-500">Unspent Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {profile.weeklyProgress.xpEarned}
                </p>
                <p className="text-xs text-gray-500">Weekly XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {Math.round(profile.totalStats.completionRate)}%
                </p>
                <p className="text-xs text-gray-500">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6 border-t border-gray-700 pt-4">
            {(['overview', 'attributes', 'badges', 'challenges', 'comparison'] as TabType[]).map(
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
                  {tab}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Challenges */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Active Challenges</h2>
                  {activeChallenges.length > 0 ? (
                    <div className="space-y-4">
                      {activeChallenges.slice(0, 3).map(challenge => (
                        <ChallengeProgressBar
                          key={challenge.id}
                          challenge={challenge}
                          playerId={selectedPlayer.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No active challenges. Start one to begin earning XP!
                    </p>
                  )}
                  <button
                    onClick={() => navigate('/challenge-hub')}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Challenges
                  </button>
                </div>

                {/* Weekly Progress */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Weekly Goals</h2>
                  <div className="space-y-4">
                    {profile.weeklyProgress.weeklyGoals.map(goal => (
                      <div key={goal.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-300 mb-1">{goal.description}</p>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                goal.completed ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{
                                width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-gray-400">
                            {goal.current}/{goal.target}
                          </p>
                          {goal.completed && (
                            <svg
                              className="w-5 h-5 text-green-500 ml-auto"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Challenges */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 lg:col-span-2">
                  <h2 className="text-xl font-bold text-white mb-4">Recommended Challenges</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendedChallenges.slice(0, 3).map(challenge => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        playerId={selectedPlayer.id}
                        compact
                      />
                    ))}
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 lg:col-span-2">
                  <h2 className="text-xl font-bold text-white mb-4">Performance Stats</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Favorite Category</p>
                      <p className="text-xl font-bold text-white capitalize">
                        {profile.totalStats.favoriteCategory}
                      </p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Longest Streak</p>
                      <p className="text-xl font-bold text-white">{profile.longestStreak} Days</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Monthly XP</p>
                      <p className="text-xl font-bold text-white">{profile.monthlyStats.totalXP}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Elite Challenges</p>
                      <p className="text-xl font-bold text-white">
                        {profile.totalStats.difficultyBreakdown.elite || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attributes' && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Attribute Development</h2>
                  {profile.unspentAttributePoints > 0 && (
                    <button
                      onClick={() => setShowAttributeSpend(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Spend Points ({profile.unspentAttributePoints})
                    </button>
                  )}
                </div>

                <AttributeProgressChart
                  baseAttributes={selectedPlayer.attributes}
                  earnedAttributes={profile.earnedAttributes}
                  onSpendPoints={showAttributeSpend ? handleAttributeSpend : undefined}
                  availablePoints={profile.unspentAttributePoints}
                />

                {/* Attribute History */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Base Attributes</h3>
                    {Object.entries(selectedPlayer.attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300 capitalize">{key}</span>
                        <span className="text-sm font-medium text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Earned Improvements</h3>
                    {Object.entries(profile.earnedAttributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300 capitalize">{key}</span>
                        <span className="text-sm font-medium text-green-400">+{value || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <BadgeShowcase badges={profile.badges} playerName={selectedPlayer.name} />
            )}

            {activeTab === 'challenges' && (
              <div className="space-y-6">
                {/* Challenge Stats */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Challenge Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(profile.totalStats.categoryBreakdown).map(
                      ([category, count]) => (
                        <div key={category} className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-1 capitalize">{category}</p>
                          <p className="text-xl font-bold text-white">{count}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Difficulty Breakdown */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Difficulty Breakdown</h2>
                  <div className="space-y-3">
                    {Object.entries(profile.totalStats.difficultyBreakdown).map(
                      ([difficulty, count]) => {
                        const total = Object.values(profile.totalStats.difficultyBreakdown).reduce(
                          (a, b) => a + b,
                          0,
                        );
                        const percentage = total > 0 ? (count / total) * 100 : 0;

                        return (
                          <div key={difficulty}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-300 capitalize">{difficulty}</span>
                              <span className="text-sm font-medium text-white">
                                {count} completed
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  difficulty === 'easy'
                                    ? 'bg-green-500'
                                    : difficulty === 'medium'
                                      ? 'bg-blue-500'
                                      : difficulty === 'hard'
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Active and Completed Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">Active Challenges</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {activeChallenges.map(challenge => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          playerId={selectedPlayer.id}
                          compact
                        />
                      ))}
                      {activeChallenges.length === 0 && (
                        <p className="text-gray-500">No active challenges</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">Recently Completed</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {profile.challengesCompleted
                        .slice(-5)
                        .reverse()
                        .map(challengeId => {
                          const challenge = state.challenges.find(c => c.id === challengeId);
                          if (!challenge) {
                            return null;
                          }
                          return (
                            <div
                              key={challengeId}
                              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-medium text-white">{challenge.title}</p>
                                <p className="text-xs text-gray-400">
                                  {challenge.xpReward} XP earned
                                </p>
                              </div>
                              <svg
                                className="w-5 h-5 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          );
                        })}
                      {profile.challengesCompleted.length === 0 && (
                        <p className="text-gray-500">No completed challenges yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comparison' && (
              <RankingComparison
                playerA={selectedPlayer}
                playerB={
                  comparePlayerId
                    ? tacticsState.players.find(p => p.id === comparePlayerId) || null
                    : null
                }
                onSelectPlayerB={playerId => setComparePlayerId(playerId)}
                availablePlayers={tacticsState.players.filter(p => p.id !== selectedPlayer.id)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Attribute Spend Modal */}
        {showAttributeSpend && profile.unspentAttributePoints > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Spend Attribute Points</h3>
              <p className="text-gray-400 mb-4">
                You have {profile.unspentAttributePoints} points to spend
              </p>

              <div className="space-y-3">
                {Object.keys(selectedPlayer.attributes).map(attribute => (
                  <div key={attribute} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{attribute}</span>
                    <button
                      onClick={() =>
                        handleAttributeSpend(attribute as keyof typeof selectedPlayer.attributes, 1)
                      }
                      disabled={profile.unspentAttributePoints < 1}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      +1 Point
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAttributeSpend(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPlayerRankingPage;
