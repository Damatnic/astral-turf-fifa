import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import type { Team, MentoringGroup } from '../types';

const MentoringPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const [selectedTeam, setSelectedTeam] = useState<Team>('home');
    const [selectedMentor, setSelectedMentor] = useState<string>('');
    const [selectedMentees, setSelectedMentees] = useState<string[]>([]);

    const teamPlayers = tacticsState.players.filter(p => p.team === selectedTeam);
    const mentoringGroups = franchiseState.mentoringGroups[selectedTeam];

    // Potential mentors (experienced players)
    const potentialMentors = teamPlayers.filter(p => 
        p.age >= 28 && 
        !mentoringGroups.some(group => group.mentorId === p.id)
    );

    // Potential mentees (younger players)
    const potentialMentees = teamPlayers.filter(p => 
        p.age <= 23 && 
        !mentoringGroups.some(group => group.menteeIds.includes(p.id))
    );

    const handleCreateGroup = () => {
        if (selectedMentor && selectedMentees.length > 0) {
            dispatch({
                type: 'CREATE_MENTORING_GROUP',
                payload: {
                    team: selectedTeam,
                    mentorId: selectedMentor,
                    menteeIds: selectedMentees
                }
            });

            uiDispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    message: 'Mentoring group created successfully!',
                    type: 'success'
                }
            });

            setSelectedMentor('');
            setSelectedMentees([]);
        }
    };

    const handleDissolveGroup = (mentorId: string) => {
        dispatch({
            type: 'DISSOLVE_MENTORING_GROUP',
            payload: { team: selectedTeam, mentorId }
        });

        uiDispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: 'Mentoring group dissolved',
                type: 'info'
            }
        });
    };

    const handleMenteeToggle = (playerId: string) => {
        if (selectedMentees.includes(playerId)) {
            setSelectedMentees(selectedMentees.filter(id => id !== playerId));
        } else if (selectedMentees.length < 3) {
            setSelectedMentees([...selectedMentees, playerId]);
        }
    };

    const getMentorPlayer = (mentorId: string) => teamPlayers.find(p => p.id === mentorId);
    const getMenteePlayer = (menteeId: string) => teamPlayers.find(p => p.id === menteeId);

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Mentoring Program</h1>
                    <p className="text-gray-400">Pair experienced players with young talents for development</p>
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
                                <p className="text-gray-400 text-sm">Active Groups</p>
                                <p className="text-2xl font-bold text-teal-400">{mentoringGroups.length}</p>
                            </div>
                            <div className="text-teal-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Available Mentors</p>
                                <p className="text-2xl font-bold text-blue-400">{potentialMentors.length}</p>
                                <p className="text-xs text-gray-500">Experienced players</p>
                            </div>
                            <div className="text-blue-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Young Prospects</p>
                                <p className="text-2xl font-bold text-purple-400">{potentialMentees.length}</p>
                                <p className="text-xs text-gray-500">Available for mentoring</p>
                            </div>
                            <div className="text-purple-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Active Mentoring Groups */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
                            <h3 className="text-xl font-semibold text-teal-400 mb-4">Active Mentoring Groups</h3>
                            
                            {mentoringGroups.length > 0 ? (
                                <div className="space-y-4">
                                    {mentoringGroups.map((group) => {
                                        const mentor = getMentorPlayer(group.mentorId);
                                        if (!mentor) return null;

                                        return (
                                            <div key={group.mentorId} className="bg-gray-700 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center">
                                                            <span className="text-white font-bold">{mentor.jerseyNumber}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-semibold">{mentor.name}</h4>
                                                            <p className="text-blue-400 text-sm">Mentor • Age {mentor.age}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDissolveGroup(group.mentorId)}
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        title="Dissolve group"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Mentees */}
                                                <div className="ml-4 pl-4 border-l-2 border-gray-600">
                                                    <h5 className="text-gray-300 text-sm font-medium mb-2">Mentees:</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {group.menteeIds.map(menteeId => {
                                                            const mentee = getMenteePlayer(menteeId);
                                                            if (!mentee) return null;

                                                            return (
                                                                <div key={menteeId} className="flex items-center space-x-2">
                                                                    <div className="bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center">
                                                                        <span className="text-white text-sm font-bold">{mentee.jerseyNumber}</span>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white text-sm font-medium">{mentee.name}</p>
                                                                        <p className="text-gray-400 text-xs">Age {mentee.age}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-300 mb-2">No Active Groups</h4>
                                    <p className="text-gray-500">Create your first mentoring group to start developing young talents</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Create New Group */}
                    <div>
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-teal-400 mb-4">Create Mentoring Group</h3>
                            
                            {/* Select Mentor */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Select Mentor</label>
                                <select
                                    value={selectedMentor}
                                    onChange={(e) => setSelectedMentor(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                    <option value="">Choose a mentor...</option>
                                    {potentialMentors.map((player) => (
                                        <option key={player.id} value={player.id}>
                                            {player.name} (Age {player.age})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Experienced players (28+ years) can become mentors</p>
                            </div>

                            {/* Select Mentees */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Select Mentees ({selectedMentees.length}/3)
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {potentialMentees.map((player) => (
                                        <div
                                            key={player.id}
                                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                                                selectedMentees.includes(player.id)
                                                    ? 'bg-purple-600/20 border-purple-400 border'
                                                    : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                            onClick={() => handleMenteeToggle(player.id)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">{player.jerseyNumber}</span>
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{player.name}</p>
                                                    <p className="text-gray-400 text-xs">Age {player.age} • Potential {player.currentPotential}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Young players (23 or younger) can be mentored</p>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleCreateGroup}
                                disabled={!selectedMentor || selectedMentees.length === 0}
                                className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                                    selectedMentor && selectedMentees.length > 0
                                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Create Mentoring Group
                            </button>
                        </div>

                        {/* Benefits */}
                        <div className="bg-gray-800 rounded-lg p-6 mt-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-teal-400 mb-4">Mentoring Benefits</h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-2">
                                    <div className="text-green-400 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">Accelerated Development</p>
                                        <p className="text-gray-400 text-xs">Mentees develop attributes 25% faster</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <div className="text-blue-400 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">Improved Morale</p>
                                        <p className="text-gray-400 text-xs">Both mentor and mentees gain morale boost</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <div className="text-purple-400 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">Leadership Development</p>
                                        <p className="text-gray-400 text-xs">Mentors develop leadership traits</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentoringPage;