// Stat Progression Visualization - Shows player growth over time

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Zap,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react';
import type { PlayerRankingProfile } from '../../types/challenges';
import type { PlayerAttributes } from '../../types/player';

interface ProgressionDataPoint {
  date: string;
  level: number;
  xp: number;
  challenges: number;
  badges: number;
  attributes?: Partial<PlayerAttributes>;
}

interface StatProgressionViewProps {
  currentProfile: PlayerRankingProfile;
  historicalData?: ProgressionDataPoint[];
  timeRange?: 'week' | 'month' | 'year' | 'all';
}

const StatProgressionView: React.FC<StatProgressionViewProps> = ({
  currentProfile,
  historicalData = [],
  timeRange = 'month',
}) => {
  // Generate sample historical data if not provided
  const progressionData = useMemo(() => {
    if (historicalData.length > 0) {
      return historicalData;
    }

    // Generate sample progression based on current stats
    const dataPoints: ProgressionDataPoint[] = [];
    const currentDate = new Date();
    const numPoints = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;

    for (let i = numPoints; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);

      const progress = (numPoints - i) / numPoints;
      const level = Math.floor(currentProfile.currentLevel * progress) || 1;
      const xp = Math.floor(currentProfile.totalXP * progress);
      const challenges = Math.floor(
        currentProfile.totalStats.totalChallengesCompleted * progress,
      );
      const badges = Math.floor(currentProfile.badges.length * progress);

      dataPoints.push({
        date: date.toISOString().split('T')[0],
        level,
        xp,
        challenges,
        badges,
      });
    }

    return dataPoints;
  }, [historicalData, currentProfile, timeRange]);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    if (progressionData.length < 2) {
      return null;
    }

    const first = progressionData[0];
    const last = progressionData[progressionData.length - 1];

    return {
      levelGain: last.level - first.level,
      xpGain: last.xp - first.xp,
      challengesGain: last.challenges - first.challenges,
      badgesGain: last.badges - first.badges,
      avgDailyXP: Math.round((last.xp - first.xp) / progressionData.length),
      avgDailyChallenges: Math.round(
        (last.challenges - first.challenges) / progressionData.length,
      ),
    };
  }, [progressionData]);

  // Find peak performance day
  const peakDay = useMemo(() => {
    if (progressionData.length < 2) {
      return null;
    }

    let maxGain = 0;
    let peakIndex = 0;

    for (let i = 1; i < progressionData.length; i++) {
      const gain = progressionData[i].xp - progressionData[i - 1].xp;
      if (gain > maxGain) {
        maxGain = gain;
        peakIndex = i;
      }
    }

    return {
      date: progressionData[peakIndex].date,
      xpGain: maxGain,
    };
  }, [progressionData]);

  // Calculate max values for scaling
  const maxValues = useMemo(() => {
    return {
      xp: Math.max(...progressionData.map((d) => d.xp)),
      challenges: Math.max(...progressionData.map((d) => d.challenges)),
      badges: Math.max(...progressionData.map((d) => d.badges)),
    };
  }, [progressionData]);

  return (
    <div className="space-y-6">
      {/* Growth Summary Cards */}
      {growthMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GrowthCard
            icon={TrendingUp}
            label="Level Gain"
            value={`+${growthMetrics.levelGain}`}
            subValue={`Avg ${growthMetrics.avgDailyXP} XP/day`}
            color="blue"
            trend={growthMetrics.levelGain > 0 ? 'up' : 'stable'}
          />
          <GrowthCard
            icon={Zap}
            label="XP Gained"
            value={growthMetrics.xpGain.toLocaleString()}
            subValue={`${growthMetrics.avgDailyXP} XP/day`}
            color="yellow"
            trend={growthMetrics.xpGain > 0 ? 'up' : 'stable'}
          />
          <GrowthCard
            icon={Target}
            label="Challenges"
            value={`+${growthMetrics.challengesGain}`}
            subValue={`${growthMetrics.avgDailyChallenges}/day`}
            color="green"
            trend={growthMetrics.challengesGain > 0 ? 'up' : 'stable'}
          />
          <GrowthCard
            icon={Award}
            label="Badges"
            value={`+${growthMetrics.badgesGain}`}
            subValue={peakDay ? `Peak: ${peakDay.xpGain} XP` : 'Keep going!'}
            color="purple"
            trend={growthMetrics.badgesGain > 0 ? 'up' : 'stable'}
          />
        </div>
      )}

      {/* XP Progression Chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-blue-400" size={20} />
            XP Progression
          </h3>
          <div className="text-sm text-gray-400">
            {progressionData[0]?.date} → {progressionData[progressionData.length - 1]?.date}
          </div>
        </div>

        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 pr-2">
            <span>{maxValues.xp.toLocaleString()}</span>
            <span>{Math.round(maxValues.xp * 0.75).toLocaleString()}</span>
            <span>{Math.round(maxValues.xp * 0.5).toLocaleString()}</span>
            <span>{Math.round(maxValues.xp * 0.25).toLocaleString()}</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="ml-12 h-full flex items-end gap-1">
            {progressionData.map((point, index) => {
              const height = maxValues.xp > 0 ? (point.xp / maxValues.xp) * 100 : 0;
              const isFirst = index === 0;
              const isLast = index === progressionData.length - 1;
              const isPeak = peakDay && point.date === peakDay.date;

              return (
                <motion.div
                  key={point.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: index * 0.02 }}
                  className="flex-1 group relative cursor-pointer"
                >
                  <div
                    className={`w-full h-full rounded-t-sm transition-all ${
                      isPeak
                        ? 'bg-gradient-to-t from-yellow-600 to-yellow-400'
                        : 'bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-300'
                    }`}
                  />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg whitespace-nowrap">
                      <p className="text-xs text-gray-400 mb-1">{point.date}</p>
                      <p className="text-sm font-bold text-white">
                        {point.xp.toLocaleString()} XP
                      </p>
                      <p className="text-xs text-gray-400">Level {point.level}</p>
                    </div>
                  </div>

                  {/* Show label for first, last, and peak */}
                  {(isFirst || isLast || isPeak) && (
                    <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                      {point.date.split('-').slice(1).join('/')}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Challenges & Badges Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Challenges Progress */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Target className="text-green-400" size={20} />
            Challenges Completed
          </h3>
          <div className="space-y-3">
            {progressionData.slice(-5).map((point, index) => {
              const prev = index > 0 ? progressionData[progressionData.length - 5 + index - 1] : null;
              const gain = prev ? point.challenges - prev.challenges : 0;

              return (
                <div key={point.date} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{point.date}</p>
                    <p className="text-lg font-bold text-white">{point.challenges}</p>
                  </div>
                  {gain > 0 && (
                    <div className="flex items-center gap-1 text-green-400 text-sm font-bold">
                      <TrendingUp size={14} />
                      +{gain}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges Progress */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Award className="text-purple-400" size={20} />
            Badges Earned
          </h3>
          <div className="space-y-3">
            {progressionData.slice(-5).map((point, index) => {
              const prev = index > 0 ? progressionData[progressionData.length - 5 + index - 1] : null;
              const gain = prev ? point.badges - prev.badges : 0;

              return (
                <div key={point.date} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{point.date}</p>
                    <p className="text-lg font-bold text-white">{point.badges}</p>
                  </div>
                  {gain > 0 && (
                    <div className="flex items-center gap-1 text-purple-400 text-sm font-bold">
                      <Award size={14} />
                      +{gain}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Peak Performance Highlight */}
      {peakDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-800/50 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-yellow-400" size={24} />
            <h3 className="text-lg font-bold text-white">Peak Performance Day</h3>
          </div>
          <p className="text-gray-300">
            <span className="font-bold text-yellow-400">{peakDay.date}</span> was your best day
            with <span className="font-bold text-white">{peakDay.xpGain.toLocaleString()} XP</span>{' '}
            gained! Keep up the great work! 🔥
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Growth Card Component
interface GrowthCardProps {
  icon: React.ComponentType<{size?: number | string; className?: string}>;
  label: string;
  value: string;
  subValue: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
  trend: 'up' | 'down' | 'stable';
}

const GrowthCard: React.FC<GrowthCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  trend,
}) => {
  const colorClasses = {
    blue: 'from-blue-600/20 to-blue-800/20 border-blue-700/50',
    yellow: 'from-yellow-600/20 to-yellow-800/20 border-yellow-700/50',
    green: 'from-green-600/20 to-green-800/20 border-green-700/50',
    purple: 'from-purple-600/20 to-purple-800/20 border-purple-700/50',
  };

  const iconColors = {
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={iconColors[color]} size={20} />
        {trend === 'up' && <TrendingUp className="text-green-400" size={16} />}
        {trend === 'down' && <TrendingDown className="text-red-400" size={16} />}
        {trend === 'stable' && <Calendar className="text-gray-400" size={16} />}
      </div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subValue}</p>
    </motion.div>
  );
};

export default StatProgressionView;
