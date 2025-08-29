
import React from 'react';
import { useFranchiseContext } from '../hooks';
import { TrophyIcon, StarIcon } from '../components/ui/icons';

const ClubHistoryPage: React.FC = () => {
    const { franchiseState } = useFranchiseContext();
    const { historicalData, hallOfFame } = franchiseState;

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <TrophyIcon className="w-5 h-5 mr-3" />
                        Club History
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Season History</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {historicalData.length > 0 ? (
                            historicalData.slice().reverse().map(record => (
                                <div key={record.season} className="p-3 bg-gray-700/50 rounded-md">
                                    <p className="font-bold text-white">Season {record.season}</p>
                                    <p className="text-sm text-gray-300">Final Position: <span className="font-semibold text-teal-400">{record.userPosition}</span></p>
                                    <p className="text-sm text-gray-300">Champion: <span className="font-semibold text-yellow-400">{record.champions}</span></p>
                                    {record.topScorer && <p className="text-xs text-gray-400">Top Scorer: {record.topScorer.name} ({record.topScorer.goals})</p>}
                                </div>
                            ))
                        ) : (
                             <p className="text-center text-gray-500 py-10">No season history yet.</p>
                        )}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Hall of Fame</h3>
                         <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {hallOfFame.length > 0 ? (
                            hallOfFame.map(player => (
                                <div key={player.id} className="p-3 bg-yellow-500/10 rounded-md border-l-4 border-yellow-500">
                                    <p className="font-bold text-yellow-300 flex items-center"><StarIcon className="w-4 h-4 mr-2" /> {player.name}</p>
                                    <p className="text-xs text-gray-400">Retired after {player.age - 16} seasons.</p>
                                </div>
                            ))
                        ) : (
                             <p className="text-center text-gray-500 py-10">No players have been inducted yet.</p>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubHistoryPage;