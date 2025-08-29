
import React from 'react';
import { useFranchiseContext } from '../hooks';
import { TargetIcon } from '../components/ui/icons';

const BoardObjectivesPage: React.FC = () => {
    const { franchiseState } = useFranchiseContext();
    const { boardObjectives } = franchiseState;

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <TargetIcon className="w-5 h-5 mr-3" />
                        Board Objectives
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-3">
                     {boardObjectives.map(obj => (
                        <div key={obj.id} className={`p-4 rounded-lg border-l-4 ${obj.isMet ? 'bg-green-500/20 border-green-500' : 'bg-gray-700/50 border-gray-500'}`}>
                            <p className={`font-semibold ${obj.isMet ? 'text-green-300' : 'text-white'}`}>{obj.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Status: {obj.isMet ? 'Completed' : 'Ongoing'}
                                {obj.isCritical && !obj.isMet && <span className="ml-2 font-bold text-red-400">(Critical)</span>}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BoardObjectivesPage;