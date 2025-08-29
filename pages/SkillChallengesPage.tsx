import React, { useState } from 'react';
import { useFranchiseContext } from '../hooks';
import { AwardIcon, PlusIcon, TrashIcon } from '../components/ui/icons';

const SkillChallengesPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { skillChallenges } = franchiseState;

    const [newChallenge, setNewChallenge] = useState({ name: '', description: '', icon: '🏆', color: '#fbbf24' });

    const handleAddChallenge = (e: React.FormEvent) => {
        e.preventDefault();
        if (newChallenge.name.trim() && newChallenge.description.trim()) {
            dispatch({ type: 'ADD_SKILL_CHALLENGE', payload: newChallenge });
            setNewChallenge({ name: '', description: '', icon: '🏆', color: '#fbbf24' });
        }
    };

    const handleRemoveChallenge = (id: string) => {
        if (confirm('Are you sure you want to delete this skill challenge? This will remove it for all players.')) {
            dispatch({ type: 'REMOVE_SKILL_CHALLENGE', payload: id });
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <AwardIcon className="w-5 h-5 mr-3" />
                        Skill Challenges
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-200">Create New Challenge</h3>
                        <form onSubmit={handleAddChallenge} className="space-y-2 p-3 bg-gray-900/50 rounded-md">
                            <input type="text" placeholder="Challenge Name" value={newChallenge.name} onChange={e => setNewChallenge({...newChallenge, name: e.target.value})} className="w-full p-2 bg-gray-700 rounded-md" required />
                            <textarea placeholder="Description..." value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})} className="w-full p-2 bg-gray-700 rounded-md" rows={3} required></textarea>
                            <div className="flex items-center space-x-2">
                                <input type="text" placeholder="Icon (emoji)" value={newChallenge.icon} onChange={e => setNewChallenge({...newChallenge, icon: e.target.value})} className="w-1/2 p-2 bg-gray-700 rounded-md" />
                                <input type="color" value={newChallenge.color} onChange={e => setNewChallenge({...newChallenge, color: e.target.value})} className="w-1/2 h-10 p-1 bg-gray-700 rounded-md" />
                            </div>
                            <button type="submit" className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 rounded-md text-sm font-semibold flex items-center justify-center">
                                <PlusIcon className="w-4 h-4 mr-1" /> Add Challenge
                            </button>
                        </form>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-200">Existing Challenges</h3>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {skillChallenges.length > 0 ? skillChallenges.map(challenge => (
                                <div key={challenge.id} className="group flex justify-between items-center p-3 bg-gray-700/50 rounded-md">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-md mr-3 flex items-center justify-center text-xl" style={{ backgroundColor: challenge.color }}>{challenge.icon}</div>
                                        <div>
                                            <p className="font-semibold text-white">{challenge.name}</p>
                                            <p className="text-xs text-gray-400">{challenge.description}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveChallenge(challenge.id)} className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )) : (
                                <p className="text-sm text-center text-gray-500 py-10">No skill challenges created yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillChallengesPage;
