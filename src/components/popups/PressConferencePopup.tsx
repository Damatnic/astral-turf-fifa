import React, { useState, useEffect } from 'react';
import { useUIContext, useFranchiseContext } from '../../hooks';
import { MessageSquareIcon, LoadingSpinner, CloseIcon } from '../ui/icons';
import { getPressConferenceQuestions } from '../../services/aiServiceLoader';
import type { AIPressConferenceResponse } from '../../types';

const PressConferencePopup: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { franchiseState } = useFranchiseContext();
  const { settings, isLoadingPressConference, pressConferenceData } = uiState;
  const { pressNarratives } = franchiseState;
  const [result, setResult] = useState<{ outcome: string; isGood: boolean } | null>(null);

  useEffect(() => {
    if (!pressConferenceData && !isLoadingPressConference && !result) {
      (dispatch as (action: { type: string }) => void)({
        type: 'GET_PRESS_CONFERENCE_QUESTIONS_START',
      });
      getPressConferenceQuestions(settings.aiPersonality, pressNarratives)
        .then(data =>
          (dispatch as (action: { type: string; payload?: unknown }) => void)({
            type: 'GET_PRESS_CONFERENCE_QUESTIONS_SUCCESS',
            payload: data,
          }),
        )
        .catch(err => {
          console.error(err);
          (dispatch as (action: { type: string }) => void)({
            type: 'GET_PRESS_CONFERENCE_QUESTIONS_FAILURE',
          });
        });
    }
  }, [
    pressConferenceData,
    isLoadingPressConference,
    settings.aiPersonality,
    dispatch,
    result,
    pressNarratives,
  ]);

  const handleCloseAndReset = () => {
    (dispatch as (action: { type: string }) => void)({
      type: 'GET_PRESS_CONFERENCE_QUESTIONS_FAILURE',
    }); // Resets data
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const handleSelectOption = (option: AIPressConferenceResponse['options'][0]) => {
    const conferenceData = pressConferenceData as { narrativeId?: string } | null;
    const payload: {
      fanConfidenceEffect: number;
      teamMoraleEffect: number;
      narrativeId?: string;
    } = {
      fanConfidenceEffect: option.fanConfidenceEffect,
      teamMoraleEffect: option.teamMoraleEffect,
    };

    if (conferenceData?.narrativeId) {
      payload.narrativeId = conferenceData.narrativeId;
    }

    (dispatch as (action: { type: string; payload?: unknown }) => void)({
      type: 'RESOLVE_PRESS_CONFERENCE_OPTION',
      payload,
    });
    setResult({
      outcome: option.outcome,
      isGood: option.fanConfidenceEffect + option.teamMoraleEffect >= 0,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleCloseAndReset}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-teal-400 flex items-center">
            <MessageSquareIcon className="w-5 h-5 mr-3" />
            Press Conference
          </h2>
          <button
            onClick={handleCloseAndReset}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto min-h-[250px] flex flex-col justify-center">
          {(isLoadingPressConference || !pressConferenceData) && !result && (
            <div className="flex justify-center">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          )}

          {
            (!isLoadingPressConference &&
              pressConferenceData &&
              !result &&
              (() => {
                const data = pressConferenceData as {
                  question?: string;
                  options?: Array<AIPressConferenceResponse['options'][0]>;
                };
                return (
                  <div className="text-center space-y-4 animate-fade-in-scale">
                    <p className="text-lg text-gray-300 italic">"{data.question}"</p>
                    <div className="space-y-2 pt-4">
                      {data.options?.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectOption(opt)}
                          className="w-full p-3 bg-gray-700 hover:bg-teal-600/50 rounded-md text-sm text-left transition-colors"
                        >
                          {i + 1}. {opt.text}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()) as React.ReactNode
          }

          {result && (
            <div className="text-center space-y-4 animate-fade-in-scale">
              <p
                className={`text-lg font-semibold ${result.isGood ? 'text-green-400' : 'text-red-400'}`}
              >
                {result.outcome}
              </p>
              <button
                onClick={handleCloseAndReset}
                className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PressConferencePopup;
