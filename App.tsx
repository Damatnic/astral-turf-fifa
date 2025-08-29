
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from './components/ui/icons';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthContext } from './hooks/useAuthContext';

// Lazy load page components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const Layout = lazy(() => import('./components/Layout'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TacticsBoardPage = lazy(() => import('./pages/TacticsBoardPage'));
const FinancesPage = lazy(() => import('./pages/FinancesPage'));
const TransfersPage = lazy(() => import('./pages/TransfersPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const InboxPage = lazy(() => import('./pages/InboxPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const YouthAcademyPage = lazy(() => import('./pages/YouthAcademyPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const StadiumPage = lazy(() => import('./pages/StadiumPage'));
const SponsorshipsPage = lazy(() => import('./pages/SponsorshipsPage'));
const LeagueTablePage = lazy(() => import('./pages/LeagueTablePage'));
const BoardObjectivesPage = lazy(() => import('./pages/BoardObjectivesPage'));
const NewsFeedPage = lazy(() => import('./pages/NewsFeedPage'));
const ClubHistoryPage = lazy(() => import('./pages/ClubHistoryPage'));
const MedicalCenterPage = lazy(() => import('./pages/MedicalCenterPage'));
const JobSecurityPage = lazy(() => import('./pages/JobSecurityPage'));
const InternationalManagementPage = lazy(() => import('./pages/InternationalManagementPage'));
const OppositionAnalysisPage = lazy(() => import('./pages/OppositionAnalysisPage'));
const PressConferencePage = lazy(() => import('./pages/PressConferencePage'));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'));
const SkillChallengesPage = lazy(() => import('./pages/SkillChallengesPage'));
const MentoringPage = lazy(() => import('./pages/MentoringPage'));

const App: React.FC = () => {
  const { authState } = useAuthContext();

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-gray-200 font-sans">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
          <LoadingSpinner className="w-12 h-12" />
        </div>
      }>
        <Routes>
          <Route path="/" element={authState.isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={authState.isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/signup" element={authState.isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
