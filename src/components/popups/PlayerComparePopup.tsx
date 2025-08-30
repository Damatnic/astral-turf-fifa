
import React from 'react';
import { useTacticsContext, useFranchiseContext, useUIContext } from '../../hooks';
import type { Player, AIComparison } from '../../types';
import { CloseIcon, CompareIcon, BrainCircuitIcon, LoadingSpinner } from '../ui/icons';
import { getAIPlayerComparison } from "../../services/aiServiceLoader";
import RadarChart from '../charts/RadarChart';

const AIResult: React.FC<{ result: AIComparison }> = ({ result }) => (
    <div className="mt-6 p-4 bg-gray-900/50 rounded-lg space-y-3 text-sm border border-teal-500/30">
        <div>
            <h4 className="font-bold text-green-400 mb-1">Comparison</h4>
            <p className="text-gray-300">{result.comparison}</p>
        </div>
        <div>
            <h4 className="font-bold text-blue-400 mb-1">Recommendation</h4>
            <p className="text-gray-300">{result.recommendation}</p>
        </div>
    </div>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
    <div className="flex items-center">
        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color }}></div>
        <span className="text-sm font-semibold">{label}</span>
    </div>
);


const PlayerComparePopup: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { tacticsState } = useTacticsContext();

    const { editingPlayerId, playerToCompareId, isComparingAI, aiComparisonResult, settings, activeTeamContext } = uiState;
    const { players, formations, activeFormationIds } = tacticsState;
    
    const player1 = players.find(p => p.id === editingPlayerId);
    const player2 = players.find(p => p.id === playerToCompareId);
    
    const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
    const activeFormationId = activeFormationIds[activeTeam];
    const activeFormation = formations[activeFormationId];

    const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });

    const handleSelectPlayer2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_COMPARE_PLAYER_ID', payload: e.target.value || null });
    };

    const handleAnalyze = async () => {
        if (!player1 || !player2 || !activeFormation) return;
        dispatch({ type: 'GENERATE_AI_COMPARISON_START' });
        try {
            const result = await getAIPlayerComparison(player1, player2, activeFormation, settings.aiPersonality);
            dispatch({ type: 'GENERATE_AI_COMPARISON_SUCCESS', payload: result });
        } catch (error) {
            console.error(error);
            dispatch({ type: 'GENERATE_AI_COMPARISON_FAILURE' });
        }
    };

    if (!player1) return null;

    const attributeLabels = Object.keys(player1.attributes);
    const radarChartDatasets = [];
    if (player1) {
        radarChartDatasets.push({
            label: player1.name,
            color: player1.teamColor,
            values: attributeLabels.map(label => player1.attributes[label as keyof typeof player1.attributes])
        });
    }
    if (player2) {
        radarChartDatasets.push({
            label: player2.name,
            color: player2.teamColor,
            values: attributeLabels.map(label => player2.attributes[label as keyof typeof player2.attributes])
        });
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
            <div 
                onClick={(e) => e.stopPropagation()}
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale"
                style={{animationDuration: '0.2s'}}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <CompareIcon className="w-5 h-5 mr-3" />
                        Compare Players
                    </h2>
                    <button type="button" onClick={closeModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto max-h-[80vh]">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Player 1</label>
                            <div className="p-2 bg-gray-700 rounded-md font-bold text-white truncate">{player1.name}</div>
                        </div>
                         <div>
                            <label htmlFor="player2-select" className="block text-sm font-medium text-gray-400 mb-1">Player 2</label>
                            <select 
                                id="player2-select"
                                value={playerToCompareId || ''}
                                onChange={handleSelectPlayer2}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Select player...</option>
                                {players.filter(p => p.id !== player1.id).map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (#{p.jerseyNumber})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="w-full aspect-square mx-auto mb-4">
                        <RadarChart labels={attributeLabels} datasets={radarChartDatasets} />
                    </div>

                    <div className="flex justify-center space-x-6 mb-6">
                        {player1 && <LegendItem color={player1.teamColor} label={player1.name} />}
                        {player2 && <LegendItem color={player2.teamColor} label={player2.name} />}
                    </div>
                    
                    <div className="text-center">
                        <button
                            onClick={handleAnalyze}
                            disabled={!player2 || isComparingAI}
                            className="w-full sm:w-1/2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center mx-auto"
                            >
                            {isComparingAI ? <LoadingSpinner /> : (
                                <>
                                    <BrainCircuitIcon className="w-5 h-5 mr-2" />
                                    Get AI Analysis
                                </>
                            )}
                        </button>
                         {isComparingAI && !aiComparisonResult &&
                            <div className="mt-4 text-center text-gray-400 text-sm">
                                <p>Astral AI is comparing the players...</p>
                            </div>
                        }
                        {aiComparisonResult && <AIResult result={aiComparisonResult} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerComparePopup;
