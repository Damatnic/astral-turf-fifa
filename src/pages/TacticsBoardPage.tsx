import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTacticsContext } from '../hooks/useTacticsContext';
import { useUIContext, useResponsive } from '../hooks';
import { TacticsErrorBoundary } from '../components/boundaries/TacticsErrorBoundary';
import { LoadingFallback } from '../components/ErrorFallback';
import ProfessionalPresentationMode from '../components/field/ProfessionalPresentationMode';
import ChatButton from '../components/ui/ChatButton';
import AITacticalAnalyzer from '../components/analysis/AITacticalAnalyzer';
import UnifiedTacticsBoard from '../components/tactics/UnifiedTacticsBoard';
import { tacticalIntegrationService } from '../services/tacticalIntegrationService';
import { type Formation } from '../types';

const TacticsBoardPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  
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

  const { tacticsState } = tacticsContextData;
  const { uiState } = uiContextData;
  const { isPresentationMode } = uiState || {};
  const { isMobile } = useResponsive() || {};

  // Integration handlers
  const handleSimulateMatch = useCallback((formation: Formation) => {
    // Navigate to match simulation with formation data
    const players = tacticsState?.players || [];
    const simulationConfig = tacticalIntegrationService.createSimulationConfig(formation, players);
    
    // Store formation in session for match simulation
    sessionStorage.setItem('tacticalFormation', JSON.stringify(simulationConfig));
    navigate('/match-simulation', { 
      state: { 
        fromTactics: true, 
        formation: formation,
        players: players 
      } 
    });
  }, [navigate, tacticsState?.players]);

  const handleAnalyticsView = useCallback(() => {
    // Navigate to analytics page
    navigate('/analytics', { 
      state: { 
        fromTactics: true,
        formation: tacticsState?.formations?.[tacticsState?.activeFormationIds?.home],
        players: tacticsState?.players
      } 
    });
  }, [navigate, tacticsState]);

  const handleSaveFormation = useCallback(async (formation: Formation) => {
    try {
      const players = tacticsState?.players || [];
      const analysis = await tacticalIntegrationService.analyzeFormation(formation, players);
      const exportData = tacticalIntegrationService.exportFormation(formation, players, analysis);
      
      // Save to localStorage (could be enhanced with proper backend)
      const savedFormations = JSON.parse(localStorage.getItem('savedFormations') || '[]');
      savedFormations.push(exportData);
      localStorage.setItem('savedFormations', JSON.stringify(savedFormations));
      
      // Show success feedback (could add toast notification)
      console.log('Formation saved successfully:', exportData.name);
    } catch (error) {
      console.error('Failed to save formation:', error);
    }
  }, [tacticsState?.players]);

  const handleExportFormation = useCallback(async (formation: Formation) => {
    try {
      const players = tacticsState?.players || [];
      const analysis = await tacticalIntegrationService.analyzeFormation(formation, players);
      const exportData = tacticalIntegrationService.exportFormation(formation, players, analysis);
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formation.name}-formation.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Formation exported successfully');
    } catch (error) {
      console.error('Failed to export formation:', error);
    }
  }, [tacticsState?.players]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Modern Unified Tactics Board */}
      {!isPresentationMode ? (
        <TacticsErrorBoundary componentName="UnifiedTacticsBoard" showDetails={import.meta.env.DEV}>
          <UnifiedTacticsBoard 
            onSimulateMatch={handleSimulateMatch}
            onSaveFormation={handleSaveFormation}
            onAnalyticsView={handleAnalyticsView}
            onExportFormation={handleExportFormation}
          />
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
