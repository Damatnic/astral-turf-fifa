// Player Ranking Cards Showcase Page - Complete visual perfection demo

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Trophy,
  TrendingUp,
  Download,
  Grid3x3,
  BarChart3,
  Share2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import PlayerCardGallery from '../components/ranking/PlayerCardGallery';
import StatProgressionView from '../components/ranking/StatProgressionView';
import PlayerCardExport from '../components/ranking/PlayerCardExport';
import EnhancedPlayerRankingCard, { type CardRarity } from '../components/ranking/EnhancedPlayerRankingCard';
import type { Player } from '../types/player';
import type { PlayerRankingProfile } from '../types/challenges';

type ViewMode = 'gallery' | 'progression' | 'showcase' | 'export';

const PlayerRankingShowcase: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('showcase');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  // Sample player data (in real app, fetch from API)
  const samplePlayers: Player[] = useMemo(() => {
    return [
      {
        id: 'player-1',
        name: 'Marcus Silva',
        jerseyNumber: 10,
        age: 25,
        nationality: 'Brazil',
        position: { x: 50, y: 30 },
        potential: [85, 95] as const,
        currentPotential: 90,
        roleId: 'forward',
        positionRole: 'ST',
        instructions: {},
        team: { id: 'team-1', name: 'Team A' } as unknown as Player['team'],
        teamColor: '#FF0000',
        attributes: {
          speed: 92,
          passing: 85,
          shooting: 89,
          dribbling: 91,
          tackling: 45,
          positioning: 88,
        },
        availability: { status: 'available', reason: '' } as unknown as Player['availability'],
        morale: { level: 'high', value: 85 } as unknown as Player['morale'],
      },
      {
        id: 'player-2',
        name: 'Emma Chen',
        jerseyNumber: 7,
        age: 23,
        nationality: 'China',
        position: { x: 50, y: 50 },
        potential: [80, 90] as const,
        currentPotential: 85,
        roleId: 'midfielder',
        positionRole: 'CM',
        instructions: {},
        team: { id: 'team-1', name: 'Team A' } as unknown as Player['team'],
        teamColor: '#FF0000',
        attributes: {
          speed: 78,
          passing: 94,
          shooting: 82,
          dribbling: 88,
          tackling: 75,
          positioning: 90,
        },
        availability: { status: 'available', reason: '' } as unknown as Player['availability'],
        morale: { level: 'high', value: 82 } as unknown as Player['morale'],
      },
      {
        id: 'player-3',
        name: 'David Johnson',
        jerseyNumber: 5,
        age: 28,
        nationality: 'England',
        position: { x: 30, y: 70 },
        potential: [75, 85] as const,
        currentPotential: 80,
        roleId: 'defender',
        positionRole: 'CB',
        instructions: {},
        team: { id: 'team-1', name: 'Team A' } as unknown as Player['team'],
        teamColor: '#FF0000',
        attributes: {
          speed: 72,
          passing: 80,
          shooting: 55,
          dribbling: 70,
          tackling: 95,
          positioning: 92,
        },
        availability: { status: 'available', reason: '' } as unknown as Player['availability'],
        morale: { level: 'high', value: 80 } as unknown as Player['morale'],
      },
      {
        id: 'player-4',
        name: 'Sofia Rodriguez',
        jerseyNumber: 11,
        age: 22,
        nationality: 'Spain',
        position: { x: 70, y: 40 },
        potential: [82, 92] as const,
        currentPotential: 88,
        roleId: 'winger',
        positionRole: 'RW',
        instructions: {},
        team: { id: 'team-1', name: 'Team A' } as unknown as Player['team'],
        teamColor: '#FF0000',
        attributes: {
          speed: 96,
          passing: 83,
          shooting: 87,
          dribbling: 93,
          tackling: 50,
          positioning: 85,
        },
        availability: { status: 'available', reason: '' } as unknown as Player['availability'],
        morale: { level: 'high', value: 88 } as unknown as Player['morale'],
      },
    ] as Player[];
  }, []);

  // Sample ranking profiles
  const sampleProfiles: Map<string, PlayerRankingProfile> = useMemo(() => {
    const profiles = new Map<string, PlayerRankingProfile>();

    const profileData = [
      {
        playerId: 'player-1',
        level: 85,
        xp: 450000,
        weeklyXP: 15000,
        currentXP: 8500,
        xpToNext: 12000,
        challenges: 324,
        badges: 48,
        streak: 28,
      },
      {
        playerId: 'player-2',
        level: 67,
        xp: 285000,
        weeklyXP: 12000,
        currentXP: 6200,
        xpToNext: 9500,
        challenges: 198,
        badges: 31,
        streak: 15,
      },
      {
        playerId: 'player-3',
        level: 52,
        xp: 165000,
        weeklyXP: 8000,
        currentXP: 4100,
        xpToNext: 7500,
        challenges: 142,
        badges: 18,
        streak: 7,
      },
      {
        playerId: 'player-4',
        level: 73,
        xp: 320000,
        weeklyXP: 13500,
        currentXP: 7200,
        xpToNext: 10500,
        challenges: 245,
        badges: 37,
        streak: 21,
      },
    ];

    profileData.forEach(data => {
      profiles.set(data.playerId, {
        playerId: data.playerId,
        totalXP: data.xp,
        currentLevel: data.level,
        xpToNextLevel: data.xpToNext,
        earnedAttributes: {},
        unspentAttributePoints: Math.floor(data.level / 5),
        challengesCompleted: Array(data.challenges).fill('ch'),
        challengesActive: [],
        challengesFailed: [],
        streakDays: data.streak,
        longestStreak: Math.max(data.streak, Math.floor(data.streak * 1.5)),
        badges: Array(data.badges)
          .fill(null)
          .map((_, i) => ({
            badgeId: `badge-${i}`,
            id: `badge-${i}`,
            name: `Badge ${i + 1}`,
            description: 'Achievement unlocked',
            category: 'achievement' as const,
            rarity: i < 5 ? 'legendary' : i < 15 ? 'epic' : i < 30 ? 'rare' : 'uncommon' as const,
            imageUrl: '',
            earnedDate: new Date().toISOString(),
            earnedAt: new Date().toISOString(),
            earnedFrom: 'challenge',
          })),
        weeklyProgress: {
          weekNumber: 1,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          xpEarned: data.weeklyXP,
          challengesCompleted: data.challenges,
          attributePointsEarned: Math.floor(data.level / 5),
          dailyActivity: [],
          weeklyGoals: [],
        },
        monthlyStats: {
          month: 'January',
          year: new Date().getFullYear(),
          totalXP: data.xp,
          challengesCompleted: data.challenges,
          attributePointsEarned: Math.floor(data.level / 5),
          badgesEarned: data.badges,
          averageDailyXP: Math.floor(data.weeklyXP / 7),
          mostProductiveDay: new Date().toISOString(),
          categoryBreakdown: {
            fitness: Math.floor(data.challenges * 0.25),
            technical: Math.floor(data.challenges * 0.25),
            tactical: Math.floor(data.challenges * 0.25),
            mental: Math.floor(data.challenges * 0.25),
          },
        },
        totalStats: {
          totalChallengesCompleted: data.challenges,
          totalXPEarned: data.xp,
          totalAttributePointsEarned: Math.floor(data.level / 5),
          totalBadgesEarned: data.badges,
          favoriteCategory: 'fitness',
          completionRate: 0.87,
          averageChallengeTime: 45,
          difficultyBreakdown: {
            easy: Math.floor(data.challenges * 0.3),
            medium: Math.floor(data.challenges * 0.4),
            hard: Math.floor(data.challenges * 0.2),
            elite: Math.floor(data.challenges * 0.1),
          },
          categoryBreakdown: {
            fitness: Math.floor(data.challenges * 0.25),
            technical: Math.floor(data.challenges * 0.25),
            tactical: Math.floor(data.challenges * 0.25),
            mental: Math.floor(data.challenges * 0.25),
          },
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    return profiles;
  }, []);

  // Calculate rarity for each player
  const calculateRarity = (profile: PlayerRankingProfile): CardRarity => {
    const level = profile.currentLevel;
    const badges = profile.badges.length;
    const challenges = profile.totalStats.totalChallengesCompleted;

    if (level >= 80 || badges >= 50 || challenges >= 500) {
      return 'legendary';
    }
    if (level >= 60 || badges >= 30 || challenges >= 250) {
      return 'epic';
    }
    if (level >= 40 || badges >= 15 || challenges >= 100) {
      return 'rare';
    }
    if (level >= 20 || badges >= 5 || challenges >= 25) {
      return 'uncommon';
    }
    return 'common';
  };

  const selectedPlayerData = useMemo(() => {
    if (!selectedPlayer) {
      return null;
    }
    const player = samplePlayers.find(p => p.id === selectedPlayer);
    const profile = sampleProfiles.get(selectedPlayer);
    if (!player || !profile) {
      return null;
    }
    return {
      player,
      profile,
      rarity: calculateRarity(profile),
    };
  }, [selectedPlayer, samplePlayers, sampleProfiles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <div className="bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-yellow-400" size={28} />
                Player Ranking Cards
              </h1>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-1">
              <ViewButton
                icon={Sparkles}
                label="Showcase"
                active={viewMode === 'showcase'}
                onClick={() => setViewMode('showcase')}
              />
              <ViewButton
                icon={Grid3x3}
                label="Gallery"
                active={viewMode === 'gallery'}
                onClick={() => setViewMode('gallery')}
              />
              <ViewButton
                icon={BarChart3}
                label="Progress"
                active={viewMode === 'progression'}
                onClick={() => setViewMode('progression')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {viewMode === 'showcase' && (
            <motion.div
              key="showcase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ShowcaseView
                players={samplePlayers}
                profiles={sampleProfiles}
                calculateRarity={calculateRarity}
                onSelectPlayer={setSelectedPlayer}
                onExport={() => setShowExport(true)}
              />
            </motion.div>
          )}

          {viewMode === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PlayerCardGallery players={samplePlayers} profiles={sampleProfiles} />
            </motion.div>
          )}

          {viewMode === 'progression' && selectedPlayerData && (
            <motion.div
              key="progression"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedPlayerData.player.name}&apos;s Progression
                </h2>
                <p className="text-gray-400">
                  Track your growth and achievements over time
                </p>
              </div>
              <StatProgressionView
                currentProfile={selectedPlayerData.profile}
                timeRange="month"
              />
            </motion.div>
          )}

          {viewMode === 'progression' && !selectedPlayerData && (
            <motion.div
              key="no-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <TrendingUp className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-xl text-gray-400 mb-2">No Player Selected</p>
              <p className="text-gray-500">
                Select a player from the showcase to view their progression
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExport && selectedPlayerData && (
          <PlayerCardExport
            player={selectedPlayerData.player}
            profile={selectedPlayerData.profile}
            rarity={selectedPlayerData.rarity}
            onClose={() => setShowExport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// View Button Component
interface ViewButtonProps {
  icon: React.ComponentType<{size?: number | string}>;
  label: string;
  active: boolean;
  onClick: () => void;
}

const ViewButton: React.FC<ViewButtonProps> = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          : 'text-gray-400 hover:text-white hover:bg-gray-600'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

// Showcase View Component
interface ShowcaseViewProps {
  players: Player[];
  profiles: Map<string, PlayerRankingProfile>;
  calculateRarity: (profile: PlayerRankingProfile) => CardRarity;
  onSelectPlayer: (playerId: string) => void;
  onExport: () => void;
}

const ShowcaseView: React.FC<ShowcaseViewProps> = ({
  players,
  profiles,
  calculateRarity,
  onSelectPlayer,
  onExport,
}) => {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const toggleFlip = (playerId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <Star className="text-yellow-400" size={32} />
          Stunning Player Cards with Rarity Tiers
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-6">
          Experience beautifully designed player cards with holographic effects, 3D animations,
          and five rarity tiers from Common to Legendary. Click cards to flip and see detailed
          stats!
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <FeatureCard
            icon={Star}
            title="5 Rarity Tiers"
            description="Common → Legendary"
            color="yellow"
          />
          <FeatureCard
            icon={Sparkles}
            title="3D Animations"
            description="Interactive flip effects"
            color="purple"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Stat Progression"
            description="Track growth over time"
            color="green"
          />
          <FeatureCard
            icon={Share2}
            title="Share & Export"
            description="Download as PNG"
            color="blue"
          />
        </div>
      </div>

      {/* Card Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 justify-items-center">
        {players.map((player, index) => {
          const profile = profiles.get(player.id);
          if (!profile) {
            return null;
          }
          const rarity = calculateRarity(profile);
          const isFlipped = flippedCards.has(player.id);

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Action Buttons */}
              <div className="absolute -top-3 -right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      onSelectPlayer(player.id);
                      onExport();
                    }}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-full text-white shadow-lg"
                    title="Export Card"
                  >
                    <Download size={18} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onSelectPlayer(player.id)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-lg"
                    title="View Progression"
                  >
                    <Trophy size={18} />
                  </motion.button>
                </div>
              </div>

              <EnhancedPlayerRankingCard
                player={player}
                profile={profile}
                rarity={rarity}
                rank={index + 1}
                showStats
                is3D
                isFlipped={isFlipped}
                onFlip={() => toggleFlip(player.id)}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-blue-400 mb-3">✨ Interactive Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-300">
          <div>
            <p className="font-semibold mb-1">🖱️ Hover Effect</p>
            <p className="text-blue-400/80">Move mouse over cards for 3D tilt effect</p>
          </div>
          <div>
            <p className="font-semibold mb-1">🔄 Flip Cards</p>
            <p className="text-blue-400/80">Click &quot;View Details&quot; to see attributes</p>
          </div>
          <div>
            <p className="font-semibold mb-1">💾 Export & Share</p>
            <p className="text-blue-400/80">Hover and click icons to export or view stats</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: React.ComponentType<{size?: number | string; className?: string}>;
  title: string;
  description: string;
  color: 'yellow' | 'purple' | 'green' | 'blue';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color }) => {
  const colorClasses = {
    yellow: 'from-yellow-600/20 to-yellow-800/20 border-yellow-700/50 text-yellow-400',
    purple: 'from-purple-600/20 to-purple-800/20 border-purple-700/50 text-purple-400',
    green: 'from-green-600/20 to-green-800/20 border-green-700/50 text-green-400',
    blue: 'from-blue-600/20 to-blue-800/20 border-blue-700/50 text-blue-400',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-4 text-center`}
    >
      <Icon size={32} className={`mx-auto mb-2 ${colorClasses[color].split(' ')[3]}`} />
      <p className="font-bold text-white mb-1">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
};

export default PlayerRankingShowcase;
