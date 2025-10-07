import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Player, type PlayerMorale } from '../../types';
import { PLAYER_ROLES } from '../../constants';

interface ExpandedPlayerCardProps {
  player: Player;
  isVisible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onPlayerAction?: (action: 'swap' | 'bench' | 'instructions' | 'stats') => void;
}

// Helper function to get availability color
const getAvailabilityColor = (status: string) => {
  switch (status) {
    case 'Available':
      return 'text-green-400';
    case 'Minor Injury':
      return 'text-yellow-400';
    case 'Major Injury':
      return 'text-red-400';
    case 'Suspended':
      return 'text-orange-400';
    case 'International Duty':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

// Helper function to get morale color
const getMoraleColor = (morale: PlayerMorale) => {
  switch (morale) {
    case 'Excellent':
      return 'text-green-400';
    case 'Good':
      return 'text-blue-400';
    case 'Okay':
      return 'text-yellow-400';
    case 'Poor':
      return 'text-orange-400';
    case 'Very Poor':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

// Helper function to get form color
const getFormColor = (form: string) => {
  switch (form) {
    case 'Excellent':
      return 'text-green-400';
    case 'Good':
      return 'text-blue-400';
    case 'Average':
      return 'text-yellow-400';
    case 'Poor':
      return 'text-orange-400';
    case 'Very Poor':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

// Attribute bar component
const AttributeBar: React.FC<{ name: string; value: number; color?: string }> = ({
  name,
  value,
  color = 'bg-blue-500',
}) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-slate-300">{name}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
    </div>
  </div>
);

export const ExpandedPlayerCard: React.FC<ExpandedPlayerCardProps> = ({
  player,
  isVisible,
  onClose,
  position,
  onPlayerAction,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'attributes'>('overview');

  const playerRole = PLAYER_ROLES.find(role => role.id === player.roleId);

  // Calculate position for the card to avoid screen edges
  const [cardPosition, setCardPosition] = useState(position);

  useEffect(() => {
    const cardWidth = 320;
    const cardHeight = 400;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position
    if (x + cardWidth > screenWidth - 20) {
      x = screenWidth - cardWidth - 20;
    }
    if (x < 20) {
      x = 20;
    }

    // Adjust vertical position
    if (y + cardHeight > screenHeight - 20) {
      y = screenHeight - cardHeight - 20;
    }
    if (y < 20) {
      y = 20;
    }

    setCardPosition({ x, y });
  }, [position]);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: position.x, y: position.y }}
            animate={{ opacity: 1, scale: 1, x: cardPosition.x, y: cardPosition.y }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 w-80 bg-slate-800/95 backdrop-blur-md rounded-lg border border-slate-600/50 shadow-2xl"
            style={{ left: 0, top: 0 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: player.teamColor }}
                    >
                      {player.jerseyNumber}
                    </div>
                    {player.availability.status !== 'Available' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{player.name}</h3>
                    <p className="text-slate-300 text-sm">
                      {playerRole?.abbreviation} • {playerRole?.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mt-3">
                {['overview', 'stats', 'attributes'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-64 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Age:</span>
                      <span className="text-white ml-2">{player.age}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Nationality:</span>
                      <span className="text-white ml-2">{player.nationality}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <span className={`ml-2 ${getAvailabilityColor(player.availability.status)}`}>
                        {player.availability.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Form:</span>
                      <span className={`ml-2 ${getFormColor(player.form)}`}>{player.form}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Morale:</span>
                      <span className={`ml-2 ${getMoraleColor(player.morale)}`}>
                        {player.morale}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Potential:</span>
                      <span className="text-white ml-2">
                        {player.potential[0]}-{player.potential[1]}
                      </span>
                    </div>
                  </div>

                  {player.traits && player.traits.length > 0 && (
                    <div>
                      <h4 className="text-slate-400 text-sm mb-2">Traits:</h4>
                      <div className="flex flex-wrap gap-1">
                        {player.traits.map((trait, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Goals:</span>
                      <span className="text-white ml-2">{player.stats.goals}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Assists:</span>
                      <span className="text-white ml-2">{player.stats.assists}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Matches:</span>
                      <span className="text-white ml-2">{player.stats.matchesPlayed}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Shots on Target:</span>
                      <span className="text-white ml-2">{player.stats.shotsOnTarget}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tackles Won:</span>
                      <span className="text-white ml-2">{player.stats.tacklesWon}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Pass Rate:</span>
                      <span className="text-white ml-2">
                        {player.stats.passesAttempted > 0
                          ? Math.round(
                              (player.stats.passesCompleted / player.stats.passesAttempted) * 100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attributes' && (
                <div className="space-y-2">
                  <AttributeBar name="Speed" value={player.attributes.speed} color="bg-green-500" />
                  <AttributeBar
                    name="Passing"
                    value={player.attributes.passing}
                    color="bg-blue-500"
                  />
                  <AttributeBar
                    name="Shooting"
                    value={player.attributes.shooting}
                    color="bg-red-500"
                  />
                  <AttributeBar
                    name="Dribbling"
                    value={player.attributes.dribbling}
                    color="bg-purple-500"
                  />
                  <AttributeBar
                    name="Tackling"
                    value={player.attributes.tackling}
                    color="bg-orange-500"
                  />
                  <AttributeBar
                    name="Positioning"
                    value={player.attributes.positioning}
                    color="bg-teal-500"
                  />
                  <AttributeBar
                    name="Stamina"
                    value={player.attributes.stamina}
                    color="bg-yellow-500"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {onPlayerAction && (
              <div className="p-4 border-t border-slate-600/50">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onPlayerAction('swap')}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Swap Position
                  </button>
                  <button
                    onClick={() => onPlayerAction('bench')}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                  >
                    To Bench
                  </button>
                  <button
                    onClick={() => onPlayerAction('instructions')}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Instructions
                  </button>
                  <button
                    onClick={() => onPlayerAction('stats')}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Full Stats
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExpandedPlayerCard;
