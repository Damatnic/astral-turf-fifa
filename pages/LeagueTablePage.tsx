
import React, { useMemo } from 'react';
import { useFranchiseContext } from '../hooks';
import { TableIcon } from '../components/ui/icons';
import { LeagueTableEntry } from '../types';

const LeagueTablePage: React.FC = () => {
    const { franchiseState } = useFranchiseContext();
    const { season } = franchiseState;

    const sortedTable = useMemo(() => {
        return (Object.values(season.leagueTable) as LeagueTableEntry[]).sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points;
            if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
            if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
            return a.teamName.localeCompare(b.teamName);
        });
    }, [season.leagueTable]);

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <TableIcon className="w-5 h-5 mr-3" />
                        League Table - Season {season.year}
                    </h2>
                </div>
                
                <div className="p-2 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-2 py-2 text-center">Pos</th>
                                <th className="px-4 py-2">Team</th>
                                <th className="px-2 py-2 text-center">P</th>
                                <th className="px-2 py-2 text-center">W</th>
                                <th className="px-2 py-2 text-center">D</th>
                                <th className="px-2 py-2 text-center">L</th>
                                <th className="px-2 py-2 text-center">GD</th>
                                <th className="px-2 py-2 text-center">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                        {sortedTable.map((entry, index) => (
                            <tr key={entry.teamName} className={`border-b border-gray-700/50 ${entry.isUserTeam ? 'bg-teal-500/20' : ''}`}>
                                <td className="px-2 py-2 text-center font-semibold">{index + 1}</td>
                                <td className="px-4 py-2 font-bold text-white">{entry.teamName}</td>
                                <td className="px-2 py-2 text-center">{entry.played}</td>
                                <td className="px-2 py-2 text-center">{entry.won}</td>
                                <td className="px-2 py-2 text-center">{entry.drawn}</td>
                                <td className="px-2 py-2 text-center">{entry.lost}</td>
                                <td className="px-2 py-2 text-center">{entry.goalDifference > 0 ? `+${entry.goalDifference}`: entry.goalDifference}</td>
                                <td className="px-2 py-2 text-center font-bold text-white">{entry.points}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeagueTablePage;