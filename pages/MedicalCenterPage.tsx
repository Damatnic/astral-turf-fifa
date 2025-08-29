
import React from 'react';
import { useTacticsContext } from '../hooks';
import { HeartPulseIcon } from '../components/ui/icons';

const MedicalCenterPage: React.FC = () => {
    const { tacticsState } = useTacticsContext();
    const { players } = tacticsState;
    
    const injuredPlayers = players.filter(p => p.availability.status.includes('Injury'));
    const suspendedPlayers = players.filter(p => p.availability.status === 'Suspended');

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <HeartPulseIcon className="w-5 h-5 mr-3" />
                        Medical Center & Suspensions
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                     <div>
                        <h3 className="font-bold text-lg text-gray-300 mb-2">Injury List</h3>
                        <div className="space-y-3">
                            {injuredPlayers.length > 0 ? (
                                injuredPlayers.map(player => (
                                    <div key={player.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white">{player.name}</p>
                                            <p className="text-sm text-red-400">{player.availability.status}</p>
                                        </div>
                                        <p className="text-xs text-gray-400">Return: {player.availability.returnDate || 'N/A'}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">No players are currently injured.</p>
                            )}
                        </div>
                     </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-300 mb-2">Suspension List</h3>
                        <div className="space-y-3">
                            {suspendedPlayers.length > 0 ? (
                                suspendedPlayers.map(player => (
                                    <div key={player.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white">{player.name}</p>
                                            <p className="text-sm text-yellow-400">{player.availability.status}</p>
                                        </div>
                                        <p className="text-xs text-gray-400">Return: {player.availability.returnDate || 'N/A'}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">No players are currently suspended.</p>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalCenterPage;