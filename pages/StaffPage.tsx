import React, { useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import { Briefcase, StarIcon } from '../components/ui/icons';
import { HeadCoach, HeadScout, HeadOfMedicine, AssistantManager, GKCoach, FitnessCoach } from '../types';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-2 text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            active
                ? 'border-b-2 border-teal-400 text-teal-300'
                : 'text-gray-400 hover:text-white'
        }`}
    >
        {children}
    </button>
);

const StaffCard: React.FC<{ title: string, current: any, market: any[], onHire: (staff: any) => void, children: React.ReactNode }> = ({ title, current, market, onHire, children }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h4 className="font-bold text-lg text-gray-300 mb-2">Current {title}</h4>
            <div className="bg-gray-700/50 p-4 rounded-lg min-h-[120px]">
                {current ? (
                    children
                ) : (
                    <p className="text-center text-gray-500 pt-6">Position Vacant</p>
                )}
            </div>
        </div>
        <div>
            <h4 className="font-bold text-lg text-gray-300 mb-2">Available Candidates</h4>
            <div className="space-y-2">
                {market.map((candidate: any) => (
                    <div key={candidate.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-white">{candidate.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{candidate.specialty || `${candidate.rating || candidate.tacticalKnowledge || candidate.fitnessCoaching || candidate.goalkeepingCoaching} Stars`}</p>
                        </div>
                        <button onClick={() => onHire(candidate)} className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-md text-sm">Hire</button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


const StaffPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { uiState } = useUIContext();
    const { staff } = franchiseState;
    const { activeTeamContext } = uiState;
    const [activeTab, setActiveTab] = useState<'coach' | 'assistant' | 'scout' | 'medicine' | 'fitness' | 'goalkeeping' >('coach');

    const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
    
    // Mock markets for demonstration
    const coachMarket: HeadCoach[] = [
        { id: 'c3', name: 'Pep Guardiola', specialty: 'attacking', bonus: 15, cost: 100000 },
        { id: 'c4', name: 'Jose Mourinho', specialty: 'defending', bonus: 15, cost: 90000 },
    ];
    const assistantMarket: AssistantManager[] = [
        { id: 'am1', name: 'Juanma Lillo', tacticalKnowledge: 18, manManagement: 16, cost: 40000 },
    ];
    const scoutMarket: HeadScout[] = [
        { id: 's1', name: 'Juni Calafat', rating: 5, cost: 50000 },
        { id: 's2', name: 'Paul Mitchell', rating: 4, cost: 40000 },
    ];
    const medicineMarket: HeadOfMedicine[] = [
         { id: 'm1', name: 'Dr. Cugat', injuryPreventionBonus: 10, rehabBonus: 15, cost: 60000 },
         { id: 'm2', name: 'Dr. Feelgood', injuryPreventionBonus: 5, rehabBonus: 10, cost: 45000 },
    ];
    const fitnessMarket: FitnessCoach[] = [
         { id: 'f1', name: 'Lorenzo Buenaventura', fitnessCoaching: 19, cost: 35000 },
    ];
    const gkMarket: GKCoach[] = [
         { id: 'gk1', name: 'Xavi Valero', goalkeepingCoaching: 18, cost: 30000 },
    ];

    const handleHire = (staffMember: any, type: any) => {
        if(confirm(`Are you sure you want to hire ${staffMember.name} for $${staffMember.cost.toLocaleString()}? This will replace your current staff.`)){
            dispatch({ type: 'HIRE_STAFF', payload: { staff: staffMember, team: activeTeam, type }});
        }
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <Briefcase className="w-5 h-5 mr-3" />
                        Staff Management ({activeTeam})
                    </h2>
                </div>
                <div className="border-b border-gray-700 overflow-x-auto">
                    <nav className="flex space-x-1 px-4">
                        <TabButton active={activeTab === 'coach'} onClick={() => setActiveTab('coach')}>Head Coach</TabButton>
                        <TabButton active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')}>Assistant</TabButton>
                        <TabButton active={activeTab === 'fitness'} onClick={() => setActiveTab('fitness')}>Fitness</TabButton>
                        <TabButton active={activeTab === 'goalkeeping'} onClick={() => setActiveTab('goalkeeping')}>Goalkeeping</TabButton>
                        <TabButton active={activeTab === 'scout'} onClick={() => setActiveTab('scout')}>Scouting</TabButton>
                        <TabButton active={activeTab === 'medicine'} onClick={() => setActiveTab('medicine')}>Medical</TabButton>
                    </nav>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {activeTab === 'coach' && (
                        <StaffCard title="Head Coach" current={staff[activeTeam].coach} market={coachMarket} onHire={(s) => handleHire(s, 'coach')}>
                            {staff[activeTeam].coach && (
                                <>
                                    <p className="font-bold text-white text-lg">{staff[activeTeam].coach!.name}</p>
                                    <p className="text-sm text-gray-300 capitalize">Specialty: <span className="font-semibold text-teal-400">{staff[activeTeam].coach!.specialty}</span></p>
                                    <p className="text-sm text-gray-300">Attribute Bonus: <span className="font-semibold text-teal-400">+{staff[activeTeam].coach!.bonus}%</span></p>
                                </>
                            )}
                        </StaffCard>
                    )}
                     {activeTab === 'assistant' && (
                        <StaffCard title="Assistant Manager" current={staff[activeTeam].assistantManager} market={assistantMarket} onHire={(s) => handleHire(s, 'assistantManager')}>
                            {staff[activeTeam].assistantManager && (
                                <>
                                    <p className="font-bold text-white text-lg">{staff[activeTeam].assistantManager!.name}</p>
                                    <p className="text-sm text-gray-300">Tactical Knowledge: <span className="font-semibold text-teal-400">{staff[activeTeam].assistantManager!.tacticalKnowledge}</span></p>
                                    <p className="text-sm text-gray-300">Man Management: <span className="font-semibold text-teal-400">{staff[activeTeam].assistantManager!.manManagement}</span></p>
                                    <p className="text-xs text-gray-500 mt-2 italic">Boosts tactical familiarity gain from training.</p>
                                </>
                            )}
                        </StaffCard>
                    )}
                    {activeTab === 'scout' && (
                        <StaffCard title="Head Scout" current={staff[activeTeam].scout} market={scoutMarket} onHire={(s) => handleHire(s, 'scout')}>
                             {staff[activeTeam].scout && (
                                <>
                                    <p className="font-bold text-white text-lg">{staff[activeTeam].scout!.name}</p>
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-5 h-5 ${i < staff[activeTeam].scout!.rating ? 'text-yellow-400' : 'text-gray-600'}`} />)}
                                    </div>
                                </>
                            )}
                        </StaffCard>
                    )}
                    {activeTab === 'medicine' && (
                        <StaffCard title="Head of Medicine" current={staff[activeTeam].medicine} market={medicineMarket} onHire={(s) => handleHire(s, 'medicine')}>
                            {staff[activeTeam].medicine && (
                                <>
                                    <p className="font-bold text-white text-lg">{staff[activeTeam].medicine!.name}</p>
                                    <p className="text-sm text-gray-300">Injury Prevention: <span className="font-semibold text-teal-400">+{staff[activeTeam].medicine!.injuryPreventionBonus}%</span></p>
                                    <p className="text-sm text-gray-300">Rehab Speed: <span className="font-semibold text-teal-400">+{staff[activeTeam].medicine!.rehabBonus}%</span></p>
                                     <p className="text-xs text-gray-500 mt-2 italic">Reduces injury chance during matches and speeds up recovery times.</p>
                                </>
                            )}
                        </StaffCard>
                    )}
                    {activeTab === 'fitness' && (
                         <StaffCard title="Fitness Coach" current={staff[activeTeam].fitnessCoach} market={fitnessMarket} onHire={(s) => handleHire(s, 'fitnessCoach')}>
                            {staff[activeTeam].fitnessCoach && (
                                <>
                                    <p className="font-bold text-white text-lg">{staff[activeTeam].fitnessCoach!.name}</p>
                                    <p className="text-sm text-gray-300">Fitness Coaching: <span className="font-semibold text-teal-400">{staff[activeTeam].fitnessCoach!.fitnessCoaching} / 20</span></p>
                                    <p className="text-xs text-gray-500 mt-2 italic">Improves weekly stamina recovery for all players.</p>
                                </>
                            )}
                        </StaffCard>
                    )}
                     {activeTab === 'goalkeeping' && (
                         <StaffCard title="Goalkeeping Coach" current={staff[activeTeam].gkCoach} market={gkMarket} onHire={(s) => handleHire(s, 'gkCoach')}>
                            {staff[activeTeam].gkCoach && (
                                <>
                                    <p className="font-bold text-white text-lg">{staff[activeTeam].gkCoach!.name}</p>
                                    <p className="text-sm text-gray-300">GK Coaching: <span className="font-semibold text-teal-400">{staff[activeTeam].gkCoach!.goalkeepingCoaching} / 20</span></p>
                                </>
                            )}
                        </StaffCard>
                    )}
                </div>
            </div>
        </div>
    );
};
export default StaffPage;