// Challenge Progress Bar Component - Shows challenge progress

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Challenge, ChallengeProgress } from '../../types/challenges';
import { challengeService } from '../../services/challengeService';
import { useChallengeContext } from '../../context/ChallengeContext';

interface ChallengeProgressBarProps {
  challenge: Challenge;
  playerId: string;
}

const ChallengeProgressBar: React.FC<ChallengeProgressBarProps> = ({ challenge, playerId }) => {
  const { updateProgress, completeChallenge, submitEvidence } = useChallengeContext();
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState(false);
  const [evidenceText, setEvidenceText] = useState('');

  useEffect(() => {
    const playerProgress = challengeService.getPlayerProgress(playerId);
    const challengeProgress = playerProgress.find(
      p => p.challengeId === challenge.id && p.status === 'active',
    );
    setProgress(challengeProgress || null);
  }, [challenge.id, playerId]);

  if (!progress) {
    return null;
  }

  const calculateOverallProgress = (): number => {
    if (!challenge.requirements.length) {
      return 0;
    }

    let totalProgress = 0;
    challenge.requirements.forEach(req => {
      const current = progress.currentProgress[req.id] || 0;
      const percentage = (current / req.target) * 100;
      totalProgress += percentage;
    });

    return Math.min(totalProgress / challenge.requirements.length, 100);
  };

  const handleUpdateProgress = (requirementId: string, value: number) => {
    updateProgress(playerId, challenge.id, requirementId, value);

    // Refresh local progress
    const updatedProgress = challengeService.getPlayerProgress(playerId);
    const challengeProgress = updatedProgress.find(
      p => p.challengeId === challenge.id && p.status === 'active',
    );
    setProgress(challengeProgress || null);
  };

  const handleComplete = () => {
    if (challenge.evidenceRequired && !progress.evidenceSubmissions?.length) {
      setEvidenceModal(true);
    } else {
      completeChallenge(playerId, challenge.id);
    }
  };

  const handleSubmitEvidence = () => {
    if (evidenceText.trim()) {
      submitEvidence(playerId, challenge.id, {
        type: 'text',
        content: evidenceText,
        description: 'Challenge completion evidence',
      });
      setEvidenceText('');
      setEvidenceModal(false);

      // If auto-validate, complete the challenge
      if (challenge.autoValidate) {
        completeChallenge(playerId, challenge.id);
      }
    }
  };

  const getTimeRemaining = (): string | null => {
    if (!challenge.timeLimit || !progress.startedAt) {
      return null;
    }

    const startTime = new Date(progress.startedAt).getTime();
    const deadline = startTime + challenge.timeLimit * 60 * 60 * 1000;
    const now = Date.now();
    const remaining = deadline - now;

    if (remaining <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const overallProgress = calculateOverallProgress();
  const isComplete = overallProgress >= 100;
  const timeRemaining = getTimeRemaining();

  return (
    <>
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-white">{challenge.title}</h4>
            <p className="text-xs text-gray-400 mt-1">{challenge.description}</p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="ml-3 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">Overall Progress</span>
            <span className="text-sm font-medium text-white">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Time Remaining */}
        {timeRemaining && (
          <div
            className={`text-xs ${
              timeRemaining === 'Expired' ? 'text-red-400' : 'text-yellow-400'
            } mb-2`}
          >
            ⏱ {timeRemaining}
          </div>
        )}

        {/* Detailed Requirements (Expandable) */}
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-gray-600 space-y-3"
          >
            {challenge.requirements.map(req => {
              const current = progress.currentProgress[req.id] || 0;
              const percentage = Math.min((current / req.target) * 100, 100);
              const isReqComplete = current >= req.target;

              return (
                <div key={req.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-300">{req.description}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-white">
                        {current}/{req.target} {req.unit}
                      </span>
                      {isReqComplete && (
                        <svg
                          className="w-4 h-4 text-green-500"
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
                  <div className="w-full bg-gray-600 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isReqComplete ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Manual Progress Update (if not auto-tracking) */}
                  {req.trackingMethod === 'manual' && !isReqComplete && (
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => handleUpdateProgress(req.id, current + 1)}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleUpdateProgress(req.id, current + 5)}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors"
                      >
                        +5
                      </button>
                      <input
                        type="number"
                        value={current}
                        onChange={e => handleUpdateProgress(req.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-gray-600 text-white text-xs rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                        min="0"
                        max={req.target}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Evidence Submissions */}
            {progress.evidenceSubmissions && progress.evidenceSubmissions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <p className="text-xs font-medium text-gray-400 mb-2">Evidence Submitted</p>
                {progress.evidenceSubmissions.map(evidence => (
                  <div
                    key={evidence.id}
                    className="flex items-center justify-between p-2 bg-gray-600 rounded mb-1"
                  >
                    <span className="text-xs text-gray-300">{evidence.description}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        evidence.verificationStatus === 'verified'
                          ? 'bg-green-600/20 text-green-400'
                          : evidence.verificationStatus === 'rejected'
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-yellow-600/20 text-yellow-400'
                      }`}
                    >
                      {evidence.verificationStatus || 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            {challenge.rewards.map(reward => (
              <span key={`${reward.type}-${reward.value}`} className="text-xs text-gray-400">
                {reward.type === 'xp' && `${reward.value} XP`}
                {reward.type === 'attribute_points' && `+${reward.value} AP`}
                {reward.type === 'badge' && '🏅'}
              </span>
            ))}
          </div>

          {isComplete && (
            <button
              onClick={handleComplete}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Complete Challenge
            </button>
          )}

          {challenge.evidenceRequired && !isComplete && (
            <button
              onClick={() => setEvidenceModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Evidence
            </button>
          )}
        </div>
      </div>

      {/* Evidence Modal */}
      {evidenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Submit Evidence</h3>
            <p className="text-gray-400 mb-4">
              Provide evidence of your challenge completion for review.
            </p>

            <textarea
              value={evidenceText}
              onChange={e => setEvidenceText(e.target.value)}
              placeholder="Describe your completion or paste a link..."
              className="w-full h-32 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            />

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setEvidenceModal(false);
                  setEvidenceText('');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEvidence}
                disabled={!evidenceText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChallengeProgressBar;
