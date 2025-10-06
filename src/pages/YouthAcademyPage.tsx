import React, { useState, useMemo } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import { intelligentTrainingService } from '../services/intelligentTrainingService';
import type { Team, YouthProspect, AIScoutReport } from '../types';

const YouthAcademyPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const [selectedTeam, setSelectedTeam] = useState<Team>('home');
  const [selectedProspect, setSelectedProspect] = useState<YouthProspect | null>(null);

  const youthAcademy = franchiseState.youthAcademy[selectedTeam];
  const stadium = franchiseState.stadium[selectedTeam];
  const finances = franchiseState.finances[selectedTeam];

  const upgradeYouthAcademyCost = (youthAcademy.level + 1) * 250000;
  const canUpgradeYouthAcademy = finances.transferBudget >= upgradeYouthAcademyCost;

  const handleInvestInYouthAcademy = () => {
    if (canUpgradeYouthAcademy) {
      (dispatch as any)({ type: 'INVEST_IN_YOUTH_ACADEMY', payload: { team: selectedTeam } });
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Youth Academy upgraded to level ${youthAcademy.level + 1}!`,
          type: 'success',
        },
      });
    }
  };

  const handleSignYouthPlayer = (prospectId: string) => {
    (dispatch as any)({ type: 'SIGN_YOUTH_PLAYER', payload: { prospectId, team: selectedTeam } });
    uiDispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: 'Youth prospect signed to the senior squad!',
        type: 'success',
      },
    });
    setSelectedProspect(null);
  };

  const getAttributeRange = (attrRange: readonly [number, number]) => {
    return `${attrRange[0]}-${attrRange[1]}`;
  };

  const getAttributeAverage = (attrRange: readonly [number, number]) => {
    return Math.round((attrRange[0] + attrRange[1]) / 2);
  };

  const calculateOverallPotential = (prospect: YouthProspect) => {
    const averages = Object.values(prospect.attributes).map(range => getAttributeAverage(range));
    return Math.round(averages.reduce((sum, val) => sum + val, 0) / averages.length);
  };

  // Enhanced youth development analytics
  const youthAnalytics = useMemo(() => {
    const prospects = youthAcademy.prospects;
    const totalProspects = prospects.length;
    const highPotential = prospects.filter((p: any) => calculateOverallPotential(p) >= 75).length;
    const readyForSeniorTeam = prospects.filter(
      (p: any) => p.age >= 18 && calculateOverallPotential(p) >= 60
    ).length;
    const graduatesThisSeason = prospects.filter(
      (p: any) => p.developmentStage === 'ready_for_senior'
    ).length;

    // Development success rate
    const developmentSuccessRate = totalProspects > 0 ? (highPotential / totalProspects) * 100 : 0;

    // Academy efficiency
    const academyEfficiency =
      youthAcademy.level * 10 + ((youthAcademy as any).coachingStaff?.length || 0) * 5;

    return {
      totalProspects,
      highPotential,
      readyForSeniorTeam,
      graduatesThisSeason,
      developmentSuccessRate,
      academyEfficiency,
      averageAge:
        totalProspects > 0
          ? prospects.reduce((sum: number, p: any) => sum + p.age, 0) / totalProspects
          : 0,
    };
  }, [youthAcademy]);

  // Advanced development programs
  const developmentPrograms: any[] = [
    {
      id: 'technical_mastery',
      name: 'Technical Mastery Program',
      description: 'Focus on ball control, passing, and dribbling skills',
      duration: 12, // weeks
      cost: 25000,
      benefits: { technical: 15, dribbling: 20, passing: 15 },
      requirements: { academyLevel: 2, age: [16, 19] },
    },
    {
      id: 'physical_development',
      name: 'Physical Development Program',
      description: 'Strength, speed, and stamina enhancement',
      duration: 16,
      cost: 30000,
      benefits: { speed: 20, stamina: 25, tackling: 10 },
      requirements: { academyLevel: 3, age: [17, 20] },
    },
    {
      id: 'tactical_intelligence',
      name: 'Tactical Intelligence Program',
      description: 'Advanced tactical understanding and positioning',
      duration: 20,
      cost: 35000,
      benefits: { positioning: 25, tackling: 15, passing: 10 },
      requirements: { academyLevel: 4, age: [18, 21] },
    },
    {
      id: 'elite_pathway',
      name: 'Elite Pathway Program',
      description: 'Comprehensive development for exceptional talents',
      duration: 24,
      cost: 50000,
      benefits: { overall: 20 },
      requirements: { academyLevel: 5, potential: 80 },
    },
  ];

  // Scouting functions
  const handleScoutNewTalents = async () => {
    try {
      const scoutingResults = await generateScoutingResults();
      (dispatch as any)({
        type: 'ADD_YOUTH_PROSPECTS',
        payload: { team: selectedTeam, prospects: scoutingResults },
      });

      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Scouting mission complete! Found ${scoutingResults.length} new prospects`,
          type: 'success',
        },
      });
    } catch (error) {
      console.error('Youth scouting failed:', error);
    }
  };

  const generateScoutingResults = async (): Promise<YouthProspect[]> => {
    // Simulate scouting based on academy level and resources
    const scoutingRange = youthAcademy.level * 2 + Math.floor(Math.random() * 3);
    const prospects: YouthProspect[] = [];

    for (let i = 0; i < scoutingRange; i++) {
      const prospect = generateRandomProspect();
      prospects.push(prospect);
    }

    return prospects;
  };

  const generateRandomProspect = (): YouthProspect => {
    const age = 16 + Math.floor(Math.random() * 5); // 16-20 years
    const academyBonus = youthAcademy.level * 2;

    return {
      id: `prospect_${Date.now()}_${Math.random()}`,
      name: generateRandomName(),
      age: age as any,
      nationality: generateRandomNationality(),
      position: generateRandomPosition() as any,
      attributes: {
        speed: [
          Math.max(30, 50 + Math.random() * 30 + academyBonus),
          Math.min(95, 70 + Math.random() * 25 + academyBonus),
        ] as [number, number],
        passing: [
          Math.max(30, 45 + Math.random() * 35 + academyBonus),
          Math.min(95, 65 + Math.random() * 30 + academyBonus),
        ] as [number, number],
        shooting: [
          Math.max(30, 40 + Math.random() * 40 + academyBonus),
          Math.min(95, 60 + Math.random() * 35 + academyBonus),
        ] as [number, number],
        dribbling: [
          Math.max(30, 45 + Math.random() * 35 + academyBonus),
          Math.min(95, 65 + Math.random() * 30 + academyBonus),
        ] as [number, number],
        tackling: [
          Math.max(30, 40 + Math.random() * 40 + academyBonus),
          Math.min(95, 60 + Math.random() * 35 + academyBonus),
        ] as [number, number],
        positioning: [
          Math.max(30, 45 + Math.random() * 35 + academyBonus),
          Math.min(95, 65 + Math.random() * 30 + academyBonus),
        ] as [number, number],
        stamina: [
          Math.max(30, 50 + Math.random() * 30 + academyBonus),
          Math.min(95, 70 + Math.random() * 25 + academyBonus),
        ] as [number, number],
      },
      monthsInAcademy: 0,
      specialties: generateRandomSpecialties(),
      mentalAttributes: {
        workRate: 50 + Math.random() * 40,
        leadership: 30 + Math.random() * 50,
      } as any,
    } as any;
  };

  const generateRandomName = () => {
    const firstNames = [
      'Alex',
      'Jamie',
      'Jordan',
      'Casey',
      'Riley',
      'Morgan',
      'Avery',
      'Quinn',
      'Sage',
      'River',
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
      'Rodriguez',
      'Martinez',
    ];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  const generateRandomNationality = () => {
    const nationalities = ['US', 'GB-ENG', 'FR', 'DE', 'ES', 'IT', 'BR', 'AR', 'MX', 'CA'];
    return nationalities[Math.floor(Math.random() * nationalities.length)];
  };

  const generateRandomPosition = () => {
    const positions = ['GK', 'DF', 'MF', 'FW'];
    return positions[Math.floor(Math.random() * positions.length)];
  };

  const generateRandomSpecialties = () => {
    const allSpecialties = [
      'Pace',
      'Technical',
      'Physical',
      'Aerial',
      'Set Pieces',
      'Leadership',
      'Versatile',
    ];
    const numSpecialties = 1 + Math.floor(Math.random() * 3);
    const shuffled = allSpecialties.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numSpecialties);
  };

  // Development program enrollment
  const enrollInProgram = (prospectId: string, programId: string) => {
    const program = developmentPrograms.find(p => p.id === programId);
    if (!program) {
      return;
    }

    if (finances.transferBudget >= program.cost) {
      dispatch({
        type: 'ENROLL_YOUTH_IN_PROGRAM',
        payload: { team: selectedTeam, prospectId, programId },
      });

      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Prospect enrolled in ${program.name}!`,
          type: 'success',
        },
      });
    } else {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Insufficient funds for development program',
          type: 'error',
        },
      });
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Youth Academy</h1>
          <p className="text-gray-400">Develop the next generation of football talent</p>

          {/* Youth Academy Analytics */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-teal-400">
                {youthAnalytics.totalProspects}
              </div>
              <div className="text-sm text-gray-400">Total Prospects</div>
              <div className="text-xs text-gray-500">
                Avg age: {youthAnalytics.averageAge.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-green-400">
                {youthAnalytics.highPotential}
              </div>
              <div className="text-sm text-gray-400">High Potential</div>
              <div className="text-xs text-gray-500">75+ overall rating</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">
                {youthAnalytics.readyForSeniorTeam}
              </div>
              <div className="text-sm text-gray-400">Ready for Senior</div>
              <div className="text-xs text-gray-500">18+ years, 60+ rating</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-purple-400">
                {youthAnalytics.developmentSuccessRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Success Rate</div>
              <div className="text-xs text-gray-500">Development efficiency</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">Level {youthAcademy.level}</div>
              <div className="text-sm text-gray-400">Academy Grade</div>
              <div className="text-xs text-gray-500">
                {youthAnalytics.academyEfficiency}% efficiency
              </div>
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

        {/* Academy Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Academy Level</p>
                <p className="text-2xl font-bold text-teal-400">Level {youthAcademy.level}</p>
                <p className="text-xs text-gray-500">
                  Youth Facilities: Level {stadium.youthFacilitiesLevel}
                </p>
              </div>
              <div className="text-teal-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Current Prospects</p>
                <p className="text-2xl font-bold text-blue-400">{youthAcademy.prospects.length}</p>
                <p className="text-xs text-gray-500">Available for development</p>
              </div>
              <div className="text-blue-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Upgrade Cost</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ${upgradeYouthAcademyCost.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">To level {youthAcademy.level + 1}</p>
              </div>
              <button
                onClick={handleInvestInYouthAcademy}
                disabled={!canUpgradeYouthAcademy}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  canUpgradeYouthAcademy
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prospects List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-teal-400 mb-4">Youth Prospects</h3>

              {youthAcademy.prospects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
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
                        d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-300 mb-2">
                    No Prospects Available
                  </h4>
                  <p className="text-gray-500">
                    New prospects will be generated based on your academy level
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {youthAcademy.prospects.map((prospect: any) => (
                    <div
                      key={prospect.id}
                      onClick={() => setSelectedProspect(prospect)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedProspect?.id === prospect.id
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{prospect.name}</h4>
                          <p className="text-sm text-gray-400">
                            Age {prospect.age} • {prospect.nationality}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-teal-400">
                              Potential: {getAttributeRange(prospect.potential)}
                            </span>
                            <span className="text-sm text-blue-400">
                              Overall: ~{calculateOverallPotential(prospect)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              prospect.morale === 'Excellent'
                                ? 'bg-green-600 text-white'
                                : prospect.morale === 'Good'
                                  ? 'bg-blue-600 text-white'
                                  : prospect.morale === 'Okay'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-red-600 text-white'
                            }`}
                          >
                            {prospect.morale}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prospect Details */}
          <div>
            {selectedProspect ? (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedProspect.name}</h3>
                    <p className="text-gray-400">
                      Age {selectedProspect.age} • {selectedProspect.nationality}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSignYouthPlayer(selectedProspect.id)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign to Senior Squad
                  </button>
                </div>

                {/* Attributes */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-teal-400 mb-3">Attributes</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedProspect.attributes).map(([attr, range]) => (
                      <div key={attr} className="flex justify-between items-center">
                        <span className="text-gray-300 capitalize">{attr}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-400 w-16">
                            {getAttributeRange(range)}
                          </span>
                          <div className="w-24 bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getAttributeAverage(range)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contract Info */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-teal-400 mb-3">Contract</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Weekly Wage</span>
                      <span className="text-white">
                        ${(selectedProspect.contract.wage || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Contract Expires</span>
                      <span className="text-white">
                        {selectedProspect.contract.expires || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Player Traits */}
                {selectedProspect.traits.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-teal-400 mb-3">Traits</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProspect.traits.map(trait => (
                        <span
                          key={trait}
                          className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                <div className="text-gray-400 mb-4">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Select a Prospect</h3>
                <p className="text-gray-500">
                  Choose a youth prospect to view detailed information
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Academy Benefits */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-teal-400 mb-4">Academy Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-green-400 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-2">Higher Potential</h4>
              <p className="text-sm text-gray-400">
                Level {youthAcademy.level} academy produces prospects with{' '}
                {40 + youthAcademy.level * 10}+ potential
              </p>
            </div>

            <div className="text-center">
              <div className="text-blue-400 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-2">Faster Development</h4>
              <p className="text-sm text-gray-400">
                Youth prospects develop {youthAcademy.level * 15}% faster in training
              </p>
            </div>

            <div className="text-center">
              <div className="text-purple-400 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-2">More Prospects</h4>
              <p className="text-sm text-gray-400">
                Generate {Math.min(youthAcademy.level, 3)} new prospects every{' '}
                {Math.max(4 - youthAcademy.level, 2)} weeks
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouthAcademyPage;
