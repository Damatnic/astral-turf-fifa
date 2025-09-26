import React, { useState, useMemo } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import type { Team, StadiumFacility, StadiumUpgrade } from '../types';

const StadiumPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const [selectedTeam, setSelectedTeam] = useState<Team>('home');

  const stadium = franchiseState.stadium[selectedTeam];
  const finances = franchiseState.finances[selectedTeam];

  const getUpgradeCost = (currentLevel: number) => currentLevel * 100000 + 200000;

  // Comprehensive stadium analytics
  const stadiumAnalytics = useMemo(() => {
    const capacity = stadium.capacity;
    const utilization = Math.min(100, (stadium.averageAttendance / capacity) * 100);
    const ticketPrice = stadium.ticketPrice || 25;
    const weeklyRevenue = stadium.averageAttendance * ticketPrice;
    const seasonRevenue = weeklyRevenue * 38; // 38 match season

    // Calculate total facility value
    const facilityValue =
      stadium.trainingFacilitiesLevel * 250000 +
      stadium.youthFacilitiesLevel * 200000 +
      (stadium.capacity / 1000) * 150000;

    // Performance impact
    const trainingBonus = stadium.trainingFacilitiesLevel * 5;
    const youthBonus = stadium.youthFacilitiesLevel * 10;
    const fanLoyalty = Math.min(100, utilization + (stadium.amenitiesLevel || 0) * 5);

    return {
      utilization,
      weeklyRevenue,
      seasonRevenue,
      facilityValue,
      trainingBonus,
      youthBonus,
      fanLoyalty,
      revenuePerSeat: weeklyRevenue / capacity,
      expansionPotential: Math.max(0, 100 - utilization),
    };
  }, [stadium]);

  // Stadium upgrade options
  const stadiumUpgrades: StadiumUpgrade[] = [
    {
      id: 'capacity_expansion',
      name: 'Capacity Expansion',
      description: 'Increase stadium capacity by 5,000 seats',
      cost: 2000000,
      benefits: ['Increased ticket revenue', 'Higher fan engagement', 'Better atmosphere'],
      requirements: { facilitiesLevel: 3 },
    },
    {
      id: 'premium_seating',
      name: 'Premium Seating',
      description: 'Add luxury boxes and premium seating areas',
      cost: 1500000,
      benefits: ['30% higher ticket prices', 'Corporate partnerships', 'VIP experiences'],
      requirements: { capacity: 25000 },
    },
    {
      id: 'roof_installation',
      name: 'Roof Installation',
      description: 'Install retractable roof for all-weather games',
      cost: 5000000,
      benefits: ['Weather-independent matches', 'Multi-purpose venue', 'Increased booking'],
      requirements: { capacity: 30000 },
    },
    {
      id: 'smart_stadium',
      name: 'Smart Stadium Technology',
      description: 'High-tech features including WiFi, apps, and digital displays',
      cost: 3000000,
      benefits: ['Enhanced fan experience', 'Data analytics', 'Revenue optimization'],
      requirements: { facilitiesLevel: 4 },
    },
    {
      id: 'eco_friendly',
      name: 'Eco-Friendly Upgrades',
      description: 'Solar panels, rainwater collection, and sustainable materials',
      cost: 1000000,
      benefits: ['Reduced operating costs', 'Environmental certification', 'Brand image'],
      requirements: {},
    },
  ];

  // Revenue optimization strategies
  const revenueStrategies = [
    {
      id: 'dynamic_pricing',
      name: 'Dynamic Pricing',
      description: 'Adjust ticket prices based on demand and opponent',
      implementation: 'Set prices 50% higher for big matches, 20% lower for low-demand games',
      estimatedIncrease: '15-25%',
    },
    {
      id: 'season_tickets',
      name: 'Season Ticket Packages',
      description: 'Offer discounted season-long packages',
      implementation: 'Guarantee steady revenue and build fan loyalty',
      estimatedIncrease: '30-40%',
    },
    {
      id: 'corporate_boxes',
      name: 'Corporate Hospitality',
      description: 'Premium corporate packages and sponsorship deals',
      implementation: 'Target local businesses with exclusive experiences',
      estimatedIncrease: '20-35%',
    },
    {
      id: 'concessions',
      name: 'Enhanced Concessions',
      description: 'Improved food and beverage offerings',
      implementation: 'Partner with local restaurants and craft breweries',
      estimatedIncrease: '10-15%',
    },
  ];

  // Handle stadium upgrades
  const handleStadiumUpgrade = (upgradeId: string) => {
    const upgrade = stadiumUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
      return;
    }

    if (finances.transferBudget >= upgrade.cost) {
      dispatch({
        type: 'APPLY_STADIUM_UPGRADE',
        payload: { team: selectedTeam, upgradeId },
      });

      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `${upgrade.name} completed successfully!`,
          type: 'success',
        },
      });
    } else {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Insufficient funds for stadium upgrade',
          type: 'error',
        },
      });
    }
  };

  // Implement revenue strategy
  const implementRevenueStrategy = (strategyId: string) => {
    dispatch({
      type: 'IMPLEMENT_REVENUE_STRATEGY',
      payload: { team: selectedTeam, strategyId },
    });

    const strategy = revenueStrategies.find(s => s.id === strategyId);
    uiDispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `${strategy?.name} strategy implemented!`,
        type: 'success',
      },
    });
  };

  const handleUpgradeFacility = (facility: 'trainingFacilitiesLevel' | 'youthFacilitiesLevel') => {
    const cost = getUpgradeCost(stadium[facility]);

    if (finances.transferBudget >= cost) {
      dispatch({
        type: 'UPGRADE_STADIUM_FACILITY',
        payload: { facility, team: selectedTeam },
      });

      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `${facility === 'trainingFacilitiesLevel' ? 'Training facilities' : 'Youth facilities'} upgraded successfully!`,
          type: 'success',
        },
      });
    } else {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Insufficient funds for facility upgrade',
          type: 'error',
        },
      });
    }
  };

  const getFacilityDescription = (level: number, type: 'training' | 'youth') => {
    if (type === 'training') {
      switch (level) {
        case 1:
          return 'Basic training grounds with minimal equipment';
        case 2:
          return 'Standard facilities with decent equipment and medical room';
        case 3:
          return 'Good facilities with modern equipment and recovery areas';
        case 4:
          return 'Excellent facilities with state-of-the-art equipment';
        case 5:
          return 'World-class training complex with cutting-edge technology';
        default:
          return 'No training facilities';
      }
    } else {
      switch (level) {
        case 1:
          return 'Basic youth setup with limited coaching staff';
        case 2:
          return 'Standard youth facilities with qualified coaches';
        case 3:
          return 'Good youth academy with specialized programs';
        case 4:
          return 'Excellent youth system producing quality prospects';
        case 5:
          return 'Elite academy known for developing world-class talent';
        default:
          return 'No youth facilities';
      }
    }
  };

  const getCapacityBenefit = (capacity: number) => {
    return Math.floor(capacity * 0.15); // Approximate weekly income from ticket sales
  };

  const getFacilityBenefits = (level: number, type: 'training' | 'youth') => {
    if (type === 'training') {
      return [
        `+${level * 5}% training effectiveness`,
        `+${level * 3}% injury prevention`,
        `-${level * 2}% fatigue accumulation`,
        level >= 3 ? 'Advanced recovery methods' : null,
        level >= 4 ? 'Performance analysis tools' : null,
        level === 5 ? 'World-class medical staff' : null,
      ].filter(Boolean);
    } else {
      return [
        `+${level * 10}% youth prospect generation`,
        `+${level * 5}% youth development speed`,
        `Higher potential prospects (${40 + level * 10}+ potential)`,
        level >= 3 ? 'Specialized position training' : null,
        level >= 4 ? 'Elite coaching staff' : null,
        level === 5 ? 'International scouting network' : null,
      ].filter(Boolean);
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Stadium Management</h1>
          <p className="text-gray-400">Manage and upgrade your stadium facilities</p>

          {/* Stadium Overview Dashboard */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-teal-400">
                {stadium.capacity.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Stadium Capacity</div>
              <div className="text-xs text-gray-500">
                {stadiumAnalytics.utilization.toFixed(1)}% utilization
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-green-400">
                ${stadiumAnalytics.weeklyRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Weekly Revenue</div>
              <div className="text-xs text-gray-500">
                ${stadiumAnalytics.revenuePerSeat.toFixed(2)} per seat
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">
                ${stadiumAnalytics.facilityValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Facility Value</div>
              <div className="text-xs text-gray-500">Total investment</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-purple-400">
                {stadiumAnalytics.fanLoyalty.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-400">Fan Loyalty</div>
              <div className="text-xs text-gray-500">Attendance & amenities</div>
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

        {/* Stadium Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-blue-400 mb-3">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">{stadium.capacity.toLocaleString()}</h3>
              <p className="text-gray-400">Stadium Capacity</p>
              <p className="text-sm text-green-400 mt-2">
                ~${getCapacityBenefit(stadium.capacity).toLocaleString()}/week income
              </p>
            </div>

            <div className="text-center">
              <div className="text-green-400 mb-3">
                <svg
                  className="w-12 h-12 mx-auto"
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
              <h3 className="text-xl font-bold text-white">
                Level {stadium.trainingFacilitiesLevel}
              </h3>
              <p className="text-gray-400">Training Facilities</p>
              <div className="flex justify-center mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < stadium.trainingFacilitiesLevel ? 'text-green-400' : 'text-gray-600'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="text-purple-400 mb-3">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Level {stadium.youthFacilitiesLevel}</h3>
              <p className="text-gray-400">Youth Facilities</p>
              <div className="flex justify-center mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < stadium.youthFacilitiesLevel ? 'text-purple-400' : 'text-gray-600'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Facility Upgrades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Training Facilities */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-400 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Training Facilities
              </h3>
              <span className="text-2xl font-bold text-white">
                Level {stadium.trainingFacilitiesLevel}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-2">Current Status:</p>
              <p className="text-gray-400 italic">
                {getFacilityDescription(stadium.trainingFacilitiesLevel, 'training')}
              </p>
            </div>

            {/* Current Benefits */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Current Benefits:</h4>
              <div className="space-y-1">
                {getFacilityBenefits(stadium.trainingFacilitiesLevel, 'training').map(
                  (benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-green-400">
                      <svg
                        className="w-4 h-4 mr-2 flex-shrink-0"
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
                      {benefit}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Upgrade Section */}
            {stadium.trainingFacilitiesLevel < 5 ? (
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">
                      Upgrade to Level {stadium.trainingFacilitiesLevel + 1}
                    </p>
                    <p className="text-yellow-400 font-bold">
                      ${getUpgradeCost(stadium.trainingFacilitiesLevel).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgradeFacility('trainingFacilitiesLevel')}
                    disabled={
                      finances.transferBudget < getUpgradeCost(stadium.trainingFacilitiesLevel)
                    }
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      finances.transferBudget >= getUpgradeCost(stadium.trainingFacilitiesLevel)
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Upgrade
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Next: {getFacilityDescription(stadium.trainingFacilitiesLevel + 1, 'training')}
                </p>
              </div>
            ) : (
              <div className="border-t border-gray-700 pt-4">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-green-400 font-medium">Maximum Level Reached</p>
                  <p className="text-xs text-gray-500">Training facilities are fully upgraded</p>
                </div>
              </div>
            )}
          </div>

          {/* Youth Facilities */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-purple-400 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Youth Facilities
              </h3>
              <span className="text-2xl font-bold text-white">
                Level {stadium.youthFacilitiesLevel}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-2">Current Status:</p>
              <p className="text-gray-400 italic">
                {getFacilityDescription(stadium.youthFacilitiesLevel, 'youth')}
              </p>
            </div>

            {/* Current Benefits */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Current Benefits:</h4>
              <div className="space-y-1">
                {getFacilityBenefits(stadium.youthFacilitiesLevel, 'youth').map(
                  (benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-purple-400">
                      <svg
                        className="w-4 h-4 mr-2 flex-shrink-0"
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
                      {benefit}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Upgrade Section */}
            {stadium.youthFacilitiesLevel < 5 ? (
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">
                      Upgrade to Level {stadium.youthFacilitiesLevel + 1}
                    </p>
                    <p className="text-yellow-400 font-bold">
                      ${getUpgradeCost(stadium.youthFacilitiesLevel).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgradeFacility('youthFacilitiesLevel')}
                    disabled={
                      finances.transferBudget < getUpgradeCost(stadium.youthFacilitiesLevel)
                    }
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      finances.transferBudget >= getUpgradeCost(stadium.youthFacilitiesLevel)
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Upgrade
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Next: {getFacilityDescription(stadium.youthFacilitiesLevel + 1, 'youth')}
                </p>
              </div>
            ) : (
              <div className="border-t border-gray-700 pt-4">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-purple-400 font-medium">Maximum Level Reached</p>
                  <p className="text-xs text-gray-500">Youth facilities are fully upgraded</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stadium Statistics */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-teal-400 mb-4">Stadium Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">
                {stadium.capacity.toLocaleString()}
              </p>
              <p className="text-gray-400">Total Capacity</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">
                ${getCapacityBenefit(stadium.capacity).toLocaleString()}
              </p>
              <p className="text-gray-400">Weekly Income</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">
                {stadium.trainingFacilitiesLevel + stadium.youthFacilitiesLevel}
              </p>
              <p className="text-gray-400">Total Facility Level</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">
                $
                {(
                  (getUpgradeCost(stadium.trainingFacilitiesLevel) +
                    getUpgradeCost(stadium.youthFacilitiesLevel)) /
                  1000
                ).toFixed(0)}
                k
              </p>
              <p className="text-gray-400">Next Upgrade Cost</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StadiumPage;
