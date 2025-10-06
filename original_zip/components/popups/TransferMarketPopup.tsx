import React, { useState, useMemo } from 'react';
import { useUIContext, useFranchiseContext } from '../../hooks';
import { CloseIcon, SearchIcon, FilterIcon, CompareIcon, MoneyIcon } from '../ui/icons';
import type { TransferPlayer, TransferMarketFilters, PositionRole } from '../../types';
import { PLAYER_ROLES } from '../../constants';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors ${
      active
        ? 'bg-gray-700 text-teal-300 border-b-2 border-teal-400'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700/50'
    }`}
  >
    {children}
  </button>
);

const PlayerCard: React.FC<{
  player: TransferPlayer;
  onMakeOffer: (playerId: string) => void;
  onScout: (playerId: string) => void;
  onCompare: (playerId: string) => void;
}> = ({ player, onMakeOffer, onScout, onCompare }) => {
  const roleInfo = PLAYER_ROLES.find(role => role.id === player.roleId);
  const averageAttribute = Math.round(
    Object.values(player.attributes).reduce((sum, value) => sum + value, 0) /
      Object.keys(player.attributes).length
  );

  return (
    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
            {player.jerseyNumber}
          </div>
          <div>
            <h4 className="font-semibold text-white text-lg">{player.name}</h4>
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <span>Age: {player.age}</span>
              <span>
                {roleInfo?.abbreviation || 'N/A'} - {roleInfo?.name || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            ${player.askingPrice.toLocaleString()}M
          </div>
          <div className="text-sm text-gray-400">Asking Price</div>
        </div>
      </div>

      {/* Player Stats Overview */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-teal-400">{averageAttribute}</div>
          <div className="text-xs text-gray-400">Overall</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">{player.potential[1]}</div>
          <div className="text-xs text-gray-400">Max Pot.</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-400">{player.stats.matchesPlayed}</div>
          <div className="text-xs text-gray-400">Matches</div>
        </div>
      </div>

      {/* Key Attributes */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Key Attributes</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Speed:</span>
            <span className="font-semibold text-white">{player.attributes.speed}</span>
          </div>
          <div className="flex justify-between">
            <span>Passing:</span>
            <span className="font-semibold text-white">{player.attributes.passing}</span>
          </div>
          <div className="flex justify-between">
            <span>Shooting:</span>
            <span className="font-semibold text-white">{player.attributes.shooting}</span>
          </div>
          <div className="flex justify-between">
            <span>Dribbling:</span>
            <span className="font-semibold text-white">{player.attributes.dribbling}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => onMakeOffer(player.id)}
          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center"
        >
          <MoneyIcon className="w-4 h-4 mr-1" />
          Make Offer
        </button>
        <button
          onClick={() => onScout(player.id)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          Scout
        </button>
        <button
          onClick={() => onCompare(player.id)}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          <CompareIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const TransferMarketPopup: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { franchiseState } = useFranchiseContext();
  const { transferMarket } = franchiseState;
  const [activeTab, setActiveTab] = useState('browse');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransferMarketFilters>({
    name: '',
    position: 'All',
    age: { min: 16, max: 35 },
    potential: { min: 50, max: 99 },
    price: { min: 0, max: 200 },
  });

  const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

  // Mock transfer market data - in real app this would come from context
  const mockTransferPlayers: TransferPlayer[] = [
    {
      id: 'transfer_1',
      name: 'Marco Silva',
      jerseyNumber: 10,
      age: 23,
      nationality: 'PT',
      potential: [82, 89],
      currentPotential: 84,
      roleId: 'ap',
      instructions: {},
      team: 'home',
      attributes: {
        speed: 85,
        passing: 88,
        tackling: 70,
        shooting: 82,
        dribbling: 90,
        positioning: 86,
        stamina: 83,
      },
      availability: { status: 'Available' },
      morale: 'Good',
      form: 'Excellent',
      developmentLog: [],
      contract: { clauses: [] },
      stats: {
        goals: 15,
        assists: 22,
        matchesPlayed: 34,
        shotsOnTarget: 45,
        tacklesWon: 25,
        saves: 0,
        passesCompleted: 420,
        passesAttempted: 500,
        careerHistory: [],
      },
      loan: { isLoaned: false },
      traits: ['Ambitious'],
      conversationHistory: [],
      stamina: 100,
      attributeHistory: [],
      attributeDevelopmentProgress: {},
      communicationLog: [],
      customTrainingSchedule: null,
      fatigue: 10,
      injuryRisk: 1,
      lastConversationInitiatedWeek: 0,
      moraleBoost: null,
      completedChallenges: [],
      askingPrice: 45,
    },
    {
      id: 'transfer_2',
      name: 'James Thompson',
      jerseyNumber: 4,
      age: 26,
      nationality: 'GB-ENG',
      potential: [85, 88],
      currentPotential: 86,
      roleId: 'bpd',
      instructions: {},
      team: 'home',
      attributes: {
        speed: 78,
        passing: 85,
        tackling: 92,
        shooting: 55,
        dribbling: 74,
        positioning: 89,
        stamina: 87,
      },
      availability: { status: 'Available' },
      morale: 'Excellent',
      form: 'Good',
      developmentLog: [],
      contract: { clauses: [] },
      stats: {
        goals: 3,
        assists: 8,
        matchesPlayed: 38,
        shotsOnTarget: 12,
        tacklesWon: 156,
        saves: 0,
        passesCompleted: 680,
        passesAttempted: 750,
        careerHistory: [],
      },
      loan: { isLoaned: false },
      traits: ['Leader', 'Consistent'],
      conversationHistory: [],
      stamina: 100,
      attributeHistory: [],
      attributeDevelopmentProgress: {},
      communicationLog: [],
      customTrainingSchedule: null,
      fatigue: 8,
      injuryRisk: 1,
      lastConversationInitiatedWeek: 0,
      moraleBoost: null,
      completedChallenges: [],
      askingPrice: 32,
    },
    {
      id: 'transfer_3',
      name: 'Kai Nakamura',
      jerseyNumber: 7,
      age: 20,
      nationality: 'JP',
      potential: [78, 92],
      currentPotential: 81,
      roleId: 'iw',
      instructions: {},
      team: 'home',
      attributes: {
        speed: 91,
        passing: 79,
        tackling: 65,
        shooting: 84,
        dribbling: 93,
        positioning: 82,
        stamina: 89,
      },
      availability: { status: 'Available' },
      morale: 'Good',
      form: 'Average',
      developmentLog: [],
      contract: { clauses: [] },
      stats: {
        goals: 18,
        assists: 14,
        matchesPlayed: 32,
        shotsOnTarget: 52,
        tacklesWon: 18,
        saves: 0,
        passesCompleted: 280,
        passesAttempted: 350,
        careerHistory: [],
      },
      loan: { isLoaned: false },
      traits: ['Ambitious'],
      conversationHistory: [],
      stamina: 100,
      attributeHistory: [],
      attributeDevelopmentProgress: {},
      communicationLog: [],
      customTrainingSchedule: null,
      fatigue: 12,
      injuryRisk: 1,
      lastConversationInitiatedWeek: 0,
      moraleBoost: null,
      completedChallenges: [],
      askingPrice: 28,
    },
  ];

  const filteredPlayers = useMemo(() => {
    return mockTransferPlayers.filter(player => {
      const matchesName = player.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesPosition =
        filters.position === 'All' ||
        PLAYER_ROLES.find(role => role.id === player.roleId)?.category === filters.position;
      const matchesAge = player.age >= filters.age.min && player.age <= filters.age.max;
      const matchesPotential =
        player.potential[1] >= filters.potential.min &&
        player.potential[1] <= filters.potential.max;
      const matchesPrice =
        player.askingPrice >= filters.price.min && player.askingPrice <= filters.price.max;

      return matchesName && matchesPosition && matchesAge && matchesPotential && matchesPrice;
    });
  }, [filters, mockTransferPlayers]);

  const handleMakeOffer = (playerId: string) => {
    const player = mockTransferPlayers.find(p => p.id === playerId);
    if (player) {
      // Open contract negotiation modal
      dispatch({ type: 'OPEN_MODAL', payload: 'contractNegotiation' });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Initiating transfer negotiation for ${player.name}...`,
          type: 'info',
        },
      });
    }
  };

  const handleScout = (playerId: string) => {
    const player = mockTransferPlayers.find(p => p.id === playerId);
    if (player) {
      dispatch({ type: 'SCOUT_PLAYER', payload: playerId });
      dispatch({ type: 'OPEN_MODAL', payload: 'scouting' });
    }
  };

  const handleCompare = (playerId: string) => {
    dispatch({ type: 'SET_COMPARE_PLAYER_ID', payload: playerId });
    dispatch({ type: 'OPEN_MODAL', payload: 'comparePlayer' });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center">
            <MoneyIcon className="w-6 h-6 mr-3 text-teal-400" />
            <h2 className="text-xl font-bold text-teal-400">Transfer Market</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors ${
                showFilters
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <FilterIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="p-4 bg-gray-900/50 border-b border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-teal-400">{mockTransferPlayers.length}</div>
              <div className="text-sm text-gray-400">Available Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{filteredPlayers.length}</div>
              <div className="text-sm text-gray-400">Matching Filters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">$125M</div>
              <div className="text-sm text-gray-400">Available Budget</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">3</div>
              <div className="text-sm text-gray-400">Active Negotiations</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search players by name..."
                value={filters.name}
                onChange={e => setFilters(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={filters.position}
              onChange={e =>
                setFilters(prev => ({ ...prev, position: e.target.value as PositionRole | 'All' }))
              }
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Positions</option>
              <option value="GK">Goalkeepers</option>
              <option value="DF">Defenders</option>
              <option value="MF">Midfielders</option>
              <option value="FW">Forwards</option>
            </select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-700/30 rounded-lg">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Age Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="16"
                    max="35"
                    value={filters.age.min}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        age: { ...prev.age, min: parseInt(e.target.value) },
                      }))
                    }
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="number"
                    min="16"
                    max="35"
                    value={filters.age.max}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        age: { ...prev.age, max: parseInt(e.target.value) },
                      }))
                    }
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Potential Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="50"
                    max="99"
                    value={filters.potential.min}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        potential: { ...prev.potential, min: parseInt(e.target.value) },
                      }))
                    }
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="number"
                    min="50"
                    max="99"
                    value={filters.potential.max}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        potential: { ...prev.potential, max: parseInt(e.target.value) },
                      }))
                    }
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Price Range (M)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={filters.price.min}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        price: { ...prev.price, min: parseInt(e.target.value) },
                      }))
                    }
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={filters.price.max}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        price: { ...prev.price, max: parseInt(e.target.value) },
                      }))
                    }
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-4 border-b border-gray-700">
          <div className="flex space-x-1">
            <TabButton active={activeTab === 'browse'} onClick={() => setActiveTab('browse')}>
              Browse Players
            </TabButton>
            <TabButton
              active={activeTab === 'negotiations'}
              onClick={() => setActiveTab('negotiations')}
            >
              Active Negotiations
            </TabButton>
            <TabButton active={activeTab === 'shortlist'} onClick={() => setActiveTab('shortlist')}>
              Shortlist
            </TabButton>
            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
              Transfer History
            </TabButton>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'browse' && (
            <div>
              {filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredPlayers.map(player => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onMakeOffer={handleMakeOffer}
                      onScout={handleScout}
                      onCompare={handleCompare}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Players Found</h3>
                  <p className="text-gray-400">
                    Try adjusting your search filters to find more players.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'negotiations' && (
            <div className="space-y-4">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Negotiations</h3>
                <p className="text-gray-400">Make offers on players to see negotiations here.</p>
              </div>
            </div>
          )}

          {activeTab === 'shortlist' && (
            <div className="space-y-4">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Shortlist Empty</h3>
                <p className="text-gray-400">Add players to your shortlist to track them easily.</p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Transfer History</h3>
                <p className="text-gray-400">Your completed transfers will appear here.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <span>
              Showing {filteredPlayers.length} of {mockTransferPlayers.length} available players
            </span>
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferMarketPopup;
