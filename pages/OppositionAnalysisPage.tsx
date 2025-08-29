import React, { useState } from 'react';
import { useUIContext, useFranchiseContext } from '../hooks';
import { getOppositionAnalysis } from '../services/aiService';
import { BrainCircuitIcon, LoadingSpinner, MicroscopeIcon } from '../components/ui/icons';

const OppositionAnalysisPage: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { franchiseState } = useFranchiseContext();
    const { isLoadingOppositionReport, oppositionReport, settings, activeTeamContext } = uiState;
    const { staff } = franchiseState;

    const [opponentName, setOpponentName] = useState('');
    const [formation, setFormation] = useState('4-4-2');
    const [keyPlayers, setKeyPlayers] = useState('');

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!opponentName || !formation || !keyPlayers) return;

        dispatch({ type: 'GENERATE_OPPOSITION_REPORT_START' });
        try {
            const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
            const scoutRating = staff[activeTeam].scout?.rating || 1;
            const report = await getOppositionAnalysis(opponentName, formation, keyPlayers, settings.aiPersonality, scoutRating);
            dispatch({ type: 'GENERATE_OPPOSITION_REPORT_SUCCESS', payload: report });
        } catch (error) {
            console.error("Failed to get opposition analysis:", error);
            dispatch({ type: 'GENERATE_OPPOSITION_REPORT_FAILURE' });
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `AI error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' } });
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <MicroscopeIcon className="w-5 h-5 mr-3" />
                        Opposition Scouting Report
                    </h2>
                </div>

                <div className="p-6 flex-grow overflow-y-auto">
                    {!oppositionReport && !isLoadingOppositionReport && (
                        <form onSubmit={handleAnalyze} className="space-y-4">
                            <div>
                                <label htmlFor="opponentName" className="block text-sm font-medium text-gray-300 mb-1">Opponent Name</label>
                                <input
                                    type="text" id="opponentName" value={opponentName} onChange={e => setOpponentName(e.target.value)}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required
                                    placeholder="e.g., Real Madrid"
                                />
                            </div>
                            <div>
                                <label htmlFor="formation" className="block text-sm font-medium text-gray-300 mb-1">Assumed Formation</label>
                                <select
                                    id="formation" value={formation} onChange={e => setFormation(e.target.value)}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                                >
                                    <option>4-4-2</option>
                                    <option>4-3-3</option>
                                    <option>3-5-2</option>
                                    <option>5-3-2</option>
                                    <option>4-2-3-1</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="keyPlayers" className="block text-sm font-medium text-gray-300 mb-1">Key Players & Tactical Style</label>
                                <textarea
                                    id="keyPlayers" rows={3} value={keyPlayers} onChange={e => setKeyPlayers(e.target.value)}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required
                                    placeholder="e.g., Fast wingers like Vinicius Jr., solid defensive midfielder, high pressing style."
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={!opponentName || !formation || !keyPlayers}
                                    className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
                                >
                                    <BrainCircuitIcon className="w-5 h-5 mr-2" />
                                    Generate Report
                                </button>
                            </div>
                        </form>
                    )}
                    
                    {isLoadingOppositionReport && (
                        <div className="flex flex-col items-center justify-center text-center text-gray-400 py-12">
                            <LoadingSpinner className="w-10 h-10 mb-4" />
                            <p className="text-lg font-semibold">Astral AI is scouting the opponent...</p>
                            <p className="text-sm">This may take a moment.</p>
                        </div>
                    )}

                    {oppositionReport && (
                        <div className="space-y-4 animate-fade-in-scale" style={{ animationDuration: '0.3s' }}>
                             <div>
                                <h3 className="font-bold text-lg text-green-400 mb-1">Key Player Analysis</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{oppositionReport.keyPlayers}</p>
                            </div>
                             <div>
                                <h3 className="font-bold text-lg text-blue-400 mb-1">Likely Tactical Approach</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{oppositionReport.tacticalApproach}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-yellow-400 mb-1">Exploitable Weaknesses</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{oppositionReport.weaknesses}</p>
                            </div>
                             <div className="pt-4 text-center">
                                <button
                                    onClick={() => dispatch({ type: 'GENERATE_OPPOSITION_REPORT_FAILURE' })}
                                    className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors"
                                >
                                    Scout New Team
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OppositionAnalysisPage;