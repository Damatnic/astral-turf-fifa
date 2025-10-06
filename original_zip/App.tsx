import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from './src/components/ui/icons';
import ProtectedRoute from './src/components/ProtectedRoute';
import { useAuthContext } from './src/hooks/useAuthContext';

// Lazy load page components
const LandingPage = lazy(() => import('./src/pages/LandingPage'));
const LoginPage = lazy(() => import('./src/pages/LoginPage'));
const SignupPage = lazy(() => import('./src/pages/SignupPage'));
const Layout = lazy(() => import('./src/components/Layout'));
const DashboardPage = lazy(() => import('./src/pages/DashboardPage'));
const TacticsBoardPage = lazy(() => import('./src/pages/TacticsBoardPage'));
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

const App: React.FC = () => {
  const { authState } = useAuthContext();

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-gray-200 font-sans">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
            <LoadingSpinner className="w-12 h-12" />
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={authState.isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />}
          />
          <Route
            path="/login"
            element={authState.isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
          />
          <Route
            path="/signup"
            element={authState.isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />}
          />

          {/* Protected routes with Layout */}
          <Route path="/*" element={<ProtectedRoute />}>
            <Route path="/*" element={<Layout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tactics" element={<TacticsBoardPage />} />
              <Route path="finances" element={<FinancesPage />} />
              <Route path="transfers" element={<TransfersPage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="youth-academy" element={<YouthAcademyPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="stadium" element={<StadiumPage />} />
              <Route path="sponsorships" element={<SponsorshipsPage />} />
              <Route path="league-table" element={<LeagueTablePage />} />
              <Route path="board-objectives" element={<BoardObjectivesPage />} />
              <Route path="news-feed" element={<NewsFeedPage />} />
              <Route path="club-history" element={<ClubHistoryPage />} />
              <Route path="medical-center" element={<MedicalCenterPage />} />
              <Route path="job-security" element={<JobSecurityPage />} />
              <Route path="international-management" element={<InternationalManagementPage />} />
              <Route path="opposition-analysis" element={<OppositionAnalysisPage />} />
              <Route path="press-conference" element={<PressConferencePage />} />
              <Route path="player/:playerId" element={<PlayerProfilePage />} />
              <Route path="skill-challenges" element={<SkillChallengesPage />} />
              <Route path="mentoring" element={<MentoringPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
