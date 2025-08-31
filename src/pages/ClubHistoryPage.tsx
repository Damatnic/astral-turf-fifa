import React from 'react';
import { useFranchiseContext } from '../hooks';

const ClubHistoryPage: React.FC = () => {
    const { franchiseState } = useFranchiseContext();
    const { historicalData, hallOfFame, lastSeasonAwards, season } = franchiseState;

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Club History</h1>
                    <p className="text-gray-400">Celebrate your club's achievements and legendary players</p>
                </div>

                {/* Hall of Fame */}
                <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-4">Hall of Fame</h3>
                    {hallOfFame.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {hallOfFame.map((player) => (
                                <div key={player.id} className="bg-gray-700 rounded-lg p-4 border border-yellow-400/30">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="bg-yellow-400 rounded-full w-10 h-10 flex items-center justify-center">
                                            <span className="text-black font-bold text-sm">{player.jerseyNumber}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold">{player.name}</h4>
                                            <p className="text-gray-400 text-sm">{player.nationality}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-center">
                                            <div className="text-green-400 font-bold">{player.stats.goals}</div>
                                            <div className="text-gray-400">Goals</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-blue-400 font-bold">{player.stats.matchesPlayed}</div>
                                            <div className="text-gray-400">Matches</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-center py-8">No players in Hall of Fame yet</p>
                    )}
                </div>

                {/* Recent Awards */}
                {lastSeasonAwards && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
                        <h3 className="text-xl font-semibold text-purple-400 mb-4">Last Season Awards</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <div className="text-yellow-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <h4 className="text-white font-medium">Champion</h4>
                                <p className="text-gray-300 text-sm">{lastSeasonAwards.champion}</p>
                            </div>

                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <div className="text-green-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h4 className="text-white font-medium">Player of the Season</h4>
                                <p className="text-gray-300 text-sm">{lastSeasonAwards.playerOfTheSeason.name}</p>
                            </div>

                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <div className="text-blue-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h4 className="text-white font-medium">Top Scorer</h4>
                                <p className="text-gray-300 text-sm">
                                    {lastSeasonAwards.topScorer.name} ({lastSeasonAwards.topScorer.goals})
                                </p>
                            </div>

                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <div className="text-teal-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h4 className="text-white font-medium">Your Position</h4>
                                <p className="text-gray-300 text-sm">{lastSeasonAwards.userPosition}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Historical Records */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-teal-400 mb-4">Historical Records</h3>
                    {historicalData.length > 0 ? (
                        <div className="space-y-3">
                            {historicalData.map((record) => (
                                <div key={record.season} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                    <div>
                                        <h4 className="text-white font-medium">Season {record.season}</h4>
                                        <p className="text-gray-400 text-sm">Champion: {record.champions}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-teal-400 font-bold">#{record.userPosition}</p>
                                        <p className="text-gray-400 text-sm">Your Position</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-center py-8">No historical data available</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClubHistoryPage;