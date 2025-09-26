import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import type { TransferPlayer, PositionRole, Team } from '../types';

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
        if (budget >= player.askingPrice) {
            dispatch({
                type: 'SIGN_TRANSFER_PLAYER',
                payload: { player, team: selectedTeam },
            });
            uiDispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    message: `Successfully signed ${player.name} for $${player.askingPrice.toLocaleString()}`,
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

    const handleScoutPlayer = (playerId: string) => {
        uiDispatch({
            type: 'GET_PLAYER_SCOUT_REPORT_START',
            payload: { playerId },
        });
    };

    const handleFilterChange = (filter: keyof typeof transferMarketFilters, value: unknown) => {
        uiDispatch({
            type: 'SET_TRANSFER_MARKET_FILTER',
            payload: { filter, value },
        });
    };

    const filteredPlayers = transferMarket.forSale.filter(player => {
        const nameMatch = player.name.toLowerCase().includes(transferMarketFilters.name.toLowerCase());
        const positionMatch = transferMarketFilters.position === 'All' || player.roleId.includes(transferMarketFilters.position);
        const ageMatch = player.age >= transferMarketFilters.age.min && player.age <= transferMarketFilters.age.max;
        const potentialMatch = player.currentPotential >= transferMarketFilters.potential.min &&
                             player.currentPotential <= transferMarketFilters.potential.max;
        const priceMatch = player.askingPrice >= transferMarketFilters.price.min &&
                          player.askingPrice <= transferMarketFilters.price.max;

        return nameMatch && positionMatch && ageMatch && potentialMatch && priceMatch;
    });

    const getPlayerCurrentTeamBudget = () => finances[selectedTeam].transferBudget;

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Transfer Market</h1>
                    <p className="text-gray-400">Buy and sell players to strengthen your squad</p>
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
                    <div className="mt-2">
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
                                onChange={(e) => handleFilterChange('name', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Search players..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                            <select
                                value={transferMarketFilters.position}
                                onChange={(e) => handleFilterChange('position', e.target.value)}
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
                                    onChange={(e) => handleFilterChange('age', { ...transferMarketFilters.age, min: parseInt(e.target.value) || 16 })}
                                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Min"
                                    min="16"
                                    max="45"
                                />
                                <input
                                    type="number"
                                    value={transferMarketFilters.age.max}
                                    onChange={(e) => handleFilterChange('age', { ...transferMarketFilters.age, max: parseInt(e.target.value) || 45 })}
                                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Max"
                                    min="16"
                                    max="45"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Potential Range</label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    value={transferMarketFilters.potential.min}
                                    onChange={(e) => handleFilterChange('potential', { ...transferMarketFilters.potential, min: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Min"
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    value={transferMarketFilters.potential.max}
                                    onChange={(e) => handleFilterChange('potential', { ...transferMarketFilters.potential, max: parseInt(e.target.value) || 100 })}
                                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Max"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Price Range ($k)</label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    value={transferMarketFilters.price.min / 1000}
                                    onChange={(e) => handleFilterChange('price', { ...transferMarketFilters.price, min: (parseInt(e.target.value) || 0) * 1000 })}
                                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Min"
                                    min="0"
                                />
                                <input
                                    type="number"
                                    value={transferMarketFilters.price.max / 1000}
                                    onChange={(e) => handleFilterChange('price', { ...transferMarketFilters.price, max: (parseInt(e.target.value) || 100000) * 1000 })}
                                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Max"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Player List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'for_sale' && filteredPlayers.map((player) => (
                        <div key={player.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-teal-500 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                                    <p className="text-sm text-gray-400">Age {player.age} • {player.nationality}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-yellow-400">
                                        ${player.askingPrice.toLocaleString()}
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
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleSignPlayer(player)}
                                    disabled={getPlayerCurrentTeamBudget() < player.askingPrice}
                                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        getPlayerCurrentTeamBudget() >= player.askingPrice
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {getPlayerCurrentTeamBudget() >= player.askingPrice ? 'Sign Player' : 'Insufficient Funds'}
                                </button>
                                <button
                                    onClick={() => handleScoutPlayer(player.id)}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Scout
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {activeTab === 'for_sale' && filteredPlayers.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-400 text-lg">No players match your current filters</p>
                            <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
                        </div>
                    )}

                    {/* For Loan Tab */}
                    {activeTab === 'for_loan' && transferMarket.forLoan.map((player) => (
                        <div key={player.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-teal-500 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                                    <p className="text-sm text-gray-400">Age {player.age} • {player.nationality}</p>
                                </div>
                                <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">LOAN</span>
                            </div>
                            <div className="flex space-x-2 mt-4">
                                <button className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium transition-colors">
                                    Loan Player
                                </button>
                                <button
                                    onClick={() => handleScoutPlayer(player.id)}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Scout
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Free Agents Tab */}
                    {activeTab === 'free_agents' && transferMarket.freeAgents.map((player) => (
                        <div key={player.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-teal-500 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                                    <p className="text-sm text-gray-400">Age {player.age} • {player.nationality}</p>
                                </div>
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">FREE</span>
                            </div>
                            <div className="flex space-x-2 mt-4">
                                <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors">
                                    Sign Free Agent
                                </button>
                                <button
                                    onClick={() => handleScoutPlayer(player.id)}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Scout
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TransfersPage;