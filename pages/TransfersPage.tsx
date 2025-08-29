
import React, { useEffect, useMemo, useState } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import { RepeatIcon, MicroscopeIcon } from '../components/ui/icons';
import { Player, TransferPlayer, PositionRole, TransferMarketFilters } from '../types';
import { PLAYER_ROLES } from '../constants';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-colors ${
            active
                ? 'border-b-2 border-teal-400 text-teal-300'
                : 'text-gray-400 hover:text-white'
        }`}
    >
        {children}
    </button>
);


const TransfersPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const { transferMarket } = franchiseState;
    const { activeTeamContext, transferMarketFilters } = uiState;
    const { players } = tacticsState;
    const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'loan' | 'free_agents'>('buy');

    const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
    
    useEffect(() => {
        if (transferMarket.forSale.length === 0 && activeTab === 'buy') {
            dispatch({ type: 'GENERATE_TRANSFER_MARKET_PLAYERS' });
        }
    }, [transferMarket.forSale.length, dispatch, activeTab]);

    const filteredPlayers = useMemo(() => {
        const { name, position, age, potential, price } = transferMarketFilters;
        let sourceList: (Player | TransferPlayer)[] = [];
        if (activeTab === 'buy') sourceList = transferMarket.forSale;
        if (activeTab === 'free_agents') sourceList = transferMarket.freeAgents;

        return sourceList.filter(p => {
            const role = PLAYER_ROLES.find(r => r.id === p.roleId);
            return (
                p.name.toLowerCase().includes(name.toLowerCase()) &&
                (position === 'All' || role?.category === position) &&
                (p.age >= age.min && p.age <= age.max) &&
                (p.currentPotential >= potential.min && p.currentPotential <= potential.max) &&
                ('askingPrice' in p ? (p.askingPrice >= price.min && p.askingPrice <= price.max) : true)
            );
        });
    }, [transferMarket.forSale, transferMarket.freeAgents, transferMarketFilters, activeTab]);
    
    const handleSignPlayer = (player: TransferPlayer) => {
        if (confirm(`Are you sure you want to sign ${player.name} for $${player.askingPrice.toLocaleString()}?`)) {
            dispatch({ type: 'SIGN_TRANSFER_PLAYER', payload: { player, team: activeTeam } });
        }
    }

    const handleSignFreeAgent = (player: Player) => {
        if (confirm(`Are you sure you want to sign free agent ${player.name}? This will only affect your wage budget.`)) {
            const transferPlayer: TransferPlayer = { ...player, askingPrice: 0 };
            dispatch({ type: 'SIGN_TRANSFER_PLAYER', payload: { player: transferPlayer, team: activeTeam } });
        }
    };
    
    const handleSellPlayer = (player: Player) => {
        const price = parseInt(prompt(`Enter sale price for ${player.name}:`, `${player.contract.wage * 52 * 1.5}`) || "0");
        if(price > 0) {
            dispatch({ type: 'SELL_PLAYER', payload: { playerId: player.id, price } });
        }
    }
    
    const handleLoanPlayer = (player: Player) => {
        const fee = parseInt(prompt(`Enter loan fee for ${player.name}:`, `0`) || "0");
        const wageContribution = parseInt(prompt(`Enter wage contribution percentage (0-100):`, `50`) || "50");
        if(confirm(`Loan out ${player.name} for a $${fee.toLocaleString()} fee with ${wageContribution}% wage contribution?`)) {
            dispatch({ type: 'LOAN_PLAYER', payload: { playerId: player.id, fee, wageContribution } });
        }
    }

    const handleSignLoanPlayer = (player: Player) => {
        const fee = player.loan.loanFee || 0;
        const wageContribution = player.loan.wageContribution || 100;
        if(confirm(`Sign ${player.name} on loan for a $${fee.toLocaleString()} fee and ${wageContribution}% wage contribution?`)) {
            dispatch({ type: 'SIGN_LOAN_PLAYER', payload: { player, fee, wageContribution } });
        }
    }

    const handleScoutPlayer = (playerId: string) => {
        uiDispatch({ type: 'GET_PLAYER_SCOUT_REPORT_START', payload: { playerId } });
    };

    const handleFilterChange = (filter: keyof TransferMarketFilters, value: any, field?: 'min' | 'max') => {
        let finalValue = value;
        if (field) {
            // Ensure min is not greater than max and vice versa
            const currentRange = transferMarketFilters[filter as 'age' | 'potential' | 'price'];
            const parsedValue = parseInt(value, 10);
            if (field === 'min' && parsedValue > currentRange.max) {
                finalValue = { min: parsedValue, max: parsedValue };
            } else if (field === 'max' && parsedValue < currentRange.min) {
                finalValue = { min: parsedValue, max: parsedValue };
            } else {
                finalValue = { ...currentRange, [field]: parsedValue };
            }
        }
        uiDispatch({ type: 'SET_TRANSFER_MARKET_FILTER', payload: { filter, value: finalValue } });
    }
    
    const getTeamPlayers = (team: 'home' | 'away') => players.filter(p => p.team === team && !p.loan.isLoaned);

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <RepeatIcon className="w-5 h-5 mr-3" />
                        Transfer & Loan Market
                    </h2>
                </div>
                 <div className="border-b border-gray-700">
                    <nav className="flex space-x-2 px-4">
                        <TabButton active={activeTab === 'buy'} onClick={() => setActiveTab('buy')}>Buy Players</TabButton>
                        <TabButton active={activeTab === 'sell'} onClick={() => setActiveTab('sell')}>Sell / Loan Out</TabButton>
                        <TabButton active={activeTab === 'loan'} onClick={() => setActiveTab('loan')}>Loan Market</TabButton>
                        <TabButton active={activeTab === 'free_agents'} onClick={() => setActiveTab('free_agents')}>Free Agents</TabButton>
                    </nav>
                </div>
                
                <div className="flex flex-grow min-h-0">
                    {(activeTab === 'buy' || activeTab === 'free_agents') && (
                        <aside className="w-64 bg-gray-900/50 p-4 space-y-4 overflow-y-auto flex-shrink-0">
                             <h3 className="font-bold text-lg text-gray-300">Filters</h3>
                             <div>
                                <label className="text-sm font-medium text-gray-400">Name</label>
                                <input type="text" value={transferMarketFilters.name} onChange={e => handleFilterChange('name', e.target.value)} className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm" />
                             </div>
                              <div>
                                <label className="text-sm font-medium text-gray-400">Position</label>
                                <select value={transferMarketFilters.position} onChange={e => handleFilterChange('position', e.target.value)} className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm">
                                    <option value="All">All</option>
                                    <option value="GK">Goalkeepers</option>
                                    <option value="DF">Defenders</option>
                                    <option value="MF">Midfielders</option>
                                    <option value="FW">Forwards</option>
                                </select>
                             </div>
                             <div>
                                <label className="text-sm font-medium text-gray-400 flex justify-between">Age <span>{transferMarketFilters.age.min}-{transferMarketFilters.age.max}</span></label>
                                <input type="range" min="16" max="40" value={transferMarketFilters.age.min} onChange={e => handleFilterChange('age', parseInt(e.target.value), 'min')} className="w-full" />
                                <input type="range" min="16" max="40" value={transferMarketFilters.age.max} onChange={e => handleFilterChange('age', parseInt(e.target.value), 'max')} className="w-full" />
                             </div>
                             <div>
                                <label className="text-sm font-medium text-gray-400 flex justify-between">Potential <span>{transferMarketFilters.potential.min}-{transferMarketFilters.potential.max}</span></label>
                                <input type="range" min="40" max="99" value={transferMarketFilters.potential.min} onChange={e => handleFilterChange('potential', parseInt(e.target.value), 'min')} className="w-full" />
                                <input type="range" min="40" max="99" value={transferMarketFilters.potential.max} onChange={e => handleFilterChange('potential', parseInt(e.target.value), 'max')} className="w-full" />
                             </div>
                             {activeTab === 'buy' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400 flex justify-between">Price</label>
                                    <p className="text-xs text-center text-gray-300">${transferMarketFilters.price.min.toLocaleString()} - ${transferMarketFilters.price.max.toLocaleString()}</p>
                                    <input type="range" min="0" max="100000000" step="100000" value={transferMarketFilters.price.min} onChange={e => handleFilterChange('price', parseInt(e.target.value), 'min')} className="w-full" />
                                    <input type="range" min="0" max="100000000" step="100000" value={transferMarketFilters.price.max} onChange={e => handleFilterChange('price', parseInt(e.target.value), 'max')} className="w-full" />
                                </div>
                             )}
                        </aside>
                    )}
                    <main className="flex-grow p-4 overflow-y-auto">
                        {activeTab === 'buy' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(filteredPlayers as TransferPlayer[]).map(player => (
                                    <div key={player.id} className="bg-gray-700/50 rounded-lg p-3 flex flex-col justify-between">
                                        <div>
                                            <p className="font-bold text-white text-lg">{player.name}</p>
                                            <p className="text-sm text-gray-400">Age: {player.age} | Pot: {player.potential[0]}-{player.potential[1]}</p>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-400">Asking Price</p>
                                            <p className="font-semibold text-teal-400 text-lg">${player.askingPrice.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">Wage: ${player.contract.wage.toLocaleString()}/wk</p>
                                        </div>
                                        <div className="flex space-x-2 mt-3">
                                            <button onClick={() => uiDispatch({type: 'GET_PLAYER_SCOUT_REPORT_START', payload: {playerId: player.id}})} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md text-sm flex items-center justify-center"><MicroscopeIcon className="w-4 h-4 mr-1"/>Scout</button>
                                            <button onClick={() => handleSignPlayer(player)} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md text-sm">Sign</button>
                                        </div>
                                    </div>
                                ))}
                                 {filteredPlayers.length === 0 && (
                                    <p className="text-gray-500 text-center col-span-full py-10">No players match your criteria.</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'free_agents' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(filteredPlayers as Player[]).map(player => (
                                    <div key={player.id} className="bg-gray-700/50 rounded-lg p-3 flex flex-col justify-between">
                                        <div>
                                            <p className="font-bold text-white text-lg">{player.name}</p>
                                            <p className="text-sm text-gray-400">Age: {player.age} | Pot: {player.potential[0]}-{player.potential[1]}</p>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-400">Asking Price</p>
                                            <p className="font-semibold text-teal-400 text-lg">Free Agent</p>
                                            <p className="text-xs text-gray-500">Wage: ${player.contract.wage.toLocaleString()}/wk</p>
                                        </div>
                                        <div className="flex space-x-2 mt-3">
                                             <button onClick={() => uiDispatch({type: 'GET_PLAYER_SCOUT_REPORT_START', payload: {playerId: player.id}})} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md text-sm flex items-center justify-center"><MicroscopeIcon className="w-4 h-4 mr-1"/>Scout</button>
                                            <button onClick={() => handleSignFreeAgent(player)} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md text-sm">Sign</button>
                                        </div>
                                    </div>
                                ))}
                                {filteredPlayers.length === 0 && (
                                    <p className="text-gray-500 text-center col-span-full py-10">No free agents match your criteria.</p>
                                )}
                             </div>
                        )}
                        {activeTab === 'sell' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {getTeamPlayers(activeTeam).map(player => (
                                    <div key={player.id} className="bg-gray-700/50 rounded-lg p-4 flex flex-col justify-between">
                                        <div>
                                            <p className="font-bold text-white text-lg">{player.name}</p>
                                            <p className="text-sm text-gray-400">Age: {player.age} | Value: ~${(player.contract.wage * 52 * 1.5).toLocaleString()}</p>
                                        </div>
                                        <div className="flex space-x-2 mt-4">
                                            <button
                                                onClick={() => handleSellPlayer(player)}
                                                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-md text-sm"
                                            >
                                                Sell
                                            </button>
                                            <button
                                                onClick={() => handleLoanPlayer(player)}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md text-sm"
                                            >
                                                Loan
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'loan' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {transferMarket.forLoan.map(player => (
                                    <div key={player.id} className="bg-gray-700/50 rounded-lg p-4 flex flex-col justify-between">
                                        <div>
                                            <p className="font-bold text-white text-lg">{player.name}</p>
                                            <p className="text-sm text-gray-400">Age: {player.age} | From: {player.loan.loanedFrom}</p>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-400">Loan Fee</p>
                                            <p className="font-semibold text-teal-400 text-xl">${player.loan.loanFee?.toLocaleString() || 0}</p>
                                            <p className="text-xs text-gray-500">Wage Share: {player.loan.wageContribution || 100}%</p>
                                        </div>
                                        <button
                                            onClick={() => handleSignLoanPlayer(player)}
                                            className="w-full mt-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md text-sm"
                                        >
                                            Sign on Loan
                                        </button>
                                    </div>
                                ))}
                                {transferMarket.forLoan.length === 0 && (
                                    <p className="text-gray-500 text-center col-span-full py-10">The loan market is currently empty.</p>
                                )}
                            </div>
                        )}
                    </main>
                </div>
                <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-end">
                    <button 
                        onClick={() => dispatch({ type: 'GENERATE_TRANSFER_MARKET_PLAYERS' })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md text-sm"
                    >
                        Refresh Market
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransfersPage;