
import React from 'react';
import { useTacticsContext } from '../hooks/useTacticsContext';
import { LeftSidebar } from '../components/sidebar/LeftSidebar';
import { RightSidebar } from '../components/sidebar/RightSidebar';
import SoccerField from '../components/field/SoccerField';
import Dugout from '../components/field/Dugout';
import TacticalToolbar from '../components/field/TacticalToolbar';
import PresentationControls from '../components/field/PresentationControls';
import ChatButton from '../components/ui/ChatButton';
import { useUIContext, useResponsive, useResponsiveNavigation } from '../hooks';

const TacticsBoardPage: React.FC = React.memo(() => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { isPresentationMode } = uiState;
  
  // Mobile-First Responsive State
  const responsive = useResponsive();
  const { shouldUseDrawer } = useResponsiveNavigation();
  const { isMobile, isTablet, currentBreakpoint } = responsive;

  return (
    <div className={`
      flex w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
      ${isMobile ? 'flex-col mobile-full-height' : 'flex-row h-screen'}
    `}>
      {/* Mobile-First Sidebar Management */}
      {!isPresentationMode && !shouldUseDrawer && (
        <>
          {/* Left Sidebar - Desktop Only */}
          <div className="flex-shrink-0 w-80 transition-all duration-300 ease-in-out backdrop-blur-sm">
            <div className="h-full border-r border-slate-700/50 bg-slate-900/80">
              <LeftSidebar />
            </div>
          </div>
        </>
      )}
      
      {/* Mobile-First Main Field Area */}
      <main className={`
        flex-grow flex flex-col min-h-0 relative
        ${isMobile ? 'flex-1' : ''}
      `}>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-slate-900/40 to-slate-950/20"></div>
        
        {/* Mobile-Optimized Field Container */}
        <div className={`
          flex-grow flex items-center justify-center relative z-10
          ${isPresentationMode ? 'p-0' : isMobile ? 'mobile-p-2' : 'p-4'}
        `}>
          <div className={`
            relative w-full h-full
            ${isMobile ? '' : 'max-w-7xl max-h-full'}
          `}>
            {/* Field Background */}
            <div className={`
              absolute inset-0 shadow-2xl bg-gradient-to-br from-emerald-900/10 to-slate-900/20 backdrop-blur-sm border border-emerald-500/10
              ${isMobile ? 'rounded-lg' : 'rounded-lg'}
            `}></div>
            
            {/* Soccer Field Component */}
            <div className="relative z-10 w-full h-full">
              <SoccerField />
            </div>
          </div>
          
          {/* Tactical Toolbar - Mobile Positioned */}
          {!isPresentationMode && (
            <div className={`
              ${isMobile ? 'absolute top-2 left-2 right-2' : 'static'}
            `}>
              <TacticalToolbar />
            </div>
          )}
        </div>
        
        {/* Mobile-First Dugout Area */}
        {!isPresentationMode && (
          <div className={`
            border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm
            ${isMobile ? 'flex-shrink-0' : ''}
          `}>
            <Dugout />
          </div>
        )}
        
        {/* Presentation Controls */}
        {isPresentationMode && <PresentationControls />}
      </main>
      
      {/* Right Sidebar - Desktop Only */}
      {!isPresentationMode && !shouldUseDrawer && (
        <div className="flex-shrink-0 w-80 transition-all duration-300 ease-in-out backdrop-blur-sm">
          <div className="h-full border-l border-slate-700/50 bg-slate-900/80">
            <RightSidebar />
          </div>
        </div>
      )}
      
      {/* Mobile Sidebar Access - Bottom Sheet Style */}
      {!isPresentationMode && isMobile && (
        <div className="flex-shrink-0 bg-slate-900/90 border-t border-slate-700/50">
          {/* Mobile Sidebar Tabs */}
          <div className="flex justify-center space-x-1 p-2">
            <button className="btn-mobile flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 rounded-lg transition-colors">
              Players
            </button>
            <button className="btn-mobile flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 rounded-lg transition-colors">
              Formation
            </button>
            <button className="btn-mobile flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 rounded-lg transition-colors">
              Analytics
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile-Optimized Chat Button */}
      {!isPresentationMode && (
        <div className={`
          fixed z-50
          ${isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'}
        `}>
          <ChatButton />
        </div>
      )}
    </div>
  );
});

export default TacticsBoardPage;
