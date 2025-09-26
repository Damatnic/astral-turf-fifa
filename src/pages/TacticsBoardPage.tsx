import React from 'react';
import { useTacticsContext } from '../hooks/useTacticsContext';
import { LeftSidebar } from '../components/sidebar/LeftSidebar';
import { RightSidebar } from '../components/sidebar/RightSidebar';
import Modern3DSoccerField from '../components/field/Modern3DSoccerField';
import Dugout from '../components/field/Dugout';
import GlassMorphismTacticalToolbar from '../components/field/GlassMorphismTacticalToolbar';
import ProfessionalPresentationMode from '../components/field/ProfessionalPresentationMode';
import ChatButton from '../components/ui/ChatButton';
import AITacticalAnalyzer from '../components/analysis/AITacticalAnalyzer';
import { useUIContext, useResponsive, useResponsiveNavigation } from '../hooks';
import { TacticsErrorBoundary } from '../components/boundaries/TacticsErrorBoundary';
import { LoadingFallback } from '../components/ErrorFallback';

const TacticsBoardPage: React.FC = React.memo(() => {
  // Validate context data with error boundaries
  const tacticsContextData = useTacticsContext();
  const uiContextData = useUIContext();

  if (!tacticsContextData || !uiContextData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingFallback message="Loading tactics board..." />
      </div>
    );
  }

  const { tacticsState, dispatch } = tacticsContextData;
  const { uiState } = uiContextData;
  const { isPresentationMode } = uiState || {};

  // Mobile-First Responsive State
  const responsive = useResponsive();
  const { shouldUseDrawer } = useResponsiveNavigation();
  const { isMobile, isTablet, currentBreakpoint } = responsive || {};

  return (
    <div
      className={`
      flex w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
      ${isMobile ? 'flex-col mobile-full-height' : 'flex-row h-screen'}
    `}
    >
      {/* Mobile-First Sidebar Management */}
      {!isPresentationMode && !shouldUseDrawer && (
        <>
          {/* Left Sidebar - Desktop Only */}
          <div className="flex-shrink-0 w-80 transition-all duration-300 ease-in-out backdrop-blur-sm">
            <div className="h-full border-r border-slate-700/50 bg-slate-900/80">
              <TacticsErrorBoundary componentName="LeftSidebar" showDetails={import.meta.env.DEV}>
                <LeftSidebar />
              </TacticsErrorBoundary>
            </div>
          </div>
        </>
      )}

      {/* Mobile-First Main Field Area */}
      <main
        className={`
        flex-grow flex flex-col min-h-0 relative
        ${isMobile ? 'flex-1' : ''}
      `}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-slate-900/40 to-slate-950/20"></div>

        {/* Mobile-Optimized Field Container */}
        <div
          className={`
          flex-grow flex items-center justify-center relative z-10
          ${isPresentationMode ? 'p-0' : isMobile ? 'mobile-p-2' : 'p-4'}
        `}
        >
          <div
            className={`
            relative w-full h-full
            ${isMobile ? '' : 'max-w-7xl max-h-full'}
          `}
          >
            {/* Field Background */}
            <div
              className={`
              absolute inset-0 shadow-2xl bg-gradient-to-br from-emerald-900/10 to-slate-900/20 backdrop-blur-sm border border-emerald-500/10
              ${isMobile ? 'rounded-lg' : 'rounded-lg'}
            `}
            ></div>

            {/* Modern 3D Soccer Field Component */}
            <div className="relative z-10 w-full h-full">
              <TacticsErrorBoundary
                componentName="Modern3DSoccerField"
                showDetails={import.meta.env.DEV}
                onError={(error, errorInfo) => {
                  console.error('Soccer Field Error:', error);
                  console.error('Error Info:', errorInfo);
                }}
              >
                <Modern3DSoccerField />
              </TacticsErrorBoundary>
            </div>
          </div>

          {/* Glass Morphism Tactical Toolbar - Mobile Positioned */}
          {!isPresentationMode && (
            <TacticsErrorBoundary
              componentName="GlassMorphismTacticalToolbar"
              showDetails={import.meta.env.DEV}
            >
              <GlassMorphismTacticalToolbar />
            </TacticsErrorBoundary>
          )}
        </div>

        {/* Mobile-First Dugout Area */}
        {!isPresentationMode && (
          <div
            className={`
            border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm
            ${isMobile ? 'flex-shrink-0' : ''}
          `}
          >
            <TacticsErrorBoundary componentName="Dugout" showDetails={import.meta.env.DEV}>
              <Dugout />
            </TacticsErrorBoundary>
          </div>
        )}

        {/* Professional Presentation Mode */}
        {isPresentationMode && (
          <TacticsErrorBoundary
            componentName="ProfessionalPresentationMode"
            showDetails={import.meta.env.DEV}
          >
            <ProfessionalPresentationMode />
          </TacticsErrorBoundary>
        )}
      </main>

      {/* Right Sidebar - Desktop Only */}
      {!isPresentationMode && !shouldUseDrawer && (
        <div className="flex-shrink-0 w-80 transition-all duration-300 ease-in-out backdrop-blur-sm">
          <div className="h-full border-l border-slate-700/50 bg-slate-900/80">
            <TacticsErrorBoundary componentName="RightSidebar" showDetails={import.meta.env.DEV}>
              <RightSidebar />
            </TacticsErrorBoundary>
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

      {/* AI Tactical Analyzer */}
      {!isPresentationMode && (
        <TacticsErrorBoundary componentName="AITacticalAnalyzer" showDetails={import.meta.env.DEV}>
          <AITacticalAnalyzer />
        </TacticsErrorBoundary>
      )}

      {/* Mobile-Optimized Chat Button */}
      {!isPresentationMode && (
        <div
          className={`
          fixed z-50
          ${isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'}
        `}
        >
          <TacticsErrorBoundary componentName="ChatButton" showDetails={false}>
            <ChatButton />
          </TacticsErrorBoundary>
        </div>
      )}
    </div>
  );
});

export default TacticsBoardPage;
