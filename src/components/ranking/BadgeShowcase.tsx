// Badge Showcase Component
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { PlayerBadge } from '../../types/challenges';

interface BadgeShowcaseProps {
  badges: PlayerBadge[];
  playerName: string;
}

const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ badges, playerName }) => {
  const [selectedBadge, setSelectedBadge] = useState<PlayerBadge | null>(null);

  const getRarityColor = (rarity: PlayerBadge['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'from-purple-600 to-pink-600 border-purple-500';
      case 'epic':
        return 'from-purple-500 to-blue-600 border-purple-400';
      case 'rare':
        return 'from-blue-500 to-cyan-600 border-blue-400';
      case 'uncommon':
        return 'from-green-500 to-emerald-600 border-green-400';
      default:
        return 'from-gray-500 to-gray-600 border-gray-400';
    }
  };

  const badgesByRarity = badges.reduce(
    (acc, badge) => {
      if (!acc[badge.rarity]) {
        acc[badge.rarity] = [];
      }
      acc[badge.rarity].push(badge);
      return acc;
    },
    {} as Record<string, PlayerBadge[]>,
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">{playerName}'s Badge Collection</h2>

      {badges.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No badges earned yet. Complete challenges to earn badges!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as const).map(rarity => {
            const rarityBadges = badgesByRarity[rarity];
            if (!rarityBadges?.length) {
              return null;
            }

            return (
              <div key={rarity}>
                <h3 className="text-sm font-medium text-gray-400 mb-3 capitalize">
                  {rarity} ({rarityBadges.length})
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {rarityBadges.map(badge => (
                    <motion.button
                      key={badge.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedBadge(badge)}
                      className={`relative w-16 h-16 rounded-lg bg-gradient-to-br ${getRarityColor(badge.rarity)} p-0.5`}
                    >
                      <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🏅</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedBadge(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 border border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <div
              className={`w-24 h-24 mx-auto rounded-lg bg-gradient-to-br ${getRarityColor(selectedBadge.rarity)} p-1 mb-4`}
            >
              <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🏅</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">{selectedBadge.name}</h3>
            <p className="text-gray-400 text-center mb-4">{selectedBadge.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Rarity:</span>
                <span className="text-white capitalize">{selectedBadge.rarity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Earned:</span>
                <span className="text-white">
                  {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="text-white capitalize">{selectedBadge.category}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BadgeShowcase;
