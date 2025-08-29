
import React from 'react';
import { Globe } from '../components/ui/icons';

const InternationalManagementPage: React.FC = () => {

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <Globe className="w-5 h-5 mr-3" />
                        International Management
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto text-center text-gray-500">
                    <p className="py-16">You have no international job offers at this time. Improve your reputation to attract offers from national teams.</p>
                </div>
            </div>
        </div>
    );
};

export default InternationalManagementPage;