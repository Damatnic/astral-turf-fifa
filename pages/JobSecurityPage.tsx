
import React from 'react';
import { useFranchiseContext } from '../hooks';
import { ShieldCheck } from '../components/ui/icons';

const Gauge: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    const colorClass = value > 70 ? 'bg-green-500' : value > 40 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div>
            <p className="text-center text-sm font-semibold text-gray-300">{label}</p>
            <div className="w-full bg-gray-600 rounded-full h-4 mt-1">
                <div className={`${colorClass} h-4 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
            </div>
            <p className="text-center font-bold text-lg mt-1">{value}%</p>
        </div>
    )
};

const JobSecurityPage: React.FC = () => {
    const { franchiseState } = useFranchiseContext();
    const { jobSecurity, fanConfidence, boardObjectives } = franchiseState;

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <ShieldCheck className="w-5 h-5 mr-3" />
                        Job Security
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <Gauge label="Board Confidence" value={jobSecurity} />
                        <Gauge label="Fan Confidence" value={fanConfidence} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-300 mb-2">Current Board Objectives</h3>
                        <div className="space-y-2">
                        {boardObjectives.map(obj => (
                            <div key={obj.id} className={`p-3 rounded-md text-sm ${obj.isMet ? 'bg-green-500/20 text-green-300' : 'bg-gray-700/50 text-gray-300'}`}>
                                <p className="font-semibold">{obj.description}</p>
                                <p className="text-xs">{obj.isMet ? 'Completed' : (obj.isCritical ? 'Critical' : 'Ongoing')}</p>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobSecurityPage;