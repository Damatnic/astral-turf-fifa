import React, { useState } from 'react';
import { useTacticsContext } from '../hooks/useTacticsContext';
import { LeftSidebar } from '../components/sidebar/LeftSidebar';
import { RightSidebar } from '../components/sidebar/RightSidebar';
import Modern3DSoccerField from '../components/field/Modern3DSoccerField';
import Dugout from '../components/field/Dugout';
import GlassMorphismTacticalToolbar from '../components/field/GlassMorphismTacticalToolbar';
import ProfessionalPresentationMode from '../components/field/ProfessionalPresentationMode';
import ChatButton from '../components/ui/ChatButton';
import AITacticalAnalyzer from '../components/analysis/AITacticalAnalyzer';
import { SmartCoachingAssistant } from '../components/coaching/SmartCoachingAssistant';
import { Advanced3DAnalytics } from '../components/analytics/Advanced3DAnalytics';
import { RealTimeCollaboration } from '../components/collaboration/RealTimeCollaboration';
import { TouchFirstTacticsBoard } from '../components/mobile/TouchFirstTacticsBoard';
import { WebGLTacticsRenderer } from '../components/webgl/WebGLTacticsRenderer';
import { useUIContext, useResponsive, useResponsiveNavigation } from '../hooks';
import { TacticsErrorBoundary } from '../components/boundaries/TacticsErrorBoundary';
import { LoadingFallback } from '../components/ErrorFallback';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Brain, 
  BarChart3, 
  Users, 
  Smartphone, 
  Zap,
  Settings,
  Eye
} from 'lucide-react';

const TacticsBoardPage: React.FC = React.memo(() => {
  // Validate context data with error boundaries
  const tacticsContextData = useTacticsContext();
  const uiContextData = useUIContext();
  
  // Enhanced UI state for new features
  const [activeTab, setActiveTab] = useState<string>('tactics');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [renderMode, setRenderMode] = useState<'standard' | 'webgl' | 'mobile'>('standard');

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

  // Mock data for enhanced features
  const mockPlayers = tacticsState?.players || [];
  const mockCurrentUser = {
    id: 'user-1',
    name: 'Head Coach',
    role: 'coach' as const,
    isOnline: true,
    color: '#3b82f6',
    permissions: { canEdit: true, canMove: true, canDraw: true, canChat: true }
  };

  const handlePlayerMove = (playerId: string, position: { x: number; y: number }) => {
    // Handle player movement for enhanced components
    if (dispatch) {
      dispatch({
        type: 'MOVE_PLAYER',
        payload: { playerId, position }
      });
    }
  };

  const handleFormationChange = (formation: any) => {
    // Handle formation changes
    if (dispatch) {
      dispatch({
        type: 'UPDATE_FORMATION',
        payload: formation
      });
    }
  };

  // Render mobile version if on mobile device
  if (isMobile && renderMode === 'mobile') {
    return (
      <TacticsErrorBoundary componentName="TouchFirstTacticsBoard" showDetails={import.meta.env.DEV}>
        <TouchFirstTacticsBoard
          players={mockPlayers}
          onPlayerMove={handlePlayerMove}
          onFormationChange={handleFormationChange}
        />
      </TacticsErrorBoundary>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Tactics Board with Tabs */}
      {!isPresentationMode ? (
        <div className="h-full flex flex-col">
          {/* Advanced Features Header */}
          <div className="bg-black/50 backdrop-blur-md border-b border-white/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white">Astral Turf Pro</h1>
                <Badge className="bg-green-500/20 text-green-400">
                  Enhanced v9.0
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setRenderMode('webgl')}
                  className={renderMode === 'webgl' 
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-white/10 hover:bg-white/20 border-white/20"
                  }
                >
                  <Zap className="w-4 h-4 mr-2" />
                  WebGL
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => setRenderMode(isMobile ? 'mobile' : 'standard')}
                  className={renderMode === 'mobile' 
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-white/10 hover:bg-white/20 border-white/20"
                  }
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {isMobile ? 'Touch' : 'Mobile'}
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                  className="bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced
                </Button>
              </div>
            </div>

            {/* Enhanced Feature Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white/5">
                <TabsTrigger value="tactics" className="data-[state=active]:bg-blue-500/20">
                  <Eye className="w-4 h-4 mr-2" />
                  Tactics
                </TabsTrigger>
                <TabsTrigger value="coaching" className="data-[state=active]:bg-green-500/20">
                  <Brain className="w-4 h-4 mr-2" />
                  Coaching
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500/20">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="collaboration" className="data-[state=active]:bg-orange-500/20">
                  <Users className="w-4 h-4 mr-2" />
                  Collaboration
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-yellow-500/20">
                  <Zap className="w-4 h-4 mr-2" />
                  Performance
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} className="h-full">
              {/* Standard Tactics View */}
              <TabsContent value="tactics" className="h-full p-0 m-0">
                <div className={`flex w-full h-full ${isMobile ? 'flex-col' : 'flex-row'}`}>
                  {/* Left Sidebar - Desktop Only */}
                  {!shouldUseDrawer && (
                    <div className="flex-shrink-0 w-80 transition-all duration-300 ease-in-out backdrop-blur-sm">
                      <div className="h-full border-r border-slate-700/50 bg-slate-900/80">
                        <TacticsErrorBoundary componentName="LeftSidebar" showDetails={import.meta.env.DEV}>
                          <LeftSidebar />
                        </TacticsErrorBoundary>
                      </div>
                    </div>
                  )}

                  {/* Main Field Area */}
                  <main className="flex-grow flex flex-col min-h-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-slate-900/40 to-slate-950/20"></div>

                    {/* Field Container */}
                    <div className="flex-grow flex items-center justify-center relative z-10 p-4">
                      <div className="relative w-full h-full max-w-7xl max-h-full">
                        {/* Field Background */}
                        <div className="absolute inset-0 shadow-2xl bg-gradient-to-br from-emerald-900/10 to-slate-900/20 backdrop-blur-sm border border-emerald-500/10 rounded-lg"></div>

                        {/* Render Field Based on Mode */}
                        <div className="relative z-10 w-full h-full">
                          {renderMode === 'webgl' ? (
                            <TacticsErrorBoundary componentName="WebGLTacticsRenderer" showDetails={import.meta.env.DEV}>
                              <WebGLTacticsRenderer
                                players={mockPlayers}
                                fieldWidth={800}
                                fieldHeight={520}
                                onPlayerMove={handlePlayerMove}
                              />
                            </TacticsErrorBoundary>
                          ) : (
                            <TacticsErrorBoundary componentName="Modern3DSoccerField" showDetails={import.meta.env.DEV}>
                              <Modern3DSoccerField />
                            </TacticsErrorBoundary>
                          )}
                        </div>
                      </div>

                      {/* Glass Morphism Tactical Toolbar */}
                      <TacticsErrorBoundary componentName="GlassMorphismTacticalToolbar" showDetails={import.meta.env.DEV}>
                        <GlassMorphismTacticalToolbar />
                      </TacticsErrorBoundary>
                    </div>

                    {/* Dugout Area */}
                    <div className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
                      <TacticsErrorBoundary componentName="Dugout" showDetails={import.meta.env.DEV}>
                        <Dugout />
                      </TacticsErrorBoundary>
                    </div>
                  </main>

                  {/* Right Sidebar - Desktop Only */}
                  {!shouldUseDrawer && (
                    <div className="flex-shrink-0 w-80 transition-all duration-300 ease-in-out backdrop-blur-sm">
                      <div className="h-full border-l border-slate-700/50 bg-slate-900/80">
                        <TacticsErrorBoundary componentName="RightSidebar" showDetails={import.meta.env.DEV}>
                          <RightSidebar />
                        </TacticsErrorBoundary>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Smart Coaching Assistant Tab */}
              <TabsContent value="coaching" className="h-full p-4 overflow-y-auto">
                <TacticsErrorBoundary componentName="SmartCoachingAssistant" showDetails={import.meta.env.DEV}>
                  <SmartCoachingAssistant
                    currentFormation={tacticsState?.formation || { name: '4-3-3', players: mockPlayers }}
                    availablePlayers={mockPlayers}
                    onFormationChange={handleFormationChange}
                    onPlayerChange={handlePlayerMove}
                  />
                </TacticsErrorBoundary>
              </TabsContent>

              {/* Advanced Analytics Tab */}
              <TabsContent value="analytics" className="h-full p-4 overflow-y-auto">
                <TacticsErrorBoundary componentName="Advanced3DAnalytics" showDetails={import.meta.env.DEV}>
                  <Advanced3DAnalytics
                    players={mockPlayers}
                    matchData={{
                      duration: 90,
                      events: [],
                      heatMapData: [],
                      movementData: []
                    }}
                  />
                </TacticsErrorBoundary>
              </TabsContent>

              {/* Real-Time Collaboration Tab */}
              <TabsContent value="collaboration" className="h-full p-4 overflow-y-auto">
                <TacticsErrorBoundary componentName="RealTimeCollaboration" showDetails={import.meta.env.DEV}>
                  <RealTimeCollaboration
                    currentUser={mockCurrentUser}
                    formation={tacticsState?.formation || { name: '4-3-3', players: mockPlayers }}
                    onFormationChange={handleFormationChange}
                    onPlayerChange={handlePlayerMove}
                  />
                </TacticsErrorBoundary>
              </TabsContent>

              {/* Performance/WebGL Tab */}
              <TabsContent value="performance" className="h-full p-4 overflow-y-auto">
                <TacticsErrorBoundary componentName="WebGLTacticsRenderer" showDetails={import.meta.env.DEV}>
                  <WebGLTacticsRenderer
                    players={mockPlayers}
                    fieldWidth={800}
                    fieldHeight={520}
                    onPlayerMove={handlePlayerMove}
                  />
                </TacticsErrorBoundary>
              </TabsContent>
            </Tabs>
          </div>
        </div>
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
