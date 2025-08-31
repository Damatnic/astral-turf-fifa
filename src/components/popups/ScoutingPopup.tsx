import React, { useEffect } from 'react';
import { useUIContext, useTacticsContext, useFranchiseContext } from '../../hooks';
import { CloseIcon, BrainCircuitIcon, LoadingSpinner, MicroscopeIcon } from '../ui/icons';
import { getPlayerScoutingReport } from "../../services/aiServiceLoader";
import type { TransferPlayer } from '../../types';

const ScoutingPopup: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { tacticsState } = useTacticsContext();
    const { franchiseState } = useFranchiseContext();
    const { isScoutingPlayer, scoutReport, scoutedPlayerId, settings, activeTeamContext } = uiState;
    const { transferMarket } = franchiseState;
    const { formations, activeFormationIds, teamTactics } = tacticsState;

    const player = transferMarket.forSale.find(p => p.id === scoutedPlayerId) as TransferPlayer | undefined;

    useEffect(() => {
        if (player && !scoutReport && !isScoutingPlayer) {
            dispatch({ type: 'GET_PLAYER_SCOUT_REPORT_START', payload: { playerId: player.id } });

            const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
            const formation = formations[activeFormationIds[activeTeam]];
            const tactics = teamTactics[activeTeam];

            if (!formation) {
                dispatch({ type: 'GET_PLAYER_SCOUT_REPORT_FAILURE' });
                return;
            }

            getPlayerScoutingReport(player, formation, tactics, settings.aiPersonality)
                .then(report => dispatch({ type: 'GET_PLAYER_SCOUT_REPORT_SUCCESS', payload: { report } }))
                .catch(err => {
                    console.error(err);
                    dispatch({ type: 'GET_PLAYER_SCOUT_REPORT_FAILURE' });
                });
        }
    }, [player, scoutReport, isScoutingPlayer, dispatch, activeTeamContext, formations, activeFormationIds, teamTactics, settings.aiPersonality]);

    const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

    if (!player) {return null;}

    return (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
            <div onClick={e => e.stopPropagation()} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center"><MicroscopeIcon className="w-5 h-5 mr-2" />Scout Report: {player.name}</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isScoutingPlayer && <div className="flex justify-center py-10"><LoadingSpinner className="w-8 h-8"/></div>}
                    {scoutReport && (
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-bold text-green-400 mb-1">Strengths</h4>
                                <ul className="list-disc list-inside text-gray-300">
                                    {scoutReport.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-bold text-yellow-400 mb-1">Weaknesses</h4>
                                <ul className="list-disc list-inside text-gray-300">
                                    {scoutReport.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-300 mb-1">Summary</h4>
                                <p className="text-gray-400 italic">"{scoutReport.summary}"</p>
                            </div>
                             <div>
                                <h4 className="font-bold text-blue-400 mb-1">Potential Tactical Fit</h4>
                                <p className="text-gray-300">{scoutReport.potentialFit}</p>
                            </div>
                             <div className="pt-2 text-center">
                                <p className="text-gray-400">Estimated Value</p>
                                <p className="text-2xl font-bold text-teal-300">${scoutReport.estimatedValue.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </div>
                 <div className="p-4 border-t border-gray-700 text-right">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ScoutingPopup;
