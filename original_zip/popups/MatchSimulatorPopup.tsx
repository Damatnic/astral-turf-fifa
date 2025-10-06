import React, { useEffect, useRef } from 'react';
import { useUIContext, useTacticsContext, useFranchiseContext } from '../../hooks';
import { CloseIcon, GoalIcon, CardIcon, MedicalCrossIcon } from '../ui/icons';
import type { MatchEvent, MatchCommentary, MatchResult } from '../../types';
import { simulateMatch } from '../../services/simulationService';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MatchSimulatorPopup: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const { franchiseState, dispatch: franchiseDispatch } = useFranchiseContext();
  const { simulationTimeline } = uiState;
  const { players, formations, activeFormationIds, teamTactics, tacticalFamiliarity, chemistry } =
    tacticsState;
  const { relationships, mentoringGroups } = franchiseState;
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const runSimulation = async () => {
      dispatch({ type: 'SIMULATE_MATCH_START' });

      const homeFormation = formations[activeFormationIds.home];
      const awayFormation = formations[activeFormationIds.away];
      const homePlayerIds = new Set(homeFormation.slots.map(s => s.playerId).filter(Boolean));
      const awayPlayerIds = new Set(awayFormation.slots.map(s => s.playerId).filter(Boolean));
      const homePlayers = players.filter(p => homePlayerIds.has(p.id));
      const awayPlayers = players.filter(p => awayPlayerIds.has(p.id));

      const onUpdate = (event: MatchEvent | MatchCommentary) => {
        setTimeout(() => {
          dispatch({ type: 'SIMULATE_MATCH_UPDATE', payload: event });
        }, event.minute * 50);
      };

      const homeFamiliarity = tacticalFamiliarity[activeFormationIds.home] || 20;
      const awayFamiliarity = tacticalFamiliarity[activeFormationIds.away] || 20;

      const result: MatchResult = simulateMatch(
        homePlayers,
        awayPlayers,
        teamTactics.home,
        teamTactics.away,
        homeFamiliarity,
        awayFamiliarity,
        chemistry,
        relationships,
        mentoringGroups,
        onUpdate
      );

      await sleep(90 * 50 + 500); // Wait for simulation to finish

      tacticsDispatch({ type: 'SIMULATE_MATCH_SUCCESS', payload: result });
    };
    runSimulation();
  }, []); // Runs only once when the modal is opened

  useEffect(() => {
    timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight, behavior: 'smooth' });
  }, [simulationTimeline]);

  const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const homeScore = simulationTimeline.filter(
    e => 'type' in e && e.type === 'Goal' && e.team === 'home'
  ).length;
  const awayScore = simulationTimeline.filter(
    e => 'type' in e && e.type === 'Goal' && e.team === 'away'
  ).length;
  const lastEvent = simulationTimeline[simulationTimeline.length - 1];
  const minute = lastEvent ? lastEvent.minute : 0;

  const renderEvent = (event: MatchEvent | MatchCommentary) => {
    if ('type' in event) {
      // MatchEvent
      const Icon =
        event.type === 'Goal'
          ? GoalIcon
          : event.type.includes('Card')
            ? CardIcon
            : MedicalCrossIcon;
      const color = event.team === 'home' ? 'text-blue-400' : 'text-red-400';
      return (
        <p>
          <Icon
            className={`inline w-4 h-4 mr-2 ${event.type === 'Goal' ? 'text-yellow-400' : ''}`}
          />{' '}
          <b className={color}>[{event.team.toUpperCase()}]</b> {event.playerName}{' '}
          {event.description}
        </p>
      );
    }
    return <p className="italic text-gray-400">{event.text}</p>; // MatchCommentary
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700/50 flex flex-col animate-fade-in-scale h-[70vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-blue-400">HOME</span>
            <span className="text-2xl font-bold text-white">
              {homeScore} - {awayScore}
            </span>
            <span className="font-bold text-red-400">AWAY</span>
          </div>
          <div className="text-lg font-mono bg-black/50 px-3 py-1 rounded-md text-white">
            {Math.min(minute, 90)}'
          </div>
        </div>

        <div ref={timelineRef} className="p-4 flex-grow overflow-y-auto space-y-3">
          {simulationTimeline.map((event, i) => (
            <div key={i} className="flex items-start text-sm">
              <span className="w-10 text-gray-500 font-mono text-right mr-3">{event.minute}'</span>
              <div className="flex-grow">{renderEvent(event)}</div>
            </div>
          ))}
        </div>
        {minute >= 90 && (
          <div className="p-4 border-t border-gray-700 text-center">
            <p className="font-bold text-lg text-yellow-400">Full Time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSimulatorPopup;
