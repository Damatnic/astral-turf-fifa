// Challenge Submission Component
import React, { useState } from 'react';
import type { Challenge, ChallengeProgress } from '../../types/challenges';

interface ChallengeSubmissionProps {
  progress: ChallengeProgress;
  challenge: Challenge;
  playerName: string;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
}

const ChallengeSubmission: React.FC<ChallengeSubmissionProps> = ({
  progress,
  challenge,
  playerName,
  onApprove,
  onReject,
}) => {
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
          <p className="text-sm text-gray-400 mt-1">Submitted by {playerName}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(progress.startedAt || '').toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white"
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

      {/* Progress Overview */}
      <div className="space-y-2 mb-4">
        {challenge.requirements.map(req => {
          const current = progress.currentProgress[req.id] || 0;
          const percentage = (current / req.target) * 100;

          return (
            <div key={req.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{req.description}</span>
                <span className="text-white">
                  {current}/{req.target} {req.unit}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Evidence */}
      {progress.evidenceSubmissions && progress.evidenceSubmissions.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-400 mb-2">Evidence Submitted</p>
          <div className="space-y-2">
            {progress.evidenceSubmissions.map(evidence => (
              <div key={evidence.id} className="p-3 bg-gray-700 rounded-lg">
                <p className="text-sm text-white">{evidence.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(evidence.submittedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Notes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Review Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none h-20 resize-none"
          placeholder="Add notes for the player..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => onReject(notes)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => onApprove(notes)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Approve
        </button>
      </div>
    </div>
  );
};

export default ChallengeSubmission;
