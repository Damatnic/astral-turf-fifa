import React, { useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import type { Team, YouthProspect } from '../types';

const YouthAcademyPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const [selectedTeam, setSelectedTeam] = useState<Team>('home');
    const [selectedProspect, setSelectedProspect] = useState<YouthProspect | null>(null);

    const youthAcademy = franchiseState.youthAcademy[selectedTeam];
    const stadium = franchiseState.stadium[selectedTeam];
    const finances = franchiseState.finances[selectedTeam];

    const upgradeYouthAcademyCost = (youthAcademy.level + 1) * 250000;
    const canUpgradeYouthAcademy = finances.transferBudget >= upgradeYouthAcademyCost;

    const handleInvestInYouthAcademy = () => {
        if (canUpgradeYouthAcademy) {
            dispatch({ type: 'INVEST_IN_YOUTH_ACADEMY', payload: { team: selectedTeam } });
            uiDispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    message: `Youth Academy upgraded to level ${youthAcademy.level + 1}!`,
                    type: 'success',
                },
            });
        }
    };

    const handleSignYouthPlayer = (prospectId: string) => {
        dispatch({ type: 'SIGN_YOUTH_PLAYER', payload: { prospectId, team: selectedTeam } });
        uiDispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: 'Youth prospect signed to the senior squad!',
                type: 'success',
            },
        });
        setSelectedProspect(null);
    };

    const getAttributeRange = (attrRange: readonly [number, number]) => {
        return `${attrRange[0]}-${attrRange[1]}`;
    };

    const getAttributeAverage = (attrRange: readonly [number, number]) => {
        return Math.round((attrRange[0] + attrRange[1]) / 2);
    };

    const calculateOverallPotential = (prospect: YouthProspect) => {
        const averages = Object.values(prospect.attributes).map(range => getAttributeAverage(range));
        return Math.round(averages.reduce((sum, val) => sum + val, 0) / averages.length);
    };

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Youth Academy</h1>
                    <p className="text-gray-400">Develop the next generation of football talent</p>
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

                {/* Academy Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Academy Level</p>
                                <p className="text-2xl font-bold text-teal-400">Level {youthAcademy.level}</p>
                                <p className="text-xs text-gray-500">
                                    Youth Facilities: Level {stadium.youthFacilitiesLevel}
                                </p>
                            </div>
                            <div className="text-teal-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Current Prospects</p>
                                <p className="text-2xl font-bold text-blue-400">{youthAcademy.prospects.length}</p>
                                <p className="text-xs text-gray-500">Available for development</p>
                            </div>
                            <div className="text-blue-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Upgrade Cost</p>
                                <p className="text-2xl font-bold text-yellow-400">
                                    ${upgradeYouthAcademyCost.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">To level {youthAcademy.level + 1}</p>
                            </div>
                            <button
                                onClick={handleInvestInYouthAcademy}
                                disabled={!canUpgradeYouthAcademy}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    canUpgradeYouthAcademy
                                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Upgrade
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Prospects List */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-xl font-semibold text-teal-400 mb-4">Youth Prospects</h3>

                            {youthAcademy.prospects.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-300 mb-2">No Prospects Available</h4>
                                    <p className="text-gray-500">New prospects will be generated based on your academy level</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {youthAcademy.prospects.map((prospect) => (
                                        <div
                                            key={prospect.id}
                                            onClick={() => setSelectedProspect(prospect)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                                selectedProspect?.id === prospect.id
                                                    ? 'border-teal-500 bg-teal-500/10'
                                                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-lg font-semibold text-white">{prospect.name}</h4>
                                                    <p className="text-sm text-gray-400">
                                                        Age {prospect.age} • {prospect.nationality}
                                                    </p>
                                                    <div className="flex items-center space-x-4 mt-2">
                                                        <span className="text-sm text-teal-400">
                                                            Potential: {getAttributeRange(prospect.potential)}
                                                        </span>
                                                        <span className="text-sm text-blue-400">
                                                            Overall: ~{calculateOverallPotential(prospect)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        prospect.morale === 'Excellent' ? 'bg-green-600 text-white' :
                                                        prospect.morale === 'Good' ? 'bg-blue-600 text-white' :
                                                        prospect.morale === 'Okay' ? 'bg-yellow-600 text-white' :
                                                        'bg-red-600 text-white'
                                                    }`}>
                                                        {prospect.morale}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prospect Details */}
                    <div>
                        {selectedProspect ? (
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">{selectedProspect.name}</h3>
                                        <p className="text-gray-400">Age {selectedProspect.age} • {selectedProspect.nationality}</p>
                                    </div>
                                    <button
                                        onClick={() => handleSignYouthPlayer(selectedProspect.id)}
                                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Sign to Senior Squad
                                    </button>
                                </div>

                                {/* Attributes */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-teal-400 mb-3">Attributes</h4>
                                    <div className="space-y-3">
                                        {Object.entries(selectedProspect.attributes).map(([attr, range]) => (
                                            <div key={attr} className="flex justify-between items-center">
                                                <span className="text-gray-300 capitalize">{attr}</span>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-sm text-gray-400 w-16">
                                                        {getAttributeRange(range)}
                                                    </span>
                                                    <div className="w-24 bg-gray-600 rounded-full h-2">
                                                        <div
                                                            className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${getAttributeAverage(range)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Contract Info */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-teal-400 mb-3">Contract</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Weekly Wage</span>
                                            <span className="text-white">${(selectedProspect.contract.wage || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Contract Expires</span>
                                            <span className="text-white">{selectedProspect.contract.expires || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Player Traits */}
                                {selectedProspect.traits.length > 0 && (
                                    <div>
                                        <h4 className="text-lg font-semibold text-teal-400 mb-3">Traits</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProspect.traits.map((trait) => (
                                                <span key={trait} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                                                    {trait}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-300 mb-2">Select a Prospect</h3>
                                <p className="text-gray-500">Choose a youth prospect to view detailed information</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Academy Benefits */}
                <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-teal-400 mb-4">Academy Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-green-400 mb-2">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-white mb-2">Higher Potential</h4>
                            <p className="text-sm text-gray-400">Level {youthAcademy.level} academy produces prospects with {40 + youthAcademy.level * 10}+ potential</p>
                        </div>

                        <div className="text-center">
                            <div className="text-blue-400 mb-2">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-white mb-2">Faster Development</h4>
                            <p className="text-sm text-gray-400">Youth prospects develop {youthAcademy.level * 15}% faster in training</p>
                        </div>

                        <div className="text-center">
                            <div className="text-purple-400 mb-2">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-white mb-2">More Prospects</h4>
                            <p className="text-sm text-gray-400">Generate {Math.min(youthAcademy.level, 3)} new prospects every {Math.max(4 - youthAcademy.level, 2)} weeks</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YouthAcademyPage;