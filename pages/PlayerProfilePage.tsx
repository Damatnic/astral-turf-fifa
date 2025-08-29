
import React, { useMemo, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useTacticsContext, useUIContext } from '../hooks';
import { PlayerAttributes } from '../types';
import { BrainCircuitIcon, LoadingSpinner, SparklesIcon, UsersIcon } from '../components/ui/icons';
import { getAIDevelopmentSummary } from '../services/aiService';
import LineChart from '../components/charts/LineChart';

const PlayerProfilePage: React.FC = () => {
    const { playerId } = useParams<{ playerId: string }>();
    const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const { players } = tacticsState;
    const { isLoadingDevelopmentSummary, developmentSummary, settings } = uiState;
    
    const [selectedAttribute, setSelectedAttribute] = useState<keyof PlayerAttributes>('speed');

    const player = useMemo(() => players.find(p => p.id === playerId), [players, playerId]);

    const chartData = useMemo(() => {
        if (!player || !player.attributeHistory) return [];
        return player.attributeHistory.map(log => ({
            x: log.week,
            y: log.attributes[selectedAttribute]
        }));
    }, [player, selectedAttribute]);

    const handleGenerateSummary = async () => {
        if (!player) return;
        uiDispatch({ type: 'GET_AI_DEVELOPMENT_SUMMARY_START' });
        try {
            const summary = await getAIDevelopmentSummary(player);
            uiDispatch({ type: 'GET_AI_DEVELOPMENT_SUMMARY_SUCCESS', payload: summary });
        } catch (error) {
            uiDispatch({ type: 'GET_AI_DEVELOPMENT_SUMMARY_FAILURE' });
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `AI Error: ${error instanceof Error ? error.message : 'Unknown'}`, type: 'error' } });
        }
    };

    if (!player) {
        return <Navigate to="/tactics" replace />;
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900 overflow-hidden">
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <div className="flex items-center">
                         <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl mr-4 border-2 border-[var(--accent-primary)]" style={{backgroundColor: player.teamColor}}>
                          {player.jerseyNumber}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-teal-400">{player.name}</h2>
                            <p className="text-sm text-gray-400">{player.age} years old | {player.nationality}</p>
                        </div>
                    </div>
                     <Link to="/tactics" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-md transition-colors text-sm">
                        Back to Tactics
                    </Link>
                </div>
                
                <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Chart */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-200">Attribute Progression</h3>
                            <select 
                                value={selectedAttribute} 
                                onChange={(e) => setSelectedAttribute(e.target.value as keyof PlayerAttributes)}
                                className="p-1.5 text-sm bg-gray-800 border border-gray-600 rounded-md"
                            >
                                {Object.keys(player.attributes).map(attr => (
                                    <option key={attr} value={attr} className="capitalize">{attr}</option>
                                ))}
                            </select>
                        </div>
                        <div className="h-64">
                            <LineChart data={chartData} color="var(--accent-primary)" yAxisLabel={selectedAttribute} />
                        </div>
                    </div>
                    
                    {/* Right Column: AI Summary */}
                    <div className="bg-gray-700/50 rounded-lg p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-lg text-gray-200 flex items-center">
                                <BrainCircuitIcon className="w-5 h-5 mr-2 text-teal-400" />
                                AI Development Summary
                            </h3>
                        </div>
                        <div className="flex-grow space-y-3 overflow-y-auto">
                            {isLoadingDevelopmentSummary ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <LoadingSpinner className="w-8 h-8 mr-3" />
                                    <span>AI is analyzing progress...</span>
                                </div>
                            ) : developmentSummary ? (
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <h4 className="font-semibold text-gray-300">Overall Summary</h4>
                                        <p className="text-gray-400">{developmentSummary.summary}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-green-400">Key Strengths / Improvements</h4>
                                        <ul className="list-disc list-inside text-gray-400">
                                            {developmentSummary.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-yellow-400">Areas for Improvement</h4>
                                         <ul className="list-disc list-inside text-gray-400">
                                            {developmentSummary.areasForImprovement.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center text-gray-500">
                                    <p>Click the button below to generate an AI-powered report on this player's development.</p>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 mt-auto">
                            <button 
                                onClick={handleGenerateSummary} 
                                disabled={isLoadingDevelopmentSummary}
                                className="w-full flex items-center justify-center py-2 px-4 bg-teal-600 hover:bg-teal-500 rounded-md font-semibold text-white disabled:bg-gray-600"
                            >
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                {developmentSummary ? 'Regenerate Summary' : 'Generate AI Summary'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfilePage;
