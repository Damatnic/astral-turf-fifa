
import React, { useState, useCallback } from 'react';
import { useTacticsContext, useUIContext, useFranchiseContext } from '../../hooks';
import { getTacticalAdvice } from '../../services/aiServiceLoader';
import type { Player, Formation, Team, TeamTacticValue, TeamTactics, TeamKitPattern, PlayerTrait } from '../../types';
import { BrainCircuitIcon, PencilIcon, LoadingSpinner, SlidersHorizontalIcon, ShirtIcon, StarIcon, UsersIcon } from '../ui/icons';
import { DETAILED_PLAYER_INSTRUCTIONS, PLAYER_ROLES } from '../../constants';
import ChemistryView from './ChemistryView';

const AttributeBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const percentage = (value / 100) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-[var(--text-secondary)] capitalize">{label}</span>
        <span className="font-bold text-[var(--accent-primary)]">{value}</span>
      </div>
      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5">
        <div className="bg-[var(--accent-secondary)] h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const PlayerDetails: React.FC<{ player: Player }> = ({ player }) => {
  const { dispatch } = useUIContext();
  const playerRole = PLAYER_ROLES.find(r => r.id === player.roleId);
  const playerInstructions = Object.entries(player.instructions)
    .map(([instrId, optionId]) => {
      const instruction = DETAILED_PLAYER_INSTRUCTIONS[instrId];
      if (!instruction || optionId === 'default') return null;
      const option = instruction.options.find(o => o.id === optionId);
      return option ? option.name : null;
    })
    .filter(Boolean);


  const handleEditPlayer = () => {
    dispatch({ type: 'SET_EDITING_PLAYER_ID', payload: player.id });
    dispatch({ type: 'OPEN_MODAL', payload: 'editPlayer'});
  }

  return (
    <div>
       <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[var(--accent-primary)]">Player Details</h2>
        <button
            onClick={handleEditPlayer}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            title="Edit Player"
        >
            <PencilIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mr-4 border-2 border-[var(--accent-primary)]" style={{backgroundColor: player.teamColor}}>
          {player.jerseyNumber}
        </div>
        <div>
          <h3 className="text-xl font-bold">{player.name}</h3>
          <p className="text-sm text-[var(--text-secondary)]">Age: {player.age} | {playerRole?.name || 'Unknown Role'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
        <div><span className="text-sm font-semibold text-[var(--text-secondary)]">Morale:</span><span className="text-sm font-bold ml-2 text-[var(--text-primary)]">{player.morale}</span></div>
        <div><span className="text-sm font-semibold text-[var(--text-secondary)]">Form:</span><span className="text-sm font-bold ml-2 text-[var(--text-primary)]">{player.form}</span></div>
      </div>
      <div className="space-y-3">
        {Object.entries(player.attributes).map(([key, value]) => (
          <AttributeBar key={key} label={key} value={value} />
        ))}
      </div>
       {player.traits.length > 0 && (
        <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-md">
            <h4 className="font-bold text-[var(--accent-primary)] text-sm mb-2">Traits</h4>
            <div className="flex flex-wrap gap-2">
                {player.traits.map(trait => (
                    <span key={trait} className="text-xs font-semibold bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full flex items-center">
                        <StarIcon className="w-3 h-3 mr-1" />
                        {trait}
                    </span>
                ))}
            </div>
        </div>
       )}
       {playerInstructions.length > 0 && (
          <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-md">
            <h4 className="font-bold text-[var(--accent-primary)] text-sm mb-2">Instructions</h4>
            <div className="flex flex-wrap gap-2">
                {playerInstructions.map(instr => (
                    <span key={instr} className="text-xs font-semibold bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">
                        {instr}
                    </span>
                ))}
            </div>
         </div>
       )}
       {player.notes && (
         <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-md">
            <h4 className="font-bold text-[var(--accent-primary)] text-sm mb-1">Notes</h4>
            <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap">{player.notes}</p>
         </div>
       )}
    </div>
  );
};

