
import React from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import { BanknoteIcon } from '../components/ui/icons';
import { SponsorshipDeal } from '../types';

const MOCK_DEALS: SponsorshipDeal[] = [
    { id: 'deal1', name: 'AstraTech Inc.', weeklyIncome: 75000, perWinBonus: 10000 },
    { id: 'deal2', name: 'Quantum Cola', weeklyIncome: 50000, perWinBonus: 25000 },
    { id: 'deal3', name: 'Nebula Airlines', weeklyIncome: 100000, perWinBonus: 5000 },
];

const SponsorshipsPage: React.FC = () => {
    const { uiState } = useUIContext();
    const { dispatch } = useFranchiseContext();
    const activeTeam = uiState.activeTeamContext === 'away' ? 'away' : 'home';

    const handleSelectDeal = (deal: SponsorshipDeal) => {
        dispatch({ type: 'SET_SPONSORSHIP_DEAL', payload: { deal, team: activeTeam } });
        // Normally would navigate away, but since it's a modal-like page, this is fine.
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700/50 flex flex-col animate-fade-in-scale"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <BanknoteIcon className="w-5 h-5 mr-3" />
                        Choose Sponsorship Deal
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {MOCK_DEALS.map(deal => (
                        <div key={deal.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-white">{deal.name}</p>
                                <p className="text-sm text-gray-300">Base: <span className="font-semibold text-green-400">${deal.weeklyIncome.toLocaleString()}/wk</span></p>
                                <p className="text-sm text-gray-300">Bonus: <span className="font-semibold text-yellow-400">${deal.perWinBonus.toLocaleString()}/win</span></p>
                            </div>
                            <button onClick={() => handleSelectDeal(deal)} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md text-sm">Select</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SponsorshipsPage;