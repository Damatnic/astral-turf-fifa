import React, { useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';

const FinancesPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { uiState } = useUIContext();
    const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
    const [newFeeItem, setNewFeeItem] = useState({ name: '', amount: 0 });

    const finances = franchiseState.finances[selectedTeam];

    const handleAddFeeItem = () => {
        if (newFeeItem.name.trim() && newFeeItem.amount > 0) {
            dispatch({
                type: 'ADD_FEE_ITEM',
                payload: {
                    team: selectedTeam,
                    item: {
                        name: newFeeItem.name,
                        amount: newFeeItem.amount,
                    },
                },
            });
            setNewFeeItem({ name: '', amount: 0 });
        }
    };

    const handleRemoveFeeItem = (itemId: string) => {
        dispatch({
            type: 'REMOVE_FEE_ITEM',
            payload: {
                team: selectedTeam,
                itemId,
            },
        });
    };

    const totalIncome = finances.income.ticketSales + finances.income.sponsorship + finances.income.prizeMoney;
    const totalExpenses = finances.expenses.playerWages + finances.expenses.staffWages +
                         finances.expenses.stadiumMaintenance + finances.expenses.travel;
    const netIncome = totalIncome - totalExpenses;

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Financial Management</h1>
                    <p className="text-gray-400">Manage your club's finances and budget</p>
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

                {/* Budget Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Transfer Budget</p>
                                <p className="text-2xl font-bold text-green-400">
                                    ${finances.transferBudget.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-green-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Wage Budget</p>
                                <p className="text-2xl font-bold text-blue-400">
                                    ${finances.wageBudget.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-blue-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Net Income</p>
                                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${netIncome.toLocaleString()}
                                </p>
                            </div>
                            <div className={netIncome >= 0 ? 'text-green-400' : 'text-red-400'}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d={netIncome >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Income and Expenses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Income */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold text-green-400 mb-4">Income</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                <span className="text-white">Ticket Sales</span>
                                <span className="text-green-400 font-medium">
                                    ${finances.income.ticketSales.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                <span className="text-white">Sponsorship</span>
                                <span className="text-green-400 font-medium">
                                    ${finances.income.sponsorship.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                <span className="text-white">Prize Money</span>
                                <span className="text-green-400 font-medium">
                                    ${finances.income.prizeMoney.toLocaleString()}
                                </span>
                            </div>
                            <div className="border-t border-gray-600 pt-3">
                                <div className="flex justify-between items-center p-3 bg-green-600/20 rounded">
                                    <span className="text-white font-semibold">Total Income</span>
                                    <span className="text-green-400 font-bold text-lg">
                                        ${totalIncome.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold text-red-400 mb-4">Expenses</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                <span className="text-white">Player Wages</span>
                                <span className="text-red-400 font-medium">
                                    ${finances.expenses.playerWages.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                <span className="text-white">Staff Wages</span>
                                <span className="text-red-400 font-medium">
                                    ${finances.expenses.staffWages.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                <span className="text-white">Stadium Maintenance</span>
                                <span className="text-red-400 font-medium">
                                    ${finances.expenses.stadiumMaintenance.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                <span className="text-white">Travel</span>
                                <span className="text-red-400 font-medium">
                                    ${finances.expenses.travel.toLocaleString()}
                                </span>
                            </div>
                            <div className="border-t border-gray-600 pt-3">
                                <div className="flex justify-between items-center p-3 bg-red-600/20 rounded">
                                    <span className="text-white font-semibold">Total Expenses</span>
                                    <span className="text-red-400 font-bold text-lg">
                                        ${totalExpenses.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seasonal Fees */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-teal-400">Seasonal Fees</h3>
                        <button
                            onClick={handleAddFeeItem}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Add Fee
                        </button>
                    </div>

                    {/* Add New Fee Form */}
                    <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Fee Name</label>
                                <input
                                    type="text"
                                    value={newFeeItem.name}
                                    onChange={(e) => setNewFeeItem({ ...newFeeItem, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="e.g., Equipment Costs"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
                                <input
                                    type="number"
                                    value={newFeeItem.amount}
                                    onChange={(e) => setNewFeeItem({ ...newFeeItem, amount: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Existing Fees */}
                    <div className="space-y-3">
                        {finances.seasonalFees.map((fee) => (
                            <div key={fee.id} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                                <span className="text-white font-medium">{fee.name}</span>
                                <div className="flex items-center space-x-3">
                                    <span className="text-yellow-400 font-medium">
                                        ${fee.amount.toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveFeeItem(fee.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                        title="Remove fee"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {finances.seasonalFees.length === 0 && (
                            <p className="text-gray-400 text-center py-8">No seasonal fees configured</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancesPage;