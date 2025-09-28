import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTacticsContext, useUIContext } from '../../hooks';
import { 
  Brain,
  User,
  Settings,
  Palette,
  Heart,
  Edit,
  Zap,
  TrendingUp,
  Activity,
  Star,
  Target,
  Users,
  BarChart3,
  Shield,
  Sparkles
} from 'lucide-react';
import PositionalBench from './PositionalBench';
import { getBenchPlayers } from '../../utils/sampleTacticsData';
import type { Player, Formation } from '../../types';

/**
 * Individual attribute bar component
 */
const AttributeBar: React.FC<{ label: string; value: number; maxValue?: number }> = ({ 
  label, 
  value, 
  maxValue = 100 
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-300 capitalize">{label}</span>
        <span className="text-xs font-bold text-white">{value}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <motion.div 
          className={`h-2 rounded-full ${getBarColor(percentage)}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

/**
 * Player details component showing comprehensive player information
 */
const PlayerDetails: React.FC<{ player: Player }> = ({ player }) => {
  // Calculate overall rating from attributes
  const overallRating = useMemo(() => {
    if (!player.attributes || Object.keys(player.attributes).length === 0) {
      return player.rating || 75;
    }
    
    const values = Object.values(player.attributes) as number[];
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }, [player.attributes, player.rating]);

  const handleEditPlayer = () => {
    console.log('Edit player:', player.id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Player Details</h2>
        <button
          onClick={handleEditPlayer}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Edit Player"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Player Info */}
      <div className="flex items-center space-x-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-2 border-slate-600"
          style={{ backgroundColor: player.teamColor || '#6b7280' }}
        >
          <span className="text-white">{player.number || player.name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white truncate">{player.name}</h3>
          <p className="text-sm text-slate-400">
            Age: {player.age || '25'} | {player.roleId?.replace('-', ' ') || 'Player'}
          </p>
          <div className="flex items-center mt-1">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-sm font-bold text-white">{overallRating}</span>
            <span className="text-xs text-slate-400 ml-1">Overall</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-800/50 rounded-lg">
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-300">Morale</div>
          <div className="text-lg font-bold text-green-400">{player.morale || 'Good'}</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-300">Form</div>
          <div className="text-lg font-bold text-blue-400">{player.form || 'Stable'}</div>
        </div>
      </div>

      {/* Attributes */}
      {player.attributes && Object.keys(player.attributes).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Attributes
          </h4>
          <div className="space-y-3">
            {Object.entries(player.attributes).map(([key, value]) => (
              <AttributeBar key={key} label={key} value={value as number} />
            ))}
          </div>
        </div>
      )}

      {/* Traits */}
      {player.traits && player.traits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-slate-300 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Traits
          </h4>
          <div className="flex flex-wrap gap-2">
            {player.traits.map((trait, index) => (
              <span 
                key={index}
                className="text-xs font-semibold bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {player.notes && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-slate-300">Notes</h4>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{player.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AI Tactical Insights component
 */
const AIInsights: React.FC = () => {
  const { tacticsState } = useTacticsContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const { formations, activeFormationIds, players } = tacticsState;
  const activeFormation = formations[activeFormationIds?.home || Object.keys(formations)[0]];

  const handleGenerateInsights = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Mock AI analysis - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInsights({
        formationStrength: 8.2,
        defensiveRating: 'High',
        attackingRating: 'Medium',
        keyAdvantages: [
          'Strong midfield presence',
          'Excellent defensive stability',
          'Good ball retention capabilities'
        ],
        vulnerabilities: [
          'Limited width in attack',
          'Potential gaps between lines',
          'Lack of pace on flanks'
        ],
        recommendations: [
          'Consider more aggressive fullback positioning',
          'Utilize quick passing combinations',
          'Maintain compact defensive shape'
        ]
      });
    } catch (error) {
      console.error('AI insights generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [activeFormation, players]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          AI Tactical Analysis
        </h3>
      </div>

      <p className="text-xs text-slate-400">
        Advanced AI analysis of your current formation ({activeFormation?.name || 'Unknown'}) and tactical setup.
      </p>

      <button
        onClick={handleGenerateInsights}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center"
      >
        {isGenerating ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Generate Analysis
          </>
        )}
      </button>

      {insights && (
        <div className="space-y-4">
          {/* Formation Strength */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-300">Formation Strength</span>
              <span className="text-lg font-bold text-green-400">{insights.formationStrength}/10</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Defense:</span>
                <span className="ml-2 text-white font-semibold">{insights.defensiveRating}</span>
              </div>
              <div>
                <span className="text-slate-400">Attack:</span>
                <span className="ml-2 text-white font-semibold">{insights.attackingRating}</span>
              </div>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Key Advantages
            </h4>
            <ul className="space-y-1">
              {insights.keyAdvantages.map((advantage: string, index: number) => (
                <li key={index} className="text-xs text-slate-300 flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  {advantage}
                </li>
              ))}
            </ul>
          </div>

          {/* Vulnerabilities */}
          <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <h4 className="text-sm font-bold text-yellow-400 mb-2 flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Potential Vulnerabilities
            </h4>
            <ul className="space-y-1">
              {insights.vulnerabilities.map((vulnerability: string, index: number) => (
                <li key={index} className="text-xs text-slate-300 flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  {vulnerability}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-1" />
              Tactical Recommendations
            </h4>
            <ul className="space-y-1">
              {insights.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="text-xs text-slate-300 flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="text-center p-4">
          <div className="text-sm text-slate-400">
            Astral AI is analyzing your tactical setup...
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Team Tactics Settings component
 */
const TeamTacticsSettings: React.FC = () => {
  const [mentality, setMentality] = useState('Balanced');
  const [pressure, setPressure] = useState('Medium');
  const [width, setWidth] = useState('Standard');

  const tacticOptions = {
    mentality: ['Defensive', 'Balanced', 'Attacking'],
    pressure: ['Low', 'Medium', 'High'],
    width: ['Narrow', 'Standard', 'Wide']
  };

  const TacticSelector: React.FC<{
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
  }> = ({ label, value, options, onChange }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-300">{label}</label>
      <div className="flex bg-slate-800/50 border border-slate-600/50 rounded-lg p-1">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`
              flex-1 text-xs font-semibold px-3 py-2 rounded transition-colors
              ${value === option 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center">
        <Settings className="w-5 h-5 mr-2" />
        Team Tactics
      </h3>

      <p className="text-xs text-slate-400">
        Configure the overall tactical approach for your team.
      </p>

      <div className="space-y-4">
        <TacticSelector
          label="Mentality"
          value={mentality}
          options={tacticOptions.mentality}
          onChange={setMentality}
        />

        <TacticSelector
          label="Defensive Pressure"
          value={pressure}
          options={tacticOptions.pressure}
          onChange={setPressure}
        />

        <TacticSelector
          label="Team Width"
          value={width}
          options={tacticOptions.width}
          onChange={setWidth}
        />
      </div>

      <div className="p-3 bg-slate-800/50 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Current Setup</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Mentality:</span>
            <span className="text-white font-semibold">{mentality}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Pressure:</span>
            <span className="text-white font-semibold">{pressure}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Width:</span>
            <span className="text-white font-semibold">{width}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Chemistry View component
 */
const ChemistryView: React.FC = () => {
  const { tacticsState } = useTacticsContext();
  const { players, formations, activeFormationIds } = tacticsState;

  const activeFormation = formations[activeFormationIds?.home || Object.keys(formations)[0]];
  const onFieldPlayers = players.filter(player => 
    activeFormation?.slots?.some(slot => slot.playerId === player.id)
  );

  const getChemistryScore = () => {
    // Mock chemistry calculation
    return Math.floor(Math.random() * 30) + 70; // 70-100
  };

  const overallChemistry = getChemistryScore();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center">
        <Heart className="w-5 h-5 mr-2" />
        Team Chemistry
      </h3>

      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
        <div className="text-3xl font-bold text-green-400 mb-1">{overallChemistry}%</div>
        <div className="text-sm text-slate-400">Overall Chemistry</div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300">Player Connections</h4>
        
        {onFieldPlayers.slice(0, 5).map((player, index) => (
          <div key={player.id} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: player.teamColor || '#6b7280' }}
              >
                {player.number || player.name.charAt(0)}
              </div>
              <span className="text-sm text-white truncate">{player.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < Math.floor(Math.random() * 3) + 2 
                      ? 'bg-green-400' 
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-sm font-bold text-blue-400 mb-2">Chemistry Tips</h4>
        <ul className="space-y-1 text-xs text-slate-300">
          <li>• Players from same nation link better</li>
          <li>• Similar playing styles improve chemistry</li>
          <li>• Regular playtime builds understanding</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Tab button component
 */
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={`
      flex-1 flex justify-center items-center p-3 transition-colors border-b-2
      ${active 
        ? 'bg-slate-800/50 text-blue-400 border-blue-500' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/30 border-transparent'
      }
    `}
  >
    {icon}
  </button>
);

/**
 * Main RightSidebar component
 */
export const RightSidebar: React.FC = () => {
  const { tacticsState } = useTacticsContext();
  const { uiState } = useUIContext();

  const { players } = tacticsState;
  const { selectedPlayerId } = uiState;

  const [activeTab, setActiveTab] = useState<'ai' | 'tactics' | 'chemistry' | 'bench'>('bench');

  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : null;

  // Get bench players
  const { formations, activeFormationIds } = tacticsState;
  const activeFormation = formations[activeFormationIds?.home || Object.keys(formations)[0]];
  const benchPlayers = activeFormation ? getBenchPlayers(players, activeFormation) : [];

  return (
    <aside className="w-80 bg-slate-900/90 backdrop-blur-sm flex flex-col shadow-lg h-full border-l border-slate-700/50">
      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedPlayer ? (
          <PlayerDetails player={selectedPlayer} />
        ) : (
          <>
            {activeTab === 'ai' && <AIInsights />}
            {activeTab === 'tactics' && <TeamTacticsSettings />}
            {activeTab === 'chemistry' && <ChemistryView />}
            {activeTab === 'bench' && (
              <PositionalBench
                players={benchPlayers}
                selectedPlayer={selectedPlayer}
                onPlayerSelect={(player) => {
                  // Handle player selection from bench
                  console.log('Selected bench player:', player);
                }}
                onPlayerDragStart={(player) => {
                  // Handle drag start from bench
                  console.log('Dragging bench player:', player);
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Tab Navigation - Only show when no player is selected */}
      {!selectedPlayer && (
        <div className="flex-shrink-0 bg-slate-800/50 border-t border-slate-700/50">
          <div className="flex">
            <TabButton
              label="Bench"
              icon={<Users className="w-5 h-5" />}
              active={activeTab === 'bench'}
              onClick={() => setActiveTab('bench')}
            />
            <TabButton
              label="AI Insights"
              icon={<Brain className="w-5 h-5" />}
              active={activeTab === 'ai'}
              onClick={() => setActiveTab('ai')}
            />
            <TabButton
              label="Team Tactics"
              icon={<Settings className="w-5 h-5" />}
              active={activeTab === 'tactics'}
              onClick={() => setActiveTab('tactics')}
            />
            <TabButton
              label="Chemistry"
              icon={<Heart className="w-5 h-5" />}
              active={activeTab === 'chemistry'}
              onClick={() => setActiveTab('chemistry')}
            />
          </div>
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;