import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  Zap,
  Star,
  Award,
  Sparkles,
  Crown,
  Shield,
  Target,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import type { Player } from '../../types/player';
import type { PlayerRankingProfile } from '../../types/challenges';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface EnhancedPlayerRankingCardProps {
  player: Player;
  profile: PlayerRankingProfile;
  rank?: number;
  rarity?: CardRarity;
  showStats?: boolean;
  is3D?: boolean;
  isFlipped?: boolean;
  onFlip?: () => void;
  compact?: boolean;
  previousStats?: {
    level: number;
    totalXP: number;
    weeklyXP: number;
  };
}

const EnhancedPlayerRankingCard: React.FC<EnhancedPlayerRankingCardProps> = ({
  player,
  profile,
  rank,
  rarity = 'common',
  showStats = true,
  is3D = true,
  isFlipped = false,
  onFlip,
  compact = false,
  previousStats,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // Rarity configuration
  const rarityConfig = useMemo(() => {
    const configs = {
      common: {
        gradient: 'from-gray-500 via-gray-600 to-gray-700',
        glow: 'rgba(156, 163, 175, 0.3)',
        border: 'border-gray-600',
        shimmer: false,
        particles: 0,
        icon: Star,
        label: 'Common',
        color: '#9CA3AF',
      },
      uncommon: {
        gradient: 'from-green-500 via-emerald-600 to-green-700',
        glow: 'rgba(16, 185, 129, 0.4)',
        border: 'border-green-500',
        shimmer: true,
        particles: 3,
        icon: Award,
        label: 'Uncommon',
        color: '#10B981',
      },
      rare: {
        gradient: 'from-blue-500 via-cyan-600 to-blue-700',
        glow: 'rgba(59, 130, 246, 0.5)',
        border: 'border-blue-500',
        shimmer: true,
        particles: 5,
        icon: Zap,
        label: 'Rare',
        color: '#3B82F6',
      },
      epic: {
        gradient: 'from-purple-500 via-pink-600 to-purple-700',
        glow: 'rgba(168, 85, 247, 0.6)',
        border: 'border-purple-500',
        shimmer: true,
        particles: 8,
        icon: Trophy,
        label: 'Epic',
        color: '#A855F7',
      },
      legendary: {
        gradient: 'from-yellow-400 via-orange-500 to-red-600',
        glow: 'rgba(251, 191, 36, 0.8)',
        border: 'border-yellow-400',
        shimmer: true,
        particles: 12,
        icon: Crown,
        label: 'Legendary',
        color: '#FBB040',
      },
    };
    return configs[rarity];
  }, [rarity]);

  // Calculate stat changes
  const statChanges = useMemo(() => {
    if (!previousStats) {
      return null;
    }
    return {
      level: profile.currentLevel - previousStats.level,
      totalXP: profile.totalXP - previousStats.totalXP,
      weeklyXP: profile.weeklyXP - previousStats.weeklyXP,
    };
  }, [profile, previousStats]);

  // Handle 3D mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3D || isFlipped) {
      return;
    }
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateYValue = ((x - centerX) / centerX) * 15;
    const rotateXValue = ((centerY - y) / centerY) * 15;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Calculate overall rating
  const overallRating = useMemo(() => {
    const attrs = player.attributes;
    return Math.round(
      (attrs.speed +
        attrs.passing +
        attrs.tackling +
        attrs.shooting +
        attrs.dribbling +
        attrs.positioning) / 6,
    );
  }, [player.attributes]);

  // Render compact version
  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, x: 4 }}
        className={`flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border ${rarityConfig.border}  cursor-pointer`}
        onClick={onFlip}
      >
        <div className="flex items-center gap-3">
          {rank && rank <= 3 && (
            <div className="text-2xl">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </div>
          )}
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rarityConfig.gradient} flex items-center justify-center`}>
            <span className="text-lg font-bold text-white">{player.jerseyNumber}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-white">{player.name}</p>
              <rarityConfig.icon size={14} style={{ color: rarityConfig.color }} />
            </div>
            <p className="text-xs text-gray-400">Level {profile.currentLevel} • {rarityConfig.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">{profile.totalXP.toLocaleString()}</p>
          <p className="text-xs text-gray-400">XP</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
    >
      <motion.div
        animate={{
          rotateX: is3D ? rotateX : 0,
          rotateY: is3D ? (isFlipped ? 180 + rotateY : rotateY) : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
        className="w-80 h-[480px]"
      >
        {/* Front of Card */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          <div
            className={`relative w-full h-full rounded-2xl overflow-hidden ${rarityConfig.border} border-2 bg-gray-900`}
            style={{
              boxShadow: `0 0 40px ${rarityConfig.glow}, 0 10px 50px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Holographic Effect for Legendary */}
            {rarity === 'legendary' && (
              <motion.div
                animate={{
                  background: [
                    'linear-gradient(45deg, rgba(251,191,36,0.2) 0%, transparent 50%, transparent 100%)',
                    'linear-gradient(135deg, transparent 0%, rgba(251,191,36,0.2) 50%, transparent 100%)',
                    'linear-gradient(225deg, transparent 0%, transparent 50%, rgba(251,191,36,0.2) 100%)',
                    'linear-gradient(315deg, rgba(251,191,36,0.2) 0%, transparent 50%, transparent 100%)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 pointer-events-none"
              />
            )}

            {/* Shimmer Effect */}
            {rarityConfig.shimmer && isHovered && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                style={{ transform: 'skewX(-20deg)' }}
              />
            )}

            {/* Particles for high rarity */}
            {rarityConfig.particles > 0 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: rarityConfig.particles }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: ['-10%', '110%'],
                      x: [
                        `${Math.random() * 100}%`,
                        `${Math.random() * 100}%`,
                      ],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                    className="absolute w-1 h-1 rounded-full"
                    style={{ backgroundColor: rarityConfig.color }}
                  />
                ))}
              </div>
            )}

            {/* Header Gradient */}
            <div className={`h-32 bg-gradient-to-br ${rarityConfig.gradient} relative`}>
              {/* Rarity Badge */}
              <div className="absolute top-3 right-3 px-3 py-1 bg-slate-800  rounded-full flex items-center gap-1">
                <rarityConfig.icon size={14} className="text-white" />
                <span className="text-xs font-bold text-white">{rarityConfig.label.toUpperCase()}</span>
              </div>

              {/* Rank Badge */}
              {rank && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-slate-800  rounded-full">
                  <span className="text-sm font-bold text-white">
                    {rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : `#${rank}`}
                  </span>
                </div>
              )}

              {/* Player Number */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-20 h-20 rounded-full bg-gray-900 border-4 flex items-center justify-center"
                  style={{ borderColor: rarityConfig.color }}
                >
                  <span className="text-3xl font-bold text-white">{player.jerseyNumber}</span>
                </motion.div>
              </div>
            </div>

            {/* Player Info */}
            <div className="pt-14 px-6 pb-6">
              <h3 className="text-2xl font-bold text-white text-center mb-1">{player.name}</h3>
              <p className="text-sm text-gray-400 text-center mb-4">
                {(player as any).positionRole || 'Player'} • {player.nationality}
              </p>

              {/* Level Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">Level {profile.currentLevel}</span>
                  </div>
                  {statChanges && statChanges.level > 0 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="flex items-center gap-1 text-green-400 text-xs font-bold"
                    >
                      <ArrowUp size={12} />
                      +{statChanges.level}
                    </motion.div>
                  )}
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(profile.currentXP / profile.xpToNextLevel) * 100}%` }}
                    className={`h-full bg-gradient-to-r ${rarityConfig.gradient}`}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {profile.currentXP.toLocaleString()} / {profile.xpToNextLevel.toLocaleString()} XP
                </p>
              </div>

              {/* Stats Grid */}
              {showStats && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatCard
                    icon={Trophy}
                    label="Total XP"
                    value={profile.totalXP.toLocaleString()}
                    change={statChanges?.totalXP}
                    color="yellow"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Weekly XP"
                    value={profile.weeklyXP.toLocaleString()}
                    change={statChanges?.weeklyXP}
                    color="green"
                  />
                  <StatCard
                    icon={Target}
                    label="Challenges"
                    value={profile.challengesCompleted.toString()}
                    color="blue"
                  />
                  <StatCard
                    icon={Activity}
                    label="Overall"
                    value={overallRating.toString()}
                    color="purple"
                  />
                </div>
              )}

              {/* Flip Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFlip}
                className="w-full py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                View Details
              </motion.button>
            </div>
          </div>
        </div>

        {/* Back of Card - Detailed Stats */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: 'rotateY(180deg)',
          }}
        >
          <div
            className={`relative w-full h-full rounded-2xl overflow-hidden ${rarityConfig.border} border-2 bg-gray-900 p-6`}
            style={{
              boxShadow: `0 0 40px ${rarityConfig.glow}, 0 10px 50px rgba(0,0,0,0.5)`,
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <rarityConfig.icon size={20} style={{ color: rarityConfig.color }} />
              Player Attributes
            </h3>

            {/* Attribute Bars */}
            <div className="space-y-3 mb-4">
              <AttributeBar label="Speed" value={player.attributes.speed} color="cyan" />
              <AttributeBar label="Passing" value={player.attributes.passing} color="green" />
              <AttributeBar label="Shooting" value={player.attributes.shooting} color="red" />
              <AttributeBar label="Dribbling" value={player.attributes.dribbling} color="yellow" />
              <AttributeBar label="Tackling" value={player.attributes.tackling} color="purple" />
              <AttributeBar label="Positioning" value={player.attributes.positioning} color="blue" />
            </div>

            {/* Back Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFlip}
              className="w-full py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg text-white font-medium text-sm"
            >
              Back to Card
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  change?: number;
  color: 'yellow' | 'green' | 'blue' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, change, color }) => {
  const colorClasses = {
    yellow: 'text-yellow-400 bg-yellow-400/10',
    green: 'text-green-400 bg-green-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{value}</span>
        {change !== undefined && change !== 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-0.5 text-xs font-bold ${
              change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {change > 0 ? <ArrowUp size={10} /> : change < 0 ? <ArrowDown size={10} /> : <Minus size={10} />}
            {Math.abs(change)}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Attribute Bar Component
interface AttributeBarProps {
  label: string;
  value: number;
  color: 'cyan' | 'green' | 'red' | 'yellow' | 'purple' | 'blue';
}

const AttributeBar: React.FC<AttributeBarProps> = ({ label, value, color }) => {
  const colorGradients = {
    cyan: 'from-cyan-500 to-cyan-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`h-full bg-gradient-to-r ${colorGradients[color]}`}
        />
      </div>
    </div>
  );
};

export default EnhancedPlayerRankingCard;
