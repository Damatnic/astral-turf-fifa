import React, { useState, useMemo } from 'react';
import { useUIContext, useTacticsContext, useFranchiseContext } from '../hooks';
import { ChartLineIcon } from '../components/ui/icons';
import { Player } from '../types';
import { PLAYER_ROLES } from '../constants';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import ScatterPlot from '../components/charts/ScatterPlot';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-colors ${
            active
                ? 'border-b-2 border-teal-400 text-teal-300'
                : 'text-gray-400 hover:text-white'
        }`}
    >
        {children}
    </button>
);

const METRICS: (keyof Player['stats'] | 'passCompletion')[] = [
    'goals', 'assists', 'matchesPlayed', 'shotsOnTarget', 'tacklesWon', 'saves',
    'passesCompleted', 'passesAttempted', 'passCompletion'
];

const getMetricValue = (player: Player, metric: typeof METRICS[number]): number => {
    if (metric === 'passCompletion') {
        return player.stats.passesAttempted > 0 ? Math.round((player.stats.passesCompleted / player.stats.passesAttempted) * 100) : 0;
    }
    const statValue = player.stats[metric];
    return typeof statValue === 'number' ? statValue : 0;
}

const AnalyticsPage: React.FC = () => {
    const { uiState } = useUIContext();
    const { tacticsState } = useTacticsContext();
    const { franchiseState } = useFranchiseContext();
    const { players } = tacticsState;
    const { matchHistory } = franchiseState;
    const [activeTab, setActiveTab] = useState<'team' | 'player'>('team');
    
    const [xAxisMetric, setXAxisMetric] = useState<typeof METRICS[number]>('tacklesWon');
    const [yAxisMetric, setYAxisMetric] = useState<typeof METRICS[number]>('passesCompleted');
    
    const teamPerformance = useMemo(() => {
        let wins = 0;
        let draws = 0;
        let losses = 0;
        const goalsData: { x: number, y: number }[] = [];
        const goalsConcededData: { x: number, y: number }[] = [];

        matchHistory.forEach((match, index) => {
            if (match.homeScore > match.awayScore) wins++;
            else if (match.homeScore < match.awayScore) losses++;
            else draws++;
            
            goalsData.push({ x: index + 1, y: match.homeScore });
            goalsConcededData.push({ x: index + 1, y: match.awayScore });
        });

        return {
            results: [{ label: 'Wins', value: wins }, { label: 'Draws', value: draws }, { label: 'Losses', value: losses }],
            goalsFor: goalsData,
            goalsAgainst: goalsConcededData,
        };
    }, [matchHistory]);

    const scatterData = useMemo(() => {
        return players.map(p => {
            const role = PLAYER_ROLES.find(r => r.id === p.roleId);
            const color = role?.category === 'GK' ? '#f59e0b' // amber-500
                        : role?.category === 'DF' ? '#3b82f6' // blue-500
                        : role?.category === 'MF' ? '#10b981' // emerald-500
                        : '#ef4444'; // red-500
            
            return {
                x: getMetricValue(p, xAxisMetric),
                y: getMetricValue(p, yAxisMetric),
                label: p.name,
                color,
            }
        });
    }, [players, xAxisMetric, yAxisMetric]);

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <ChartLineIcon className="w-5 h-5 mr-3" />
                        Analytics Dashboard
                    </h2>
                </div>
                 <div className="border-b border-gray-700">
                    <nav className="flex space-x-2 px-4">
                        <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')}>Team Performance</TabButton>
                        <TabButton active={activeTab === 'player'} onClick={() => setActiveTab('player')}>Player Analysis</TabButton>
                    </nav>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {activeTab === 'team' && (
                        <>
                             <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-200">Season Results</h3>
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                   <BarChart data={teamPerformance.results} />
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-200">Goals For vs. Against</h3>
                                 <div className="bg-gray-700/50 p-4 rounded-lg h-80">
                                    <LineChart data={teamPerformance.goalsFor} yAxisLabel="Goals Scored" xAxisLabel="Match Week" />
                                 </div>
                                 <div className="bg-gray-700/50 p-4 rounded-lg h-80 mt-4">
                                     <LineChart data={teamPerformance.goalsAgainst} color="#ef4444" yAxisLabel="Goals Conceded" xAxisLabel="Match Week" />
                                 </div>
                            </div>
                        </>
                    )}
                     {activeTab === 'player' && (
                         <div>
                             <h3 className="text-lg font-semibold mb-2 text-gray-200">Player Stat Comparison</h3>
                             <div className="bg-gray-700/50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-400">X-Axis</label>
                                        <select value={xAxisMetric} onChange={(e) => setXAxisMetric(e.target.value as any)} className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded-md text-sm">
                                            {METRICS.map(m => <option key={m} value={m} className="capitalize">{m.replace(/([A-Z])/g, ' $1')}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="text-sm font-medium text-gray-400">Y-Axis</label>
                                        <select value={yAxisMetric} onChange={(e) => setYAxisMetric(e.target.value as any)} className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded-md text-sm">
                                            {METRICS.map(m => <option key={m} value={m} className="capitalize">{m.replace(/([A-Z])/g, ' $1')}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="h-96">
                                    <ScatterPlot data={scatterData} xAxisLabel={xAxisMetric} yAxisLabel={yAxisMetric} />
                                </div>
                                <div className="flex justify-center space-x-4 mt-2 text-xs font-semibold">
                                     <span className="flex items-center"><div className="w-3 h-3 rounded-full mr-1.5" style={{backgroundColor: '#f59e0b'}}></div>GK</span>
                                     <span className="flex items-center"><div className="w-3 h-3 rounded-full mr-1.5" style={{backgroundColor: '#3b82f6'}}></div>DF</span>
                                     <span className="flex items-center"><div className="w-3 h-3 rounded-full mr-1.5" style={{backgroundColor: '#10b981'}}></div>MF</span>
                                     <span className="flex items-center"><div className="w-3 h-3 rounded-full mr-1.5" style={{backgroundColor: '#ef4444'}}></div>FW</span>
                                </div>
                             </div>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};
export default AnalyticsPage;