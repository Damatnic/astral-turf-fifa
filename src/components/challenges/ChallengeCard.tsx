// Challenge Card Component - Display individual challenge

import React from 'react';
import { motion } from 'framer-motion';
import type { Challenge } from '../../types/challenges';
import { useChallengeContext } from '../../context/ChallengeContext';

interface ChallengeCardProps {
  challenge: Challenge;
  playerId: string;
  viewMode?: 'grid' | 'list';
  compact?: boolean;
  onStart?: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  playerId,
  viewMode = 'grid',
  compact = false,
  onStart,
}) => {
  const { startChallenge, state } = useChallengeContext();

  const playerProfile = state.playerProfiles.get(playerId);
  const isActive = playerProfile?.challengesActive.includes(challenge.id);
  const isCompleted = playerProfile?.challengesCompleted.includes(challenge.id);

  const handleStart = () => {
    if (onStart) {
      onStart();
    } else {
      startChallenge(playerId, challenge.id);
    }
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'medium':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'hard':
        return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      case 'elite':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const getCategoryIcon = (category: Challenge['category']) => {
    switch (category) {
      case 'fitness':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'technical':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762z" />
          </svg>
        );
      case 'tactical':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'mental':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getCategoryColor = (category: Challenge['category']) => {
    switch (category) {
      case 'fitness':
        return 'text-green-400';
      case 'technical':
        return 'text-blue-400';
      case 'tactical':
        return 'text-purple-400';
      case 'mental':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (compact) {
    return (
      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`${getCategoryColor(challenge.category)}`}>
              {getCategoryIcon(challenge.category)}
            </div>
            <div>
              <p className="font-medium text-white text-sm">{challenge.title}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}
                >
                  {challenge.difficulty}
                </span>
                <span className="text-xs text-gray-500">{challenge.xpReward} XP</span>
              </div>
            </div>
          </div>
          {!isActive && !isCompleted && (
            <button
              onClick={handleStart}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Start
            </button>
          )}
          {isActive && (
            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded">
              Active
            </span>
          )}
          {isCompleted && (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`p-3 rounded-lg bg-gray-700 ${getCategoryColor(challenge.category)}`}>
              {getCategoryIcon(challenge.category)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{challenge.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{challenge.description}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}
                >
                  {challenge.difficulty}
                </span>
                <span className="text-xs text-gray-500 capitalize">{challenge.category}</span>
                <span className="text-xs text-gray-500">{challenge.frequency}</span>
                {challenge.timeLimit && (
                  <span className="text-xs text-gray-500">⏱ {challenge.timeLimit}h limit</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{challenge.xpReward}</p>
              <p className="text-xs text-gray-500">XP</p>
              {challenge.attributePointReward && (
                <p className="text-xs text-green-400 mt-1">+{challenge.attributePointReward} AP</p>
              )}
            </div>
          </div>
          <div className="ml-4">
            {!isActive && !isCompleted && (
              <button
                onClick={handleStart}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Challenge
              </button>
            )}
            {isActive && (
              <div className="px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-center">
                In Progress
              </div>
            )}
            {isCompleted && (
              <div className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg text-center">
                Completed
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all overflow-hidden"
    >
      {/* Header */}
      <div
        className={`p-4 bg-gradient-to-r ${
          challenge.category === 'fitness'
            ? 'from-green-600/20 to-green-700/20'
            : challenge.category === 'technical'
              ? 'from-blue-600/20 to-blue-700/20'
              : challenge.category === 'tactical'
                ? 'from-purple-600/20 to-purple-700/20'
                : 'from-yellow-600/20 to-yellow-700/20'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg bg-gray-800/50 ${getCategoryColor(challenge.category)}`}>
            {getCategoryIcon(challenge.category)}
          </div>
          <span
            className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}
          >
            {challenge.difficulty}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2">{challenge.title}</h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{challenge.description}</p>

        {/* Requirements */}
        <div className="space-y-2 mb-4">
          {challenge.requirements.slice(0, 2).map(req => (
            <div key={req.id} className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {req.description}
            </div>
          ))}
          {challenge.requirements.length > 2 && (
            <p className="text-xs text-gray-600">+{challenge.requirements.length - 2} more</p>
          )}
        </div>

        {/* Rewards */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{challenge.xpReward}</p>
              <p className="text-xs text-gray-500">XP</p>
            </div>
            {challenge.attributePointReward && (
              <div className="text-center">
                <p className="text-xl font-bold text-green-400">
                  +{challenge.attributePointReward}
                </p>
                <p className="text-xs text-gray-500">Points</p>
              </div>
            )}
            {challenge.badgeReward && (
              <div className="p-2 bg-yellow-600/20 rounded">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {challenge.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-700 text-xs text-gray-400 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {!isActive && !isCompleted && (
          <button
            onClick={handleStart}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Challenge
          </button>
        )}
        {isActive && (
          <div className="w-full px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-center font-medium">
            In Progress
          </div>
        )}
        {isCompleted && (
          <div className="w-full px-4 py-2 bg-green-600/20 text-green-400 rounded-lg text-center font-medium flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Completed
          </div>
        )}

        {/* Time Limit Warning */}
        {challenge.timeLimit && !isCompleted && (
          <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            {challenge.timeLimit} hour time limit
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChallengeCard;
