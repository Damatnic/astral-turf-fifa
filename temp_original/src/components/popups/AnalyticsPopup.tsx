import React, { useState } from 'react';
import { useUIContext, useTacticsContext } from '../../hooks';
import { CloseIcon, ChartLineIcon, RadarChartIcon, ArrowIcon } from '../ui/icons';
import type { Player } from '../../types';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import RadarChart from '../charts/RadarChart';

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

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}> = ({ title, value, change, icon }) => (
  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
    <div className="flex justify-between items-start mb-2">
      <h4 className="text-sm text-gray-400 font-medium">{title}</h4>
      {icon && <div className="text-gray-400">{icon}</div>}
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    {change !== undefined && (
      <div
        className={`flex items-center text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}
      >
        {change >= 0 ? (
          <ArrowIcon className="w-4 h-4 mr-1 rotate-0" />
        ) : (
          <ArrowIcon className="w-4 h-4 mr-1 rotate-180" />
        )}
        <span>
          {Math.abs(change)}% {change >= 0 ? 'increase' : 'decrease'}
        </span>
      </div>
    )}
  </div>
);

const PlayerStatsRow: React.FC<{ player: Player; onViewDetails: (playerId: string) => void }> = ({
  player,
  onViewDetails,
}) => {
  const averageRating = Math.round(
    (player.attributes.speed +
      player.attributes.passing +
      player.attributes.tackling +
      player.attributes.shooting +
      player.attributes.dribbling +
      player.attributes.positioning +
      player.attributes.stamina) /
      7
  );

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-700/30">
      <td className="px-4 py-3">
        <div className="flex items-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
            style={{ backgroundColor: player.teamColor }}
          >
            {player.jerseyNumber}
          </div>
          <span className="font-medium text-white">{player.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-white">{player.stats.matchesPlayed}</td>
      <td className="px-4 py-3 text-center text-green-400 font-semibold">{player.stats.goals}</td>
      <td className="px-4 py-3 text-center text-blue-400 font-semibold">{player.stats.assists}</td>
      <td className="px-4 py-3 text-center text-teal-400">{averageRating}</td>
      <td className="px-4 py-3 text-center">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            player.form === 'Excellent'
              ? 'bg-green-600 text-white'
              : player.form === 'Good'
                ? 'bg-blue-600 text-white'
                : player.form === 'Average'
                  ? 'bg-yellow-600 text-white'
                  : player.form === 'Poor'
                    ? 'bg-orange-600 text-white'
                    : 'bg-red-600 text-white'
          }`}
        >
          {player.form}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onViewDetails(player.id)}
          className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-md transition-colors"
        >
          View
        </button>
      </td>
    </tr>
  );
};

