import React from 'react';
import { useFranchiseContext } from '../hooks';

const JobSecurityPage: React.FC = () => {
  const { franchiseState } = useFranchiseContext();
  const { jobSecurity, fanConfidence, boardObjectives, gameWeek, season, manager } = franchiseState;

  const getSecurityLevel = () => {
    if (jobSecurity >= 80) {
      return { level: 'Excellent', color: 'text-green-400', bg: 'bg-green-600/20' };
    }
    if (jobSecurity >= 60) {
      return { level: 'Good', color: 'text-blue-400', bg: 'bg-blue-600/20' };
    }
    if (jobSecurity >= 40) {
      return { level: 'Unstable', color: 'text-yellow-400', bg: 'bg-yellow-600/20' };
    }
    if (jobSecurity >= 20) {
      return { level: 'At Risk', color: 'text-orange-400', bg: 'bg-orange-600/20' };
    }
    return { level: 'Critical', color: 'text-red-400', bg: 'bg-red-600/20' };
  };

  const security = getSecurityLevel();
  const completedObjectives = boardObjectives.filter(obj => obj.isMet).length;
  const criticalObjectives = boardObjectives.filter(obj => obj.isCritical && !obj.isMet).length;

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Job Security</h1>
          <p className="text-gray-400">Monitor your position as manager and board confidence</p>
        </div>

        {/* Main Status */}
        <div
          className={`rounded-lg p-8 mb-8 border-2 ${security.bg} ${security.color.replace('text-', 'border-')}`}
        >
          <div className="text-center">
            <div className="mb-4">
              <div className={`text-6xl font-bold ${security.color}`}>{jobSecurity}%</div>
              <div className={`text-xl font-semibold ${security.color} mt-2`}>{security.level}</div>
            </div>
            <p className="text-gray-300 text-lg">
              {security.level === 'Excellent' &&
                'The board has complete confidence in your abilities.'}
              {security.level === 'Good' && 'You have solid support from the board.'}
              {security.level === 'Unstable' && 'Your position is becoming uncertain.'}
              {security.level === 'At Risk' && 'The board is questioning your performance.'}
              {security.level === 'Critical' && 'Your job is in immediate danger.'}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${fanConfidence}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Objectives Met</p>
                <p className="text-2xl font-bold text-green-400">{completedObjectives}</p>
                <p className="text-xs text-gray-500">of {boardObjectives.length}</p>
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
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedObjectives / boardObjectives.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical Issues</p>
                <p className="text-2xl font-bold text-red-400">{criticalObjectives}</p>
                <p className="text-xs text-gray-500">requiring attention</p>
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
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((criticalObjectives / 5) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Profile */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h3 className="text-xl font-semibold text-teal-400 mb-4">Manager Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">{manager.name}</h4>
              <p className="text-gray-400 mb-4">Manager • Season {season.year}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Reputation</span>
                  <span className="text-purple-400 font-bold">{manager.reputation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Current Week</span>
                  <span className="text-white">{gameWeek}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Trophy Cabinet</h4>
              {manager.trophyCabinet.length > 0 ? (
                <div className="space-y-1">
                  {manager.trophyCabinet.map((trophy, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="text-yellow-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-300 text-sm">{trophy}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No trophies yet</p>
              )}
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Season Progress</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 text-sm">Season Completion</span>
                    <span className="text-teal-400">{((gameWeek / 38) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-teal-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(gameWeek / 38) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">Week {gameWeek} of 38</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Positive Factors */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Positive Factors</h3>
            <div className="space-y-3">
              {completedObjectives > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="text-green-400 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Meeting Board Objectives</p>
                    <p className="text-gray-400 text-sm">
                      Completed {completedObjectives} of {boardObjectives.length} objectives
                    </p>
                  </div>
                </div>
              )}

              {fanConfidence >= 60 && (
                <div className="flex items-start space-x-3">
                  <div className="text-green-400 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Strong Fan Support</p>
                    <p className="text-gray-400 text-sm">Fan confidence at {fanConfidence}%</p>
                  </div>
                </div>
              )}

              {manager.reputation >= 60 && (
                <div className="flex items-start space-x-3">
                  <div className="text-green-400 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Good Reputation</p>
                    <p className="text-gray-400 text-sm">
                      Reputation rating of {manager.reputation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Concerns */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-red-400 mb-4">Areas of Concern</h3>
            <div className="space-y-3">
              {criticalObjectives > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="text-red-400 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Critical Objectives Unmet</p>
                    <p className="text-gray-400 text-sm">
                      {criticalObjectives} critical objectives require immediate attention
                    </p>
                  </div>
                </div>
              )}

              {fanConfidence < 50 && (
                <div className="flex items-start space-x-3">
                  <div className="text-red-400 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Low Fan Confidence</p>
                    <p className="text-gray-400 text-sm">
                      Fans are losing faith in your management
                    </p>
                  </div>
                </div>
              )}

              {jobSecurity < 40 && (
                <div className="flex items-start space-x-3">
                  <div className="text-red-400 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Unstable Position</p>
                    <p className="text-gray-400 text-sm">
                      Board confidence in your abilities is wavering
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-3">Immediate Actions</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                {criticalObjectives > 0 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Focus on completing critical board objectives</span>
                  </li>
                )}
                {fanConfidence < 60 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>Work on improving team performance to boost fan confidence</span>
                  </li>
                )}
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Communicate progress to the board regularly</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-3">Long-term Strategy</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Build a sustainable playing style that delivers consistent results</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Invest in youth development for long-term success</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-teal-400 mt-1">•</span>
                  <span>Maintain financial stability while improving the squad</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSecurityPage;
