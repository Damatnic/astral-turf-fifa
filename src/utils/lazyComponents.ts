/**
 * Lazy Component Loading Utilities
 *
 * Centralizes dynamic imports for code splitting and lazy loading.
 * Groups components by feature for optimal chunk creation.
 */

import { lazy, ComponentType } from 'react';

/**
 * Retry wrapper for lazy imports
 * Retries failed imports up to 3 times with exponential backoff
 */
function lazyRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  name: string,
  retries = 3,
  interval = 1000,
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (retriesLeft: number) => {
        componentImport()
          .then(resolve)
          .catch(error => {
            if (retriesLeft === 0) {
              console.error(`Failed to load component: ${name}`, error);
              reject(error);
              return;
            }

            console.warn(`Retrying ${name}... (${retriesLeft} attempts left)`);
            setTimeout(
              () => {
                attemptImport(retriesLeft - 1);
              },
              interval * (retries - retriesLeft + 1),
            ); // Exponential backoff
          });
      };

      attemptImport(retries);
    });
  });
}

// ============================================================================
// CORE PAGES (Loaded on demand)
// ============================================================================

export const LandingPage = lazyRetry(() => import('../pages/LandingPage'), 'LandingPage');

export const LoginPage = lazyRetry(() => import('../pages/LoginPage'), 'LoginPage');

export const SignupPage = lazyRetry(() => import('../pages/SignupPage'), 'SignupPage');

// ============================================================================
// MAIN LAYOUT (Critical path)
// ============================================================================

export const Layout = lazyRetry(() => import('../components/Layout'), 'Layout');

export const DashboardPage = lazyRetry(() => import('../pages/DashboardPage'), 'DashboardPage');

// ============================================================================
// TACTICAL FEATURES (Heavy components - separate chunk)
// ============================================================================

export const TacticsBoardPage = lazyRetry(
  () => import('../pages/TacticsBoardPage'),
  'TacticsBoardPage',
);

export const OppositionAnalysisPage = lazyRetry(
  () => import('../pages/OppositionAnalysisPage'),
  'OppositionAnalysisPage',
);

// ============================================================================
// ANALYTICS & REPORTING (Separate chunk with Chart.js)
// ============================================================================

export const AnalyticsPage = lazyRetry(() => import('../pages/AnalyticsPage'), 'AnalyticsPage');

export const AdvancedAnalyticsPage = lazyRetry(
  () => import('../pages/AdvancedAnalyticsPage'),
  'AdvancedAnalyticsPage',
);

// ============================================================================
// PLAYER MANAGEMENT (Separate chunk)
// ============================================================================

export const PlayerProfilePage = lazyRetry(
  () => import('../pages/PlayerProfilePage'),
  'PlayerProfilePage',
);

export const MyPlayerRankingPage = lazyRetry(
  () => import('../pages/MyPlayerRankingPage'),
  'MyPlayerRankingPage',
);

export const TransfersPage = lazyRetry(() => import('../pages/TransfersPage'), 'TransfersPage');

// ============================================================================
// TRAINING & DEVELOPMENT (Separate chunk)
// ============================================================================

export const TrainingPage = lazyRetry(() => import('../pages/TrainingPage'), 'TrainingPage');

export const YouthAcademyPage = lazyRetry(
  () => import('../pages/YouthAcademyPage'),
  'YouthAcademyPage',
);

export const MentoringPage = lazyRetry(() => import('../pages/MentoringPage'), 'MentoringPage');

export const SkillChallengesPage = lazyRetry(
  () => import('../pages/SkillChallengesPage'),
  'SkillChallengesPage',
);

// ============================================================================
// CLUB MANAGEMENT (Separate chunk)
// ============================================================================

export const FinancesPage = lazyRetry(() => import('../pages/FinancesPage'), 'FinancesPage');

export const StaffPage = lazyRetry(() => import('../pages/StaffPage'), 'StaffPage');

export const StadiumPage = lazyRetry(() => import('../pages/StadiumPage'), 'StadiumPage');

export const SponsorshipsPage = lazyRetry(
  () => import('../pages/SponsorshipsPage'),
  'SponsorshipsPage',
);

// ============================================================================
// COMMUNICATION (Separate chunk)
// ============================================================================

export const InboxPage = lazyRetry(() => import('../pages/InboxPage'), 'InboxPage');

export const PressConferencePage = lazyRetry(
  () => import('../pages/PressConferencePage'),
  'PressConferencePage',
);

export const NewsFeedPage = lazyRetry(() => import('../pages/NewsFeedPage'), 'NewsFeedPage');

// ============================================================================
// LEAGUE & COMPETITION (Separate chunk)
// ============================================================================

export const LeagueTablePage = lazyRetry(
  () => import('../pages/LeagueTablePage'),
  'LeagueTablePage',
);

export const BoardObjectivesPage = lazyRetry(
  () => import('../pages/BoardObjectivesPage'),
  'BoardObjectivesPage',
);

export const JobSecurityPage = lazyRetry(
  () => import('../pages/JobSecurityPage'),
  'JobSecurityPage',
);

export const ClubHistoryPage = lazyRetry(
  () => import('../pages/ClubHistoryPage'),
  'ClubHistoryPage',
);

// ============================================================================
// HEALTH & WELLNESS (Separate chunk)
// ============================================================================

export const MedicalCenterPage = lazyRetry(
  () => import('../pages/MedicalCenterPage'),
  'MedicalCenterPage',
);

// ============================================================================
// SPECIAL FEATURES (Separate chunk)
// ============================================================================

export const InternationalManagementPage = lazyRetry(
  () => import('../pages/InternationalManagementPage'),
  'InternationalManagementPage',
);

export const ChallengeHubPage = lazyRetry(
  () => import('../pages/ChallengeHubPage'),
  'ChallengeHubPage',
);

export const CoachChallengeManagerPage = lazyRetry(
  () => import('../pages/CoachChallengeManagerPage'),
  'CoachChallengeManagerPage',
);

// ============================================================================
// SETTINGS (Loaded on demand)
// ============================================================================

export const SettingsPage = lazyRetry(() => import('../pages/SettingsPage'), 'SettingsPage');

// ============================================================================
// PRELOADING UTILITIES
// ============================================================================

/**
 * Preload components in the background
 * Call this after initial render to speed up future navigations
 */
export const preloadCriticalComponents = () => {
  // Preload likely next pages based on user flow
  const criticalComponents = [DashboardPage, TacticsBoardPage, AnalyticsPage, PlayerProfilePage];

  // Start preloading after a short delay (low priority)
  setTimeout(() => {
    criticalComponents.forEach(component => {
      // Trigger the import but don't wait for it
      // Type assertion needed to access internal _payload property
      (component as any)._payload?._result?.catch(() => {
        // Silently fail - will retry when actually needed
      });
    });
  }, 2000);
};

/**
 * Preload components based on route
 */
export const preloadRouteComponents = (route: string) => {
  const routePreloadMap: Record<string, Array<React.LazyExoticComponent<any>>> = {
    '/dashboard': [TacticsBoardPage, AnalyticsPage, PlayerProfilePage],
    '/tactics-board': [OppositionAnalysisPage, AnalyticsPage],
    '/analytics': [AdvancedAnalyticsPage, TacticsBoardPage],
    '/players': [PlayerProfilePage, TransfersPage, MyPlayerRankingPage],
    '/training': [TrainingPage, YouthAcademyPage, MentoringPage],
  };

  const componentsToPreload = routePreloadMap[route] || [];

  componentsToPreload.forEach(component => {
    // Low priority preload
    requestIdleCallback(() => {
      // Type assertion needed to access internal _payload property
      (component as any)._payload?._result?.catch(() => {});
    });
  });
};

/**
 * Check if a component is loaded
 */
export const isComponentLoaded = (component: React.LazyExoticComponent<any>): boolean => {
  // Type assertion needed to access internal _payload property
  return (component as any)._payload?._status === 1; // 1 = fulfilled
};

/**
 * Get loading progress
 */
export const getLoadingProgress = (components: Array<React.LazyExoticComponent<any>>): number => {
  const loaded = components.filter(isComponentLoaded).length;
  return (loaded / components.length) * 100;
};
