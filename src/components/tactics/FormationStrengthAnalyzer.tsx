import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Swords,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Target,
  Zap,
} from 'lucide-react';
import type { Formation, Player } from '../../types';

interface FormationAnalysis {
  overallStrength: number;
  defensiveStrength: number;
  offensiveStrength: number;
  balance: number;
  chemistry: number;
  coverage: number;
  errors: Array<{ severity: 'error' | 'warning' | 'info'; message: string }>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface FormationStrengthAnalyzerProps {
  formation: Formation;
  players: Player[];
  isVisible: boolean;
  position?: { x: number; y: number };
}

const FormationStrengthAnalyzer: React.FC<FormationStrengthAnalyzerProps> = ({
  formation,
  players,
  isVisible,
  position = { x: 20, y: 20 },
}) => {
  const analysis = useMemo<FormationAnalysis>(() => {
    const errors: FormationAnalysis['errors'] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // Count positions
    const positions = formation.slots.reduce((acc, slot) => {
      const role = slot.role || slot.roleId || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const gkCount = (positions.GK || 0) + (positions.goalkeeper || 0);
    const dfCount = (positions.DF || 0) + Object.keys(positions).filter(k => k.includes('back')).length;
    const mfCount = (positions.MF || 0) + Object.keys(positions).filter(k => k.includes('midfield')).length;
    const fwCount = (positions.FW || 0) + Object.keys(positions).filter(k => k.includes('forward') || k.includes('striker') || k.includes('winger')).length;

    // Validation
    if (gkCount === 0) {
      errors.push({ severity: 'error', message: 'No goalkeeper assigned' });
    } else if (gkCount > 1) {
      errors.push({ severity: 'error', message: 'Multiple goalkeepers assigned' });
    }

    if (formation.slots.length < 11) {
      errors.push({ severity: 'error', message: `Only ${formation.slots.length} players assigned (need 11)` });
    } else if (formation.slots.length > 11) {
      errors.push({ severity: 'warning', message: `${formation.slots.length} players assigned (should be 11)` });
    }

    // Tactical Analysis
    if (dfCount < 3) {
      weaknesses.push('Very light defensive line - vulnerable to attacks');
      suggestions.push('Consider adding more defenders for stability');
    } else if (dfCount >= 5) {
      strengths.push('Strong defensive foundation');
    }

    if (mfCount < 2) {
      weaknesses.push('Weak midfield control');
      suggestions.push('Add more midfielders to control possession');
    } else if (mfCount >= 4) {
      strengths.push('Dominant midfield presence');
    }

    if (fwCount === 0) {
      errors.push({ severity: 'warning', message: 'No attackers assigned' });
    } else if (fwCount >= 3) {
      strengths.push('Aggressive attacking setup');
    }

    // Calculate metrics
    const assignedPlayers = players.filter(p =>
      formation.slots.some(s => s.playerId === p.id),
    );

    const avgAttributes = assignedPlayers.reduce((acc, player) => {
      return {
        defensive: acc.defensive + (player.attributes.tackling + player.attributes.positioning) / 2,
        offensive: acc.offensive + (player.attributes.shooting + player.attributes.dribbling) / 2,
        physical: acc.physical + (player.attributes.speed + player.attributes.stamina) / 2,
      };
    }, { defensive: 0, offensive: 0, physical: 0 });

    const playerCount = assignedPlayers.length || 1;
    const defensiveStrength = Math.min(100, (avgAttributes.defensive / playerCount) * 1.2);
    const offensiveStrength = Math.min(100, (avgAttributes.offensive / playerCount) * 1.2);
    const balance = 100 - Math.abs(defensiveStrength - offensiveStrength);

    // Coverage analysis
    const coverageScore = analyzeCoverage(formation);

    // Chemistry (simplified)
    const chemistry = Math.min(100, assignedPlayers.length >= 11 ? 85 : assignedPlayers.length * 7);

    // Overall strength
    const overallStrength = Math.round(
      (defensiveStrength * 0.25 +
       offensiveStrength * 0.25 +
       balance * 0.2 +
       chemistry * 0.15 +
       coverageScore * 0.15) *
      (errors.filter(e => e.severity === 'error').length === 0 ? 1 : 0.5),
    );

    return {
      overallStrength,
      defensiveStrength: Math.round(defensiveStrength),
      offensiveStrength: Math.round(offensiveStrength),
      balance: Math.round(balance),
      chemistry: Math.round(chemistry),
      coverage: Math.round(coverageScore),
      errors,
      strengths,
      weaknesses,
      suggestions,
    };
  }, [formation, players]);

  const analyzeCoverage = (formation: Formation): number => {
    // Analyze field coverage - check if positions are well distributed
    const zones = {
      defensive: 0,
      midfield: 0,
      attacking: 0,
    };

    formation.slots.forEach(slot => {
      const pos = slot.position || slot.defaultPosition;
      if (pos.y < 33) {
        zones.defensive++;
      } else if (pos.y < 66) {
        zones.midfield++;
      } else {
        zones.attacking++;
      }
    });

    // Ideal distribution would be balanced
    const idealCoverage = formation.slots.length / 3;
    const variance = Math.abs(zones.defensive - idealCoverage) +
                    Math.abs(zones.midfield - idealCoverage) +
                    Math.abs(zones.attacking - idealCoverage);

    return Math.max(0, 100 - (variance * 5));
  };

  const getStrengthColor = (value: number) => {
    if (value >= 80) {
      return 'text-green-400';
    }
    if (value >= 60) {
      return 'text-blue-400';
    }
    if (value >= 40) {
      return 'text-yellow-400';
    }
    return 'text-red-400';
  };

  const getStrengthBg = (value: number) => {
    if (value >= 80) {
      return 'from-green-500 to-emerald-500';
    }
    if (value >= 60) {
      return 'from-blue-500 to-cyan-500';
    }
    if (value >= 40) {
      return 'from-yellow-500 to-orange-500';
    }
    return 'from-red-500 to-pink-500';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
        }}
        className="w-96 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden z-50"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${getStrengthBg(analysis.overallStrength)} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Formation Analysis</h3>
                <p className="text-white/80 text-sm">{formation.name || 'Custom Formation'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getStrengthColor(analysis.overallStrength)}`}>
                {analysis.overallStrength}
              </div>
              <div className="text-white/80 text-xs">Overall</div>
            </div>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="p-4 space-y-3">
          {/* Primary Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={Shield}
              label="Defense"
              value={analysis.defensiveStrength}
              color="green"
            />
            <MetricCard
              icon={Swords}
              label="Attack"
              value={analysis.offensiveStrength}
              color="red"
            />
            <MetricCard
              icon={Activity}
              label="Balance"
              value={analysis.balance}
              color="blue"
            />
            <MetricCard
              icon={Zap}
              label="Chemistry"
              value={analysis.chemistry}
              color="purple"
            />
          </div>

          {/* Coverage */}
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-cyan-400" />
                <span className="text-sm font-medium text-gray-300">Field Coverage</span>
              </div>
              <span className={`text-sm font-bold ${getStrengthColor(analysis.coverage)}`}>
                {analysis.coverage}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.coverage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${getStrengthBg(analysis.coverage)}`}
              />
            </div>
          </div>

          {/* Errors & Warnings */}
          {analysis.errors.length > 0 && (
            <div className="space-y-2">
              {analysis.errors.map((error, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    error.severity === 'error'
                      ? 'bg-red-500/10 border border-red-500/30'
                      : error.severity === 'warning'
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : 'bg-blue-500/10 border border-blue-500/30'
                  }`}
                >
                  {error.severity === 'error' && <XCircle size={16} className="text-red-400 mt-0.5" />}
                  {error.severity === 'warning' && <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />}
                  {error.severity === 'info' && <Info size={16} className="text-blue-400 mt-0.5" />}
                  <span className="text-sm text-gray-300 flex-1">{error.message}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 size={14} />
                <span className="text-xs font-semibold">Strengths</span>
              </div>
              {analysis.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-300 pl-6">
                  <span className="text-green-400">•</span>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={14} />
                <span className="text-xs font-semibold">Weaknesses</span>
              </div>
              {analysis.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-300 pl-6">
                  <span className="text-red-400">•</span>
                  <span>{weakness}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <TrendingUp size={14} />
                <span className="text-xs font-semibold">Suggestions</span>
              </div>
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-300 pl-6">
                  <span className="text-blue-400">→</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

interface MetricCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: 'green' | 'red' | 'blue' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-gray-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
          />
        </div>
      </div>
    </div>
  );
};

export default FormationStrengthAnalyzer;
