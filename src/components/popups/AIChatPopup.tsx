import React, { useState, useEffect, useRef } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import { getAIChatResponse } from '../../services/aiServiceLoader';
import type { ChatMessage } from '../../types';
import { CloseIcon, BrainCircuitIcon, LoadingSpinner } from '../ui/icons';

const AIChatPopup: React.FC = () => {
  const { tacticsState } = useTacticsContext();
  const { uiState, dispatch } = useUIContext();
  const { players, formations, activeFormationIds } = tacticsState;
  const { chatHistory, isChatProcessing, settings, activeTeamContext } = uiState;
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatHistory, isChatProcessing]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isChatProcessing) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: message,
    };

    dispatch({ type: 'SEND_CHAT_MESSAGE_START', payload: userMessage });
    setMessage('');

    try {
      const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
      const formation = formations[activeFormationIds[activeTeam]];
      if (!formation) {
        throw new Error('No formation found for active team');
      }
      const onFieldIds = new Set(formation.slots.map(s => s.playerId).filter(Boolean));
      const onFieldPlayers = players.filter(p => onFieldIds.has(p.id));

      const result = await getAIChatResponse(
        [...chatHistory, userMessage],
        onFieldPlayers,
        formation,
        settings.aiPersonality,
      );

      const aiResponse: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'ai',
        text: result.text,
      };
      dispatch({
        type: 'SEND_CHAT_MESSAGE_SUCCESS',
        payload: { response: aiResponse, playerIdsToHighlight: result.playerIdsToHighlight },
      });
    } catch (_error) {
      console.error('Failed to get AI chat response:', _error);
      dispatch({ type: 'SEND_CHAT_MESSAGE_FAILURE' });
    }
  };

  const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

  return (
    <div className="fixed bottom-28 right-8 z-40">
      <div className="bg-slate-800  rounded-lg shadow-2xl w-96 border border-gray-700/50 flex flex-col animate-fade-in-scale h-[60vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center">
            <BrainCircuitIcon className="w-6 h-6 mr-2 text-teal-400" />
            <h3 className="font-bold text-white">Astral AI Assistant</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {chatHistory.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <BrainCircuitIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-slate-700 text-slate-200 rounded-bl-lg'}`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isChatProcessing && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                <LoadingSpinner className="w-5 h-5 text-white" />
              </div>
              <div className="max-w-xs px-4 py-2 rounded-2xl bg-slate-700 text-slate-400 rounded-bl-lg italic">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-700 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ask about your tactics..."
              className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={isChatProcessing}
            />
            <button
              type="submit"
              disabled={!message.trim() || isChatProcessing}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatPopup;
