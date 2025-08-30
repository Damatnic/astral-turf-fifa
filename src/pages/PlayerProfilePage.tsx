import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTacticsContext, useFranchiseContext, useUIContext } from '../hooks';
import type { Player, ChatMessage } from '../types';

const PlayerProfilePage: React.FC = () => {
    const { playerId } = useParams<{ playerId: string }>();
    const { tacticsState } = useTacticsContext();
    const { franchiseState } = useFranchiseContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'development' | 'contract' | 'history'>('overview');

    const player = tacticsState.players.find(p => p.id === playerId);

    if (!player) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Player Not Found</h3>
                    <p className="text-gray-500">The requested player profile could not be found.</p>
                </div>
            </div>
        );
    }

    const handleStartConversation = () => {
        uiDispatch({
            type: 'START_PLAYER_CONVERSATION',
            payload: { playerId: player.id }
        });
    };

    const getAvailabilityColor = (status: string) => {
        switch (status) {
            case 'Available': return 'text-green-400';
            case 'Minor Injury': return 'text-yellow-400';
            case 'Major Injury': return 'text-red-400';
            case 'Suspended': return 'text-red-400';
            case 'International Duty': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    const getMoraleColor = (morale: string) => {
        switch (morale) {
            case 'Excellent': return 'text-green-400';
            case 'Good': return 'text-blue-400';
            case 'Okay': return 'text-yellow-400';
            case 'Poor': return 'text-orange-400';
            case 'Very Poor': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getFormColor = (form: string) => {
        switch (form) {
            case 'Excellent': return 'text-green-400';
            case 'Good': return 'text-blue-400';
            case 'Average': return 'text-yellow-400';
            case 'Poor': return 'text-orange-400';
            case 'Very Poor': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const calculateAge = (age: number) => age;
    const calculateOverall = (attributes: typeof player.attributes) => {
        const values = Object.values(attributes);
        return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
    };

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-6">
                            {/* Player Avatar */}
                            <div className="bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">{player.jerseyNumber}</span>
                            </div>
                            
                            {/* Player Info */}
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{player.name}</h1>
                                <div className="flex items-center space-x-4 text-gray-400 mb-2">
                                    <span>Age {player.age}</span>
                                    <span>•</span>
                                    <span>{player.nationality}</span>
                                    <span>•</span>
                                    <span className="capitalize">{player.team} Team</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        player.availability.status === 'Available' 
                                            ? 'bg-green-600/20 text-green-400' 
                                            : 'bg-red-600/20 text-red-400'
                                    }`}>
                                        {player.availability.status}
                                    </span>
                                    <span className="text-gray-400">
                                        Morale: <span className={getMoraleColor(player.morale)}>{player.morale}</span>
                                    </span>
                                    <span className="text-gray-400">
                                        Form: <span className={getFormColor(player.form)}>{player.form}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                            <button
                                onClick={handleStartConversation}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                            >
                                Start Conversation
                            </button>
                            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                                Edit Player
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="border-b border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { key: 'overview' as const, label: 'Overview' },
                                { key: 'stats' as const, label: 'Statistics' },
                                { key: 'development' as const, label: 'Development' },
                                { key: 'contract' as const, label: 'Contract' },
                                { key: 'history' as const, label: 'History' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === key
                                            ? 'border-teal-500 text-teal-400'
                                            : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Key Stats */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Key Statistics</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Overall Rating</span>
                                        <span className="text-2xl font-bold text-teal-400">
                                            {calculateOverall(player.attributes)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Potential</span>
                                        <span className="text-lg font-bold text-purple-400">
                                            {player.currentPotential}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Market Value</span>
                                        <span className="text-lg font-bold text-yellow-400">
                                            ${(player.currentPotential * 50000).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Weekly Wage</span>
                                        <span className="text-lg font-bold text-green-400">
                                            ${(player.contract.wage || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Attributes */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Attributes</h3>
                                <div className="space-y-3">
                                    {Object.entries(player.attributes).map(([attr, value]) => (
                                        <div key={attr} className="flex justify-between items-center">
                                            <span className="text-gray-300 capitalize">{attr}</span>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-24 bg-gray-700 rounded-full h-2">
                                                    <div 
                                                        className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${value}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-white font-bold w-8 text-right">{value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Physical Condition */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Physical Condition</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-300">Stamina</span>
                                            <span className="text-white font-bold">{player.stamina}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                    player.stamina >= 80 ? 'bg-green-400' :
                                                    player.stamina >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                                                }`}
                                                style={{ width: `${player.stamina}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-300">Fatigue</span>
                                            <span className="text-white font-bold">{player.fatigue}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                    player.fatigue >= 80 ? 'bg-red-400' :
                                                    player.fatigue >= 60 ? 'bg-yellow-400' : 'bg-green-400'
                                                }`}
                                                style={{ width: `${player.fatigue}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-300">Injury Risk</span>
                                            <span className="text-white font-bold">{player.injuryRisk}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                    player.injuryRisk >= 80 ? 'bg-red-400' :
                                                    player.injuryRisk >= 60 ? 'bg-yellow-400' : 'bg-green-400'
                                                }`}
                                                style={{ width: `${player.injuryRisk}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics Tab */}
                    {activeTab === 'stats' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Current Season Stats */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Current Season</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-400">{player.stats.goals}</div>
                                        <div className="text-sm text-gray-400">Goals</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-400">{player.stats.assists}</div>
                                        <div className="text-sm text-gray-400">Assists</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-400">{player.stats.matchesPlayed}</div>
                                        <div className="text-sm text-gray-400">Matches</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-400">
                                            {player.stats.passesAttempted > 0 
                                                ? ((player.stats.passesCompleted / player.stats.passesAttempted) * 100).toFixed(1)
                                                : '0.0'
                                            }%
                                        </div>
                                        <div className="text-sm text-gray-400">Pass Accuracy</div>
                                    </div>
                                </div>
                            </div>

                            {/* Career Stats */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Career History</h3>
                                <div className="space-y-3">
                                    {player.stats.careerHistory.slice(0, 5).map((season, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                                            <div>
                                                <p className="text-white font-medium">{season.club}</p>
                                                <p className="text-gray-400 text-sm">Season {season.season}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-green-400 font-bold">{season.goals}G</p>
                                                <p className="text-blue-400 text-sm">{season.assists}A</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Development Tab */}
                    {activeTab === 'development' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Development Progress */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Development Progress</h3>
                                <div className="space-y-4">
                                    {Object.entries(player.attributeDevelopmentProgress).map(([attr, progress]) => (
                                        <div key={attr} className="flex justify-between items-center">
                                            <span className="text-gray-300 capitalize">{attr}</span>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-24 bg-gray-700 rounded-full h-2">
                                                    <div 
                                                        className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-teal-400 font-bold w-8 text-right">{progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Training Focus */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Training Focus</h3>
                                {player.individualTrainingFocus ? (
                                    <div className="bg-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-white font-medium capitalize">
                                                    {player.individualTrainingFocus.attribute} Training
                                                </p>
                                                <p className="text-gray-400 text-sm capitalize">
                                                    Intensity: {player.individualTrainingFocus.intensity}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm ${
                                                player.individualTrainingFocus.intensity === 'high' 
                                                    ? 'bg-red-600/20 text-red-400'
                                                    : 'bg-green-600/20 text-green-400'
                                            }`}>
                                                {player.individualTrainingFocus.intensity}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No individual training focus set</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contract Tab */}
                    {activeTab === 'contract' && (
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-teal-400 mb-4">Contract Details</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Weekly Wage</span>
                                            <span className="text-green-400 font-bold">
                                                ${(player.contract.wage || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Contract Expires</span>
                                            <span className="text-white">
                                                {player.contract.expires || 'Not specified'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-3">Contract Clauses</h4>
                                    {player.contract.clauses.length > 0 ? (
                                        <div className="space-y-2">
                                            {player.contract.clauses.map((clause) => (
                                                <div key={clause.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                                    <span className="text-gray-300 text-sm">{clause.text}</span>
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        clause.status === 'Met' ? 'bg-green-600 text-white' :
                                                        clause.status === 'Unmet' ? 'bg-red-600 text-white' :
                                                        'bg-gray-600 text-white'
                                                    }`}>
                                                        {clause.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No contract clauses</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            {/* Player Traits */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Player Traits</h3>
                                {player.traits.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {player.traits.map((trait) => (
                                            <span key={trait} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                                                {trait}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No special traits identified</p>
                                )}
                            </div>

                            {/* Development Log */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-teal-400 mb-4">Development Log</h3>
                                <div className="space-y-3">
                                    {player.developmentLog.slice(0, 5).map((entry) => (
                                        <div key={entry.id} className="p-4 bg-gray-700 rounded">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-white font-medium">{entry.author}</span>
                                                <span className="text-gray-400 text-sm">{entry.date}</span>
                                            </div>
                                            <p className="text-gray-300">{entry.note}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayerProfilePage;