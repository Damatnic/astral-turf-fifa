import React, { useState, useEffect, useRef } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import { getAIPlayerConversationResponse } from '../../services/aiServiceLoader';
import type { ChatMessage, Player } from '../../types';
import { CloseIcon, BrainCircuitIcon, LoadingSpinner, UsersIcon } from '../ui/icons';

const PlayerConversationPopup: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const { players } = tacticsState;
  const { playerConversationData, isLoadingConversation, settings } = uiState;
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const player = players.find(p => p.id === playerConversationData?.playerId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [player?.conversationHistory, isLoadingConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoadingConversation || !player) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: message,
    };

    dispatch({
      type: 'SEND_PLAYER_MESSAGE_START',
      payload: { playerId: player.id, message: userMessage },
    } as any);
    setMessage('');

    try {
      const result = await getAIPlayerConversationResponse(player, message, settings.aiPersonality);
      const aiResponse: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'ai',
        text: result.response,
      };
      dispatch({
        type: 'SEND_PLAYER_MESSAGE_SUCCESS',
        payload: { playerId: player.id, response: aiResponse, moraleEffect: result.moraleEffect },
      } as any);
    } catch (_error) {
      console.error('Failed to get AI player response:', _error);
      dispatch({ type: 'SEND_PLAYER_MESSAGE_FAILURE', payload: { playerId: player.id } } as any);
    }
  };

  const handleClose = () => {
    uiDispatch({ type: 'CLOSE_MODAL' });
  };

  if (!player) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[70vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center">
            <UsersIcon className="w-6 h-6 mr-2 text-teal-400" />
            <h3 className="font-bold text-white">Conversation with {player.name}</h3>
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
          {player.conversationHistory?.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: player.teamColor }}
                >
                  <span className="font-bold">{player.jerseyNumber}</span>
                </div>
              )}
              <div
                className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-slate-700 text-slate-200 rounded-bl-lg'}`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoadingConversation && (
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: player.teamColor }}
              >
                <LoadingSpinner className="w-5 h-5" />
              </div>
              <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-slate-700 text-slate-400 rounded-bl-lg italic">
                <p className="text-sm">{player.name} is thinking...</p>
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
              placeholder={`Talk to ${player.name}...`}
              className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={isLoadingConversation}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoadingConversation}
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

export default PlayerConversationPopup;
