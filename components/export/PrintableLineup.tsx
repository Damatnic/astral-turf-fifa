
import React, { forwardRef } from 'react';
import { Player, Formation } from '../../types';
import { LogoIcon } from '../ui/icons';

interface PrintableLineupProps {
    players: Player[];
    formations: Record<string, Formation>;
    activeFormationIds: { home: string, away: string };
    captainIds: { home: string | null, away: string | null };
}

const PlayerList: React.FC<{ title: string, players: Player[], captainId: string | null }> = ({ title, players, captainId }) => (
    <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-600 pb-1 mb-2">{title}</h4>
        <ul className="space-y-1 text-sm">
            {players.length > 0 ? players.map(player => (
                <li key={player.id} className="flex items-center">
                    <span className="w-6 text-right mr-3 font-mono text-gray-400">{player.jerseyNumber}</span>
                    <span className="font-semibold">{player.name} {player.id === captainId && '(C)'}</span>
                </li>
            )) : <li className="text-gray-500">None</li>}
        </ul>
    </div>
);

const PrintableLineup = forwardRef<HTMLDivElement, PrintableLineupProps>(({ players, formations, activeFormationIds, captainIds }, ref) => {
    
    const homeFormation = formations[activeFormationIds.home];
    const awayFormation = formations[activeFormationIds.away];

    const homePlayerIds = new Set(homeFormation.slots.map(s => s.playerId).filter(Boolean));
    const awayPlayerIds = new Set(awayFormation.slots.map(s => s.playerId).filter(Boolean));

    const homeStarters = players.filter(p => p.team === 'home' && homePlayerIds.has(p.id));
    const awayStarters = players.filter(p => p.team === 'away' && awayPlayerIds.has(p.id));

    const homeBench = players.filter(p => p.team === 'home' && !homePlayerIds.has(p.id));
    const awayBench = players.filter(p => p.team === 'away' && !awayPlayerIds.has(p.id));

    return (
        <div ref={ref} className="w-[800px] bg-slate-800 text-white p-8 font-sans">
            <header className="flex items-center justify-between pb-4 border-b-2 border-slate-600">
                <div className="flex items-center">
                    <LogoIcon className="w-12 h-12 mr-4 text-teal-400" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-wider">
                            <span className="text-teal-400">Astral</span> Turf
                        </h1>
                        <p className="text-gray-400">Match Day Lineup</p>
                    </div>
                </div>
                 <div className="text-right">
                    <p className="font-bold text-lg">{homeFormation.name} vs {awayFormation.name}</p>
                    <p className="text-gray-400">Formations</p>
                </div>
            </header>

            <main className="grid grid-cols-2 gap-8 mt-6">
                {/* Home Team */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-blue-400">Home Team</h2>
                    <div className="space-y-6">
                        <PlayerList title="Starting XI" players={homeStarters} captainId={captainIds.home} />
                        <PlayerList title="Substitutes" players={homeBench} captainId={captainIds.home} />
                    </div>
                </section>

                {/* Away Team */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-red-400">Away Team</h2>
                     <div className="space-y-6">
                        <PlayerList title="Starting XI" players={awayStarters} captainId={captainIds.away} />
                        <PlayerList title="Substitutes" players={awayBench} captainId={captainIds.away} />
                    </div>
                </section>
            </main>
        </div>
    );
});

export default PrintableLineup;
