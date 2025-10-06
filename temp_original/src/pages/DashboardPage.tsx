import React from 'react';
import { useAuthContext, useFranchiseContext, useUIContext } from '../hooks';

const DashboardPage: React.FC = () => {
  const { authState } = useAuthContext();
  const { franchiseState } = useFranchiseContext();
  const { uiState } = useUIContext();

  if (!authState.user) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const { user } = authState;
  const { gameWeek, season, manager, finances, jobSecurity, fanConfidence } = franchiseState;
  const currentFinances = finances.home; // Assuming home team for main context

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Manager Dashboard</h1>
          <p className="text-gray-400">
            Welcome back, {manager.name} - Week {gameWeek}, Season {season.year}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Job Security</p>
                <p className="text-2xl font-bold text-green-400">{jobSecurity}%</p>
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
                <p className="text-gray-400 text-sm">Fan Confidence</p>
                <p className="text-2xl font-bold text-blue-400">{fanConfidence}%</p>
              </div>
              <div className="text-blue-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Transfer Budget</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ${currentFinances.transferBudget.toLocaleString()}
                </p>
              </div>
              <div className="text-yellow-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Manager Reputation</p>
                <p className="text-2xl font-bold text-purple-400">{manager.reputation}</p>
              </div>
              <div className="text-purple-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* League Position */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-teal-400 mb-4">League Position</h3>
            <div className="space-y-3">
              {Object.values(season.leagueTable)
                .sort((a, b) => b.points - a.points)
                .slice(0, 5)
                .map((team, index) => (
                  <div
                    key={team.teamName}
                    className={`flex items-center justify-between p-3 rounded ${
                      team.isUserTeam ? 'bg-teal-600/20 border border-teal-600/50' : 'bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                      <span
                        className={`font-medium ${team.isUserTeam ? 'text-teal-400' : 'text-white'}`}
                      >
                        {team.teamName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{team.points}</span>
                      <span className="text-sm text-gray-400 ml-2">pts</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Board Objectives */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-teal-400 mb-4">Board Objectives</h3>
            <div className="space-y-3">
              {franchiseState.boardObjectives.slice(0, 4).map(objective => (
                <div
                  key={objective.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        objective.isMet
                          ? 'bg-green-400'
                          : objective.isCritical
                            ? 'bg-red-400'
                            : 'bg-yellow-400'
                      }`}
                    ></div>
                    <span className="text-white text-sm">{objective.description}</span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      objective.isMet
                        ? 'bg-green-600/20 text-green-400'
                        : objective.isCritical
                          ? 'bg-red-600/20 text-red-400'
                          : 'bg-yellow-600/20 text-yellow-400'
                    }`}
                  >
                    {objective.isMet ? 'Complete' : objective.isCritical ? 'Critical' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-teal-400 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {franchiseState.inbox
              .filter(item => !item.isRead)
              .slice(0, 5)
              .map(item => (
                <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-700 rounded">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.type === 'match'
                        ? 'bg-green-400'
                        : item.type === 'injury'
                          ? 'bg-red-400'
                          : item.type === 'transfer'
                            ? 'bg-blue-400'
                            : 'bg-yellow-400'
                    }`}
                  ></div>
                  <div className="flex-grow">
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-gray-400 text-sm">{item.content.substring(0, 80)}...</p>
                  </div>
                  <span className="text-xs text-gray-500">Week {item.week}</span>
                </div>
              ))}
            {franchiseState.inbox.filter(item => !item.isRead).length === 0 && (
              <p className="text-gray-400 text-center py-8">No new notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
