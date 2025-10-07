import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LoadingAnimation, PageTransition } from './src/components/ui/AnimationSystem';
import { ThemeProvider } from './src/context/ThemeContext';
import { AccessibilityProvider, SkipLink } from './src/components/ui/AccessibilityComponents';
import ProtectedRoute from './src/components/ProtectedRoute';
import { useAuthContext } from './src/hooks/useAuthContext';
import PWAInstallPrompt from './src/components/pwa/PWAInstallPrompt';
import PWAUpdatePrompt from './src/components/pwa/PWAUpdatePrompt';
import OfflineIndicator from './src/components/pwa/OfflineIndicator';

// Lazy load page components
const LandingPage = lazy(() => import('./src/pages/LandingPage'));
const LoginPage = lazy(() => import('./src/pages/LoginPage'));
const SignupPage = lazy(() => import('./src/pages/SignupPage'));
const Layout = lazy(() => import('./src/components/Layout'));
const DashboardPage = lazy(() => import('./src/pages/DashboardPage'));
const TacticsBoardPageNew = lazy(() => import('./src/pages/TacticsBoardPageNew'));
const FinancesPage = lazy(() => import('./src/pages/FinancesPage'));
const TransfersPage = lazy(() => import('./src/pages/TransfersPage'));
const TrainingPage = lazy(() => import('./src/pages/TrainingPage'));
const InboxPage = lazy(() => import('./src/pages/InboxPage'));
const AnalyticsPage = lazy(() => import('./src/pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./src/pages/SettingsPage'));
const YouthAcademyPage = lazy(() => import('./src/pages/YouthAcademyPage'));
const StaffPage = lazy(() => import('./src/pages/StaffPage'));
const StadiumPage = lazy(() => import('./src/pages/StadiumPage'));
const SponsorshipsPage = lazy(() => import('./src/pages/SponsorshipsPage'));
const LeagueTablePage = lazy(() => import('./src/pages/LeagueTablePage'));
const BoardObjectivesPage = lazy(() => import('./src/pages/BoardObjectivesPage'));
const NewsFeedPage = lazy(() => import('./src/pages/NewsFeedPage'));
const ClubHistoryPage = lazy(() => import('./src/pages/ClubHistoryPage'));
const MedicalCenterPage = lazy(() => import('./src/pages/MedicalCenterPage'));
const JobSecurityPage = lazy(() => import('./src/pages/JobSecurityPage'));
const InternationalManagementPage = lazy(() => import('./src/pages/InternationalManagementPage'));
const OppositionAnalysisPage = lazy(() => import('./src/pages/OppositionAnalysisPage'));
const PressConferencePage = lazy(() => import('./src/pages/PressConferencePage'));
const PlayerProfilePage = lazy(() => import('./src/pages/PlayerProfilePage'));
const SkillChallengesPage = lazy(() => import('./src/pages/SkillChallengesPage'));
const MentoringPage = lazy(() => import('./src/pages/MentoringPage'));
const AdvancedAnalyticsPage = lazy(() => import('./src/pages/AdvancedAnalyticsPage'));
const MyPlayerRankingPage = lazy(() => import('./src/pages/MyPlayerRankingPage'));
const ChallengeHubPage = lazy(() => import('./src/pages/ChallengeHubPage'));
const CoachChallengeManagerPage = lazy(() => import('./src/pages/CoachChallengeManagerPage'));
const PlayerCardPage = lazy(() => import('./src/pages/PlayerCardPage'));

const AppContent: React.FC = () => {
  const { authState } = useAuthContext();
  const location = useLocation();

  return (
    <>
      {/* Skip Links for Accessibility */}
      <SkipLink targetId="main-content">Skip to main content</SkipLink>
      <SkipLink targetId="navigation">Skip to navigation</SkipLink>

      {/* PWA Components */}
      <PWAInstallPrompt autoShow delay={5000} />
      <PWAUpdatePrompt />
      <OfflineIndicator />

      <div className="h-screen w-screen overflow-hidden font-sans">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <LoadingAnimation type="spinner" size="lg" />
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public routes */}
              <Route
                path="/"
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <PageTransition>
                      <LandingPage />
                    </PageTransition>
                  )
                }
              />
              <Route
                path="/login"
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <PageTransition>
                      <LoginPage />
                    </PageTransition>
                  )
                }
              />
              <Route
                path="/signup"
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <PageTransition>
                      <SignupPage />
                    </PageTransition>
                  )
                }
              />

              {/* Protected routes with Layout */}
              <Route path="/*" element={<ProtectedRoute />}>
                <Route path="/*" element={<Layout />}>
                  <Route
                    path="dashboard"
                    element={
                      <PageTransition>
                        <DashboardPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="tactics"
                    element={
                      <PageTransition>
                        <TacticsBoardPageNew />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="finances"
                    element={
                      <PageTransition>
                        <FinancesPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="transfers"
                    element={
                      <PageTransition>
                        <TransfersPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="training"
                    element={
                      <PageTransition>
                        <TrainingPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="inbox"
                    element={
                      <PageTransition>
                        <InboxPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="analytics"
                    element={
                      <PageTransition>
                        <AnalyticsPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <PageTransition>
                        <SettingsPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="youth-academy"
                    element={
                      <PageTransition>
                        <YouthAcademyPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="staff"
                    element={
                      <PageTransition>
                        <StaffPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="stadium"
                    element={
                      <PageTransition>
                        <StadiumPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="sponsorships"
                    element={
                      <PageTransition>
                        <SponsorshipsPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="league-table"
                    element={
                      <PageTransition>
                        <LeagueTablePage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="board-objectives"
                    element={
                      <PageTransition>
                        <BoardObjectivesPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="news-feed"
                    element={
                      <PageTransition>
                        <NewsFeedPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="club-history"
                    element={
                      <PageTransition>
                        <ClubHistoryPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="medical-center"
                    element={
                      <PageTransition>
                        <MedicalCenterPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="job-security"
                    element={
                      <PageTransition>
                        <JobSecurityPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="international-management"
                    element={
                      <PageTransition>
                        <InternationalManagementPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="opposition-analysis"
                    element={
                      <PageTransition>
                        <OppositionAnalysisPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="press-conference"
                    element={
                      <PageTransition>
                        <PressConferencePage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="player/:playerId"
                    element={
                      <PageTransition>
                        <PlayerProfilePage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="player-card"
                    element={
                      <PageTransition>
                        <PlayerCardPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="skill-challenges"
                    element={
                      <PageTransition>
                        <SkillChallengesPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="mentoring"
                    element={
                      <PageTransition>
                        <MentoringPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="advanced-analytics"
                    element={
                      <PageTransition>
                        <AdvancedAnalyticsPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="player-ranking"
                    element={
                      <PageTransition>
                        <MyPlayerRankingPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="player-ranking/:playerId"
                    element={
                      <PageTransition>
                        <MyPlayerRankingPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="challenge-hub"
                    element={
                      <PageTransition>
                        <ChallengeHubPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="challenge-manager"
                    element={
                      <PageTransition>
                        <CoachChallengeManagerPage />
                      </PageTransition>
                    }
                  />
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultMode="system">
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </ThemeProvider>
  );
};

export default App;
