import React from 'react';
import { useUIContext, useFranchiseContext } from '../../hooks';
import { CloseIcon, TrophyIcon, AwardIcon } from '../ui/icons';

const SeasonEndSummaryPopup: React.FC = () => {
    const { dispatch } = useUIContext();
    const { franchiseState, dispatch: franchiseDispatch } = useFranchiseContext();
    const { lastSeasonAwards, season } = franchiseState;

    const handleNextSeason = () => {
        franchiseDispatch({ type: 'ADVANCE_SEASON' });
        dispatch({ type: 'CLOSE_MODAL' });
    };

    if (!lastSeasonAwards) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center"><TrophyIcon className="w-5 h-5 mr-2" />End of Season {season.year} Summary</h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-4 text-center">
                    <div>
                        <p className="text-sm text-gray-400">League Champions</p>
                        <p className="text-2xl font-bold text-yellow-400">{lastSeasonAwards.champion}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-400">Your Final Position</p>
                        <p className="text-2xl font-bold text-white">{lastSeasonAwards.userPosition}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div>
                           <p className="text-xs text-gray-400">Player of the Season</p>
                           <p className="font-semibold text-teal-300">{lastSeasonAwards.playerOfTheSeason.name}</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-400">Young Player of the Season</p>
                           <p className="font-semibold text-teal-300">{lastSeasonAwards.youngPlayerOfTheSeason.name}</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-400">Top Scorer</p>
                           <p className="font-semibold text-teal-300">{lastSeasonAwards.topScorer.name} ({lastSeasonAwards.topScorer.goals})</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-200 mt-4 mb-2">Team of the Season</h4>
                        <div className="p-3 bg-gray-700/50 rounded-lg text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                            {lastSeasonAwards.teamOfTheSeason.map((name, i) => (
                                <p key={i} className="text-gray-300">{name || 'N/A'}</p>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 text-center">
                    <button onClick={handleNextSeason} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md">Continue to Next Season</button>
                </div>
            </div>
        </div>
    );
};

export default SeasonEndSummaryPopup;
