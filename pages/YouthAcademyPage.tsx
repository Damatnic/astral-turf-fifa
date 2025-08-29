
import React from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import { GraduationCap, SparklesIcon } from '../components/ui/icons';
import { YouthProspect } from '../types';

const ProspectCard: React.FC<{ prospect: YouthProspect }> = ({ prospect }) => {
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const { dispatch } = useFranchiseContext();
    const activeTeam = uiState.activeTeamContext === 'away' ? 'away' : 'home';

    const handleSign = () => {
        if (confirm(`Are you sure you want to sign ${prospect.name} to the senior squad?`)) {
            dispatch({ type: 'SIGN_YOUTH_PLAYER', payload: { prospectId: prospect.id, team: activeTeam } });
        }
    };
    
    const handleScout = () => {
         uiDispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', message: 'Scouting report requested...' } });
    }

    return (
        <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-white">{prospect.name}</p>
                    <p className="text-sm text-gray-400">Age: {prospect.age}</p>
                </div>
                <img 
                    src={`https://flagcdn.com/w40/${prospect.nationality.toLowerCase().split('-')[0]}.png`}
                    alt={prospect.nationality}
                    className="w-8 h-auto rounded-sm"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
            </div>
            <div className="mt-2">
                <p className="text-xs text-gray-400">Potential Ability</p>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-teal-500 to-green-400 h-2.5 rounded-full" style={{ width: `${prospect.potential[1]}%` }}></div>
                </div>
                <p className="text-right text-xs font-mono text-teal-300">{prospect.potential[0]} - {prospect.potential[1]}</p>
            </div>
            <div className="mt-4 flex space-x-2">
                <button onClick={handleScout} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md text-sm flex items-center justify-center"><SparklesIcon className="w-4 h-4 mr-2"/>Scout</button>
                <button onClick={handleSign} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md text-sm">Sign</button>
            </div>
        </div>
    );
};

const YouthAcademyPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { uiState } = useUIContext();
    const { youthAcademy } = franchiseState;
    const { activeTeamContext } = uiState;
    const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
    const academy = youthAcademy[activeTeam];
    
    const handleInvest = () => {
        if(confirm(`Upgrading the youth academy costs money and improves the quality of future intakes. Proceed?`)){
            dispatch({ type: 'INVEST_IN_YOUTH_ACADEMY', payload: { team: activeTeam } });
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <GraduationCap className="w-5 h-5 mr-3" />
                        Youth Academy ({activeTeam})
                    </h2>
                </div>
                
                <div className="p-4 bg-gray-900/50 flex justify-between items-center">
                    <p className="text-gray-300">Academy Level: <span className="font-bold text-xl text-white">{academy.level}</span></p>
                    <button onClick={handleInvest} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-md text-sm">Invest</button>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    {academy.prospects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {academy.prospects.map(prospect => (
                                <ProspectCard key={prospect.id} prospect={prospect} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <p className="text-lg">No prospects currently in the academy.</p>
                            <p className="text-sm">New prospects will arrive during the season.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YouthAcademyPage;