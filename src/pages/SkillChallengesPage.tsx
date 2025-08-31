import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import type { SkillChallenge, Team } from '../types';

const SkillChallengesPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const [selectedTeam, setSelectedTeam] = useState<Team>('home');
    const [selectedChallenge, setSelectedChallenge] = useState<SkillChallenge | null>(null);

    const { skillChallenges } = franchiseState;
    const teamPlayers = tacticsState.players.filter(p => p.team === selectedTeam);

    // Mock skill challenges
    const availableChallenges: SkillChallenge[] = [
        {
            id: 'shooting_master',
            name: 'Shooting Master',
            description: 'Score 10 goals in a shooting accuracy mini-game',
            icon: '⚽',
            color: 'text-red-400',
        },
        {
            id: 'passing_wizard',
            name: 'Passing Wizard',
            description: 'Complete 15 consecutive accurate passes in the passing challenge',
            icon: '🎯',
            color: 'text-blue-400',
        },
        {
            id: 'dribble_king',
            name: 'Dribble King',
            description: 'Navigate through 20 cones without touching any in the dribbling course',
            icon: '🏃',
            color: 'text-yellow-400',
        },
        {
            id: 'defending_wall',
            name: 'Defending Wall',
            description: 'Successfully tackle 12 attackers in the defensive challenge',
            icon: '🛡️',
            color: 'text-green-400',
        },
        {
            id: 'keeper_hero',
            name: 'Goalkeeper Hero',
            description: 'Save 8 out of 10 penalty shots',
            icon: '🥅',
            color: 'text-purple-400',
        },
        {
            id: 'stamina_beast',
            name: 'Stamina Beast',
            description: 'Complete the endurance run in under 12 minutes',
            icon: '💨',
            color: 'text-orange-400',
        },
    ];

    const handleStartChallenge = (challenge: SkillChallenge) => {
        setSelectedChallenge(challenge);
        // In a real implementation, this would start the mini-game
        uiDispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: `Starting ${challenge.name} challenge!`,
                type: 'info',
            },
        });
    };

    const handleCompleteChallenge = (challengeId: string, playerId: string) => {
        dispatch({
            type: 'UPDATE_PLAYER_CHALLENGE_COMPLETION',
            payload: { playerId, challengeId },
        });

        uiDispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: 'Challenge completed! Player gained experience.',
                type: 'success',
            },
        });

        setSelectedChallenge(null);
    };

    const getPlayerChallengesCompleted = (playerId: string) => {
        const player = teamPlayers.find(p => p.id === playerId);
        return player?.completedChallenges.length || 0;
    };

    const hasPlayerCompletedChallenge = (playerId: string, challengeId: string) => {
        const player = teamPlayers.find(p => p.id === playerId);
        return player?.completedChallenges.includes(challengeId) || false;
    };

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Skill Challenges</h1>
                    <p className="text-gray-400">Test and improve your players' abilities through fun mini-games</p>
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

                {!selectedChallenge ? (
                    <>
                        {/* Available Challenges */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-teal-400 mb-6">Available Challenges</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableChallenges.map((challenge) => (
                                    <div
                                        key={challenge.id}
                                        className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-teal-500 transition-colors cursor-pointer"
                                        onClick={() => handleStartChallenge(challenge)}
                                    >
                                        <div className="text-center mb-4">
                                            <div className="text-4xl mb-2">{challenge.icon}</div>
                                            <h4 className={`text-lg font-semibold ${challenge.color}`}>
                                                {challenge.name}
                                            </h4>
                                        </div>

                                        <p className="text-gray-300 text-sm text-center mb-4">
                                            {challenge.description}
                                        </p>

                                        <div className="flex justify-center">
                                            <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                                Start Challenge
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Player Progress */}
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-xl font-semibold text-teal-400 mb-6">Player Progress</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teamPlayers.slice(0, 12).map((player) => (
                                    <div key={player.id} className="bg-gray-700 rounded-lg p-4">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">{player.jerseyNumber}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">{player.name}</h4>
                                                <p className="text-gray-400 text-sm">Age {player.age}</p>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-gray-300 text-sm">Challenges Completed</span>
                                                <span className="text-teal-400 font-bold">
                                                    {getPlayerChallengesCompleted(player.id)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-600 rounded-full h-2">
                                                <div
                                                    className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${(getPlayerChallengesCompleted(player.id) / availableChallenges.length) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Challenge badges */}
                                        <div className="flex flex-wrap gap-1">
                                            {availableChallenges.map((challenge) => (
                                                <div
                                                    key={challenge.id}
                                                    className={`text-xs px-2 py-1 rounded ${
                                                        hasPlayerCompletedChallenge(player.id, challenge.id)
                                                            ? 'bg-green-600/20 text-green-400'
                                                            : 'bg-gray-600/50 text-gray-500'
                                                    }`}
                                                    title={challenge.name}
                                                >
                                                    {challenge.icon}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    // Challenge Interface
                    <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">{selectedChallenge.icon}</div>
                            <h2 className={`text-3xl font-bold ${selectedChallenge.color} mb-2`}>
                                {selectedChallenge.name}
                            </h2>
                            <p className="text-gray-300 text-lg">{selectedChallenge.description}</p>
                        </div>

                        {/* Mock challenge interface */}
                        <div className="bg-gray-700 rounded-lg p-8 mb-6">
                            <div className="text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Challenge in Progress...</h3>
                                <p className="text-gray-400 mb-6">This is where the actual mini-game would be displayed</p>

                                {/* Mock progress */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-300">Progress</span>
                                        <span className="text-teal-400">75%</span>
                                    </div>
                                    <div className="w-full bg-gray-600 rounded-full h-3">
                                        <div
                                            className="bg-teal-400 h-3 rounded-full transition-all duration-300"
                                            style={{ width: '75%' }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex justify-center space-x-4">
                                    <button
                                        onClick={() => setSelectedChallenge(null)}
                                        className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-md font-medium transition-colors"
                                    >
                                        Exit Challenge
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Simulate completing the challenge with a random player
                                            const randomPlayer = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
                                            handleCompleteChallenge(selectedChallenge.id, randomPlayer.id);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                                    >
                                        Complete Challenge
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Challenge Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-700 rounded-lg p-4 text-center">
                                <div className="text-green-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h4 className="text-white font-medium mb-1">Skill Boost</h4>
                                <p className="text-gray-400 text-sm">+5 to related attribute</p>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4 text-center">
                                <div className="text-blue-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h4 className="text-white font-medium mb-1">Morale Boost</h4>
                                <p className="text-gray-400 text-sm">Improved player happiness</p>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4 text-center">
                                <div className="text-yellow-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <h4 className="text-white font-medium mb-1">Achievement</h4>
                                <p className="text-gray-400 text-sm">Unlock challenge badge</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillChallengesPage;