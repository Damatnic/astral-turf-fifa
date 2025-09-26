import React from 'react';
import { useFranchiseContext } from '../hooks';
import type { BoardObjective } from '../types';

const BoardObjectivesPage: React.FC = () => {
  const { franchiseState } = useFranchiseContext();
  const { boardObjectives, jobSecurity, fanConfidence, gameWeek, season } = franchiseState;

  const getObjectiveIcon = (objective: BoardObjective) => {
    if (objective.description.toLowerCase().includes('league')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    if (
      objective.description.toLowerCase().includes('final') ||
      objective.description.toLowerCase().includes('cup')
    ) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      );
    }
    if (
      objective.description.toLowerCase().includes('finance') ||
      objective.description.toLowerCase().includes('profit')
    ) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      );
    }
    if (
      objective.description.toLowerCase().includes('youth') ||
      objective.description.toLowerCase().includes('develop')
    ) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    );
  };

  const getObjectiveColor = (objective: BoardObjective) => {
    if (objective.isMet) {
      return 'text-green-400';
    }
    if (objective.isCritical) {
      return 'text-red-400';
    }
    return 'text-yellow-400';
  };

  const getObjectiveBackground = (objective: BoardObjective) => {
    if (objective.isMet) {
      return 'bg-green-600/10 border-green-400';
    }
    if (objective.isCritical) {
      return 'bg-red-600/10 border-red-400';
    }
    return 'bg-yellow-600/10 border-yellow-400';
  };

  const getJobSecurityStatus = () => {
    if (jobSecurity >= 80) {
      return { text: 'Excellent', color: 'text-green-400', bg: 'bg-green-600/20' };
    }
    if (jobSecurity >= 60) {
      return { text: 'Good', color: 'text-blue-400', bg: 'bg-blue-600/20' };
    }
    if (jobSecurity >= 40) {
      return { text: 'Unstable', color: 'text-yellow-400', bg: 'bg-yellow-600/20' };
    }
    if (jobSecurity >= 20) {
      return { text: 'At Risk', color: 'text-orange-400', bg: 'bg-orange-600/20' };
    }
    return { text: 'Critical', color: 'text-red-400', bg: 'bg-red-600/20' };
  };

  const getFanConfidenceStatus = () => {
    if (fanConfidence >= 80) {
      return { text: 'Delighted', color: 'text-green-400' };
    }
    if (fanConfidence >= 60) {
      return { text: 'Happy', color: 'text-blue-400' };
    }
    if (fanConfidence >= 40) {
      return { text: 'Neutral', color: 'text-yellow-400' };
    }
    if (fanConfidence >= 20) {
      return { text: 'Unhappy', color: 'text-orange-400' };
    }
    return { text: 'Angry', color: 'text-red-400' };
  };

  const jobSecurityStatus = getJobSecurityStatus();
  const fanConfidenceStatus = getFanConfidenceStatus();

  const completedObjectives = boardObjectives.filter(obj => obj.isMet).length;
  const criticalObjectives = boardObjectives.filter(obj => obj.isCritical && !obj.isMet).length;

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Board Objectives</h1>
          <p className="text-gray-400">Track your progress and meet the board's expectations</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className={`rounded-lg p-6 border-2 ${jobSecurityStatus.bg} ${jobSecurityStatus.color.replace('text-', 'border-')}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Job Security</p>
                <p className="text-2xl font-bold text-white">{jobSecurity}%</p>
                <p className={`text-sm ${jobSecurityStatus.color}`}>{jobSecurityStatus.text}</p>
              </div>
              <div className={jobSecurityStatus.color}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.5 0a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Fan Confidence</p>
                <p className="text-2xl font-bold text-white">{fanConfidence}%</p>
                <p className={`text-sm ${fanConfidenceStatus.color}`}>{fanConfidenceStatus.text}</p>
              </div>
              <div className={fanConfidenceStatus.color}>
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
                <p className="text-gray-400 text-sm">Objectives Met</p>
                <p className="text-2xl font-bold text-green-400">{completedObjectives}</p>
                <p className="text-sm text-gray-500">of {boardObjectives.length}</p>
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
                <p className="text-gray-400 text-sm">Critical Issues</p>
                <p className="text-2xl font-bold text-red-400">{criticalObjectives}</p>
                <p className="text-sm text-gray-500">require attention</p>
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

        {/* Objectives List */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-semibold text-teal-400 mb-6">
            Season {season.year} Objectives
          </h3>

          <div className="space-y-4">
            {boardObjectives.map(objective => (
              <div
                key={objective.id}
                className={`p-4 rounded-lg border-l-4 ${getObjectiveBackground(objective)} transition-all hover:shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`mt-1 ${getObjectiveColor(objective)}`}>
                      {getObjectiveIcon(objective)}
                    </div>
                    <div className="flex-grow">
                      <p className="text-white font-medium text-lg">{objective.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            objective.isMet
                              ? 'bg-green-600 text-white'
                              : objective.isCritical
                                ? 'bg-red-600 text-white'
                                : 'bg-yellow-600 text-white'
                          }`}
                        >
                          {objective.isMet
                            ? 'Completed'
                            : objective.isCritical
                              ? 'Critical'
                              : 'In Progress'}
                        </span>
                        <span className="text-xs text-gray-400">Week {gameWeek} of 38</span>
                      </div>
                    </div>
                  </div>

                  <div className={`text-2xl ${getObjectiveColor(objective)}`}>
                    {objective.isMet ? (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : objective.isCritical ? (
                      <svg
                        className="w-8 h-8"
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
                    ) : (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Indicators */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-teal-400 mb-4">Performance Indicators</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Job Security</span>
                  <span className={`font-bold ${jobSecurityStatus.color}`}>{jobSecurity}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      jobSecurity >= 60
                        ? 'bg-green-400'
                        : jobSecurity >= 30
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                    }`}
                    style={{ width: `${jobSecurity}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Fan Confidence</span>
                  <span className={`font-bold ${fanConfidenceStatus.color}`}>{fanConfidence}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      fanConfidence >= 60
                        ? 'bg-blue-400'
                        : fanConfidence >= 30
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                    }`}
                    style={{ width: `${fanConfidence}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Objectives Progress</span>
                  <span className="font-bold text-green-400">
                    {((completedObjectives / boardObjectives.length) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(completedObjectives / boardObjectives.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Season Timeline */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-teal-400 mb-4">Season Progress</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Week</span>
                <span className="text-white font-bold">{gameWeek} / 38</span>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-teal-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(gameWeek / 38) * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{completedObjectives}</div>
                  <div className="text-xs text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {boardObjectives.length - completedObjectives - criticalObjectives}
                  </div>
                  <div className="text-xs text-gray-400">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{criticalObjectives}</div>
                  <div className="text-xs text-gray-400">At Risk</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Board Expectations */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">Board Expectations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Meet Objectives</h4>
              <p className="text-gray-400 text-sm">
                Complete objectives to maintain board confidence and job security
              </p>
            </div>

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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Consistent Results</h4>
              <p className="text-gray-400 text-sm">
                Deliver consistent performances and avoid prolonged poor form
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Financial Health</h4>
              <p className="text-gray-400 text-sm">
                Maintain financial stability while investing in team development
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardObjectivesPage;
