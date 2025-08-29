import React, { useState, useMemo } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import { UsersIcon, TrashIcon } from '../components/ui/icons';
import { Player } from '../types';

const MentoringPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { uiState } = useUIContext();
    const { players } = tacticsState;
    const { mentoringGroups } = franchiseState;
    
    const activeTeam = uiState.activeTeamContext === 'away' ? 'away' : 'home';
    const teamMentoringGroups = mentoringGroups[activeTeam];
    
    const [selectedMentor, setSelectedMentor] = useState<string>('');
    const [selectedMentees, setSelectedMentees] = useState<string[]>([]);

    const teamPlayers = useMemo(() => players.filter(p => p.team === activeTeam), [players, activeTeam]);

    const { potentialMentors, potentialMentees } = useMemo(() => {
        const allMenteeIds = new Set(teamMentoringGroups.flatMap(g => g.menteeIds));
        const allMentorIds = new Set(teamMentoringGroups.map(g => g.mentorId));

        const mentors = teamPlayers.filter(p => 
            p.age >= 25 &&
            (p.traits.includes('Leader') || p.traits.includes('Consistent')) &&
            !allMentorIds.has(p.id) &&
            !allMenteeIds.has(p.id)
        );

        const mentees = teamPlayers.filter(p =>
            p.age < 23 &&
            !allMentorIds.has(p.id) &&
            !allMenteeIds.has(p.id)
        );

        return { potentialMentors: mentors, potentialMentees: mentees };
    }, [teamPlayers, teamMentoringGroups]);

    const handleToggleMentee = (playerId: string) => {
        setSelectedMentees(prev => 
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    };

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedMentor && selectedMentees.length > 0) {
            dispatch({ type: 'CREATE_MENTORING_GROUP', payload: { team: activeTeam, mentorId: selectedMentor, menteeIds: selectedMentees } });
            setSelectedMentor('');
            setSelectedMentees([]);
        }
    };

    const handleDissolveGroup = (mentorId: string) => {
        if (confirm('Are you sure you want to dissolve this mentoring group?')) {
            dispatch({ type: 'DISSOLVE_MENTORING_GROUP', payload: { team: activeTeam, mentorId } });
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <UsersIcon className="w-5 h-5 mr-3" />
                        Mentoring ({activeTeam})
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-200">Existing Groups</h3>
                        <div className="space-y-3">
                            {teamMentoringGroups.length > 0 ? teamMentoringGroups.map(group => {
                                const mentor = players.find(p => p.id === group.mentorId);
                                const mentees = group.menteeIds.map(id => players.find(p => p.id === id)).filter(Boolean);
                                if (!mentor) return null;
                                return (
                                    <div key={group.mentorId} className="bg-gray-700/50 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-teal-300">{mentor.name} (Mentor)</p>
                                            <button onClick={() => handleDissolveGroup(mentor.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                        <ul className="text-sm mt-1 list-disc list-inside pl-2 text-gray-300">
                                            {mentees.map(mentee => <li key={mentee!.id}>{mentee!.name}</li>)}
                                        </ul>
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-center text-gray-500 py-10">No mentoring groups established.</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-200">Create New Group</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4 p-4 bg-gray-900/50 rounded-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Select Mentor</label>
                                <select value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" required>
                                    <option value="">Choose a mentor...</option>
                                    {potentialMentors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Select Mentees (up to 3)</label>
                                <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                                    {potentialMentees.map(p => (
                                        <label key={p.id} className="flex items-center p-2 bg-gray-700/50 rounded-md">
                                            <input
                                                type="checkbox"
                                                checked={selectedMentees.includes(p.id)}
                                                onChange={() => handleToggleMentee(p.id)}
                                                disabled={!selectedMentees.includes(p.id) && selectedMentees.length >= 3}
                                                className="w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                                            />
                                            <span className="ml-3 text-sm text-white">{p.name} (Age: {p.age})</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded-md text-sm font-semibold">Create Group</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentoringPage;
