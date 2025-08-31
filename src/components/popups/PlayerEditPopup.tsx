import React, { useState, useEffect, useMemo } from 'react';
import { useTacticsContext, useUIContext, useFranchiseContext } from '../../hooks';
import type { Player, PlayerAttributes, PlayerTrait, PositionRole, PlayerAvailabilityStatus, PlayerMorale, PlayerForm } from '../../types';
import { CloseIcon } from '../ui/icons';
import { PLAYER_ROLES, DETAILED_PLAYER_INSTRUCTIONS } from '../../constants';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = React.memo(({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${active ? 'bg-gray-700 text-teal-300' : 'bg-gray-800 text-gray-400 hover:bg-gray-700/50'}`}>
        {children}
    </button>
));

const PlayerEditPopup: React.FC = React.memo(() => {
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
    const { franchiseState } = useFranchiseContext();
    const { editingPlayerId } = uiState;
    const { players } = tacticsState;
    const { skillChallenges } = franchiseState;

    const [playerData, setPlayerData] = useState<Player | null>(null);
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        if (editingPlayerId) {
            const player = players.find(p => p.id === editingPlayerId);
            setPlayerData(player ? { ...player } : null);
        } else {
            // Logic for creating a new player
            const newPlayer: Player = {
                id: `player_${Date.now()}`, name: 'New Player', jerseyNumber: 99, age: 20, nationality: '', potential: [60, 80], currentPotential: 65, roleId: 'cm', instructions: {}, team: 'home', teamColor: '#3b82f6',
                attributes: { speed: 60, passing: 60, tackling: 60, shooting: 60, dribbling: 60, positioning: 60, stamina: 80 },
                position: { x: -100, y: -100 }, availability: { status: 'Available' }, morale: 'Okay', form: 'Average', stamina: 100,
                developmentLog: [], contract: { clauses: [] }, stats: { goals: 0, assists: 0, matchesPlayed: 0, shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0, careerHistory: [] },
                loan: { isLoaned: false }, traits: [], conversationHistory: [], attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [],
            };
            setPlayerData(newPlayer);
        }
    }, [editingPlayerId, players]);

    const handleClose = () => uiDispatch({ type: 'CLOSE_MODAL' });

    const handleSave = () => {
        if (!playerData) {return;}
        if (editingPlayerId) {
            tacticsDispatch({ type: 'UPDATE_PLAYER', payload: playerData });
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${playerData.name} updated successfully.`, type: 'success' } });
        } else {
            tacticsDispatch({ type: 'ADD_PLAYER', payload: playerData });
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${playerData.name} created successfully.`, type: 'success' } });
        }
        handleClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPlayerData(prev => prev ? { ...prev, [name]: name === 'age' || name === 'jerseyNumber' ? parseInt(value) : value } : null);
    };

    const handleAttributeChange = (attr: keyof PlayerAttributes, value: number) => {
        setPlayerData(prev => prev ? { ...prev, attributes: { ...prev.attributes, [attr]: value } } : null);
    };

    const handleInstructionChange = (instruction: string, option: string) => {
        setPlayerData(p => {
            if (!p) {return null;}
            const newInstructions = { ...p.instructions };
            if (option === 'default') {
                delete newInstructions[instruction];
            } else {
                newInstructions[instruction] = option;
            }
            return { ...p, instructions: newInstructions };
        });
    };

    const handleChallengeToggle = (challengeId: string) => {
        if (!playerData) {return;}
        const isCompleted = playerData.completedChallenges.includes(challengeId);
        const newChallenges = isCompleted
            ? playerData.completedChallenges.filter(id => id !== challengeId)
            : [...playerData.completedChallenges, challengeId];
        setPlayerData({ ...playerData, completedChallenges: newChallenges });
    };

    if (!playerData) {return null;}

    return (
        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
            <div onClick={e => e.stopPropagation()} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400">{editingPlayerId ? `Edit ${playerData.name}` : 'Create New Player'}</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"><CloseIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex-shrink-0 px-4 border-b border-gray-700">
                    <div className="flex space-x-1">
                        <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</TabButton>
                        <TabButton active={activeTab === 'attributes'} onClick={() => setActiveTab('attributes')}>Attributes</TabButton>
                        <TabButton active={activeTab === 'instructions'} onClick={() => setActiveTab('instructions')}>Instructions</TabButton>
                        <TabButton active={activeTab === 'challenges'} onClick={() => setActiveTab('challenges')}>Challenges</TabButton>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><label className="text-gray-400">Name</label><input type="text" name="name" value={playerData.name} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded mt-1" /></div>
                            <div><label className="text-gray-400">Jersey #</label><input type="number" name="jerseyNumber" value={playerData.jerseyNumber} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded mt-1" /></div>
                            <div><label className="text-gray-400">Age</label><input type="number" name="age" value={playerData.age} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded mt-1" /></div>
                            <div><label className="text-gray-400">Nationality (ISO 3166-1 alpha-2)</label><input type="text" name="nationality" value={playerData.nationality} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded mt-1" placeholder="e.g., US, GB-ENG" /></div>
                            <div>
                                <label className="text-gray-400">Role</label>
                                <select name="roleId" value={playerData.roleId} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded mt-1">
                                    {PLAYER_ROLES.map(role => <option key={role.id} value={role.id}>{role.name} ({role.abbreviation})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400">Team Color</label>
                                <input type="color" name="teamColor" value={playerData.teamColor} onChange={handleChange} className="w-full h-10 p-1 bg-gray-700 rounded mt-1" />
                            </div>
                        </div>
                    )}
                    {activeTab === 'attributes' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            {Object.entries(playerData.attributes).map(([key, value]) => (
                                <div key={key}>
                                    <div className="flex justify-between text-sm mb-1"><span className="capitalize text-gray-300">{key}</span><span className="font-bold text-teal-400">{value}</span></div>
                                    <input type="range" min="1" max="99" value={value} onChange={e => handleAttributeChange(key as keyof PlayerAttributes, parseInt(e.target.value))} className="w-full" />
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'instructions' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.values(DETAILED_PLAYER_INSTRUCTIONS).map(instr => (
                                <div key={instr.name}>
                                    <label className="text-gray-300 font-semibold">{instr.name}</label>
                                    <p className="text-xs text-gray-500 mb-1">{instr.description}</p>
                                    <select
                                        value={playerData.instructions[instr.name.toLowerCase().replace(/ /g, '_')] || 'default'}
                                        onChange={(e) => handleInstructionChange(instr.name.toLowerCase().replace(/ /g, '_'), e.target.value)}
                                        className="w-full p-2 bg-gray-700 rounded text-sm"
                                    >
                                        {instr.options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'challenges' && (
                        <div>
                            <h3 className="font-semibold text-lg text-gray-200 mb-2">Assign Skill Badges</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {skillChallenges.map(challenge => (
                                    <label key={challenge.id} className="flex items-center p-2 bg-gray-700/50 rounded-md cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={playerData.completedChallenges.includes(challenge.id)}
                                            onChange={() => handleChallengeToggle(challenge.id)}
                                            className="w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                                        />
                                        <div className="w-6 h-6 rounded-md ml-3 mr-2 flex items-center justify-center text-sm" style={{ backgroundColor: challenge.color }}>{challenge.icon}</div>
                                        <span className="text-sm font-semibold text-white">{challenge.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md transition-colors">Save Changes</button>
                </div>
            </div>
        </div>
    );
});

export default PlayerEditPopup;
