import React, { useState, useEffect, useMemo } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import { matchStrategyService } from '../services/matchStrategyService';
import { aiService } from '../services/aiService';
import type { Team, MatchResult, MatchEvent, Player, TeamTactics, Formation } from '../types';

interface MatchSimulation {
  id: string;
  homeTeam: string;
  awayTeam: string;
  status:
    | 'pre_match'
    | 'first_half'
    | 'half_time'
    | 'second_half'
    | 'extra_time'
    | 'penalties'
    | 'finished';
  currentMinute: number;
  score: { home: number; away: number };
  events: MatchEvent[];
  statistics: {
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    shotsOnTarget: { home: number; away: number };
    corners: { home: number; away: number };
    fouls: { home: number; away: number };
    yellowCards: { home: number; away: number };
    redCards: { home: number; away: number };
  };
  playerRatings: Record<string, number>;
}

const MatchSimulationPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { tacticsState } = useTacticsContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();

  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const [matchSimulation, setMatchSimulation] = useState<MatchSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [matchStrategy, setMatchStrategy] = useState<any>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<any>(null);
  const [substitutionPlan, setSubstitutionPlan] = useState<
    Array<{ out: string; in: string; minute: number }>
  >([]);

  // Get upcoming fixtures
  const upcomingFixtures = useMemo(() => {
    return franchiseState.season.fixtures.filter(
      fixture =>
        fixture.week >= franchiseState.gameWeek &&
        (fixture.homeTeam === 'Astral FC' || fixture.awayTeam === 'Astral FC')
    );
  }, [franchiseState.season.fixtures, franchiseState.gameWeek]);

  // Match simulation engine
  const simulateMatchMinute = (minute: number): MatchEvent[] => {
    const events: MatchEvent[] = [];
    const eventProbability = Math.random();

    // Event probability based on match minute and current situation
    let baseEventChance = 0.15; // 15% chance of event per minute

    // Increase chances in certain periods
    if (minute >= 40 && minute <= 45) {
      baseEventChance *= 1.5;
    } // End of first half
    if (minute >= 85) {
      baseEventChance *= 2;
    } // Final minutes

    if (eventProbability < baseEventChance) {
      const event = generateMatchEvent(minute);
      if (event) {
        events.push(event);
      }
    }

    return events;
  };

  const generateMatchEvent = (minute: number): MatchEvent | null => {
    const eventTypes = [
      'shot_on_target',
      'shot_off_target',
      'goal',
      'yellow_card',
      'red_card',
      'substitution',
      'corner',
      'free_kick',
      'offside',
      'foul',
    ];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const team = Math.random() > 0.5 ? 'home' : 'away';
    const players =
      team === 'home'
        ? tacticsState.players.filter(p => p.team === 'home')
        : tacticsState.players.filter(p => p.team === 'away');

    if (players.length === 0) {
      return null;
    }

    const player = players[Math.floor(Math.random() * players.length)];

    return {
      id: `event_${Date.now()}_${Math.random()}`,
      minute,
      type: eventType as any,
      player: player.name,
      playerId: player.id,
      team,
      description: generateEventDescription(eventType, player.name, minute),
    };
  };

  const generateEventDescription = (
    eventType: string,
    playerName: string,
    minute: number
  ): string => {
    const descriptions = {
      goal: [
        `${playerName} finds the back of the net!`,
        `What a strike from ${playerName}!`,
        `${playerName} scores a brilliant goal!`,
      ],
      shot_on_target: [
        `${playerName} forces a save from the keeper`,
        `Good effort from ${playerName}`,
        `${playerName} tests the goalkeeper`,
      ],
      shot_off_target: [
        `${playerName} blazes over the bar`,
        `Wide from ${playerName}`,
        `${playerName} misses the target`,
      ],
      yellow_card: [
        `${playerName} receives a yellow card`,
        `Booking for ${playerName}`,
        `${playerName} goes into the referee's book`,
      ],
      red_card: [
        `${playerName} is sent off!`,
        `Red card for ${playerName}!`,
        `${playerName} receives his marching orders`,
      ],
      corner: [
        `Corner kick won by ${playerName}`,
        `${playerName} wins a corner`,
        `Corner to be taken`,
      ],
      foul: [
        `Foul by ${playerName}`,
        `${playerName} commits a foul`,
        `Free kick awarded against ${playerName}`,
      ],
    };

    const eventDescriptions = descriptions[eventType as keyof typeof descriptions] || [
      `Event involving ${playerName}`,
    ];
    return eventDescriptions[Math.floor(Math.random() * eventDescriptions.length)];
  };

  // Start match simulation
  const startMatchSimulation = async () => {
    if (!selectedFixture) {
      return;
    }

    setIsSimulating(true);

    // Generate pre-match strategy
    try {
      const strategy = await matchStrategyService.generateMatchStrategy(
        {
          players: tacticsState.players.filter(p => p.team === 'home'),
          availableFormations: [],
          currentTactics: (tacticsState as any).tactics,
        },
        {} as any, // opponentAnalysis
        {
          importance: 'medium',
          venue: 'home',
        } as any
      );
      setMatchStrategy(strategy);
    } catch (error) {
      console.error('Failed to generate match strategy:', error);
    }

    // Initialize match simulation
    const simulation: MatchSimulation = {
      id: `match_${Date.now()}`,
      homeTeam: selectedFixture.homeTeam,
      awayTeam: selectedFixture.awayTeam,
      status: 'first_half',
      currentMinute: 0,
      score: { home: 0, away: 0 },
      events: [],
      statistics: {
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 },
      },
      playerRatings: {},
    };

    setMatchSimulation(simulation);
    simulateMatch(simulation);
  };

  const simulateMatch = async (simulation: MatchSimulation) => {
    const speeds = { slow: 2000, medium: 1000, fast: 500 };
    const interval = speeds[simulationSpeed];

    const timer = setInterval(() => {
      if (!isSimulating) {
        clearInterval(timer);
        return;
      }

      const newMinute = simulation.currentMinute + 1;
      const events = simulateMatchMinute(newMinute);

      // Update simulation
      const updatedSimulation = {
        ...simulation,
        currentMinute: newMinute,
        events: [...simulation.events, ...events],
        statistics: updateMatchStatistics(simulation.statistics, events),
        score: updateScore(simulation.score, events),
      };

      // Check for half-time
      if (newMinute === 45) {
        updatedSimulation.status = 'half_time';
        setTimeout(() => {
          updatedSimulation.status = 'second_half';
          setMatchSimulation(updatedSimulation);
        }, 5000); // 5 second half-time break
      }

      // Check for full-time
      if (newMinute >= 90) {
        updatedSimulation.status = 'finished';
        clearInterval(timer);
        setIsSimulating(false);
        finalizeMatch(updatedSimulation);
      }

      setMatchSimulation(updatedSimulation);
      simulation = updatedSimulation;
    }, interval);
  };

  const updateMatchStatistics = (stats: MatchSimulation['statistics'], events: MatchEvent[]) => {
    const newStats = { ...stats };

    events.forEach(event => {
      const team = event.team as 'home' | 'away';

      switch (event.type) {
        case 'shot_on_target':
          newStats.shots[team]++;
          newStats.shotsOnTarget[team]++;
          break;
        case 'shot_off_target':
          newStats.shots[team]++;
          break;
        case 'goal':
          newStats.shots[team]++;
          newStats.shotsOnTarget[team]++;
          break;
        case 'corner':
          newStats.corners[team]++;
          break;
        case 'foul':
          newStats.fouls[team]++;
          break;
        case 'yellow_card':
          newStats.yellowCards[team]++;
          break;
        case 'red_card':
          newStats.redCards[team]++;
          break;
      }
    });

    return newStats;
  };

  const updateScore = (score: { home: number; away: number }, events: MatchEvent[]) => {
    const newScore = { ...score };

    events.forEach(event => {
      if (event.type === 'goal') {
        if (event.team === 'home') {
          newScore.home++;
        } else {
          newScore.away++;
        }
      }
    });

    return newScore;
  };

  const finalizeMatch = (simulation: MatchSimulation) => {
    const matchResult: MatchResult = {
      id: simulation.id,
      homeTeam: simulation.homeTeam,
      awayTeam: simulation.awayTeam,
      homeScore: simulation.score.home,
      awayScore: simulation.score.away,
      date: new Date().toISOString(),
      events: simulation.events,
      statistics: simulation.statistics,
      playerRatings: simulation.playerRatings,
    };

    // Save match result
    dispatch({
      type: 'SAVE_MATCH_RESULT',
      payload: { matchResult },
    });

    uiDispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `Match finished: ${simulation.homeTeam} ${simulation.score.home}-${simulation.score.away} ${simulation.awayTeam}`,
        type: 'info',
      },
    });
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
  };

  const resumeSimulation = () => {
    if (matchSimulation && matchSimulation.status !== 'finished') {
      setIsSimulating(true);
      simulateMatch(matchSimulation);
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Match Simulation</h1>
          <p className="text-gray-400">Simulate matches with realistic gameplay and statistics</p>
        </div>

        {!matchSimulation ? (
          /* Fixture Selection */
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-teal-400 mb-4">Upcoming Fixtures</h3>
              <div className="grid gap-4">
                {upcomingFixtures.map(fixture => (
                  <div
                    key={fixture.id}
                    onClick={() => setSelectedFixture(fixture)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedFixture?.id === fixture.id
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="font-semibold text-white">{fixture.homeTeam}</div>
                          <div className="text-sm text-gray-400">Home</div>
                        </div>
                        <div className="text-xl font-bold text-gray-400">VS</div>
                        <div className="text-center">
                          <div className="font-semibold text-white">{fixture.awayTeam}</div>
                          <div className="text-sm text-gray-400">Away</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Week {fixture.week}</div>
                        <div className="text-xs text-gray-500">{fixture.competition}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedFixture && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-400">Simulation Speed:</label>
                    <select
                      value={simulationSpeed}
                      onChange={e =>
                        setSimulationSpeed(e.target.value as 'slow' | 'medium' | 'fast')
                      }
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="slow">Slow (Detailed)</option>
                      <option value="medium">Medium</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>
                  <button
                    onClick={startMatchSimulation}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Start Match Simulation
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Live Match Simulation */
          <div className="space-y-6">
            {/* Match Header */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{matchSimulation.homeTeam}</div>
                    <div className="text-4xl font-bold text-teal-400">
                      {matchSimulation.score.home}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl text-gray-400">VS</div>
                    <div className="text-2xl font-bold text-white">
                      {matchSimulation.currentMinute}'
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{matchSimulation.awayTeam}</div>
                    <div className="text-4xl font-bold text-teal-400">
                      {matchSimulation.score.away}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {isSimulating ? (
                    <button
                      onClick={pauseSimulation}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium"
                    >
                      Pause
                    </button>
                  ) : matchSimulation.status !== 'finished' ? (
                    <button
                      onClick={resumeSimulation}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                    >
                      Resume
                    </button>
                  ) : null}

                  <button
                    onClick={() => {
                      setMatchSimulation(null);
                      setIsSimulating(false);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
                  >
                    End Simulation
                  </button>
                </div>
              </div>

              {/* Match Status */}
              <div className="text-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    matchSimulation.status === 'first_half'
                      ? 'bg-green-600 text-white'
                      : matchSimulation.status === 'half_time'
                        ? 'bg-yellow-600 text-white'
                        : matchSimulation.status === 'second_half'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-white'
                  }`}
                >
                  {matchSimulation.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Match Events */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-teal-400 mb-4">Match Events</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matchSimulation.events
                    .slice()
                    .reverse()
                    .map(event => (
                      <div
                        key={event.id}
                        className="flex items-center space-x-3 p-3 bg-gray-700 rounded"
                      >
                        <div className="text-sm font-bold text-teal-400 w-12">{event.minute}'</div>
                        <div className="flex-1">
                          <div className="text-white">{event.description}</div>
                          <div className="text-xs text-gray-400">{event.player}</div>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            event.team === 'home' ? 'bg-blue-400' : 'bg-red-400'
                          }`}
                        ></div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Match Statistics */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-teal-400 mb-4">Statistics</h3>
                <div className="space-y-4">
                  {Object.entries(matchSimulation.statistics).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{value.home}</span>
                        <span className="text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span>{value.away}</span>
                      </div>
                      <div className="flex h-2 bg-gray-600 rounded">
                        <div
                          className="bg-blue-400 rounded-l"
                          style={{
                            width: `${(value.home / (value.home + value.away || 1)) * 100}%`,
                          }}
                        ></div>
                        <div
                          className="bg-red-400 rounded-r"
                          style={{
                            width: `${(value.away / (value.home + value.away || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSimulationPage;
