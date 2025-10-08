import React, { useEffect } from 'react';
import { useUIContext, useTacticsContext, useFranchiseContext } from '../../hooks';
import { CloseIcon, LoadingSpinner, MessageSquareIcon } from '../ui/icons';
import { getTeamTalkOptions } from '../../services/aiServiceLoader';
import type { TeamTalkOption } from '../../types';

const TeamTalkPopup: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const { franchiseState } = useFranchiseContext();
  const { isLoadingTeamTalk, teamTalkData, settings, activeTeamContext } = uiState;
  const { players } = tacticsState;

  const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
  const isHalftime =
    franchiseState.lastMatchResult === null &&
    uiState.simulationTimeline.some((e: any) => e.minute >= 45);
  const homeScore = uiState.simulationTimeline.filter(
    (e: any) => 'type' in e && e.type === 'Goal' && e.team === 'home',
  ).length;
  const awayScore = uiState.simulationTimeline.filter(
    (e: any) => 'type' in e && e.type === 'Goal' && e.team === 'away',
  ).length;

  useEffect(() => {
    if (!teamTalkData && !isLoadingTeamTalk) {
      const teamPlayers = players.filter(p => p.team === activeTeam);
      const opponentName = 'The Opponent'; // Simplified for now
      const currentScore = `${homeScore}-${awayScore}`;

      (dispatch as (action: { type: string }) => void)({ type: 'GET_TEAM_TALK_OPTIONS_START' });
      getTeamTalkOptions(
        teamPlayers,
        opponentName,
        isHalftime,
        currentScore,
        settings.aiPersonality,
      )
        .then(data =>
          (dispatch as (action: { type: string; payload?: unknown }) => void)({
            type: 'GET_TEAM_TALK_OPTIONS_SUCCESS',
            payload: data,
          }),
        )
        .catch(err => {
          console.error(err);
          (dispatch as (action: { type: string }) => void)({
            type: 'GET_TEAM_TALK_OPTIONS_FAILURE',
          });
          dispatch({
            type: 'ADD_NOTIFICATION',
            payload: { message: `AI Error: ${err.message}`, type: 'error' },
          });
        });
    }
  }, [
    teamTalkData,
    isLoadingTeamTalk,
    dispatch,
    players,
    activeTeam,
    isHalftime,
    settings.aiPersonality,
    homeScore,
    awayScore,
  ]);

  const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });

  const handleSelectTalk = (option: TeamTalkOption) => {
    tacticsDispatch({
      type: 'APPLY_TEAM_TALK_EFFECT',
      payload: { team: activeTeam, effect: option.moraleEffect },
    });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { message: 'Team talk delivered!', type: 'success' },
    });
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900 z-50  flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <div
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-teal-400 flex items-center">
            <MessageSquareIcon className="w-5 h-5 mr-3" />
            Team Talk
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-gray-300 min-h-[200px]">
          {isLoadingTeamTalk && (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          )}
          {
            (teamTalkData &&
              (() => {
                const data = teamTalkData as { options?: TeamTalkOption[] };
                if (!data.options) {
                  return null;
                }
                return (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400 mb-4 text-center">
                      Your assistant suggests the following approaches:
                    </p>
                    {data.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectTalk(option)}
                        className="w-full text-left p-3 bg-gray-700/50 hover:bg-teal-600/30 rounded-lg border border-gray-600 hover:border-teal-500 transition-all"
                      >
                        <p className="font-bold text-teal-400">{option.tone}</p>
                        <p className="text-sm text-gray-300 mt-1 italic">"{option.message}"</p>
                      </button>
                    ))}
                  </div>
                );
              })()) as React.ReactNode
          }
        </div>
      </div>
    </div>
  );
};

export default TeamTalkPopup;
