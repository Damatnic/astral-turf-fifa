import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import type { Team, WeeklySchedule, TrainingDrill } from '../types';

const TrainingPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { uiState } = useUIContext();
    const [selectedTeam, setSelectedTeam] = useState<Team>('home');
    const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule>('monday');
    const [newTemplateName, setNewTemplateName] = useState('');

    const schedule = franchiseState.trainingSchedule[selectedTeam];
    const daySchedule = schedule[selectedDay];
    const players = tacticsState.players.filter(p => p.team === selectedTeam);

    const days: { key: keyof WeeklySchedule; label: string }[] = [
        { key: 'monday', label: 'Monday' },
        { key: 'tuesday', label: 'Tuesday' },
        { key: 'wednesday', label: 'Wednesday' },
        { key: 'thursday', label: 'Thursday' },
        { key: 'friday', label: 'Friday' },
        { key: 'saturday', label: 'Saturday' },
        { key: 'sunday', label: 'Sunday' }
    ];

    const drillCategories = [
        'attacking', 'defending', 'physical', 'technical', 'tactical', 'set_pieces', 'warmup', 'cooldown'
    ];

    const mockDrills: Record<string, TrainingDrill> = {
        'warmup_1': {
            id: 'warmup_1',
            name: 'Light Jogging',
            category: 'warmup',
            description: 'Easy pace jogging to warm up muscles',
            primaryAttributes: ['stamina'],
            secondaryAttributes: [],
            intensity: 'low',
            fatigueEffect: 2,
            moraleEffect: 0,
            injuryRisk: 0.01
        },
        'shooting_1': {
            id: 'shooting_1',
            name: 'Shooting Practice',
            category: 'attacking',
            description: 'Practice shooting from various positions',
            primaryAttributes: ['shooting'],
            secondaryAttributes: ['positioning'],
            intensity: 'medium',
            fatigueEffect: 8,
            moraleEffect: 1,
            injuryRisk: 0.05
        },
        'passing_1': {
            id: 'passing_1',
            name: 'Passing Drills',
            category: 'technical',
            description: 'Short and long passing accuracy training',
            primaryAttributes: ['passing'],
            secondaryAttributes: ['positioning'],
            intensity: 'medium',
            fatigueEffect: 6,
            moraleEffect: 0,
            injuryRisk: 0.03
        }
    };

    const handleSetDayAsRest = () => {
        dispatch({
            type: 'SET_DAY_AS_REST',
            payload: { team: selectedTeam, day: selectedDay }
        });
    };

    const handleSetDayAsTraining = () => {
        dispatch({
            type: 'SET_DAY_AS_TRAINING',
            payload: { team: selectedTeam, day: selectedDay }
        });
    };

    const handleSetSessionDrill = (session: 'morning' | 'afternoon', sessionPart: 'warmup' | 'main' | 'cooldown', drillId: string | null) => {
        dispatch({
            type: 'SET_SESSION_DRILL',
            payload: { team: selectedTeam, day: selectedDay, session, sessionPart, drillId }
        });
    };

    const handleSaveTemplate = () => {
        if (newTemplateName.trim()) {
            dispatch({
                type: 'SAVE_TRAINING_TEMPLATE',
                payload: { team: selectedTeam, name: newTemplateName.trim() }
            });
            setNewTemplateName('');
        }
    };

    const handleLoadTemplate = (templateId: string) => {
        dispatch({
            type: 'LOAD_TRAINING_TEMPLATE',
            payload: { team: selectedTeam, templateId }
        });
    };

    return (
        <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2">Training Management</h1>
                    <p className="text-gray-400">Design training schedules and develop your players</p>
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

                {/* Templates Section */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-teal-400 mb-4">Training Templates</h3>
                    <div className="flex items-center space-x-4 mb-4">
                        <input
                            type="text"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Template name..."
                        />
                        <button
                            onClick={handleSaveTemplate}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Save Current Schedule
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(franchiseState.trainingPlanTemplates).map(([id, template]) => (
                            <button
                                key={id}
                                onClick={() => handleLoadTemplate(id)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Day Selector */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-teal-400 mb-4">Training Days</h3>
                        <div className="space-y-2">
                            {days.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedDay(key)}
                                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                                        selectedDay === key
                                            ? 'bg-teal-600 text-white'
                                            : schedule[key].isRestDay
                                                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                                : 'bg-gray-700 text-white hover:bg-gray-600'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span>{label}</span>
                                        {schedule[key].isRestDay && (
                                            <span className="text-xs bg-red-600 px-2 py-1 rounded">REST</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Training Schedule */}
                    <div className="lg:col-span-3 bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-teal-400">
                                {days.find(d => d.key === selectedDay)?.label} Schedule
                            </h3>
                            <div className="space-x-2">
                                <button
                                    onClick={handleSetDayAsTraining}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                        !daySchedule.isRestDay
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    }`}
                                >
                                    Training Day
                                </button>
                                <button
                                    onClick={handleSetDayAsRest}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                        daySchedule.isRestDay
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    }`}
                                >
                                    Rest Day
                                </button>
                            </div>
                        </div>

                        {daySchedule.isRestDay ? (
                            <div className="text-center py-12">
                                <div className="text-red-400 mb-2">
                                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-red-400 mb-2">Rest Day</h4>
                                <p className="text-gray-400">Players will recover stamina and reduce injury risk</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Morning Session */}
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <h4 className="text-md font-semibold text-yellow-400 mb-3">Morning Session</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(['warmup', 'main', 'cooldown'] as const).map((part) => (
                                            <div key={part} className="bg-gray-600 rounded-lg p-3">
                                                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                                                    {part}
                                                </label>
                                                <select
                                                    value={daySchedule.morning[part] || ''}
                                                    onChange={(e) => handleSetSessionDrill('morning', part, e.target.value || null)}
                                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                >
                                                    <option value="">No drill selected</option>
                                                    {Object.values(mockDrills)
                                                        .filter(drill => 
                                                            (part === 'warmup' && drill.category === 'warmup') ||
                                                            (part === 'cooldown' && drill.category === 'cooldown') ||
                                                            (part === 'main' && !['warmup', 'cooldown'].includes(drill.category))
                                                        )
                                                        .map(drill => (
                                                            <option key={drill.id} value={drill.id}>
                                                                {drill.name}
                                                            </option>
                                                        ))}
                                                </select>
                                                {daySchedule.morning[part] && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {mockDrills[daySchedule.morning[part]!]?.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Afternoon Session */}
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <h4 className="text-md font-semibold text-orange-400 mb-3">Afternoon Session</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(['warmup', 'main', 'cooldown'] as const).map((part) => (
                                            <div key={part} className="bg-gray-600 rounded-lg p-3">
                                                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                                                    {part}
                                                </label>
                                                <select
                                                    value={daySchedule.afternoon[part] || ''}
                                                    onChange={(e) => handleSetSessionDrill('afternoon', part, e.target.value || null)}
                                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                >
                                                    <option value="">No drill selected</option>
                                                    {Object.values(mockDrills)
                                                        .filter(drill => 
                                                            (part === 'warmup' && drill.category === 'warmup') ||
                                                            (part === 'cooldown' && drill.category === 'cooldown') ||
                                                            (part === 'main' && !['warmup', 'cooldown'].includes(drill.category))
                                                        )
                                                        .map(drill => (
                                                            <option key={drill.id} value={drill.id}>
                                                                {drill.name}
                                                            </option>
                                                        ))}
                                                </select>
                                                {daySchedule.afternoon[part] && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {mockDrills[daySchedule.afternoon[part]!]?.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Player Development Progress */}
                <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-teal-400 mb-4">Player Development Progress</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {players.slice(0, 6).map((player) => (
                            <div key={player.id} className="bg-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-white font-medium">{player.name}</h4>
                                        <p className="text-sm text-gray-400">Age {player.age}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm text-teal-400">Potential: {player.currentPotential}</span>
                                        <br />
                                        <span className="text-xs text-gray-400">Stamina: {player.stamina}%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(player.attributeDevelopmentProgress).slice(0, 3).map(([attr, progress]) => (
                                        <div key={attr} className="flex justify-between items-center">
                                            <span className="text-sm text-gray-300 capitalize">{attr}</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-16 bg-gray-600 rounded-full h-2">
                                                    <div 
                                                        className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-400 w-8">{progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingPage;