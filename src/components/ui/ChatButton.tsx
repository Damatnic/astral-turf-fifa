import React from 'react';
import { useUIContext } from '../../hooks';
import { ChatIcon, CloseIcon } from './icons';

const ChatButton: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const isChatOpen = uiState.activeModal === 'chat';

  const toggleChat = () => {
    if (isChatOpen) {
      dispatch({ type: 'CLOSE_MODAL' });
    } else {
      dispatch({ type: 'OPEN_MODAL', payload: 'chat' });
    }
  };

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-teal-500 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-teal-400 transition-all duration-300 ease-in-out transform hover:scale-110"
      aria-label={isChatOpen ? 'Close AI Chat' : 'Open AI Chat'}
    >
      <div className="relative w-8 h-8">
        <div
          className={`absolute inset-0 transition-all duration-300 ${isChatOpen ? 'opacity-100 transform rotate-0 scale-100' : 'opacity-0 transform -rotate-90 scale-0'}`}
        >
          <CloseIcon className="w-8 h-8" />
        </div>
        <div
          className={`absolute inset-0 transition-all duration-300 ${!isChatOpen ? 'opacity-100 transform rotate-0 scale-100' : 'opacity-0 transform rotate-90 scale-0'}`}
        >
          <ChatIcon className="w-8 h-8" />
        </div>
      </div>
    </button>
  );
};

export default ChatButton;
