
import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import { BanknoteIcon, PlusIcon, TrashIcon } from '../components/ui/icons';
import { Team, FeeItem } from '../types';

const FinanceRow: React.FC<{ label: string; value: number; isExpense?: boolean }> = ({ label, value, isExpense }) => (
    <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-600/50">
        <span className="text-gray-300">{label}</span>
        <span className={`font-semibold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
            {isExpense && '-'}${value.toLocaleString()}
        </span>
    </div>
);

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


const FinancesPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { uiState } = useUIContext();
    const { finances } = franchiseState;
    const { players } = tacticsState;
    const [activeTab, setActiveTab] = useState<'overview' | 'fees'>('overview');
    
    const [newFee, setNewFee] = useState({ name: '', amount: '' });
    
    const activeTeam = uiState.activeTeamContext === 'away' ? 'away' : 'home';
    const teamFinances = finances[activeTeam];

    const calculateWeeklyWages = (team: Team): number => {
        return players.filter(p => p.team === team).reduce((total, p) => total + (p.contract.wage || 0), 0);
    }
    
    const totalFees = teamFinances.seasonalFees.reduce((sum, item) => sum + item.amount, 0);

    const handleAddFee = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(newFee.amount);
        if (newFee.name.trim() && !isNaN(amount) && amount > 0) {
            dispatch({ type: 'ADD_FEE_ITEM', payload: { team: activeTeam, item: { name: newFee.name, amount } } });
            setNewFee({ name: '', amount: '' });
        }
    };

    const handleRemoveFee = (itemId: string) => {
        dispatch({ type: 'REMOVE_FEE_ITEM', payload: { team: activeTeam, itemId } });
    };

    const FinanceCard: React.FC<{ team: 'home' | 'away'}> = ({ team }) => {
        const teamFinances = finances[team];
        const wages = calculateWeeklyWages(team);
        const remainingWageBudget = teamFinances.wageBudget - wages;
        
        const totalIncome = (Object.values(teamFinances.income) as number[]).reduce((a, b) => a + b, 0);
        const totalExpenses = (Object.values(teamFinances.expenses) as number[]).reduce((a, b) => a + b, 0);
        const netTotal = totalIncome - totalExpenses;

        return (
            <div className="bg-gray-700/50 p-4 rounded-lg space-y-4">
                <h3 className={`text-xl font-bold ${team === 'home' ? 'text-blue-400' : 'text-red-400'}`}>{team.charAt(0).toUpperCase() + team.slice(1)} Team</h3>
                <div>
                    <p className="text-sm text-gray-400">Transfer Budget</p>
                    <p className="text-2xl font-bold text-teal-400">${teamFinances.transferBudget.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">Remaining Wage Budget</p>
                    <p className={`text-xl font-bold ${remainingWageBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>${remainingWageBudget.toLocaleString()}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <BanknoteIcon className="w-5 h-5 mr-3" />
                        Finances ({activeTeam})
                    </h2>
                </div>

                <div className="border-b border-gray-700">
                    <nav className="flex space-x-2 px-4">
                        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
                        <TabButton active={activeTab === 'fees'} onClick={() => setActiveTab('fees')}>Seasonal Team Fees</TabButton>
                    </nav>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <FinanceCard team={activeTeam} />
                        </div>
                    )}
                    {activeTab === 'fees' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-200">Fee Items</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {teamFinances.seasonalFees.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-700/50 rounded-md">
                                            <span className="text-white">{item.name}</span>
                                            <div className="flex items-center">
                                                <span className="font-semibold text-green-400 mr-4">${item.amount.toLocaleString()}</span>
                                                <button onClick={() => handleRemoveFee(item.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-2 border-t border-gray-600 flex justify-between font-bold text-lg">
                                    <span className="text-white">Total Per Player</span>
                                    <span className="text-teal-400">${totalFees.toLocaleString()}</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-200">Add New Fee Item</h3>
                                <form onSubmit={handleAddFee} className="space-y-2 p-3 bg-gray-900/50 rounded-md">
                                    <input type="text" placeholder="Fee Name (e.g., Uniforms)" value={newFee.name} onChange={e => setNewFee({...newFee, name: e.target.value})} className="w-full p-2 bg-gray-700 rounded-md" />
                                    <input type="number" placeholder="Amount" value={newFee.amount} onChange={e => setNewFee({...newFee, amount: e.target.value})} className="w-full p-2 bg-gray-700 rounded-md" />
                                    <button type="submit" className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 rounded-md text-sm font-semibold flex items-center justify-center">
                                        <PlusIcon className="w-4 h-4 mr-1" /> Add Fee
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancesPage;