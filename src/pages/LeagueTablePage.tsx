import React from 'react';
import { useFranchiseContext } from '../hooks';

const LeagueTablePage: React.FC = () => {
  const { franchiseState } = useFranchiseContext();
  const { season } = franchiseState;

  // Sort league table by points, then goal difference, then goals scored
  const sortedTable = Object.values(season.leagueTable).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    return b.goalsFor - a.goalsFor;
  });

  const getPositionColor = (position: number) => {
    if (position <= 4) {
      return 'text-green-400';
    } // Champions League
    if (position <= 6) {
      return 'text-blue-400';
    } // Europa League
    if (position >= 18) {
      return 'text-red-400';
    } // Relegation
    return 'text-gray-300'; // Mid-table
  };

  const getPositionBackground = (position: number) => {
    if (position <= 4) {
      return 'bg-green-600/10 border-l-4 border-l-green-400';
    }
    if (position <= 6) {
      return 'bg-blue-600/10 border-l-4 border-l-blue-400';
    }
    if (position >= 18) {
      return 'bg-red-600/10 border-l-4 border-l-red-400';
    }
    return '';
  };

  const getFormDisplay = (team: unknown) => {
    // Mock form data - in a real app this would come from match history
    const forms = ['W', 'W', 'D', 'L', 'W'];
    return forms;
  };

  const getFormColor = (result: string) => {
    switch (result) {
      case 'W':
        return 'bg-green-600 text-white';
      case 'D':
        return 'bg-yellow-600 text-white';
      case 'L':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">League Table</h1>
          <p className="text-gray-400">Season {season.year} standings</p>
        </div>

        {/* League Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
            <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-gray-300 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Club</div>
              <div className="col-span-1 text-center">MP</div>
              <div className="col-span-1 text-center">W</div>
              <div className="col-span-1 text-center">D</div>
              <div className="col-span-1 text-center">L</div>
              <div className="col-span-1 text-center">GD</div>
              <div className="col-span-1 text-center">PTS</div>
              <div className="col-span-1 text-center">Form</div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {sortedTable.map((team, index) => {
              const position = index + 1;
              return (
                <div
                  key={team.teamName}
                  className={`px-6 py-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${
                    team.isUserTeam
                      ? 'bg-teal-600/10 border-l-4 border-l-teal-400'
                      : getPositionBackground(position)
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Position */}
                    <div className="col-span-1">
                      <span
                        className={`text-lg font-bold ${
                          team.isUserTeam ? 'text-teal-400' : getPositionColor(position)
                        }`}
                      >
                        {position}
                      </span>
                    </div>

                    {/* Club Name */}
                    <div className="col-span-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            team.isUserTeam ? 'bg-teal-600 text-white' : 'bg-gray-600 text-white'
                          }`}
                        >
                          {team.teamName.substring(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={`font-medium ${
                            team.isUserTeam ? 'text-teal-400' : 'text-white'
                          }`}
                        >
                          {team.teamName}
                          {team.isUserTeam && (
                            <span className="ml-2 text-xs bg-teal-600 text-white px-2 py-1 rounded">
                              YOU
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Matches Played */}
                    <div className="col-span-1 text-center">
                      <span className="text-gray-300">{team.played}</span>
                    </div>

                    {/* Wins */}
                    <div className="col-span-1 text-center">
                      <span className="text-green-400 font-medium">{team.won}</span>
                    </div>

                    {/* Draws */}
                    <div className="col-span-1 text-center">
                      <span className="text-yellow-400 font-medium">{team.drawn}</span>
                    </div>

                    {/* Losses */}
                    <div className="col-span-1 text-center">
                      <span className="text-red-400 font-medium">{team.lost}</span>
                    </div>

                    {/* Goal Difference */}
                    <div className="col-span-1 text-center">
                      <span
                        className={`font-medium ${
                          team.goalDifference > 0
                            ? 'text-green-400'
                            : team.goalDifference < 0
                              ? 'text-red-400'
                              : 'text-gray-300'
                        }`}
                      >
                        {team.goalDifference > 0 ? '+' : ''}
                        {team.goalDifference}
                      </span>
                    </div>

                    {/* Points */}
                    <div className="col-span-1 text-center">
                      <span className="text-white font-bold text-lg">{team.points}</span>
                    </div>

                    {/* Form */}
                    <div className="col-span-1">
                      <div className="flex space-x-1">
                        {getFormDisplay(team).map((result, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getFormColor(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">Competition Positions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <div>
                <p className="text-green-400 font-medium">Champions League</p>
                <p className="text-xs text-gray-400">Positions 1-4</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <div>
                <p className="text-blue-400 font-medium">Europa League</p>
                <p className="text-xs text-gray-400">Positions 5-6</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-400 rounded"></div>
              <div>
                <p className="text-red-400 font-medium">Relegation Zone</p>
                <p className="text-xs text-gray-400">Positions 18-20</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <div className="text-2xl font-bold text-teal-400 mb-2">
              {sortedTable.findIndex(team => team.isUserTeam) + 1}
            </div>
            <p className="text-gray-400">Your Position</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {sortedTable.find(team => team.isUserTeam)?.points || 0}
            </div>
            <p className="text-gray-400">Your Points</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {sortedTable[0]?.points - (sortedTable.find(team => team.isUserTeam)?.points || 0)}
            </div>
            <p className="text-gray-400">Points Behind Leader</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {Math.max(
                0,
                (sortedTable.find(team => team.isUserTeam)?.points || 0) -
                  (sortedTable[17]?.points || 0),
              )}
            </div>
            <p className="text-gray-400">Points Above Relegation</p>
          </div>
        </div>

        {/* Top Performers */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Attack */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Best Attack</h3>
            <div className="space-y-3">
              {[...sortedTable]
                .sort((a, b) => b.goalsFor - a.goalsFor)
                .slice(0, 3)
                .map((team, index) => (
                  <div key={team.teamName} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 w-4">{index + 1}</span>
                      <span
                        className={team.isUserTeam ? 'text-teal-400 font-medium' : 'text-white'}
                      >
                        {team.teamName}
                      </span>
                    </div>
                    <span className="text-green-400 font-bold">{team.goalsFor}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Best Defense */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">Best Defense</h3>
            <div className="space-y-3">
              {[...sortedTable]
                .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
                .slice(0, 3)
                .map((team, index) => (
                  <div key={team.teamName} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 w-4">{index + 1}</span>
                      <span
                        className={team.isUserTeam ? 'text-teal-400 font-medium' : 'text-white'}
                      >
                        {team.teamName}
                      </span>
                    </div>
                    <span className="text-blue-400 font-bold">{team.goalsAgainst}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueTablePage;
