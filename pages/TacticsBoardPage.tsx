
import React from 'react';
import { useTacticsContext } from '../hooks/useTacticsContext';
import { LeftSidebar } from '../components/sidebar/LeftSidebar';
import { RightSidebar } from '../components/sidebar/RightSidebar';
import SoccerField from '../components/field/SoccerField';
import Dugout from '../components/field/Dugout';
import TacticalToolbar from '../components/field/TacticalToolbar';
import PresentationControls from '../components/field/PresentationControls';
import ChatButton from '../components/ui/ChatButton';
import { useUIContext } from '../hooks';

const TacticsBoardPage: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { isPresentationMode } = uiState;

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Left Sidebar with enhanced styling */}
      <div className={`flex-shrink-0 transition-all duration-300 ease-in-out backdrop-blur-sm ${isPresentationMode ? 'w-0 overflow-hidden' : 'w-80'}`}>
        <div className="h-full border-r border-slate-700/50 bg-slate-900/80">
          <LeftSidebar />
        </div>
      </div>
      
      {/* Main Field Area with enhanced background */}
      <main className="flex-grow flex flex-col min-h-0 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-slate-900/40 to-slate-950/20"></div>
        <div className={`flex-grow flex items-center justify-center relative z-10 ${isPresentationMode ? 'p-0' : 'p-4'}`}>
          {/* Field container with subtle enhancement */}
          <div className="relative w-full h-full max-w-7xl max-h-full">
            <div className="absolute inset-0 rounded-lg shadow-2xl bg-gradient-to-br from-emerald-900/10 to-slate-900/20 backdrop-blur-sm border border-emerald-500/10"></div>
            <div className="relative z-10 w-full h-full">
              <SoccerField />
            </div>
          </div>
          {!isPresentationMode && <TacticalToolbar />}
        </div>
        {!isPresentationMode && (
          <div className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
            <Dugout />
          </div>
        )}
        {isPresentationMode && <PresentationControls />}
      </main>
      
      {/* Right Sidebar with enhanced styling */}
      <div className={`flex-shrink-0 transition-all duration-300 ease-in-out backdrop-blur-sm ${isPresentationMode ? 'w-0 overflow-hidden' : 'w-80'}`}>
        <div className="h-full border-l border-slate-700/50 bg-slate-900/80">
          <RightSidebar />
        </div>
      </div>
      
      {/* Chat Button with enhanced positioning */}
      {!isPresentationMode && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatButton />
        </div>
      )}
    </div>
  );
};

export default TacticsBoardPage;
