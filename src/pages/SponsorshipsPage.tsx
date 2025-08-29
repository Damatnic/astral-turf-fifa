import React, { useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import { Team, SponsorshipDeal } from '../../types';

const SponsorshipsPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const [selectedTeam, setSelectedTeam] = useState<Team>('home');

    const currentDeal = franchiseState.sponsorships[selectedTeam];

    // Mock available sponsorship deals
    const availableDeals: SponsorshipDeal[] = [
        {
            id: 'nike',
            name: 'Nike',
            weeklyIncome: 25000,
            perWinBonus: 5000
        },
        {
            id: 'adidas',
            name: 'Adidas',
            weeklyIncome: 28000,
            perWinBonus: 4500
        },
        {
            id: 'puma',
            name: 'Puma',
            weeklyIncome: 22000,
            perWinBonus: 6000
        },
        {
            id: 'under_armour',
            name: 'Under Armour',
            weeklyIncome: 20000,
            perWinBonus: 7000
        },
        {
            id: 'umbro',
            name: 'Umbro',
            weeklyIncome: 18000,
            perWinBonus: 5500
        },
        {
            id: 'new_balance',
            name: 'New Balance',
            weeklyIncome: 24000,
            perWinBonus: 4000
        }
    ];

    const handleSignDeal = (deal: SponsorshipDeal) => {
        dispatch({
            type: 'SET_SPONSORSHIP_DEAL',
            payload: { deal, team: selectedTeam }
        });
        
        uiDispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: `Successfully signed sponsorship deal with ${deal.name}!`,
                type: 'success'
            }
        });
    };

    const handleTerminateDeal = () => {
        dispatch({
            type: 'SET_SPONSORSHIP_DEAL',
            payload: { deal: null, team: selectedTeam }
        });
        
        uiDispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: 'Sponsorship deal terminated',
                type: 'info'
            }
        });
    };

    const calculateSeasonValue = (deal: SponsorshipDeal) => {
        // Assuming 38 matches per season with 50% win rate
        const estimatedWins = 19;
        const seasonalWeeks = 38;
        return (deal.weeklyIncome * seasonalWeeks) + (deal.perWinBonus * estimatedWins);
    };

    const getSponsorLogo = (sponsorName: string) => {
        const colors = {
            'Nike': 'text-orange-400',
            'Adidas': 'text-blue-400',
            'Puma': 'text-yellow-400',
            'Under Armour': 'text-red-400',
            'Umbro': 'text-green-400',
            'New Balance': 'text-purple-400'
        };
        return colors[sponsorName as keyof typeof colors] || 'text-gray-400';
    };

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Sponsorship Management</h1>
                    <p className="text-gray-400">Manage sponsorship deals to boost your club's revenue</p>
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

                {/* Current Sponsorship Deal */}
                <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
                    <h3 className="text-xl font-semibold text-teal-400 mb-4">Current Sponsorship</h3>
                    
                    {currentDeal ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center mb-4">
                                    <div className={`text-4xl font-bold mr-4 ${getSponsorLogo(currentDeal.name)}`}>
                                        {currentDeal.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-white">{currentDeal.name}</h4>
                                        <p className="text-gray-400">Official Kit Partner</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                        <span className="text-gray-300">Weekly Income</span>
                                        <span className="text-green-400 font-bold">
                                            ${currentDeal.weeklyIncome.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                        <span className="text-gray-300">Win Bonus</span>
                                        <span className="text-blue-400 font-bold">
                                            ${currentDeal.perWinBonus.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                                        <span className="text-gray-300">Est. Season Value</span>
                                        <span className="text-yellow-400 font-bold">
                                            ${calculateSeasonValue(currentDeal).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center">
                                <div className="bg-gray-700 rounded-lg p-6 text-center">
                                    <div className="text-gray-400 mb-3">
                                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h5 className="text-lg font-semibold text-white mb-2">Active Contract</h5>
                                    <p className="text-gray-400 text-sm mb-4">
                                        This sponsorship deal is currently active and providing revenue to your club.
                                    </p>
                                    <button
                                        onClick={handleTerminateDeal}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                    >
                                        Terminate Deal
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-300 mb-2">No Active Sponsorship</h4>
                            <p className="text-gray-500">Your club is not currently sponsored. Consider signing a deal below.</p>
                        </div>
                    )}
                </div>

                {/* Available Sponsorship Deals */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-teal-400 mb-6">Available Sponsorship Deals</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableDeals.map((deal) => (
                            <div key={deal.id} className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:border-teal-500 transition-colors">
                                <div className="flex items-center mb-4">
                                    <div className={`text-3xl font-bold mr-3 ${getSponsorLogo(deal.name)}`}>
                                        {deal.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">{deal.name}</h4>
                                        <p className="text-gray-400 text-sm">Sports Equipment</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">Weekly Income</span>
                                        <span className="text-green-400 font-bold">
                                            ${deal.weeklyIncome.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">Win Bonus</span>
                                        <span className="text-blue-400 font-bold">
                                            ${deal.perWinBonus.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                                        <span className="text-gray-300 text-sm font-medium">Season Value</span>
                                        <span className="text-yellow-400 font-bold">
                                            ${calculateSeasonValue(deal).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleSignDeal(deal)}
                                        disabled={currentDeal?.id === deal.id}
                                        className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                                            currentDeal?.id === deal.id
                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                                        }`}
                                    >
                                        {currentDeal?.id === deal.id ? 'Current Deal' : 'Sign Deal'}
                                    </button>
                                </div>

                                {/* Deal Features */}
                                <div className="mt-4 pt-4 border-t border-gray-600">
                                    <div className="text-xs text-gray-400 space-y-1">
                                        <div className="flex items-center">
                                            <svg className="w-3 h-3 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Kit and equipment sponsorship
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-3 h-3 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Stadium branding rights
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-3 h-3 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Performance bonuses
                                        </div>
                                        {deal.weeklyIncome >= 25000 && (
                                            <div className="flex items-center">
                                                <svg className="w-3 h-3 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                                Premium partner benefits
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sponsorship Benefits Info */}
                <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-teal-400 mb-4">Sponsorship Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-green-400 mb-3">
                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Guaranteed Income</h4>
                            <p className="text-gray-400 text-sm">
                                Receive consistent weekly payments regardless of performance
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-blue-400 mb-3">
                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Performance Bonuses</h4>
                            <p className="text-gray-400 text-sm">
                                Earn additional revenue for each match victory
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-purple-400 mb-3">
                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Brand Partnership</h4>
                            <p className="text-gray-400 text-sm">
                                Access to premium equipment and marketing support
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorshipsPage;