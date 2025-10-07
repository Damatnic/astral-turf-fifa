import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ArrowUpDown,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Heart,
  Shield,
  Play,
  Pause,
  RotateCcw,
  Settings,
  ChevronRight,
  X,
  CheckCircle2,
  Timer,
  Battery,
  ThermometerSun,
} from 'lucide-react';
import { type Player, type Formation, type Team } from '../../types';

interface SubstitutionCandidate {
  player: Player;
  reason: 'fatigue' | 'injury' | 'performance' | 'tactical';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

interface TacticalAdjustment {
  id: string;
  type: 'formation' | 'mentality' | 'pressing' | 'width';
  description: string;
  impact: string;
  confidence: number;
}

interface DugoutManagementProps {
  players: Player[];
  formation: Formation | undefined;
  currentMinute: number;
  substitutionsUsed: number;
  maxSubstitutions: number;
  onSubstitution: (playerOut: string, playerIn: string) => void;
  onTacticalChange: (adjustment: TacticalAdjustment) => void;
  onPlayerInstruction: (playerId: string, instruction: string) => void;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'substitutions' | 'instructions' | 'analytics' | 'adjustments';

const DugoutManagement: React.FC<DugoutManagementProps> = ({
  players,
  formation,
  currentMinute = 45,
  substitutionsUsed = 1,
  maxSubstitutions = 5,
  onSubstitution,
  onTacticalChange,
  onPlayerInstruction,
  className,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('substitutions');
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<string | null>(null);
  const [selectedPlayerIn, setSelectedPlayerIn] = useState<string | null>(null);
  const [substitutionFilter, setSubstitutionFilter] = useState<'all' | 'urgent' | 'suggested'>(
    'all',
  );

  // Get field players and bench players
  const { fieldPlayers, benchPlayers } = useMemo(() => {
    const field = players.filter(p => formation?.slots?.some(slot => slot.playerId === p.id));
    const bench = players.filter(
      p =>
        !formation?.slots?.some(slot => slot.playerId === p.id) &&
        p.availability.status === 'Available',
    );
    return { fieldPlayers: field, benchPlayers: bench };
  }, [players, formation]);

  // Generate substitution candidates with AI suggestions
  const substitutionCandidates = useMemo((): SubstitutionCandidate[] => {
    return fieldPlayers
      .map(player => {
        const fatigue = player.stamina || 100;
        const injuryRisk = player.injuryRisk || 0;
        const form = player.form;

        let reason: SubstitutionCandidate['reason'] = 'performance';
        let urgency: SubstitutionCandidate['urgency'] = 'low';
        let recommendation = '';

        // Fatigue analysis
        if (fatigue < 30) {
          reason = 'fatigue';
          urgency = 'critical';
          recommendation = `${player.name} is exhausted (${fatigue}% stamina). Immediate substitution required.`;
        } else if (fatigue < 50) {
          reason = 'fatigue';
          urgency = 'high';
          recommendation = `${player.name} is tiring (${fatigue}% stamina). Consider substitution soon.`;
        }

        // Injury risk analysis
        else if (injuryRisk > 80) {
          reason = 'injury';
          urgency = 'critical';
          recommendation = `${player.name} has very high injury risk (${injuryRisk}%). Substitute immediately.`;
        } else if (injuryRisk > 60) {
          reason = 'injury';
          urgency = 'high';
          recommendation = `${player.name} at moderate injury risk (${injuryRisk}%). Monitor closely.`;
        }

        // Performance analysis
        else if (form === 'Very Poor' || form === 'Poor') {
          reason = 'performance';
          urgency = currentMinute > 60 ? 'medium' : 'low';
          recommendation = `${player.name} is in poor form. Consider fresh legs for better impact.`;
        }

        // Late game tactical considerations
        else if (currentMinute > 70) {
          reason = 'tactical';
          urgency = 'low';
          recommendation = `${player.name} could be rotated for tactical variation or fresh energy.`;
        } else {
          recommendation = `${player.name} is performing well. No immediate substitution needed.`;
        }

        return {
          player,
          reason,
          urgency,
          recommendation,
        };
      })
      .sort((a, b) => {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });
  }, [fieldPlayers, currentMinute]);

  // Tactical adjustments suggestions
  const tacticalAdjustments = useMemo(
    (): TacticalAdjustment[] => [
      {
        id: 'press_high',
        type: 'pressing',
        description: 'Increase Pressing Intensity',
        impact: 'More aggressive ball recovery, higher energy consumption',
        confidence: 85,
      },
      {
        id: 'defensive_mentality',
        type: 'mentality',
        description: 'Switch to Defensive Mentality',
        impact: 'Better defensive stability, reduced attacking threat',
        confidence: 78,
      },
      {
        id: 'wider_play',
        type: 'width',
        description: 'Play Wider',
        impact: 'Stretch opposition defense, create crossing opportunities',
        confidence: 72,
      },
      {
        id: 'formation_352',
        type: 'formation',
        description: 'Change to 3-5-2',
        impact: 'Additional midfielder, more control in center',
        confidence: 90,
      },
    ],
    [],
  );

  // Filter substitution candidates
  const filteredCandidates = useMemo(() => {
    switch (substitutionFilter) {
      case 'urgent':
        return substitutionCandidates.filter(c => c.urgency === 'critical' || c.urgency === 'high');
      case 'suggested':
        return substitutionCandidates.filter(c => c.urgency !== 'low');
      default:
        return substitutionCandidates;
    }
  }, [substitutionCandidates, substitutionFilter]);

  const handleSubstitution = useCallback(() => {
    if (selectedPlayerOut && selectedPlayerIn) {
      onSubstitution(selectedPlayerOut, selectedPlayerIn);
      setSelectedPlayerOut(null);
      setSelectedPlayerIn(null);
    }
  }, [selectedPlayerOut, selectedPlayerIn, onSubstitution]);

  const getUrgencyColor = (urgency: SubstitutionCandidate['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'high':
        return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
      default:
        return 'text-green-400 bg-green-900/30 border-green-500/50';
    }
  };

  const getReasonIcon = (reason: SubstitutionCandidate['reason']) => {
    switch (reason) {
      case 'fatigue':
        return Battery;
      case 'injury':
        return AlertTriangle;
      case 'performance':
        return TrendingUp;
      case 'tactical':
        return Target;
      default:
        return Activity;
    }
  };

  const tabs = [
    {
      id: 'substitutions',
      name: 'Substitutions',
      icon: ArrowUpDown,
      count: filteredCandidates.length,
    },
    { id: 'instructions', name: 'Instructions', icon: Target, count: fieldPlayers.length },
    { id: 'analytics', name: 'Analytics', icon: Activity, count: 0 },
    { id: 'adjustments', name: 'Adjustments', icon: Settings, count: tacticalAdjustments.length },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`
          bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl
          w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Dugout Management</h2>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentMinute}'
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUpDown className="w-4 h-4" />
                  {substitutionsUsed}/{maxSubstitutions} subs used
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/50">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative
                  ${
                    activeTab === tab.id
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                {tab.name}
                {tab.count > 0 && (
                  <span
                    className={`
                    px-1.5 py-0.5 rounded text-xs
                    ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700/50 text-slate-300'}
                  `}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Substitutions Tab */}
            {activeTab === 'substitutions' && (
              <motion.div
                key="substitutions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex"
              >
                {/* Left Panel - Players to substitute */}
                <div className="w-1/2 border-r border-slate-700/50 p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">Players on Field</h3>
                      <div className="flex gap-1">
                        {['all', 'urgent', 'suggested'].map(filter => (
                          <button
                            key={filter}
                            onClick={() => setSubstitutionFilter(filter as any)}
                            className={`
                              px-3 py-1 text-xs rounded-lg transition-all
                              ${
                                substitutionFilter === filter
                                  ? 'bg-blue-600/80 text-white'
                                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
                              }
                            `}
                          >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 h-[calc(100%-4rem)] overflow-y-auto">
                    {filteredCandidates.map(candidate => {
                      const IconComponent = getReasonIcon(candidate.reason);
                      const isSelected = selectedPlayerOut === candidate.player.id;

                      return (
                        <motion.div
                          key={candidate.player.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setSelectedPlayerOut(isSelected ? null : candidate.player.id)
                          }
                          className={`
                            p-4 rounded-xl border cursor-pointer transition-all
                            ${
                              isSelected
                                ? 'border-blue-500/70 bg-blue-600/25'
                                : `border-slate-600/50 ${getUrgencyColor(candidate.urgency)} hover:border-slate-500/60`
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center text-white font-bold">
                                {candidate.player.jerseyNumber || candidate.player.name.charAt(0)}
                              </div>
                              <div
                                className={`
                                absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center
                                ${getUrgencyColor(candidate.urgency)} border-2 border-slate-800
                              `}
                              >
                                <IconComponent className="w-3 h-3" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-white truncate">
                                  {candidate.player.name}
                                </h4>
                                <span
                                  className={`
                                  text-xs px-2 py-1 rounded-full
                                  ${getUrgencyColor(candidate.urgency)}
                                `}
                                >
                                  {candidate.urgency.toUpperCase()}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                                <span>Stamina: {candidate.player.stamina || 100}%</span>
                                <span>Form: {candidate.player.form}</span>
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed">
                                {candidate.recommendation}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel - Bench players */}
                <div className="w-1/2 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Available Substitutes</h3>

                  <div className="space-y-3 h-[calc(100%-4rem)] overflow-y-auto">
                    {benchPlayers.map(player => {
                      const isSelected = selectedPlayerIn === player.id;

                      return (
                        <motion.div
                          key={player.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedPlayerIn(isSelected ? null : player.id)}
                          className={`
                            p-4 rounded-xl border cursor-pointer transition-all
                            ${
                              isSelected
                                ? 'border-green-500/70 bg-green-600/25'
                                : 'border-slate-600/50 bg-slate-800/40 hover:border-slate-500/60'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center text-white font-bold">
                              {player.jerseyNumber || player.name.charAt(0)}
                            </div>

                            <div className="flex-1">
                              <h4 className="font-semibold text-white mb-1">{player.name}</h4>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span>Fresh: {player.stamina || 100}%</span>
                                <span>Form: {player.form}</span>
                                <span className="text-green-400">Ready</span>
                              </div>
                            </div>

                            {isSelected && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Substitution Action */}
                  {selectedPlayerOut && selectedPlayerIn && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-6 right-6 left-1/2 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-300">
                          Substitute {fieldPlayers.find(p => p.id === selectedPlayerOut)?.name} with{' '}
                          {benchPlayers.find(p => p.id === selectedPlayerIn)?.name}
                        </div>
                        <button
                          onClick={handleSubstitution}
                          disabled={substitutionsUsed >= maxSubstitutions}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          Confirm Substitution
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tactical Adjustments Tab */}
            {activeTab === 'adjustments' && (
              <motion.div
                key="adjustments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">
                  Recommended Tactical Adjustments
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-4rem)] overflow-y-auto">
                  {tacticalAdjustments.map(adjustment => (
                    <motion.div
                      key={adjustment.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-5 bg-slate-800/40 border border-slate-600/50 rounded-xl hover:border-slate-500/60 transition-all cursor-pointer"
                      onClick={() => onTacticalChange(adjustment)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-white">{adjustment.description}</h4>
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          {adjustment.confidence}%
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                        {adjustment.impact}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 capitalize">
                          {adjustment.type} Change
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Player Instructions Tab */}
            {activeTab === 'instructions' && (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">
                  Individual Player Instructions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-[calc(100%-4rem)] overflow-y-auto">
                  {fieldPlayers.map(player => (
                    <div
                      key={player.id}
                      className="p-4 bg-slate-800/40 border border-slate-600/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {player.jerseyNumber || player.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm">{player.name}</h4>
                          <p className="text-xs text-slate-400">{player.roleId}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {['Stay wide', 'Get forward', 'Sit narrow', 'Play deeper'].map(
                          instruction => (
                            <button
                              key={instruction}
                              onClick={() => onPlayerInstruction(player.id, instruction)}
                              className="w-full p-2 text-xs text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors text-left"
                            >
                              {instruction}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 flex items-center justify-center"
              >
                <div className="text-center text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Live Match Analytics</h3>
                  <p className="text-sm">
                    Real-time performance data and insights will appear here during matches.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export { DugoutManagement };
export default DugoutManagement;
