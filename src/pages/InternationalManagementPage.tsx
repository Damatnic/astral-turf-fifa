import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext } from '../hooks';
import { Team } from '../../types';

const InternationalManagementPage: React.FC = () => {
    const { franchiseState } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const [selectedTeam, setSelectedTeam] = useState<Team>('home');

    const teamPlayers = tacticsState.players.filter(p => p.team === selectedTeam);
    const internationalPlayers = teamPlayers.filter(p => 
        p.availability.status === 'International Duty' || 
        Math.random() > 0.7 // Mock: some players are eligible for international duty
    );

    // Mock international competitions
    const internationalCompetitions = [
        {
            id: 'world_cup',
            name: 'FIFA World Cup',
            date: '2024-11-20',
            status: 'upcoming',
            duration: '4 weeks',
            type: 'tournament'
        },
        {
            id: 'euro_cup',
            name: 'UEFA European Championship',
            date: '2024-06-15',
            status: 'completed',
            duration: '3 weeks',
            type: 'tournament'
        },
        {
            id: 'copa_america',
            name: 'Copa America',
            date: '2024-07-10',
            status: 'in_progress',
            duration: '3 weeks',
            type: 'tournament'
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'text-blue-400';
            case 'in_progress': return 'text-yellow-400';
            case 'completed': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusBackground = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-600/20';
            case 'in_progress': return 'bg-yellow-600/20';
            case 'completed': return 'bg-green-600/20';
            default: return 'bg-gray-600/20';
        }
    };

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">International Management</h1>
                    <p className="text-gray-400">Monitor players on international duty and upcoming competitions</p>
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

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">International Players</p>
                                <p className="text-2xl font-bold text-blue-400">{internationalPlayers.length}</p>
                                <p className="text-xs text-gray-500">From your squad</p>
                            </div>
                            <div className="text-blue-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Currently Away</p>
                                <p className="text-2xl font-bold text-yellow-400">
                                    {teamPlayers.filter(p => p.availability.status === 'International Duty').length}
                                </p>
                                <p className="text-xs text-gray-500">On international duty</p>
                            </div>
                            <div className="text-yellow-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Upcoming Competitions</p>
                                <p className="text-2xl font-bold text-green-400">
                                    {internationalCompetitions.filter(comp => comp.status === 'upcoming').length}
                                </p>
                                <p className="text-xs text-gray-500">This year</p>
                            </div>
                            <div className="text-green-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* International Players */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold text-teal-400 mb-4">International Players</h3>
                        
                        {internationalPlayers.length > 0 ? (
                            <div className="space-y-4">
                                {internationalPlayers.map((player) => (
                                    <div key={player.id} className="p-4 bg-gray-700 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">{player.jerseyNumber}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-semibold">{player.name}</h4>
                                                    <p className="text-gray-400 text-sm">
                                                        {player.nationality} • Age {player.age}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    player.availability.status === 'International Duty'
                                                        ? 'bg-yellow-600/20 text-yellow-400'
                                                        : 'bg-green-600/20 text-green-400'
                                                }`}>
                                                    {player.availability.status === 'International Duty' ? 'Away' : 'Available'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Player international stats */}
                                        <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <div className="text-lg font-bold text-blue-400">
                                                    {Math.floor(Math.random() * 50) + 10}
                                                </div>
                                                <div className="text-xs text-gray-400">Int'l Caps</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-green-400">
                                                    {Math.floor(Math.random() * 20)}
                                                </div>
                                                <div className="text-xs text-gray-400">Int'l Goals</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-purple-400">
                                                    {Math.floor(Math.random() * 15)}
                                                </div>
                                                <div className="text-xs text-gray-400">Assists</div>
                                            </div>
                                        </div>

                                        {player.availability.status === 'International Duty' && (
                                            <div className="mt-3 p-2 bg-yellow-600/10 rounded border border-yellow-600/30">
                                                <p className="text-yellow-400 text-xs">
                                                    Return expected: {player.availability.returnDate || 'TBD'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-300 mb-2">No International Players</h4>
                                <p className="text-gray-500">None of your players are currently involved in international football</p>
                            </div>
                        )}
                    </div>

                    {/* International Competitions */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold text-teal-400 mb-4">International Competitions</h3>
                        
                        <div className="space-y-4">
                            {internationalCompetitions.map((competition) => (
                                <div key={competition.id} className={`p-4 rounded-lg border-l-4 ${getStatusBackground(competition.status)} ${
                                    competition.status === 'upcoming' ? 'border-l-blue-400' :
                                    competition.status === 'in_progress' ? 'border-l-yellow-400' :
                                    'border-l-green-400'
                                }`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="text-white font-semibold">{competition.name}</h4>
                                            <p className="text-gray-400 text-sm">
                                                {new Date(competition.date).toLocaleDateString()} • {competition.duration}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            competition.status === 'upcoming' ? 'bg-blue-600/20 text-blue-400' :
                                            competition.status === 'in_progress' ? 'bg-yellow-600/20 text-yellow-400' :
                                            'bg-green-600/20 text-green-400'
                                        }`}>
                                            {competition.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {/* Affected players */}
                                    <div className="mt-3">
                                        <p className="text-gray-300 text-sm mb-2">Potentially affected players:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {internationalPlayers.slice(0, 3).map((player) => (
                                                <span key={player.id} className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                                    {player.name}
                                                </span>
                                            ))}
                                            {internationalPlayers.length > 3 && (
                                                <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                                    +{internationalPlayers.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Management Tips */}
                <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-teal-400 mb-4">International Duty Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-blue-400 mb-3">
                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Plan Ahead</h4>
                            <p className="text-gray-400 text-sm">
                                Monitor international fixtures and plan your squad rotation accordingly
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-green-400 mb-3">
                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Squad Depth</h4>
                            <p className="text-gray-400 text-sm">
                                Maintain adequate squad depth to cope with international absences
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-yellow-400 mb-3">
                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Fitness Management</h4>
                            <p className="text-gray-400 text-sm">
                                Monitor returning players for fatigue and potential injuries
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternationalManagementPage;