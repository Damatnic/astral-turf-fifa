import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import type { Team } from '../types';
import { ResponsivePage } from '../components/Layout/ResponsivePage';
import {
  ResponsiveGrid,
  TouchButton,
  ResponsiveCard,
} from '../components/Layout/AdaptiveLayout.tsx';

const AnalyticsPage: React.FC = () => {
  const { franchiseState } = useFranchiseContext();
  const { tacticsState } = useTacticsContext();
  const { uiState } = useUIContext();
  const [selectedTeam, setSelectedTeam] = useState<Team>('home');
  const [selectedMetric, setSelectedMetric] = useState<
    'performance' | 'financials' | 'transfers' | 'development'
  >('performance');

  const teamPlayers = tacticsState.players.filter(p => p.team === selectedTeam);
  const teamFinances = franchiseState.finances[selectedTeam];
  const { matchHistory, season } = franchiseState;

  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    const totalMatches = matchHistory.length;
    const wins = matchHistory.filter((match: any) => {
      const isHome = true; // Simplified assumption
      return isHome ? match.homeScore > match.awayScore : match.awayScore > match.homeScore;
    }).length;
    const draws = matchHistory.filter((match: any) => match.homeScore === match.awayScore).length;
    const losses = totalMatches - wins - draws;

    const goalStats = matchHistory.reduce(
      (acc: any, match: any) => {
        acc.scored += match.homeScore; // Simplified
        acc.conceded += match.awayScore;
        return acc;
      },
      { scored: 0, conceded: 0 },
    ) as { scored: number; conceded: number };

    return {
      totalMatches,
      wins,
      draws,
      losses,
      winPercentage: totalMatches > 0 ? (wins / totalMatches) * 100 : 0,
      goalsScored: goalStats.scored,
      goalsConceded: goalStats.conceded,
      goalDifference: goalStats.scored - goalStats.conceded,
    };
  };

  const performanceMetrics = calculatePerformanceMetrics();

  // Calculate player analytics
  const calculatePlayerAnalytics = () => {
    const avgAge = teamPlayers.reduce((sum, p) => sum + p.age, 0) / teamPlayers.length || 0;
    const avgPotential =
      teamPlayers.reduce((sum, p) => sum + p.currentPotential, 0) / teamPlayers.length || 0;
    const totalWages = teamPlayers.reduce((sum, p) => sum + (p.contract.wage || 0), 0);

    const topScorers = teamPlayers.sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 5);

    const topAssists = teamPlayers.sort((a, b) => b.stats.assists - a.stats.assists).slice(0, 5);

    return {
      avgAge: Math.round(avgAge * 10) / 10,
      avgPotential: Math.round(avgPotential * 10) / 10,
      totalWages,
      topScorers,
      topAssists,
      squadValue: teamPlayers.length * 500000, // Simplified calculation
    };
  };

  const playerAnalytics = calculatePlayerAnalytics();

  // Financial trends (simplified mock data)
  const financialTrends = {
    weeklyIncome: [120000, 125000, 130000, 118000, 135000, 140000],
    weeklyExpenses: [95000, 98000, 92000, 105000, 100000, 97000],
    weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
  };

  return (
    <ResponsivePage title="Analytics Dashboard" maxWidth="full">
      <div className="space-y-6">
        {/* Description */}
        <p className="text-sm sm:text-base text-gray-400">
          Analyze your team's performance and trends
        </p>

        {/* Team Selector */}
        <div className="bg-gray-800 rounded-lg p-1 inline-flex gap-1">
          <TouchButton
            onClick={() => setSelectedTeam('home')}
            variant={selectedTeam === 'home' ? 'primary' : 'secondary'}
            size="md"
          >
            Home Team
          </TouchButton>
          <TouchButton
            onClick={() => setSelectedTeam('away')}
            variant={selectedTeam === 'away' ? 'primary' : 'secondary'}
            size="md"
          >
            Away Team
          </TouchButton>
        </div>

        {/* Metric Selector */}
        <div className="border-b border-gray-700 pb-2">
          <ResponsiveGrid cols={{ mobile: 2, tablet: 4, desktop: 4 }} gap="sm">
            {[
              { key: 'performance' as const, label: 'Performance' },
              { key: 'financials' as const, label: 'Financials' },
              { key: 'transfers' as const, label: 'Transfers' },
              { key: 'development' as const, label: 'Development' },
            ].map(({ key, label }) => (
              <TouchButton
                key={key}
                onClick={() => setSelectedMetric(key)}
                variant={selectedMetric === key ? 'primary' : 'secondary'}
                size="md"
                fullWidth
              >
                {label}
              </TouchButton>
            ))}
          </ResponsiveGrid>
        </div>

        {/* Performance Analytics */}
        {selectedMetric === 'performance' && (
          <div className="space-y-6">
            {/* Match Statistics */}
            <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap="lg">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Win Rate</p>
                    <p className="text-2xl font-bold text-green-400">
                      {performanceMetrics.winPercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {performanceMetrics.wins}W {performanceMetrics.draws}D{' '}
                      {performanceMetrics.losses}L
                    </p>
                  </div>
                  <div className="text-green-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Goals Scored</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {performanceMetrics.goalsScored}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(
                        performanceMetrics.goalsScored /
                        Math.max(performanceMetrics.totalMatches, 1)
                      ).toFixed(1)}{' '}
                      per game
                    </p>
                  </div>
                  <div className="text-blue-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Goals Conceded</p>
                    <p className="text-2xl font-bold text-red-400">
                      {performanceMetrics.goalsConceded}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(
                        performanceMetrics.goalsConceded /
                        Math.max(performanceMetrics.totalMatches, 1)
                      ).toFixed(1)}{' '}
                      per game
                    </p>
                  </div>
                  <div className="text-red-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Goal Difference</p>
                    <p
                      className={`text-2xl font-bold ${performanceMetrics.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {performanceMetrics.goalDifference >= 0 ? '+' : ''}
                      {performanceMetrics.goalDifference}
                    </p>
                  </div>
                  <div
                    className={
                      performanceMetrics.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          performanceMetrics.goalDifference >= 0
                            ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                            : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                        }
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </ResponsiveGrid>

            {/* Top Performers */}
            <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2 }} gap="lg">
              {/* Top Scorers */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-teal-400 mb-4">Top Scorers</h3>
                <div className="space-y-3">
                  {playerAnalytics.topScorers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                        <span className="text-white font-medium">{player.name}</span>
                      </div>
                      <span className="text-teal-400 font-bold">{player.stats.goals}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Assists */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-teal-400 mb-4">Top Assists</h3>
                <div className="space-y-3">
                  {playerAnalytics.topAssists.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                        <span className="text-white font-medium">{player.name}</span>
                      </div>
                      <span className="text-blue-400 font-bold">{player.stats.assists}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ResponsiveGrid>
          </div>
        )}

        {/* Financial Analytics */}
        {selectedMetric === 'financials' && (
          <div className="space-y-6">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-green-400 mb-2">Total Income</h4>
                <p className="text-2xl font-bold text-white">
                  $
                  {(
                    teamFinances.income.ticketSales +
                    teamFinances.income.sponsorship +
                    teamFinances.income.prizeMoney
                  ).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-red-400 mb-2">Total Expenses</h4>
                <p className="text-2xl font-bold text-white">
                  $
                  {(
                    teamFinances.expenses.playerWages +
                    teamFinances.expenses.staffWages +
                    teamFinances.expenses.stadiumMaintenance +
                    teamFinances.expenses.travel
                  ).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-teal-400 mb-2">Squad Value</h4>
                <p className="text-2xl font-bold text-white">
                  ${playerAnalytics.squadValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-teal-400 mb-4">Income Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">Ticket Sales</p>
                  <p className="text-xl font-bold text-green-400">
                    ${teamFinances.income.ticketSales.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">Sponsorship</p>
                  <p className="text-xl font-bold text-green-400">
                    ${teamFinances.income.sponsorship.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">Prize Money</p>
                  <p className="text-xl font-bold text-green-400">
                    ${teamFinances.income.prizeMoney.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Development Analytics */}
        {selectedMetric === 'development' && (
          <div className="space-y-6">
            {/* Squad Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-teal-400 mb-2">Average Age</h4>
                <p className="text-2xl font-bold text-white">{playerAnalytics.avgAge} years</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-teal-400 mb-2">Average Potential</h4>
                <p className="text-2xl font-bold text-white">{playerAnalytics.avgPotential}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-teal-400 mb-2">Squad Size</h4>
                <p className="text-2xl font-bold text-white">{teamPlayers.length} players</p>
              </div>
            </div>

            {/* Player Development Progress */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-teal-400 mb-4">
                Player Development Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamPlayers.slice(0, 9).map(player => (
                  <div key={player.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium">{player.name}</h4>
                        <p className="text-sm text-gray-400">Age {player.age}</p>
                      </div>
                      <span className="text-sm text-teal-400">
                        Potential: {player.currentPotential}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(player.attributeDevelopmentProgress)
                        .slice(0, 2)
                        .map(([attr, progress]) => (
                          <div key={attr} className="flex justify-between items-center">
                            <span className="text-xs text-gray-300 capitalize">{attr}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-gray-600 rounded-full h-1">
                                <div
                                  className="bg-teal-400 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400 w-6">{progress}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transfer Analytics */}
        {selectedMetric === 'transfers' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Transfer Analytics</h3>
              <p className="text-gray-500">
                Transfer analytics will be available once you complete some transfers
              </p>
            </div>
          </div>
        )}
      </div>
    </ResponsivePage>
  );
};

export default AnalyticsPage;
