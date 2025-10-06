/**
 * Team Challenge Creator
 * Coach interface for creating and managing team challenges
 * Supports multi-player coordination and team-based rewards
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  X,
  Trophy,
  Target,
  Star,
  ChevronRight,
  Save,
  Play,
} from 'lucide-react';
import { Challenge, ChallengeRequirement, ChallengeDifficulty } from '../../types/challenge';

interface TeamPlayer {
  id: string;
  name: string;
  avatar?: string;
  jerseyNumber: number;
}

interface TeamChallengeCreatorProps {
  availablePlayers: TeamPlayer[];
  onCreateChallenge: (challenge: Partial<Challenge>) => Promise<void>;
  onClose: () => void;
}

export const TeamChallengeCreator: React.FC<TeamChallengeCreatorProps> = ({
  availablePlayers,
  onCreateChallenge,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [challengeData, setChallengeData] = useState<Partial<Challenge>>({
    title: '',
    description: '',
    type: 'team',
    difficulty: 'intermediate',
    status: 'draft',
    assignedTo: [],
    requirements: [],
    points: 500,
    xpReward: 1000,
    evidenceTypes: ['photo', 'video', 'stats'],
    minimumEvidence: 1,
    tags: [],
    isPublic: true,
    isTemplate: false,
  });
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [newRequirement, setNewRequirement] = useState<Partial<ChallengeRequirement>>({
    type: 'metric',
    description: '',
    target: 0,
    unit: '',
    isOptional: false,
    weight: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minPlayers = 2;
  const maxPlayers = 11;

  // Handlers
  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      if (newSelected.size < maxPlayers) {
        newSelected.add(playerId);
      }
    }
    setSelectedPlayers(newSelected);
  };

  const handleAddRequirement = () => {
    if (!newRequirement.description || !newRequirement.target) {
      return;
    }

    const requirement: ChallengeRequirement = {
      id: `req-${Date.now()}`,
      type: newRequirement.type || 'metric',
      description: newRequirement.description,
      target: newRequirement.target,
      unit: newRequirement.unit || '',
      isOptional: newRequirement.isOptional || false,
      weight: newRequirement.weight || 1,
    };

    setChallengeData({
      ...challengeData,
      requirements: [...(challengeData.requirements || []), requirement],
    });

    // Reset form
    setNewRequirement({
      type: 'metric',
      description: '',
      target: 0,
      unit: '',
      isOptional: false,
      weight: 1,
    });
  };

  const handleRemoveRequirement = (reqId: string) => {
    setChallengeData({
      ...challengeData,
      requirements: (challengeData.requirements || []).filter((r) => r.id !== reqId),
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!challengeData.title?.trim()) {
      return;
    }
    if (selectedPlayers.size < minPlayers) {
      return;
    }
    if ((challengeData.requirements || []).length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const challenge: Partial<Challenge> = {
        ...challengeData,
        assignedTo: Array.from(selectedPlayers),
        startDate: new Date(),
        endDate: new Date(Date.now() + (challengeData.duration || 7) * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await onCreateChallenge(challenge);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await onCreateChallenge({ ...challengeData, status: 'draft' });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    const colors = {
      beginner: 'text-green-400 border-green-500/30 bg-green-500/10',
      intermediate: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      advanced: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      expert: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      legendary: 'text-red-400 border-red-500/30 bg-red-500/10',
    };
    return colors[difficulty];
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 border-b border-blue-500/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create Team Challenge</h2>
              <p className="text-sm text-gray-400">Coordinate challenges for multiple players</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                {s === 1 ? 'Details' : s === 2 ? 'Players' : 'Requirements'}
              </span>
              {s < 3 && <ChevronRight className="w-4 h-4 text-gray-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Challenge Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  value={challengeData.title}
                  onChange={(e) => setChallengeData({ ...challengeData, title: e.target.value })}
                  placeholder="e.g., Team Sprint Challenge"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={challengeData.description}
                  onChange={(e) => setChallengeData({ ...challengeData, description: e.target.value })}
                  placeholder="Describe the challenge objectives and what players need to do..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Difficulty & Duration */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'advanced', 'expert', 'legendary'] as ChallengeDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setChallengeData({ ...challengeData, difficulty: diff })}
                        className={`px-3 py-2 rounded-lg border font-medium text-sm capitalize transition-colors ${
                          challengeData.difficulty === diff
                            ? getDifficultyColor(diff)
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={challengeData.duration || 7}
                    onChange={(e) => setChallengeData({ ...challengeData, duration: parseInt(e.target.value) || 7 })}
                    min="1"
                    max="365"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Points & XP */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Points Reward
                  </label>
                  <div className="relative">
                    <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500" />
                    <input
                      type="number"
                      value={challengeData.points}
                      onChange={(e) => setChallengeData({ ...challengeData, points: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    XP Reward
                  </label>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <input
                      type="number"
                      value={challengeData.xpReward}
                      onChange={(e) => setChallengeData({ ...challengeData, xpReward: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={(challengeData.tags || []).join(', ')}
                  onChange={(e) => setChallengeData({ ...challengeData, tags: e.target.value.split(',').map(t => t.trim()) })}
                  placeholder="e.g., sprint, endurance, teamwork"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Players */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Select Team Members</h3>
                    <p className="text-sm text-gray-400">
                      Choose {minPlayers}-{maxPlayers} players for this team challenge
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{selectedPlayers.size}</div>
                    <div className="text-xs text-gray-400">Selected</div>
                  </div>
                </div>

                {/* Player Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availablePlayers.map((player) => {
                    const isSelected = selectedPlayers.has(player.id);
                    const isDisabled = !isSelected && selectedPlayers.size >= maxPlayers;
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerToggle(player.id)}
                        disabled={isDisabled}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/50'
                            : isDisabled
                              ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {/* Avatar */}
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {player.jerseyNumber}
                          </div>
                          
                          {/* Name */}
                          <div className="text-center">
                            <div className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                              {player.name}
                            </div>
                            <div className="text-xs text-gray-500">#{player.jerseyNumber}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedPlayers.size < minPlayers && (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">
                        Select at least {minPlayers - selectedPlayers.size} more player(s)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Requirements */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Challenge Requirements</h3>

                {/* Existing Requirements */}
                {(challengeData.requirements || []).length > 0 && (
                  <div className="space-y-3 mb-6">
                    {(challengeData.requirements || []).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium">{req.description}</span>
                            {req.isOptional && (
                              <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
                                Optional
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            Target: {req.target} {req.unit}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveRequirement(req.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Requirement */}
                <div className="p-6 bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">Add Requirement</h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Type</label>
                        <select
                          value={newRequirement.type}
                          onChange={(e) => setNewRequirement({ ...newRequirement, type: e.target.value as ChallengeRequirement['type'] })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="metric">Metric</option>
                          <option value="action">Action</option>
                          <option value="achievement">Achievement</option>
                          <option value="submission">Submission</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Optional?</label>
                        <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRequirement.isOptional}
                            onChange={(e) => setNewRequirement({ ...newRequirement, isOptional: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-white">Optional requirement</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Description</label>
                      <input
                        type="text"
                        value={newRequirement.description}
                        onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                        placeholder="e.g., Complete 5km team run"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Target Value</label>
                        <input
                          type="number"
                          value={newRequirement.target}
                          onChange={(e) => setNewRequirement({ ...newRequirement, target: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Unit</label>
                        <input
                          type="text"
                          value={newRequirement.unit}
                          onChange={(e) => setNewRequirement({ ...newRequirement, unit: e.target.value })}
                          placeholder="e.g., km, minutes, reps"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddRequirement}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Requirement
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-800/50 border-t border-gray-700 p-6 flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Previous
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedPlayers.size < minPlayers || (challengeData.requirements || []).length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Create Challenge
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