const AnalyticsPopup: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { tacticsState } = useTacticsContext();
  const { players } = tacticsState;
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('season');

  const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const homeTeamPlayers = players.filter(p => p.team === 'home');

  // Calculate team statistics
  const teamStats = {
    totalGoals: homeTeamPlayers.reduce((sum, p) => sum + p.stats.goals, 0),
    totalAssists: homeTeamPlayers.reduce((sum, p) => sum + p.stats.assists, 0),
    totalMatches: Math.max(...homeTeamPlayers.map(p => p.stats.matchesPlayed)),
    averageAge: Math.round(
      homeTeamPlayers.reduce((sum, p) => sum + p.age, 0) / homeTeamPlayers.length
    ),
    averageStamina: Math.round(
      homeTeamPlayers.reduce((sum, p) => sum + p.stamina, 0) / homeTeamPlayers.length
    ),
    playersInGoodForm: homeTeamPlayers.filter(p => p.form === 'Excellent' || p.form === 'Good')
      .length,
  };

  // Mock performance data for charts
  const performanceData = {
    monthlyGoals: [
      { month: 'Jan', goals: 15, assists: 8 },
      { month: 'Feb', goals: 22, assists: 12 },
      { month: 'Mar', goals: 18, assists: 15 },
      { month: 'Apr', goals: 25, assists: 18 },
      { month: 'May', goals: 20, assists: 10 },
      { month: 'Jun', goals: 28, assists: 22 },
    ],
    playerAttributes: homeTeamPlayers.slice(0, 5).map(player => ({
      name: player.name,
      speed: player.attributes.speed,
      passing: player.attributes.passing,
      shooting: player.attributes.shooting,
      dribbling: player.attributes.dribbling,
      tackling: player.attributes.tackling,
      positioning: player.attributes.positioning,
    })),
  };

  const topScorers = homeTeamPlayers.sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 5);

  const topAssists = homeTeamPlayers.sort((a, b) => b.stats.assists - a.stats.assists).slice(0, 5);

  const handleViewPlayerDetails = (playerId: string) => {
    dispatch({ type: 'SET_EDITING_PLAYER_ID', payload: playerId });
    dispatch({ type: 'OPEN_MODAL', payload: 'editPlayer' });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-7xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center">
            <ChartLineIcon className="w-6 h-6 mr-3 text-teal-400" />
            <h2 className="text-xl font-bold text-teal-400">Team Analytics</h2>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="season">This Season</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={handleClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-4 border-b border-gray-700">
          <div className="flex space-x-1">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Overview
            </TabButton>
            <TabButton
              active={activeTab === 'performance'}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </TabButton>
            <TabButton active={activeTab === 'players'} onClick={() => setActiveTab('players')}>
              Player Stats
            </TabButton>
            <TabButton active={activeTab === 'tactical'} onClick={() => setActiveTab('tactical')}>
              Tactical Analysis
            </TabButton>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Statistics */}
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-4">Key Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Goals" value={teamStats.totalGoals} change={15} />
                  <StatCard title="Total Assists" value={teamStats.totalAssists} change={8} />
                  <StatCard title="Matches Played" value={teamStats.totalMatches} />
                  <StatCard
                    title="Team Fitness"
                    value={`${teamStats.averageStamina}%`}
                    change={-3}
                  />
                </div>
              </div>

              {/* Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-gray-200 mb-4">Top Scorers</h3>
                  <div className="space-y-3">
                    {topScorers.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-gray-700/30 rounded-md"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-xs text-gray-400">Age: {player.age}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-400">
                            {player.stats.goals}
                          </div>
                          <div className="text-xs text-gray-400">Goals</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-gray-200 mb-4">Top Assists</h3>
                  <div className="space-y-3">
                    {topAssists.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-gray-700/30 rounded-md"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-xs text-gray-400">Age: {player.age}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-400">
                            {player.stats.assists}
                          </div>
                          <div className="text-xs text-gray-400">Assists</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Overview */}
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-4">Team Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Squad Size" value={homeTeamPlayers.length} />
                  <StatCard title="Average Age" value={teamStats.averageAge} />
                  <StatCard title="Players in Form" value={teamStats.playersInGoodForm} />
                  <StatCard title="Injury Rate" value="5%" change={-12} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-4">Goals & Assists Trend</h3>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <LineChart
                    data={performanceData.monthlyGoals.map((d, i) => ({ x: i + 1, y: d.goals }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-gray-200 mb-4">Monthly Goals</h3>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <BarChart
                      data={performanceData.monthlyGoals.map(d => ({
                        label: d.month,
                        value: d.goals,
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-gray-200 mb-4">
                    Player Attributes Comparison
                  </h3>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <RadarChart
                      datasets={performanceData.playerAttributes.slice(0, 1).map(p => ({
                        label: p.name,
                        color: 'rgb(20, 184, 166)',
                        values: [
                          p.speed,
                          p.passing,
                          p.shooting,
                          p.dribbling,
                          p.tackling,
                          p.positioning,
                        ],
                      }))}
                      labels={[
                        'Speed',
                        'Passing',
                        'Shooting',
                        'Dribbling',
                        'Tackling',
                        'Positioning',
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-4">Player Statistics</h3>
                <div className="bg-gray-700/30 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Player
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Matches
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Goals
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Assists
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Rating
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Form
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {homeTeamPlayers.map(player => (
                          <PlayerStatsRow
                            key={player.id}
                            player={player}
                            onViewDetails={handleViewPlayerDetails}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tactical' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-4">Tactical Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="font-medium text-gray-200 mb-3">Formation Effectiveness</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">4-4-2</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-600 rounded-full h-2 mr-3">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: '85%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-green-400">85%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">4-3-3</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-600 rounded-full h-2 mr-3">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: '72%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-blue-400">72%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">3-5-2</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-600 rounded-full h-2 mr-3">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{ width: '68%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-yellow-400">68%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="font-medium text-gray-200 mb-3">Playing Style Analysis</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Possession</span>
                          <span className="font-semibold text-teal-400">58%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-teal-500 h-2 rounded-full"
                            style={{ width: '58%' }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Attacking</span>
                          <span className="font-semibold text-red-400">75%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: '75%' }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Defensive</span>
                          <span className="font-semibold text-blue-400">45%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: '45%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4">
                <h4 className="font-medium text-gray-200 mb-3">Tactical Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">12</div>
                    <div className="text-sm text-gray-400">Clean Sheets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400 mb-1">2.3</div>
                    <div className="text-sm text-gray-400">Goals per Game</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">78%</div>
                    <div className="text-sm text-gray-400">Pass Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <span>Data updated: {new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md transition-colors">
              Export Report
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPopup;