const AIInsights: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { franchiseState } = useFranchiseContext();
  const { players, formations, activeFormationIds, teamTactics } = tacticsState;
  const { aiInsight, isLoadingAI, settings } = uiState;
  const { staff } = franchiseState;

  const homeFormation = formations[activeFormationIds.home];
  const awayFormation = formations[activeFormationIds.away];


  const handleGenerateInsights = useCallback(async () => {
    if (!homeFormation || !awayFormation) return;
    dispatch({ type: 'GENERATE_AI_INSIGHT_START' });
    try {
      const homePlayerIds = new Set(homeFormation.slots.map(s => s.playerId).filter(Boolean));
      const awayPlayerIds = new Set(awayFormation.slots.map(s => s.playerId).filter(Boolean));
      
      const homePlayers = players.filter(p => homePlayerIds.has(p.id));
      const awayPlayers = players.filter(p => awayPlayerIds.has(p.id));

      const insight = await getTacticalAdvice(homePlayers, awayPlayers, homeFormation, awayFormation, teamTactics.home, teamTactics.away, settings.aiPersonality, staff.home.coach);
      dispatch({ type: 'GENERATE_AI_INSIGHT_SUCCESS', payload: insight });
    } catch (error) {
      console.error(error);
      dispatch({ type: 'GENERATE_AI_INSIGHT_FAILURE' });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `AI error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' } });
    }
  }, [homeFormation, awayFormation, players, teamTactics.home, teamTactics.away, settings.aiPersonality, staff.home.coach, dispatch]);

  return (
    <div>
      <div className="mb-3">
          <p className="text-xs text-[var(--text-secondary)] mt-1">Analyzes the Home team's ({homeFormation.name}) strategy against the Away team's ({awayFormation.name}).</p>
      </div>
      <button
        onClick={handleGenerateInsights}
        disabled={isLoadingAI}
        className="w-full bg-[var(--accent-tertiary)] hover:bg-[var(--accent-secondary)] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
      >
        {isLoadingAI ? <LoadingSpinner /> : 'Analyze Home vs. Away'}
      </button>
      {aiInsight && (
        <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-md space-y-3 text-sm">
          <div>
            <h4 className="font-bold text-green-400">Key Advantages (Home)</h4>
            <p className="text-[var(--text-primary)]">{aiInsight.advantages}</p>
          </div>
          <div>
            <h4 className="font-bold text-yellow-400">Potential Vulnerabilities (Home)</h4>
            <p className="text-[var(--text-primary)]">{aiInsight.vulnerabilities}</p>
          </div>
          <div>
            <h4 className="font-bold text-blue-400">Strategic Recommendation</h4>
            <p className="text-[var(--text-primary)]">{aiInsight.recommendation}</p>
          </div>
        </div>
      )}
       {isLoadingAI && !aiInsight &&
         <div className="mt-4 text-center text-[var(--text-secondary)] text-sm">
            <p>Astral AI is analyzing the matchup...</p>
         </div>
      }
    </div>
  );
};

const TacticControl: React.FC<{
    label: string;
    options: readonly { value: TeamTacticValue; label: string }[];
    value: TeamTacticValue;
    onChange: (value: TeamTacticValue) => void;
}> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
        <div className="flex bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md p-0.5">
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`w-full text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                        value === option.value ? 'bg-[var(--accent-tertiary)] text-white' : 'text-[var(--text-secondary)] hover:bg-gray-600/70'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

const TeamTacticsEditor: React.FC = () => {
    const { tacticsState, dispatch } = useTacticsContext();
    const { uiState } = useUIContext();
    const { teamTactics } = tacticsState;
    const { activeTeamContext } = uiState;
    const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
    const currentTactics = teamTactics[activeTeam];

    const handleTacticChange = (tactic: keyof TeamTactics, value: TeamTacticValue) => {
        dispatch({ type: 'SET_TEAM_TACTIC', payload: { team: activeTeam, tactic, value } });
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] mt-1">Set the high-level strategy for the <span className={`font-bold ${activeTeam === 'home' ? 'text-blue-400' : 'text-red-400'}`}>{activeTeam} team</span>.</p>
        </div>
    );
};

const TeamKitEditor: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { teamKits, activeTeamContext } = uiState;
    const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
    const currentKit = teamKits[activeTeam];

    const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor', value: string) => {
        dispatch({ type: 'SET_TEAM_KIT', payload: { team: activeTeam, kit: { [colorType]: value } } });
    };
    
    const handlePatternChange = (pattern: TeamKitPattern) => {
        dispatch({ type: 'SET_TEAM_KIT', payload: { team: activeTeam, kit: { pattern } } });
    };

    return (
        <div className="space-y-4">
             <p className="text-xs text-[var(--text-secondary)] mt-1">Customize the kit for the <span className={`font-bold ${activeTeam === 'home' ? 'text-blue-400' : 'text-red-400'}`}>{activeTeam} team</span>.</p>
             <div className="flex items-center justify-around">
                <div className="flex flex-col items-center">
                    <label htmlFor="primaryColor" className="text-sm font-medium text-[var(--text-secondary)] mb-1.5">Primary</label>
                    <input type="color" id="primaryColor" value={currentKit.primaryColor} onChange={e => handleColorChange('primaryColor', e.target.value)} className="w-16 h-10 p-0 border-none rounded-md cursor-pointer" />
                </div>
                 <div className="flex flex-col items-center">
                    <label htmlFor="secondaryColor" className="text-sm font-medium text-[var(--text-secondary)] mb-1.5">Secondary</label>
                    <input type="color" id="secondaryColor" value={currentKit.secondaryColor} onChange={e => handleColorChange('secondaryColor', e.target.value)} className="w-16 h-10 p-0 border-none rounded-md cursor-pointer"/>
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Pattern</label>
                <div className="flex bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md p-0.5">
                    {(['solid', 'stripes', 'hoops'] as TeamKitPattern[]).map(p => (
                         <button
                            key={p}
                            onClick={() => handlePatternChange(p)}
                             className={`w-full text-xs font-semibold px-2 py-1 rounded-md transition-colors capitalize ${
                                currentKit.pattern === p ? 'bg-[var(--accent-tertiary)] text-white' : 'text-[var(--text-secondary)] hover:bg-gray-600/70'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
             </div>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} title={label} className={`flex-1 flex justify-center items-center p-2 transition-colors ${active ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>
        {icon}
    </button>
)

export const RightSidebar: React.FC = () => {
    const { tacticsState } = useTacticsContext();
    const { uiState } = useUIContext();
    const { selectedPlayerId, activeTeamContext } = uiState;
    const { players } = tacticsState;
    const [activeTab, setActiveTab] = useState<'details' | 'ai' | 'tactics' | 'kit' | 'chemistry'>('details');

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);

    const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';

    return (
        <aside className="w-80 bg-[var(--bg-secondary)] flex flex-col shadow-lg h-full">
            <div className="flex-grow p-4 overflow-y-auto">
                {selectedPlayer ? (
                    <PlayerDetails player={selectedPlayer} />
                ) : (
                    <>
                        {activeTab === 'ai' && <AIInsights />}
                        {activeTab === 'tactics' && <TeamTacticsEditor />}
                        {activeTab === 'kit' && <TeamKitEditor />}
                        {activeTab === 'chemistry' && <ChemistryView team={activeTeam} />}
                    </>
                )}
            </div>
            
            {!selectedPlayerId && (
                <div className="flex-shrink-0 border-t border-[var(--border-primary)] flex bg-[var(--bg-primary)]">
                    <TabButton label="AI Insights" icon={<BrainCircuitIcon className="w-5 h-5" />} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
                    <TabButton label="Team Tactics" icon={<SlidersHorizontalIcon className="w-5 h-5" />} active={activeTab === 'tactics'} onClick={() => setActiveTab('tactics')} />
                     <TabButton label="Team Chemistry" icon={<UsersIcon className="w-5 h-5" />} active={activeTab === 'chemistry'} onClick={() => setActiveTab('chemistry')} />
                    <TabButton label="Kit Editor" icon={<ShirtIcon className="w-5 h-5" />} active={activeTab === 'kit'} onClick={() => setActiveTab('kit')} />
                </div>
            )}
        </aside>
    );
};
