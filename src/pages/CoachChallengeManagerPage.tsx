// Coach Challenge Manager Page - For coaches to create and manage challenges

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChallengeContext } from '../context/ChallengeContext';
import { useTacticsContext, useAuthContext } from '../hooks';
import ChallengeCreator from '../components/challenges/ChallengeCreator';
import ChallengeSubmission from '../components/challenges/ChallengeSubmission';
import type {
  Challenge,
  ChallengeProgress,
  ChallengeTemplate,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeRequirement,
  ChallengeReward,
} from '../types/challenges';
import type { Player } from '../types/player';
import { challengeService } from '../services/challengeService';

type TabType = 'create' | 'manage' | 'review' | 'templates' | 'analytics';

const CoachChallengeManagerPage: React.FC = () => {
  const { state, dispatch, createCustomChallenge, updateLeaderboard } = useChallengeContext();
  const { tacticsState } = useTacticsContext();
  const { authState } = useAuthContext();

  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ChallengeTemplate | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<ChallengeProgress[]>([]);
  const [coachChallenges, setCoachChallenges] = useState<Challenge[]>([]);

  // Load coach-created challenges
  useEffect(() => {
    const challenges = challengeService.getChallenges({ createdBy: ['coach'] });
    setCoachChallenges(challenges.filter(c => c.createdByUserId === authState.user?.id));
  }, [state.challenges, authState.user]);

  // Load pending reviews
  useEffect(() => {
    const allProgress: ChallengeProgress[] = [];
    tacticsState.players.forEach(player => {
      const progress = challengeService.getPlayerProgress(player.id);
      const pending = progress.filter(p => p.approvalStatus === 'pending');
      allProgress.push(...pending);
    });
    setPendingReviews(allProgress);
  }, [tacticsState.players]);

  const handleCreateChallenge = (challengeData: Partial<Challenge>) => {
    const newChallenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'> = {
      title: challengeData.title || '',
      description: challengeData.description || '',
      category: challengeData.category || 'fitness',
      difficulty: challengeData.difficulty || 'medium',
      frequency: challengeData.frequency || 'special',
      requirements: challengeData.requirements || [],
      rewards: challengeData.rewards || [],
      xpReward: challengeData.xpReward || 100,
      attributePointReward: challengeData.attributePointReward,
      badgeReward: challengeData.badgeReward,
      timeLimit: challengeData.timeLimit,
      createdBy: 'coach',
      createdByUserId: authState.user?.id,
      targetPlayers: challengeData.targetPlayers,
      teamChallenge: challengeData.teamChallenge,
      evidenceRequired: challengeData.evidenceRequired,
      autoValidate: challengeData.autoValidate,
      tags: challengeData.tags,
    };

    createCustomChallenge(newChallenge);
    setShowCreator(false);
  };

  const handleUpdateChallenge = (challengeId: string, updates: Partial<Challenge>) => {
    dispatch({
      type: 'UPDATE_CHALLENGE',
      payload: { challengeId, updates },
    });
  };

  const handleDeleteChallenge = (challengeId: string) => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      dispatch({ type: 'DELETE_CHALLENGE', payload: challengeId });
    }
  };

  const handleReviewSubmission = (
    playerId: string,
    challengeId: string,
    approved: boolean,
    notes?: string
  ) => {
    dispatch({
      type: 'REVIEW_CHALLENGE',
      payload: {
        playerId,
        challengeId,
        approved,
        reviewerId: authState.user?.id || '',
        notes,
      },
    });
  };

  const getPlayerName = (playerId: string): string => {
    const player = tacticsState.players.find(p => p.id === playerId);
    return player?.name || 'Unknown Player';
  };

  const getChallengeName = (challengeId: string): string => {
    const challenge = state.challenges.find(c => c.id === challengeId);
    return challenge?.title || 'Unknown Challenge';
  };

  const calculateChallengeStats = () => {
    const stats = {
      totalCreated: coachChallenges.length,
      activeAssignments: 0,
      completionRate: 0,
      totalXPAwarded: 0,
      popularCategory: '' as ChallengeCategory,
    };

    // Calculate active assignments
    tacticsState.players.forEach(player => {
      const progress = challengeService.getPlayerProgress(player.id);
      const activeCoachChallenges = progress.filter(
        p => p.status === 'active' && coachChallenges.some(c => c.id === p.challengeId)
      );
      stats.activeAssignments += activeCoachChallenges.length;
    });

    // Calculate completion rate and XP awarded
    let totalAttempts = 0;
    let totalCompleted = 0;
    const categoryCount: Record<ChallengeCategory, number> = {
      fitness: 0,
      technical: 0,
      tactical: 0,
      mental: 0,
    };

    tacticsState.players.forEach(player => {
      const progress = challengeService.getPlayerProgress(player.id);
      coachChallenges.forEach(challenge => {
        const challengeProgress = progress.filter(p => p.challengeId === challenge.id);
        totalAttempts += challengeProgress.length;
        const completed = challengeProgress.filter(p => p.status === 'completed');
        totalCompleted += completed.length;

        if (completed.length > 0) {
          stats.totalXPAwarded += challenge.xpReward * completed.length;
          categoryCount[challenge.category] += completed.length;
        }
      });
    });

    stats.completionRate = totalAttempts > 0 ? (totalCompleted / totalAttempts) * 100 : 0;

    // Find most popular category
    const maxCategory = Object.entries(categoryCount).reduce((a, b) => (a[1] > b[1] ? a : b));
    stats.popularCategory = maxCategory[0] as ChallengeCategory;

    return stats;
  };

  const stats = calculateChallengeStats();

  return (
    <div className="w-full h-full bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Challenge Manager</h1>
              <p className="text-gray-400">Create and manage custom challenges for your players</p>
            </div>

            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create Challenge
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Created</p>
              <p className="text-xl font-bold text-white">{stats.totalCreated}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Active</p>
              <p className="text-xl font-bold text-blue-400">{stats.activeAssignments}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Pending Review</p>
              <p className="text-xl font-bold text-yellow-400">{pendingReviews.length}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Completion Rate</p>
              <p className="text-xl font-bold text-green-400">
                {Math.round(stats.completionRate)}%
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">XP Awarded</p>
              <p className="text-xl font-bold text-purple-400">{stats.totalXPAwarded}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 border-t border-gray-700 pt-4">
            {(['create', 'manage', 'review', 'templates', 'analytics'] as TabType[]).map(tab => (
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
                {tab === 'review' && pendingReviews.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-gray-900 text-xs rounded-full">
                    {pendingReviews.length}
                  </span>
                )}
              </button>
            ))}
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
            {activeTab === 'create' && (
              <div className="space-y-6">
                {/* Quick Create Options */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Quick Create</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(['fitness', 'technical', 'tactical', 'mental'] as ChallengeCategory[]).map(
                      category => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedTemplate({
                              id: `quick-${category}`,
                              name: `${category} Challenge`,
                              description: `Create a ${category} challenge`,
                              category,
                              defaultRequirements: [],
                              defaultRewards: [],
                              customizable: true,
                              popularityScore: 0,
                              usageCount: 0,
                            });
                            setShowCreator(true);
                          }}
                          className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
                        >
                          <div className="flex items-center mb-2">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                category === 'fitness'
                                  ? 'bg-green-600'
                                  : category === 'technical'
                                    ? 'bg-blue-600'
                                    : category === 'tactical'
                                      ? 'bg-purple-600'
                                      : 'bg-yellow-600'
                              }`}
                            >
                              <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                {category === 'fitness' ? (
                                  <path
                                    fillRule="evenodd"
                                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                    clipRule="evenodd"
                                  />
                                ) : category === 'technical' ? (
                                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                ) : category === 'tactical' ? (
                                  <path
                                    fillRule="evenodd"
                                    d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
                                    clipRule="evenodd"
                                  />
                                ) : (
                                  <path
                                    fillRule="evenodd"
                                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                    clipRule="evenodd"
                                  />
                                )}
                              </svg>
                            </div>
                            <span className="ml-3 font-medium text-white capitalize">
                              {category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">Create a {category} challenge</p>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Recent Templates */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Popular Templates</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {challengeService
                      .getTemplates()
                      .slice(0, 4)
                      .map(template => (
                        <div key={template.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-white">{template.name}</h3>
                              <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <span className="capitalize">{template.category}</span>
                                <span className="mx-2">•</span>
                                <span>Used {template.usageCount} times</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowCreator(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Use
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="space-y-4">
                {coachChallenges.length > 0 ? (
                  coachChallenges.map(challenge => (
                    <div
                      key={challenge.id}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                          <p className="text-gray-400 mt-1">{challenge.description}</p>

                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                challenge.category === 'fitness'
                                  ? 'bg-green-600/20 text-green-400'
                                  : challenge.category === 'technical'
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : challenge.category === 'tactical'
                                      ? 'bg-purple-600/20 text-purple-400'
                                      : 'bg-yellow-600/20 text-yellow-400'
                              }`}
                            >
                              {challenge.category}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                challenge.difficulty === 'easy'
                                  ? 'bg-green-600/20 text-green-400'
                                  : challenge.difficulty === 'medium'
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : challenge.difficulty === 'hard'
                                      ? 'bg-orange-600/20 text-orange-400'
                                      : 'bg-red-600/20 text-red-400'
                              }`}
                            >
                              {challenge.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">{challenge.xpReward} XP</span>
                            {challenge.targetPlayers && challenge.targetPlayers.length > 0 && (
                              <span className="text-xs text-gray-500">
                                Assigned to {challenge.targetPlayers.length} player(s)
                              </span>
                            )}
                          </div>

                          {/* Requirements */}
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-400 mb-2">Requirements:</p>
                            <ul className="list-disc list-inside text-sm text-gray-500">
                              {challenge.requirements.map(req => (
                                <li key={req.id}>{req.description}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedChallenge(challenge);
                              setShowCreator(true);
                            }}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      No Challenges Created
                    </h3>
                    <p className="text-gray-500 mb-4">Start creating challenges for your players</p>
                    <button
                      onClick={() => setShowCreator(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Your First Challenge
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'review' && (
              <div className="space-y-4">
                {pendingReviews.length > 0 ? (
                  pendingReviews.map(progress => (
                    <ChallengeSubmission
                      key={`${progress.playerId}-${progress.challengeId}`}
                      progress={progress}
                      challenge={state.challenges.find(c => c.id === progress.challengeId)!}
                      playerName={getPlayerName(progress.playerId)}
                      onApprove={notes =>
                        handleReviewSubmission(progress.playerId, progress.challengeId, true, notes)
                      }
                      onReject={notes =>
                        handleReviewSubmission(
                          progress.playerId,
                          progress.challengeId,
                          false,
                          notes
                        )
                      }
                    />
                  ))
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Pending Reviews</h3>
                    <p className="text-gray-500">All challenge submissions have been reviewed</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {challengeService.getTemplates().map(template => (
                  <div
                    key={template.id}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                        <p className="text-gray-400 mt-1">{template.description}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          template.category === 'fitness'
                            ? 'bg-green-600/20 text-green-400'
                            : template.category === 'technical'
                              ? 'bg-blue-600/20 text-blue-400'
                              : template.category === 'tactical'
                                ? 'bg-purple-600/20 text-purple-400'
                                : 'bg-yellow-600/20 text-yellow-400'
                        }`}
                      >
                        {template.category}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-gray-400">Default Requirements:</p>
                      {template.defaultRequirements.map((req, index) => (
                        <div key={index} className="text-sm text-gray-500">
                          • {req.description}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Used {template.usageCount} times
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowCreator(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Challenge Analytics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Total Created</p>
                      <p className="text-2xl font-bold text-white">{stats.totalCreated}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Completion Rate</p>
                      <p className="text-2xl font-bold text-green-400">
                        {Math.round(stats.completionRate)}%
                      </p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Total XP Awarded</p>
                      <p className="text-2xl font-bold text-purple-400">{stats.totalXPAwarded}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Most Popular</p>
                      <p className="text-2xl font-bold text-blue-400 capitalize">
                        {stats.popularCategory || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Player Engagement */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Player Engagement</h2>
                  <div className="space-y-3">
                    {tacticsState.players.map(player => {
                      const progress = challengeService.getPlayerProgress(player.id);
                      const coachProgress = progress.filter(p =>
                        coachChallenges.some(c => c.id === p.challengeId)
                      );
                      const completed = coachProgress.filter(p => p.status === 'completed').length;
                      const active = coachProgress.filter(p => p.status === 'active').length;

                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-bold text-white">
                                {player.jerseyNumber}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{player.name}</p>
                              <p className="text-xs text-gray-400">
                                {active} active, {completed} completed
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-400">
                              {coachProgress.length > 0
                                ? Math.round((completed / coachProgress.length) * 100)
                                : 0}
                              % Success
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Challenge Performance */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Challenge Performance</h2>
                  <div className="space-y-3">
                    {coachChallenges.slice(0, 5).map(challenge => {
                      let attempts = 0;
                      let completions = 0;

                      tacticsState.players.forEach(player => {
                        const progress = challengeService.getPlayerProgress(player.id);
                        const challengeProgress = progress.filter(
                          p => p.challengeId === challenge.id
                        );
                        attempts += challengeProgress.length;
                        completions += challengeProgress.filter(
                          p => p.status === 'completed'
                        ).length;
                      });

                      const successRate = attempts > 0 ? (completions / attempts) * 100 : 0;

                      return (
                        <div key={challenge.id} className="p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-white">{challenge.title}</p>
                            <span className="text-sm text-gray-400">{attempts} attempts</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {Math.round(successRate)}% success rate
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Challenge Creator Modal */}
        {showCreator && (
          <ChallengeCreator
            template={selectedTemplate}
            existingChallenge={selectedChallenge}
            players={tacticsState.players}
            onSave={handleCreateChallenge}
            onClose={() => {
              setShowCreator(false);
              setSelectedChallenge(null);
              setSelectedTemplate(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CoachChallengeManagerPage;
