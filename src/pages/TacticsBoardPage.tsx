import React, { useState } from 'react';
import { useTacticsContext } from '../hooks/useTacticsContext';
import { useUIContext, useResponsive } from '../hooks';
import { TacticsErrorBoundary } from '../components/boundaries/TacticsErrorBoundary';
import { LoadingFallback } from '../components/ErrorFallback';
import ProfessionalPresentationMode from '../components/field/ProfessionalPresentationMode';
import ChatButton from '../components/ui/ChatButton';
import AITacticalAnalyzer from '../components/analysis/AITacticalAnalyzer';
import UnifiedTacticsBoard from '../components/tactics/UnifiedTacticsBoard';

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

  const { uiState } = uiContextData;
  const { isPresentationMode } = uiState || {};
  const { isMobile } = useResponsive() || {};

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Modern Unified Tactics Board */}
      {!isPresentationMode ? (
        <TacticsErrorBoundary componentName="UnifiedTacticsBoard" showDetails={import.meta.env.DEV}>
          <UnifiedTacticsBoard />
        </TacticsErrorBoundary>
      ) : (
        /* Presentation Mode */
        <TacticsErrorBoundary componentName="ProfessionalPresentationMode" showDetails={import.meta.env.DEV}>
          <ProfessionalPresentationMode />
        </TacticsErrorBoundary>
      )}

      {/* AI Tactical Analyzer - Always Available */}
      {!isPresentationMode && (
        <TacticsErrorBoundary componentName="AITacticalAnalyzer" showDetails={import.meta.env.DEV}>
          <AITacticalAnalyzer />
        </TacticsErrorBoundary>
      )}

      {/* Chat Button */}
      {!isPresentationMode && (
        <div className={`fixed z-50 ${isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'}`}>
          <TacticsErrorBoundary componentName="ChatButton" showDetails={false}>
            <ChatButton />
          </TacticsErrorBoundary>
        </div>
      )}
    </div>
  );
});

export default TacticsBoardPage;
