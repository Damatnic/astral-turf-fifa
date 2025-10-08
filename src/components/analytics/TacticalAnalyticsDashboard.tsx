/**
 * Tactical Analytics Dashboard
 * 
 * Comprehensive analytics for formation and player performance
 * with charts, metrics, and insights
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Activity, Target, Shield,
  Zap, Users, Award, BarChart3, PieChart
} from 'lucide-react';
import type { Player } from '../../types';
import type { ProfessionalFormation } from '../../data/professionalFormations';
import { calculateTeamChemistry } from '../../utils/playerChemistry';
import { analyzeFormation } from '../../utils/formationAnalyzer';

interface TacticalAnalyticsDashboardProps {
  formation: ProfessionalFormation;
  players: Player[];
}

export const TacticalAnalyticsDashboard: React.FC<TacticalAnalyticsDashboardProps> = ({
  formation,
  players
}) => {
  // Calculate analytics
  const formationAnalysis = useMemo(() => 
    analyzeFormation(formation, players), 
    [formation, players]
  );

  const chemistryAnalysis = useMemo(() => 
    calculateTeamChemistry(players), 
    [players]
  );

  // Calculate team stats
  const teamStats = useMemo(() => {
    const avgOverall = players.reduce((sum, p) => sum + p.overall, 0) / players.length || 0;
    const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length || 0;
    const totalPlayers = players.length;

    // Position distribution
    const positionCounts = players.reduce((acc, p) => {
      const role = p.roleId || 'Unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      avgOverall: avgOverall.toFixed(1),
      avgAge: avgAge.toFixed(1),
      totalPlayers,
      positionCounts,
    };
  }, [players]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="Formation Score"
          value={`${formationAnalysis.overallScore.toFixed(0)}%`}
          trend={formationAnalysis.overallScore >= 70 ? 'up' : 'down'}
          color="from-blue-600 to-blue-800"
        />
        <AnalyticsCard
          icon={<Users className="w-6 h-6" />}
          label="Team Chemistry"
          value={`${chemistryAnalysis.overallChemistry.toFixed(0)}%`}
          trend={chemistryAnalysis.overallChemistry >= 70 ? 'up' : 'down'}
          color="from-purple-600 to-purple-800"
        />
        <AnalyticsCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Avg Overall"
          value={teamStats.avgOverall}
          subtitle={`${teamStats.totalPlayers} players`}
          color="from-green-600 to-green-800"
        />
        <AnalyticsCard
          icon={<Activity className="w-6 h-6" />}
          label="Team Cohesion"
          value={`${chemistryAnalysis.teamCohesion.toFixed(0)}%`}
          trend={chemistryAnalysis.teamCohesion >= 70 ? 'up' : 'down'}
          color="from-orange-600 to-orange-800"
        />
      </div>

      {/* Tactical Balance Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-blue-400" />
          <span>Tactical Balance</span>
        </h3>
        <div className="space-y-4">
          <TacticalBalanceBar
            label="Defensive Strength"
            value={formationAnalysis.tacticalBalance.defensive}
            icon={<Shield className="w-4 h-4" />}
          />
          <TacticalBalanceBar
            label="Attacking Threat"
            value={formationAnalysis.tacticalBalance.attacking}
            icon={<Zap className="w-4 h-4" />}
          />
          <TacticalBalanceBar
            label="Possession Control"
            value={formationAnalysis.tacticalBalance.possession}
            icon={<Activity className="w-4 h-4" />}
          />
          <TacticalBalanceBar
            label="Width Coverage"
            value={formationAnalysis.tacticalBalance.width}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <TacticalBalanceBar
            label="Team Compactness"
            value={formationAnalysis.tacticalBalance.compactness}
            icon={<Users className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5 text-green-400" />
            <span>Key Strengths</span>
          </h3>
          <div className="space-y-3">
            {formationAnalysis.strengths.map((strength, idx) => (
              <div key={idx} className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-green-400 text-sm">{strength.aspect}</span>
                  <span className="text-green-400 font-bold">{strength.score.toFixed(0)}%</span>
                </div>
                <p className="text-xs text-gray-400">{strength.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-red-400" />
            <span>Areas to Address</span>
          </h3>
          <div className="space-y-3">
            {formationAnalysis.weaknesses.map((weakness, idx) => (
              <div key={idx} className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-red-400 text-sm">{weakness.aspect}</span>
                  <span className="text-red-400 font-bold">{weakness.severity.toFixed(0)}%</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{weakness.description}</p>
                <p className="text-xs text-blue-300">💡 {weakness.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Player Chemistry Matrix */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-purple-400" />
          <span>Player Chemistry</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {chemistryAnalysis.playerChemistry.slice(0, 6).map((pc) => {
            const player = players.find(p => p.id === pc.playerId);
            if (!player) return null;

            return (
              <div key={pc.playerId} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{player.name}</span>
                  <span className={`text-sm font-bold ${
                    pc.individualChemistry >= 75 ? 'text-green-400' :
                    pc.individualChemistry >= 50 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {pc.individualChemistry.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full ${
                      pc.individualChemistry >= 75 ? 'bg-green-500' :
                      pc.individualChemistry >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${pc.individualChemistry}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pc.connections} connections</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {formationAnalysis.recommendations.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <span>AI Recommendations</span>
          </h3>
          <div className="space-y-3">
            {formationAnalysis.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-4 border ${
                  rec.priority === 'critical' ? 'bg-red-900/20 border-red-700' :
                  rec.priority === 'high' ? 'bg-orange-900/20 border-orange-700' :
                  'bg-blue-900/20 border-blue-700'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 ${
                    rec.priority === 'critical' ? 'text-red-400' :
                    rec.priority === 'high' ? 'text-orange-400' :
                    'text-blue-400'
                  }`}>
                    {rec.priority === 'critical' ? '🚨' :
                     rec.priority === 'high' ? '⚠️' : '💡'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm mb-1">{rec.title}</h4>
                    <p className="text-xs text-gray-400">{rec.description}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded mt-2 inline-block ${
                      rec.priority === 'critical' ? 'bg-red-600' :
                      rec.priority === 'high' ? 'bg-orange-600' :
                      'bg-blue-600'
                    } text-white`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics Card Component
const AnalyticsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down';
  color: string;
}> = ({ icon, label, value, subtitle, trend, color }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-lg`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="text-white">{icon}</div>
      {trend && (
        <div className={trend === 'up' ? 'text-green-300' : 'text-red-300'}>
          {trend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
      )}
    </div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-white/80 text-sm font-medium">{label}</div>
    {subtitle && <div className="text-white/60 text-xs mt-1">{subtitle}</div>}
  </motion.div>
);

// Tactical Balance Bar Component
const TacticalBalanceBar: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => {
  const getColor = (val: number) => {
    if (val >= 75) return 'from-green-500 to-emerald-600';
    if (val >= 50) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">{icon}</span>
          <span className="text-gray-300 font-medium">{label}</span>
        </div>
        <span className="text-white font-bold text-lg">{value.toFixed(0)}</span>
      </div>
      <div className="relative w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${getColor(value)} rounded-full`}
        />
        {/* Threshold markers */}
        <div className="absolute inset-0 flex justify-between px-1">
          <div className="w-px h-full bg-white/20" style={{ marginLeft: '25%' }} />
          <div className="w-px h-full bg-white/30" style={{ marginLeft: '25%' }} />
          <div className="w-px h-full bg-white/30" style={{ marginLeft: '25%' }} />
        </div>
      </div>
    </div>
  );
};

export default TacticalAnalyticsDashboard;

