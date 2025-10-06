import React, { useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import type { AIOppositionReport } from '../types';

const OppositionAnalysisPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');

  const { scoutingAssignments, season } = franchiseState;

  // Mock upcoming opponents
  const upcomingOpponents = [
    'Manchester United',
    'Liverpool FC',
    'Chelsea FC',
    'Arsenal FC',
    'Tottenham Hotspur',
    'Manchester City',
    'Newcastle United',
    'Brighton & Hove Albion',
  ];

  const handleDispatchScout = () => {
    if (selectedOpponent) {
      dispatch({
        type: 'DISPATCH_SCOUT',
        payload: { opponentName: selectedOpponent },
      });

      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Scout dispatched to analyze ${selectedOpponent}`,
          type: 'success',
        },
      });

      setSelectedOpponent('');
    }
  };

  const getAssignmentStatus = (assignment: any) => {
    if (assignment.report) {
      return 'completed';
    }
    if (assignment.dueWeek <= franchiseState.gameWeek) {
      return 'overdue';
    }
    return 'in_progress';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'overdue':
        return 'text-red-400';
      case 'in_progress':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600/20';
      case 'overdue':
        return 'bg-red-600/20';
      case 'in_progress':
        return 'bg-yellow-600/20';
      default:
        return 'bg-gray-600/20';
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Opposition Analysis</h1>
          <p className="text-gray-400">Scout your opponents and prepare tactical strategies</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Assignments</p>
                <p className="text-2xl font-bold text-blue-400">{scoutingAssignments.length}</p>
                <p className="text-xs text-gray-500">Scouts deployed</p>
              </div>
              <div className="text-blue-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed Reports</p>
                <p className="text-2xl font-bold text-green-400">
                  {scoutingAssignments.filter(a => a.report).length}
                </p>
                <p className="text-xs text-gray-500">Analysis ready</p>
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
                <p className="text-gray-400 text-sm">Overdue Reports</p>
                <p className="text-2xl font-bold text-red-400">
                  {scoutingAssignments.filter(a => getAssignmentStatus(a) === 'overdue').length}
                </p>
                <p className="text-xs text-gray-500">Need attention</p>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Scout */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-teal-400 mb-4">Dispatch Scout</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Opponent
              </label>
              <select
                value={selectedOpponent}
                onChange={e => setSelectedOpponent(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Choose opponent...</option>
                {upcomingOpponents
                  .filter(opponent => !scoutingAssignments.some(a => a.opponentName === opponent))
                  .map(opponent => (
                    <option key={opponent} value={opponent}>
                      {opponent}
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleDispatchScout}
              disabled={!selectedOpponent}
              className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                selectedOpponent
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Dispatch Scout
            </button>

            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Scouting Benefits:</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Identify opponent's key players</li>
                <li>• Discover tactical weaknesses</li>
                <li>• Understand their playing style</li>
                <li>• Get formation recommendations</li>
              </ul>
            </div>
          </div>

          {/* Active Assignments */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-teal-400 mb-4">Scouting Assignments</h3>

            {scoutingAssignments.length > 0 ? (
              <div className="space-y-4">
                {scoutingAssignments.map((assignment, index) => {
                  const status = getAssignmentStatus(assignment);

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${getStatusBackground(status)} ${
                        status === 'completed'
                          ? 'border-l-green-400'
                          : status === 'overdue'
                            ? 'border-l-red-400'
                            : 'border-l-yellow-400'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-semibold">{assignment.opponentName}</h4>
                          <p className="text-gray-400 text-sm">Due: Week {assignment.dueWeek}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            status === 'completed'
                              ? 'bg-green-600/20 text-green-400'
                              : status === 'overdue'
                                ? 'bg-red-600/20 text-red-400'
                                : 'bg-yellow-600/20 text-yellow-400'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </span>
                      </div>

                      {assignment.report ? (
                        <div className="mt-3 p-3 bg-gray-700 rounded">
                          <h5 className="text-sm font-medium text-green-400 mb-2">Scout Report:</h5>
                          <div className="space-y-2 text-sm text-gray-300">
                            <div>
                              <span className="font-medium">Key Players:</span>{' '}
                              {assignment.report.keyPlayers}
                            </div>
                            <div>
                              <span className="font-medium">Tactical Approach:</span>{' '}
                              {assignment.report.tacticalApproach}
                            </div>
                            <div>
                              <span className="font-medium">Weaknesses:</span>{' '}
                              {assignment.report.weaknesses}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-gray-700 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                            <span className="text-sm text-yellow-400">
                              Scout analyzing opponent...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-300 mb-2">No Active Assignments</h4>
                <p className="text-gray-500">Dispatch scouts to analyze your upcoming opponents</p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Tips */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">Opposition Analysis Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-blue-400 mb-3">
                <svg
                  className="w-10 h-10 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Key Players</h4>
              <p className="text-gray-400 text-sm">
                Identify their star players and neutralize threats
              </p>
            </div>

            <div className="text-center">
              <div className="text-green-400 mb-3">
                <svg
                  className="w-10 h-10 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Formation</h4>
              <p className="text-gray-400 text-sm">
                Understand their tactical setup and adapt accordingly
              </p>
            </div>

            <div className="text-center">
              <div className="text-yellow-400 mb-3">
                <svg
                  className="w-10 h-10 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Weaknesses</h4>
              <p className="text-gray-400 text-sm">
                Exploit vulnerable areas in their defensive structure
              </p>
            </div>

            <div className="text-center">
              <div className="text-purple-400 mb-3">
                <svg
                  className="w-10 h-10 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Strengths</h4>
              <p className="text-gray-400 text-sm">
                Prepare defensive strategies for their attacking threats
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OppositionAnalysisPage;
