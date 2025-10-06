import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTacticsContext } from '../hooks/useTacticsContext';
import { useUIContext, useResponsive } from '../hooks';
import { ResponsivePage } from '../components/Layout/ResponsivePage';
import { TacticsErrorBoundary } from '../components/boundaries/TacticsErrorBoundary';
import { LoadingFallback } from '../components/ErrorFallback';
import { type Formation } from '../types';

const UnifiedTacticsBoard = lazy(() => import('../components/tactics/UnifiedTacticsBoard'));
const ProfessionalPresentationMode = lazy(
  () => import('../components/field/ProfessionalPresentationMode'),
);
const ChatButton = lazy(() => import('../components/ui/ChatButton'));

const TacticsBoardPageComponent: React.FC = () => {
  const navigate = useNavigate();

  // Validate context data with error boundaries
  const tacticsContextData = useTacticsContext();
  const uiContextData = useUIContext();
  const responsiveState = useResponsive();

  if (!tacticsContextData || !uiContextData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingFallback message="Loading tactics board..." />
      </div>
    );
  }

  const { tacticsState } = tacticsContextData;
  const { uiState } = uiContextData;
  const { isPresentationMode } = uiState || {};
  const { isMobile } = responsiveState || {};

  // Integration handlers
  const handleSimulateMatch = (formation: Formation) => {
    // Navigate to match simulation with formation data
    const players = tacticsState?.players || [];
    const simulationConfig = { formation, players };

    // Store formation in session for match simulation
    sessionStorage.setItem('tacticalFormation', JSON.stringify(simulationConfig));
    navigate('/match-simulation', {
      state: {
        fromTactics: true,
        formation: formation,
        players: players,
      },
    });
  };

  const handleAnalyticsView = () => {
    // Navigate to analytics page
    navigate('/analytics', {
      state: {
        fromTactics: true,
        formation: tacticsState?.formations?.[tacticsState?.activeFormationIds?.home],
        players: tacticsState?.players,
      },
    });
  };

  const handleSaveFormation = async (formation: Formation) => {
    try {
      const players = tacticsState?.players || [];
      const exportData = {
        id: Date.now().toString(),
        name: formation.name || 'Custom Formation',
        formation,
        players,
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage (could be enhanced with proper backend)
      const savedFormations = JSON.parse(localStorage.getItem('savedFormations') || '[]');
      savedFormations.push(exportData);
      localStorage.setItem('savedFormations', JSON.stringify(savedFormations));

      // Show success feedback (could add toast notification)
      // eslint-disable-next-line no-console
      console.log('Formation saved successfully:', exportData.name);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save formation:', error);
    }
  };

  const handleExportFormation = async (formation: Formation) => {
    try {
      const players = tacticsState?.players || [];
      const exportData = {
        id: Date.now().toString(),
        name: formation.name || 'Custom Formation',
        formation,
        players,
        createdAt: new Date().toISOString(),
      };

      // Create downloadable JSON file
      const blob = new window.Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formation.name}-formation.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // eslint-disable-next-line no-console
      console.log('Formation exported successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to export formation:', error);
    }
  };

  return (
    <ResponsivePage maxWidth="full" noPadding>
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Modern Unified Tactics Board */}
        {!isPresentationMode ? (
          <Suspense fallback={<LoadingFallback message="Loading tactics board..." />}>
            <TacticsErrorBoundary
              componentName="UnifiedTacticsBoard"
              showDetails={import.meta.env.DEV}
            >
              <UnifiedTacticsBoard
                onSimulateMatch={handleSimulateMatch}
                onSaveFormation={handleSaveFormation}
                onAnalyticsView={handleAnalyticsView}
                onExportFormation={handleExportFormation}
              />
            </TacticsErrorBoundary>
          </Suspense>
        ) : (
          /* Presentation Mode */
          <Suspense fallback={<LoadingFallback message="Loading presentation mode..." />}>
            <TacticsErrorBoundary
              componentName="ProfessionalPresentationMode"
              showDetails={import.meta.env.DEV}
            >
              <ProfessionalPresentationMode />
            </TacticsErrorBoundary>
          </Suspense>
        )}

        {/* Chat Button */}
        {!isPresentationMode && (
          <div className={`fixed z-50 ${isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'}`}>
            <Suspense fallback={<LoadingFallback message="Loading assistant..." />}>
              <TacticsErrorBoundary componentName="ChatButton" showDetails={false}>
                <ChatButton />
              </TacticsErrorBoundary>
            </Suspense>
          </div>
        )}
      </div>
    </ResponsivePage>
  );
};

const TacticsBoardPage = React.memo(TacticsBoardPageComponent);

export default TacticsBoardPage;
