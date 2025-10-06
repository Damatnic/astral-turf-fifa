// Challenge Creator Component
import React, { useState } from 'react';
import type {
  Challenge,
  ChallengeTemplate,
  ChallengeCategory,
  ChallengeDifficulty,
} from '../../types/challenges';
import type { Player } from '../../types/player';

interface ChallengeCreatorProps {
  template?: ChallengeTemplate | null;
  existingChallenge?: Challenge | null;
  players: Player[];
  onSave: (challenge: Partial<Challenge>) => void;
  onClose: () => void;
}

const ChallengeCreator: React.FC<ChallengeCreatorProps> = ({
  template,
  existingChallenge,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(existingChallenge?.title || template?.name || '');
  const [description, setDescription] = useState(
    existingChallenge?.description || template?.description || ''
  );
  const [category, setCategory] = useState(
    existingChallenge?.category || template?.category || 'fitness'
  );
  const [difficulty, setDifficulty] = useState(existingChallenge?.difficulty || 'medium');
  const [xpReward, setXpReward] = useState(existingChallenge?.xpReward || 100);

  const handleSubmit = () => {
    onSave({
      title,
      description,
      category,
      difficulty,
      xpReward,
      frequency: 'special',
      requirements: template?.defaultRequirements || [],
      rewards: [{ type: 'xp', value: xpReward, description: `${xpReward} XP` }],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          {existingChallenge ? 'Edit Challenge' : 'Create Challenge'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ChallengeCategory)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="fitness">Fitness</option>
                <option value="technical">Technical</option>
                <option value="tactical">Tactical</option>
                <option value="mental">Mental</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as ChallengeDifficulty)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="elite">Elite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">XP Reward</label>
            <input
              type="number"
              value={xpReward}
              onChange={e => setXpReward(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              min="0"
              step="50"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {existingChallenge ? 'Update' : 'Create'} Challenge
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCreator;
