import React, { useEffect } from 'react';
import { useUIContext, useTacticsContext } from '../../hooks';
import { CloseIcon, BrainCircuitIcon, LoadingSpinner, SwapIcon } from '../ui/icons';
import { getAISubstitutionSuggestion } from '../../services/aiServiceLoader';
import { getFormationPlayerIds, isValidFormation } from '../../utils/tacticalDataGuards';

const AISubstitutionSuggestionPopup: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const { players, formations, activeFormationIds } = tacticsState;
  const { isLoadingAISubSuggestion, aiSubSuggestionData, settings, activeTeamContext } = uiState;

  useEffect(() => {
    if (!aiSubSuggestionData && !isLoadingAISubSuggestion) {
      dispatch({ type: 'GET_AI_SUB_SUGGESTION_START' });

      const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
      const formation = formations[activeFormationIds[activeTeam]];
      if (!formation) {
        console.error('No formation found for active team');
        dispatch({ type: 'GET_AI_SUB_SUGGESTION_FAILURE' });
        return;
      }
      const onFieldIds = getFormationPlayerIds(formation);
      const onFieldPlayers = players.filter(p => p && onFieldIds.has(p.id));
      const benchedPlayers = players.filter(p => p && p.team === activeTeam && !onFieldIds.has(p.id));

      getAISubstitutionSuggestion(onFieldPlayers, benchedPlayers, settings.aiPersonality)
        .then(data => dispatch({ type: 'GET_AI_SUB_SUGGESTION_SUCCESS', payload: data }))
        .catch(err => {
          console.error(err);
          dispatch({ type: 'GET_AI_SUB_SUGGESTION_FAILURE' });
        });
    }
  }, [
    aiSubSuggestionData,
    isLoadingAISubSuggestion,
    dispatch,
    players,
    formations,
    activeFormationIds,
    activeTeamContext,
    settings.aiPersonality,
  ]);

  const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const handleMakeSubstitution = () => {
    if (!aiSubSuggestionData) {
      return;
    }
    tacticsDispatch({
      type: 'SWAP_PLAYERS',
      payload: {
        sourcePlayerId: aiSubSuggestionData.playerInId,
        targetPlayerId: aiSubSuggestionData.playerOutId,
      },
    });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { message: 'Substitution made!', type: 'success' },
    });
    handleClose();
  };

  const playerOut = players.find(p => p.id === aiSubSuggestionData?.playerOutId);
  const playerIn = players.find(p => p.id === aiSubSuggestionData?.playerInId);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-700/50 flex flex-col animate-fade-in-scale"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-teal-400 flex items-center">
            <BrainCircuitIcon className="w-5 h-5 mr-2" />
            AI Substitution Suggestion
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {isLoadingAISubSuggestion && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}
          {aiSubSuggestionData && playerIn && playerOut && (
            <div className="space-y-4">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-xs text-red-400 font-bold">OUT</p>
                  <p className="text-lg font-semibold">{playerOut.name}</p>
                </div>
                <SwapIcon className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-xs text-green-400 font-bold">IN</p>
                  <p className="text-lg font-semibold">{playerIn.name}</p>
                </div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-md">
                <h4 className="font-semibold text-gray-300 mb-1">Reasoning:</h4>
                <p className="text-sm text-gray-400 italic">"{aiSubSuggestionData.reasoning}"</p>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  Decline
                </button>
                <button
                  onClick={handleMakeSubstitution}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-semibold"
                >
                  Accept
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISubstitutionSuggestionPopup;
