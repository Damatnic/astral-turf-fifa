import React, { useState, useMemo } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import type { Team, Player, InjuryType, TreatmentPlan } from '../types';

const MedicalCenterPage: React.FC = () => {
  const { franchiseState } = useFranchiseContext();
  const { tacticsState } = useTacticsContext();
  const [selectedTeam, setSelectedTeam] = useState<Team>('home');
  const [selectedTab, setSelectedTab] = useState<'injured' | 'fitness' | 'prevention'>('injured');

  const teamPlayers = tacticsState.players.filter(p => p.team === selectedTeam);
  const staff = franchiseState.staff[selectedTeam];

  // Filter players by medical status
  const injuredPlayers = teamPlayers.filter(
    p => p.availability.status === 'Minor Injury' || p.availability.status === 'Major Injury',
  );

  const lowFitnessPlayers = teamPlayers.filter(p => p.stamina < 70);
  const highRiskPlayers = teamPlayers.filter(p => p.injuryRisk > 60);

  const getInjuryColor = (status: string) => {
    switch (status) {
      case 'Minor Injury':
        return 'text-yellow-400';
      case 'Major Injury':
        return 'text-red-400';
      default:
        return 'text-green-400';
    }
  };

  const getInjuryBackground = (status: string) => {
    switch (status) {
      case 'Minor Injury':
        return 'bg-yellow-600/10 border-yellow-400';
      case 'Major Injury':
        return 'bg-red-600/10 border-red-400';
      default:
        return 'bg-green-600/10 border-green-400';
    }
  };

  const getFitnessColor = (stamina: number) => {
    if (stamina >= 80) {
      return 'text-green-400';
    }
    if (stamina >= 60) {
      return 'text-yellow-400';
    }
    return 'text-red-400';
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) {
      return 'text-red-400';
    }
    if (risk >= 60) {
      return 'text-yellow-400';
    }
    return 'text-green-400';
  };

  // Enhanced injury and recovery management
  const calculateRecoveryTime = (player: Player) => {
    const baseRecovery = {
      'Major Injury': { min: 4, max: 12 },
      'Minor Injury': { min: 1, max: 4 },
      Fatigue: { min: 0, max: 1 },
    };

    const injuryType = player.availability.status as keyof typeof baseRecovery;
    const range = baseRecovery[injuryType];

    if (!range) {
      return 0;
    }

    const baseTime = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const staffBonus = staff.medicine ? Math.floor(staff.medicine.rehabBonus / 10) : 0;

    return Math.max(1, baseTime - staffBonus);
  };

  // Injury prevention recommendations
  const getInjuryPreventionPlan = (player: Player) => {
    const recommendations = [];

    if (player.fatigue > 70) {
      recommendations.push('Reduce training intensity');
      recommendations.push('Extended warm-up sessions');
    }

    if (player.injuryRisk > 60) {
      recommendations.push('Individual fitness assessment');
      recommendations.push('Physiotherapy consultation');
    }

    if (player.age > 30) {
      recommendations.push('Recovery-focused training');
      recommendations.push('Regular massage therapy');
    }

    if (player.stamina < 60) {
      recommendations.push('Cardiovascular conditioning');
      recommendations.push('Gradual fitness building');
    }

    return recommendations;
  };

  // Treatment assignment
  const assignTreatment = (playerId: string, treatment: string) => {
    dispatch({
      type: 'ASSIGN_MEDICAL_TREATMENT',
      payload: { playerId, treatment, assignedBy: 'Medical Staff' },
    });
  };

  // Return to training clearance
  const clearPlayerForTraining = (playerId: string) => {
    dispatch({
      type: 'CLEAR_PLAYER_FOR_TRAINING',
      payload: { playerId },
    });
  };

  const getMedicalStaffEffectiveness = () => {
    const baseEffectiveness = 50;
    const medicineBonus = staff.medicine
      ? (staff.medicine.injuryPreventionBonus + staff.medicine.rehabBonus) / 2
      : 0;
    const fitnessBonus = staff.fitnessCoach ? staff.fitnessCoach.fitnessCoaching / 10 : 0;

    return Math.min(100, baseEffectiveness + medicineBonus + fitnessBonus);
  };

  const medicalEffectiveness = getMedicalStaffEffectiveness();

  // Enhanced medical analytics
  const medicalAnalytics = useMemo(() => {
    const totalPlayers = teamPlayers.length;
    const availablePlayers = teamPlayers.filter(p => p.availability.status === 'Available').length;
    const injuredPlayers = teamPlayers.filter(p => p.availability.status.includes('Injury')).length;
    const fatigueePlayers = teamPlayers.filter(p => p.fatigue > 70).length;
    const highRiskPlayers = teamPlayers.filter(p => p.injuryRisk > 60).length;

    const averageFitness = Math.round(
      teamPlayers.reduce((sum, p) => sum + p.stamina, 0) / totalPlayers,
    );
    const averageFatigue = Math.round(
      teamPlayers.reduce((sum, p) => sum + p.fatigue, 0) / totalPlayers,
    );
    const averageRisk = Math.round(
      teamPlayers.reduce((sum, p) => sum + p.injuryRisk, 0) / totalPlayers,
    );

    return {
      totalPlayers,
      availablePlayers,
      injuredPlayers,
      fatigueePlayers,
      highRiskPlayers,
      availabilityRate: Math.round((availablePlayers / totalPlayers) * 100),
      averageFitness,
      averageFatigue,
      averageRisk,
    };
  }, [teamPlayers]);

  // Treatment options
  const treatmentOptions = {
    physiotherapy: 'Physiotherapy Session',
    massage: 'Therapeutic Massage',
    ice_bath: 'Ice Bath Recovery',
    rest: 'Complete Rest',
    light_training: 'Light Training',
    surgery: 'Surgical Intervention',
    injection: 'Anti-inflammatory Injection',
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Medical Center</h1>
          <p className="text-gray-400">Monitor player health, injuries, and fitness levels</p>

          {/* Medical Overview Dashboard */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-green-400">
                {medicalAnalytics.availablePlayers}
              </div>
              <div className="text-sm text-gray-400">Available Players</div>
              <div className="text-xs text-gray-500">
                {medicalAnalytics.availabilityRate}% squad available
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-red-400">
                {medicalAnalytics.injuredPlayers}
              </div>
              <div className="text-sm text-gray-400">Injured Players</div>
              <div className="text-xs text-gray-500">Requiring treatment</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">
                {medicalAnalytics.highRiskPlayers}
              </div>
              <div className="text-sm text-gray-400">High Risk</div>
              <div className="text-xs text-gray-500">Injury prevention needed</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-teal-400">{medicalEffectiveness}%</div>
              <div className="text-sm text-gray-400">Staff Effectiveness</div>
              <div className="text-xs text-gray-500">Medical team rating</div>
            </div>
          </div>
        </div>

        {/* Team Selector */}
        <div className="mb-6">
          <div className="bg-gray-800 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setSelectedTeam('home')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTeam === 'home'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Home Team
            </button>
            <button
              onClick={() => setSelectedTeam('away')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTeam === 'away'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Away Team
            </button>
          </div>
        </div>

        {/* Medical Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Injured Players</p>
                <p className="text-2xl font-bold text-red-400">{injuredPlayers.length}</p>
                <p className="text-xs text-gray-500">Currently unavailable</p>
              </div>
              <div className="text-red-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Low Fitness</p>
                <p className="text-2xl font-bold text-yellow-400">{lowFitnessPlayers.length}</p>
                <p className="text-xs text-gray-500">Below 70% stamina</p>
              </div>
              <div className="text-yellow-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High Risk</p>
                <p className="text-2xl font-bold text-orange-400">{highRiskPlayers.length}</p>
                <p className="text-xs text-gray-500">Injury prone</p>
              </div>
              <div className="text-orange-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Medical Staff</p>
                <p className="text-2xl font-bold text-teal-400">{medicalEffectiveness}%</p>
                <p className="text-xs text-gray-500">Effectiveness</p>
              </div>
              <div className="text-teal-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('injured')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'injured'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Injured Players ({injuredPlayers.length})
              </button>
              <button
                onClick={() => setSelectedTab('fitness')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'fitness'
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Fitness Monitoring ({teamPlayers.length})
              </button>
              <button
                onClick={() => setSelectedTab('prevention')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'prevention'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Prevention & Staff
              </button>
            </nav>
          </div>
        </div>

        {/* Injured Players Tab */}
        {selectedTab === 'injured' && (
          <div className="space-y-4">
            {injuredPlayers.length > 0 ? (
              injuredPlayers.map(player => (
                <div
                  key={player.id}
                  className={`p-6 rounded-lg border-l-4 ${getInjuryBackground(player.availability.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center">
                        <span className="text-white font-bold">{player.jerseyNumber}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                        <p className="text-gray-400">
                          Age {player.age} • {player.nationality}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              player.availability.status === 'Minor Injury'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {player.availability.status}
                          </span>
                          <span className="text-sm text-gray-400">
                            Est. Recovery: {calculateRecoveryTime(player)} weeks
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Return Date</p>
                      <p className="text-white font-medium">
                        {player.availability.returnDate || 'TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Recovery Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Recovery Progress</span>
                      <span className="text-sm text-teal-400">
                        {Math.floor(Math.random() * 40) + 30}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-green-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Injured Players</h3>
                <p className="text-gray-500">All players are currently available for selection</p>
              </div>
            )}
          </div>
        )}

        {/* Fitness Monitoring Tab */}
        {selectedTab === 'fitness' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamPlayers.map(player => (
              <div key={player.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{player.jerseyNumber}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{player.name}</h4>
                      <p className="text-gray-400 text-sm">Age {player.age}</p>
                    </div>
                  </div>
                </div>

                {/* Fitness Metrics */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">Stamina</span>
                      <span className={`font-bold ${getFitnessColor(player.stamina)}`}>
                        {player.stamina}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          player.stamina >= 80
                            ? 'bg-green-400'
                            : player.stamina >= 60
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${player.stamina}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">Injury Risk</span>
                      <span className={`font-bold ${getRiskColor(player.injuryRisk)}`}>
                        {player.injuryRisk}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          player.injuryRisk >= 80
                            ? 'bg-red-400'
                            : player.injuryRisk >= 60
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                        }`}
                        style={{ width: `${player.injuryRisk}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">Fatigue</span>
                      <span
                        className={`font-bold ${
                          player.fatigue >= 80
                            ? 'text-red-400'
                            : player.fatigue >= 60
                              ? 'text-yellow-400'
                              : 'text-green-400'
                        }`}
                      >
                        {player.fatigue}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          player.fatigue >= 80
                            ? 'bg-red-400'
                            : player.fatigue >= 60
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                        }`}
                        style={{ width: `${player.fatigue}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div
                  className={`mt-4 p-2 rounded text-center text-sm font-medium ${
                    player.availability.status === 'Available'
                      ? 'bg-green-600/20 text-green-400'
                      : player.availability.status.includes('Injury')
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-yellow-600/20 text-yellow-400'
                  }`}
                >
                  {player.availability.status}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prevention & Staff Tab */}
        {selectedTab === 'prevention' && (
          <div className="space-y-8">
            {/* Medical Staff */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-teal-400 mb-4">Medical Staff</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Head of Medicine */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Head of Medicine</h4>
                  {staff.medicine ? (
                    <div>
                      <p className="text-gray-300 font-medium">{staff.medicine.name}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Injury Prevention</span>
                          <span className="text-green-400">
                            +{staff.medicine.injuryPreventionBonus}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rehabilitation</span>
                          <span className="text-blue-400">+{staff.medicine.rehabBonus}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No medical staff hired</p>
                  )}
                </div>

                {/* Fitness Coach */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Fitness Coach</h4>
                  {staff.fitnessCoach ? (
                    <div>
                      <p className="text-gray-300 font-medium">{staff.fitnessCoach.name}</p>
                      <div className="mt-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fitness Coaching</span>
                          <span className="text-yellow-400">
                            {staff.fitnessCoach.fitnessCoaching}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No fitness coach hired</p>
                  )}
                </div>
              </div>
            </div>

            {/* Prevention Recommendations */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-teal-400 mb-4">
                Prevention Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    Training Load Management
                  </h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start space-x-2">
                      <svg
                        className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">Rotate players with high fatigue levels</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg
                        className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">Schedule rest days for overworked players</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg
                        className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">Monitor training intensity closely</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Injury Prevention</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start space-x-2">
                      <svg
                        className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">Proper warm-up and cool-down routines</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg
                        className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">Focus on flexibility and mobility work</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg
                        className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">Regular fitness assessments</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalCenterPage;
