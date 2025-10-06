import React, { useState, useEffect, useMemo } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import { aiService } from '../services/aiService';
import type { TransferPlayer, PositionRole, Team, AIScoutReport } from '../types';
import { ResponsivePage } from '../components/Layout/ResponsivePage';
import {
  ResponsiveGrid,
  TouchButton,
  ResponsiveCard,
} from '../components/Layout/AdaptiveLayout.tsx';

const TransfersPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { tacticsState } = useTacticsContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const [activeTab, setActiveTab] = useState<'for_sale' | 'for_loan' | 'free_agents'>('for_sale');
  const [selectedTeam, setSelectedTeam] = useState<Team>('home');

  const { transferMarket, finances } = franchiseState;
  const { transferMarketFilters } = uiState;

  const handleSignPlayer = (player: TransferPlayer) => {
    const budget = finances[selectedTeam].transferBudget;
    if (budget >= (player as any).askingPrice) {
      dispatch({
        type: 'SIGN_TRANSFER_PLAYER',
        payload: { player, team: selectedTeam },
      });
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Successfully signed ${player.name} for $${(player as any).askingPrice.toLocaleString()}`,
          type: 'success',
        },
      });
    } else {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Insufficient transfer budget to sign ${player.name}`,
          type: 'error',
        },
      });
    }
  };

  const handleScoutPlayer = async (player: TransferPlayer) => {
    uiDispatch({
      type: 'GET_PLAYER_SCOUT_REPORT_START',
      payload: { playerId: player.id },
    });

    try {
      const scoutReport = await (aiService.getPlayerScoutingReport as any)(player as any);
      (uiDispatch as (action: { type: string; payload?: any }) => void)({
        type: 'GET_PLAYER_SCOUT_REPORT_SUCCESS',
        payload: { playerId: player.id, report: scoutReport },
      });
    } catch (error) {
      console.error('Failed to generate scout report:', error);
      (uiDispatch as (action: { type: string; payload?: any }) => void)({
        type: 'GET_PLAYER_SCOUT_REPORT_FAILURE',
        payload: {
          playerId: player.id,
          error: 'Scout report generation failed - AI analysis unavailable',
        },
      });
    }
  };

  const handleFilterChange = (filter: keyof typeof transferMarketFilters, value: unknown) => {
    uiDispatch({
      type: 'SET_TRANSFER_MARKET_FILTER',
      payload: { filter, value },
    });
  };

  const filteredPlayers = transferMarket.forSale.filter(player => {
    const nameMatch = player.name.toLowerCase().includes(transferMarketFilters.name.toLowerCase());
    const positionMatch =
      transferMarketFilters.position === 'All' ||
      player.roleId.includes(transferMarketFilters.position);
    const ageMatch =
      player.age >= transferMarketFilters.age.min && player.age <= transferMarketFilters.age.max;
    const potentialMatch =
      player.currentPotential >= transferMarketFilters.potential.min &&
      player.currentPotential <= transferMarketFilters.potential.max;
    const priceMatch =
      (player as any).askingPrice >= transferMarketFilters.price.min &&
      (player as any).askingPrice <= transferMarketFilters.price.max;

    return nameMatch && positionMatch && ageMatch && potentialMatch && priceMatch;
  });

  const getPlayerCurrentTeamBudget = () => finances[selectedTeam].transferBudget;

  // Enhanced filtering with multiple criteria
  const enhancedFilteredPlayers = useMemo(() => {
    const players =
      activeTab === 'for_sale'
        ? transferMarket.forSale
        : activeTab === 'for_loan'
          ? transferMarket.forLoan
          : transferMarket.freeAgents;

    return players
      .filter(player => {
        const nameMatch = player.name
          .toLowerCase()
          .includes(transferMarketFilters.name.toLowerCase());
        const positionMatch =
          transferMarketFilters.position === 'All' ||
          player.roleId.includes(transferMarketFilters.position);
        const ageMatch =
          player.age >= transferMarketFilters.age.min &&
          player.age <= transferMarketFilters.age.max;
        const potentialMatch =
          player.currentPotential >= transferMarketFilters.potential.min &&
          player.currentPotential <= transferMarketFilters.potential.max;
        const priceMatch =
          activeTab === 'free_agents' ||
          ((player as any).askingPrice >= transferMarketFilters.price.min &&
            (player as any).askingPrice <= transferMarketFilters.price.max);

        return nameMatch && positionMatch && ageMatch && potentialMatch && priceMatch;
      })
      .sort((a, b) => {
        // Sort by value rating
        const aRating = a.currentPotential / ((a as any).askingPrice || 1);
        const bRating = b.currentPotential / ((b as any).askingPrice || 1);
        return bRating - aRating;
      });
  }, [transferMarket, activeTab, transferMarketFilters]);

  // Loan handling
  const handleLoanPlayer = (player: TransferPlayer) => {
    const budget = finances[selectedTeam].wageBudget;
    const loanWage = (player as any).askingPrice * 0.1; // 10% of value as loan wage

    if (budget >= loanWage) {
      (dispatch as (action: { type: string; payload?: any }) => void)({
        type: 'LOAN_TRANSFER_PLAYER',
        payload: { player, team: selectedTeam, loanWage },
      });
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Successfully loaned ${player.name} for $${loanWage.toLocaleString()}/week`,
          type: 'success',
        },
      });
    } else {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Insufficient wage budget to loan ${player.name}`,
          type: 'error',
        },
      });
    }
  };

  // Negotiate transfer
  const handleNegotiate = async (player: TransferPlayer) => {
    try {
      const result = await (aiService.getTacticalAdvice as any)(player, selectedTeam);
      const negotiationResult = result as {
        isDealAccepted?: boolean;
        finalPrice?: number;
        response?: string;
      };

      if (negotiationResult.isDealAccepted && negotiationResult.finalPrice !== undefined) {
        dispatch({
          type: 'SIGN_TRANSFER_PLAYER',
          payload: {
            player: { ...player, askingPrice: negotiationResult.finalPrice },
            team: selectedTeam,
          },
        });
        uiDispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            message: `Transfer negotiation successful! Signed ${player.name} for $${negotiationResult.finalPrice.toLocaleString()}`,
            type: 'success',
          },
        });
      } else {
        uiDispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            message: `Transfer negotiation failed: ${negotiationResult.response}`,
            type: 'warning',
          },
        });
      }
    } catch (error) {
      console.error('Transfer negotiation failed:', error);
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Transfer negotiation system unavailable',
          type: 'error',
        },
      });
    }
  };

  // Player comparison
  const handleComparePlayer = (player: TransferPlayer) => {
    const currentPlayers = tacticsState.players.filter(p => p.team === selectedTeam);
    const similarPosition = currentPlayers.filter(p => p.roleId === player.roleId);

    (uiDispatch as (action: { type: string; payload?: any }) => void)({
      type: 'OPEN_PLAYER_COMPARISON',
      payload: {
        targetPlayer: player,
        comparisonPlayers: similarPosition.slice(0, 3),
      },
    });
  };

  return (
    <ResponsivePage title="Transfer Market" maxWidth="full">
      <div className="space-y-6">
        {/* Header Description */}
        <p className="text-sm sm:text-base text-gray-400">
          Buy and sell players to strengthen your squad
        </p>

        {/* Team Selector */}
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-1 inline-flex gap-1">
            <TouchButton
              onClick={() => setSelectedTeam('home')}
              variant={selectedTeam === 'home' ? 'primary' : 'secondary'}
              size="md"
            >
              Home Team
            </TouchButton>
            <TouchButton
              onClick={() => setSelectedTeam('away')}
              variant={selectedTeam === 'away' ? 'primary' : 'secondary'}
              size="md"
            >
              Away Team
            </TouchButton>
          </div>
          <div>
            <span className="text-sm text-gray-400">Transfer Budget: </span>
            <span className="text-lg font-bold text-green-400">
              ${getPlayerCurrentTeamBudget().toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('for_sale')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'for_sale'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                For Sale ({transferMarket.forSale.length})
              </button>
              <button
                onClick={() => setActiveTab('for_loan')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'for_loan'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                For Loan ({transferMarket.forLoan.length})
              </button>
              <button
                onClick={() => setActiveTab('free_agents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'free_agents'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Free Agents ({transferMarket.freeAgents.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={transferMarketFilters.name}
                onChange={e => handleFilterChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Search players..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <select
                value={transferMarketFilters.position}
                onChange={e => handleFilterChange('position', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="All">All Positions</option>
                <option value="GK">Goalkeeper</option>
                <option value="DF">Defender</option>
                <option value="MF">Midfielder</option>
                <option value="FW">Forward</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Age Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={transferMarketFilters.age.min}
                  onChange={e =>
                    handleFilterChange('age', {
                      ...transferMarketFilters.age,
                      min: parseInt(e.target.value) || 16,
                    })
                  }
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Min"
                  min="16"
                  max="45"
                />
                <input
                  type="number"
                  value={transferMarketFilters.age.max}
                  onChange={e =>
                    handleFilterChange('age', {
                      ...transferMarketFilters.age,
                      max: parseInt(e.target.value) || 45,
                    })
                  }
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Max"
                  min="16"
                  max="45"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Potential Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={transferMarketFilters.potential.min}
                  onChange={e =>
                    handleFilterChange('potential', {
                      ...transferMarketFilters.potential,
                      min: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Min"
                  min="0"
                  max="100"
                />
                <input
                  type="number"
                  value={transferMarketFilters.potential.max}
                  onChange={e =>
                    handleFilterChange('potential', {
                      ...transferMarketFilters.potential,
                      max: parseInt(e.target.value) || 100,
                    })
                  }
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Max"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price Range ($k)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={transferMarketFilters.price.min / 1000}
                  onChange={e =>
                    handleFilterChange('price', {
                      ...transferMarketFilters.price,
                      min: (parseInt(e.target.value) || 0) * 1000,
                    })
                  }
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Min"
                  min="0"
                />
                <input
                  type="number"
                  value={transferMarketFilters.price.max / 1000}
                  onChange={e =>
                    handleFilterChange('price', {
                      ...transferMarketFilters.price,
                      max: (parseInt(e.target.value) || 100000) * 1000,
                    })
                  }
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Player List */}
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
          {activeTab === 'for_sale' &&
            enhancedFilteredPlayers.map(player => (
              <ResponsiveCard
                key={player.id}
                padding="lg"
                className="border border-gray-700 hover:border-teal-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                    <p className="text-sm text-gray-400">
                      Age {player.age} • {player.nationality}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">
                      ${(player as any).askingPrice.toLocaleString()}
                    </p>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      Potential: {player.currentPotential}
                    </span>
                  </div>
                </div>

                {/* Key Attributes */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      Speed: {player.attributes.speed}
                    </span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      Shooting: {player.attributes.shooting}
                    </span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      Passing: {player.attributes.passing}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <TouchButton
                      onClick={() => handleSignPlayer(player as any)}
                      disabled={getPlayerCurrentTeamBudget() < (player as any).askingPrice}
                      variant={
                        getPlayerCurrentTeamBudget() >= (player as any).askingPrice
                          ? 'primary'
                          : 'secondary'
                      }
                      size="md"
                      className={`flex-1 ${
                        getPlayerCurrentTeamBudget() >= (player as any).askingPrice
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {getPlayerCurrentTeamBudget() >= (player as any).askingPrice
                        ? 'Buy Now'
                        : 'Insufficient Funds'}
                    </TouchButton>
                    <TouchButton
                      onClick={() => handleNegotiate(player as any)}
                      variant="primary"
                      size="md"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Negotiate
                    </TouchButton>
                  </div>
                  <div className="flex gap-2">
                    <TouchButton
                      onClick={() => handleScoutPlayer(player as any)}
                      variant="primary"
                      size="md"
                      className="flex-1"
                    >
                      Scout Report
                    </TouchButton>
                    <TouchButton
                      onClick={() => handleComparePlayer(player as any)}
                      variant="primary"
                      size="md"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Compare
                    </TouchButton>
                  </div>
                </div>
              </ResponsiveCard>
            ))}

          {/* Empty State */}
          {activeTab === 'for_sale' && enhancedFilteredPlayers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-lg font-medium">No players match your current filters</p>
                <p className="text-sm mt-2">
                  Try adjusting your search criteria or browse other tabs
                </p>
                <div className="mt-4">
                  <TouchButton
                    onClick={() => uiDispatch({ type: 'RESET_TRANSFER_FILTERS' })}
                    variant="primary"
                    size="md"
                  >
                    Reset Filters
                  </TouchButton>
                </div>
              </div>
            </div>
          )}

          {/* For Loan Tab */}
          {activeTab === 'for_loan' &&
            transferMarket.forLoan.map(player => (
              <ResponsiveCard
                key={player.id}
                padding="lg"
                className="border border-gray-700 hover:border-teal-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                    <p className="text-sm text-gray-400">
                      Age {player.age} • {player.nationality}
                    </p>
                  </div>
                  <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">LOAN</span>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex gap-2">
                    <TouchButton
                      onClick={() => handleLoanPlayer(player as any)}
                      variant="primary"
                      size="md"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Loan Player
                    </TouchButton>
                    <span className="text-xs text-gray-400 self-center">
                      ~${((player as any).askingPrice * 0.1).toLocaleString()}/week
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <TouchButton
                      onClick={() => handleScoutPlayer(player as any)}
                      variant="primary"
                      size="md"
                      className="flex-1"
                    >
                      Scout Report
                    </TouchButton>
                    <TouchButton
                      onClick={() => handleComparePlayer(player as any)}
                      variant="primary"
                      size="md"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Compare
                    </TouchButton>
                  </div>
                </div>
              </ResponsiveCard>
            ))}

          {/* Free Agents Tab */}
          {activeTab === 'free_agents' &&
            transferMarket.freeAgents.map(player => (
              <ResponsiveCard
                key={player.id}
                padding="lg"
                className="border border-gray-700 hover:border-teal-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                    <p className="text-sm text-gray-400">
                      Age {player.age} • {player.nationality}
                    </p>
                  </div>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">FREE</span>
                </div>
                {/* Player Stats Preview */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      Speed: {player.attributes.speed}
                    </span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      Shooting: {player.attributes.shooting}
                    </span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      Passing: {player.attributes.passing}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <TouchButton
                    onClick={() => handleSignPlayer(player as any)}
                    variant="primary"
                    size="md"
                    fullWidth
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Sign Free Agent (No Fee)
                  </TouchButton>
                  <div className="flex gap-2">
                    <TouchButton
                      onClick={() => handleScoutPlayer(player as any)}
                      variant="primary"
                      size="md"
                      className="flex-1"
                    >
                      Scout Report
                    </TouchButton>
                    <TouchButton
                      onClick={() => handleComparePlayer(player as any)}
                      variant="primary"
                      size="md"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Compare
                    </TouchButton>
                  </div>
                </div>
              </ResponsiveCard>
            ))}
        </ResponsiveGrid>
      </div>
    </ResponsivePage>
  );
};

export default TransfersPage;
