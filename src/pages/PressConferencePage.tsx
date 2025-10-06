import React, { useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import type { AIPressConferenceResponse } from '../types';

const PressConferencePage: React.FC = () => {
  const { franchiseState } = useFranchiseContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const [selectedQuestion, setSelectedQuestion] = useState<AIPressConferenceResponse | null>(null);

  const { manager, fanConfidence, jobSecurity, gameWeek, season, pressNarratives } = franchiseState;

  // Mock press conference questions
  const mockQuestions: AIPressConferenceResponse[] = [
    {
      question: "How do you feel about the team's recent performance?",
      options: [
        {
          text: "I'm very pleased with how the players are developing.",
          outcome: 'Positive response boosts team morale',
          fanConfidenceEffect: 5,
          teamMoraleEffect: 10,
        },
        {
          text: 'We still have work to do, but I see improvement.',
          outcome: 'Balanced response maintains stability',
          fanConfidenceEffect: 0,
          teamMoraleEffect: 0,
        },
        {
          text: 'The performance has been disappointing lately.',
          outcome: 'Critical response may demotivate players',
          fanConfidenceEffect: -10,
          teamMoraleEffect: -15,
        },
      ],
    },
    {
      question: 'What are your thoughts on the upcoming transfer window?',
      options: [
        {
          text: "We're always looking to strengthen the squad where possible.",
          outcome: 'Fans appreciate ambition',
          fanConfidenceEffect: 8,
          teamMoraleEffect: 5,
        },
        {
          text: "I'm happy with the current squad and their potential.",
          outcome: 'Shows faith in current players',
          fanConfidenceEffect: -2,
          teamMoraleEffect: 12,
        },
        {
          text: 'The board will make decisions about transfers.',
          outcome: 'Diplomatic but uninspiring response',
          fanConfidenceEffect: -5,
          teamMoraleEffect: -3,
        },
      ],
    },
    {
      question: 'How do you respond to criticism from fans about your tactics?',
      options: [
        {
          text: "I understand the fans' passion and we're working to improve.",
          outcome: 'Humble response that acknowledges concerns',
          fanConfidenceEffect: 3,
          teamMoraleEffect: 8,
        },
        {
          text: 'My tactics are based on what I think gives us the best chance to win.',
          outcome: 'Confident but potentially divisive',
          fanConfidenceEffect: -3,
          teamMoraleEffect: 10,
        },
        {
          text: 'Results will speak for themselves in time.',
          outcome: 'Evasive response that may frustrate fans',
          fanConfidenceEffect: -8,
          teamMoraleEffect: 2,
        },
      ],
    },
  ];

  const handleAnswerQuestion = (option: AIPressConferenceResponse['options'][0]) => {
    // Apply effects
    uiDispatch({
      type: 'RESOLVE_PRESS_CONFERENCE_OPTION',
      payload: {
        fanConfidenceEffect: option.fanConfidenceEffect,
        teamMoraleEffect: option.teamMoraleEffect,
        narrativeId: selectedQuestion?.narrativeId,
      },
    } as any);

    uiDispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `Press conference completed: ${option.outcome}`,
        type: 'info',
      },
    });

    setSelectedQuestion(null);
  };

  const getRecentNarratives = () => {
    return pressNarratives
      .filter(narrative => narrative.weekGenerated >= gameWeek - 4)
      .sort((a, b) => b.weekGenerated - a.weekGenerated);
  };

  const getNarrativeToneColor = (tone: string) => {
    switch (tone) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getNarrativeToneBackground = (tone: string) => {
    switch (tone) {
      case 'positive':
        return 'bg-green-600/20';
      case 'negative':
        return 'bg-red-600/20';
      default:
        return 'bg-gray-600/20';
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Press Conferences</h1>
          <p className="text-gray-400">Manage media interactions and shape public perception</p>
        </div>

        {/* Manager Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">{manager.name}</h3>
              <p className="text-gray-400 mb-4">Manager • Season {season.year}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Reputation</span>
                  <span className="text-purple-400 font-bold">{manager.reputation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Job Security</span>
                  <span
                    className={`font-bold ${
                      jobSecurity >= 70
                        ? 'text-green-400'
                        : jobSecurity >= 40
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {jobSecurity}%
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <div
                  className={`text-3xl font-bold ${
                    fanConfidence >= 70
                      ? 'text-green-400'
                      : fanConfidence >= 40
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {fanConfidence}%
                </div>
                <p className="text-gray-400">Fan Confidence</p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    fanConfidence >= 70
                      ? 'bg-green-400'
                      : fanConfidence >= 40
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${fanConfidence}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <div className="text-3xl font-bold text-teal-400">{gameWeek}</div>
                <p className="text-gray-400">Current Week</p>
              </div>
              <p className="text-gray-500 text-sm">{38 - gameWeek} weeks remaining in season</p>
            </div>
          </div>
        </div>

        {!selectedQuestion ? (
          <>
            {/* Available Questions */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-teal-400 mb-6">Media Questions</h3>
              <div className="space-y-4">
                {mockQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-teal-500 transition-colors cursor-pointer"
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-grow">
                        <p className="text-white text-lg font-medium mb-2">{question.question}</p>
                        <p className="text-gray-400 text-sm">
                          Choose from {question.options.length} response options
                        </p>
                      </div>
                      <div className="text-teal-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Media Coverage */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-teal-400 mb-6">Recent Media Coverage</h3>

              {getRecentNarratives().length > 0 ? (
                <div className="space-y-4">
                  {getRecentNarratives().map(narrative => (
                    <div
                      key={narrative.id}
                      className={`p-4 rounded-lg border-l-4 ${getNarrativeToneBackground(narrative.tone)} ${
                        narrative.tone === 'positive'
                          ? 'border-l-green-400'
                          : narrative.tone === 'negative'
                            ? 'border-l-red-400'
                            : 'border-l-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-semibold">{narrative.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              narrative.tone === 'positive'
                                ? 'bg-green-600/20 text-green-400'
                                : narrative.tone === 'negative'
                                  ? 'bg-red-600/20 text-red-400'
                                  : 'bg-gray-600/20 text-gray-400'
                            }`}
                          >
                            {narrative.tone}
                          </span>
                          <span className="text-xs text-gray-500">
                            Week {narrative.weekGenerated}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-300">{narrative.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
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
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-300 mb-2">No Recent Coverage</h4>
                  <p className="text-gray-500">
                    Media narratives will appear here based on your press conference responses
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Question Interface */
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="mb-8">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Press Conference Question</h2>
                  <p className="text-xl text-gray-300">{selectedQuestion.question}</p>
                </div>
              </div>
            </div>

            {/* Response Options */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-teal-400">Choose Your Response:</h3>
              {selectedQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer border border-gray-600 hover:border-teal-500"
                  onClick={() => handleAnswerQuestion(option)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-teal-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <p className="text-white font-medium mb-2">"{option.text}"</p>
                      <p className="text-gray-400 text-sm mb-2">{option.outcome}</p>
                      <div className="flex space-x-4 text-xs">
                        <div
                          className={`flex items-center space-x-1 ${
                            option.fanConfidenceEffect > 0
                              ? 'text-green-400'
                              : option.fanConfidenceEffect < 0
                                ? 'text-red-400'
                                : 'text-gray-400'
                          }`}
                        >
                          <span>Fan Confidence:</span>
                          <span>
                            {option.fanConfidenceEffect > 0 ? '+' : ''}
                            {option.fanConfidenceEffect}
                          </span>
                        </div>
                        <div
                          className={`flex items-center space-x-1 ${
                            option.teamMoraleEffect > 0
                              ? 'text-green-400'
                              : option.teamMoraleEffect < 0
                                ? 'text-red-400'
                                : 'text-gray-400'
                          }`}
                        >
                          <span>Team Morale:</span>
                          <span>
                            {option.teamMoraleEffect > 0 ? '+' : ''}
                            {option.teamMoraleEffect}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setSelectedQuestion(null)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Back to Questions
              </button>
            </div>
          </div>
        )}

        {/* Press Conference Tips */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">Press Conference Strategy</h3>
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
              <h4 className="text-lg font-semibold text-white mb-2">Build Confidence</h4>
              <p className="text-gray-400 text-sm">
                Positive responses can boost fan confidence and team morale
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Stay Balanced</h4>
              <p className="text-gray-400 text-sm">
                Diplomatic answers maintain stability during difficult periods
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
              <h4 className="text-lg font-semibold text-white mb-2">Consider Context</h4>
              <p className="text-gray-400 text-sm">
                Your responses shape media narratives and public perception
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressConferencePage;
