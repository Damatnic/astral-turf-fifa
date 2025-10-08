import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  useTacticsContext,
  useUIContext,
  useFranchiseContext,
  useAuthContext,
  useResponsive,
  useResponsiveNavigation,
} from '../../hooks';
import {
  LogoIcon,
  ResetIcon,
  PresentationIcon,
  MoonIcon,
  SunIcon,
  PlayIcon,
  CogIcon,
  GridIcon,
} from './icons';
import { Button, IconButton } from './modern';
import { cn } from '../../utils/cn';
import type { TeamView, MatchEvent, MatchResult, MatchCommentary } from '../../types';
import { FileMenu } from './menus/FileMenu';
import { FranchiseMenu } from './menus/FranchiseMenu';
import { simulateMatch } from '../../services/simulationService';

const TeamToggleButton: React.FC<{
  view: TeamView;
  activeContext: TeamView;
  onClick: (view: TeamView) => void;
  children: React.ReactNode;
  variant: 'home' | 'away' | 'both';
}> = React.memo(({ view, activeContext, onClick, children, variant }) => {
  const isActive = activeContext === view;

  const variantClasses = {
    home: isActive
      ? 'bg-team-home-500 text-white shadow-glow-primary border-team-home-400'
      : 'text-team-home-300 hover:bg-team-home-500/20 border-team-home-600/50',
    away: isActive
      ? 'bg-team-away-500 text-white shadow-glow-accent border-team-away-400'
      : 'text-team-away-300 hover:bg-team-away-500/20 border-team-away-600/50',
    both: isActive
      ? 'bg-secondary-500 text-white shadow-medium border-secondary-400'
      : 'text-secondary-300 hover:bg-secondary-500/20 border-secondary-600/50',
  };

  return (
    <button
      onClick={() => onClick(view)}
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
        'border ',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
        'active:scale-95',
        variantClasses[variant],
      )}
    >
      {children}
    </button>
  );
});

// Mobile Hamburger Menu Icon
const HamburgerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

// Mobile Close Icon
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const Header: React.FC = React.memo(() => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const { franchiseState } = useFranchiseContext();
  const { dispatch: authDispatch } = useAuthContext();

  // Mobile-First Responsive State
  const responsive = useResponsive();
  const { shouldUseDrawer, shouldCollapse } = useResponsiveNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile, isTablet, currentBreakpoint } = responsive;

  const { players, formations, activeFormationIds } = tacticsState;
  const { activeTeamContext, isSimulatingMatch, activePlaybookItemId } = uiState;
  const { gameWeek } = franchiseState;
  const location = useLocation();

  const handleTeamContextChange = (view: TeamView) => {
    uiDispatch({ type: 'SET_ACTIVE_TEAM_CONTEXT', payload: view });
  };

  const handlePresentationMode = () => {
    if (!activePlaybookItemId) {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Select a play from the playbook to enter presentation mode.',
          type: 'info',
        },
      });
      return;
    }
    uiDispatch({ type: 'ENTER_PRESENTATION_MODE' });
  };

  const handleSimulateMatch = async () => {
    const homeFormation = formations[activeFormationIds.home];
    const awayFormation = formations[activeFormationIds.away];
    const homePlayerIds = new Set(homeFormation.slots.map(s => s.playerId).filter(Boolean));
    const awayPlayerIds = new Set(awayFormation.slots.map(s => s.playerId).filter(Boolean));

    if (homePlayerIds.size !== 11 || awayPlayerIds.size !== 11) {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Both teams must have 11 players on the field to start a simulation.',
          type: 'error',
        },
      });
      return;
    }

    uiDispatch({ type: 'OPEN_MODAL', payload: 'matchSimulator' });
  };

  const isTacticsPage = location.pathname === '/tactics';

  const handleLogout = () => {
    authDispatch({ type: 'LOGOUT' });
  };

  return (
    <>
      {/* Modern Responsive Header */}
      <header
        className={cn(
          'flex-shrink-0 backdrop-blur-xl border-b shadow-lg relative z-50',
          'bg-secondary-900/80 border-secondary-700/50',
          'supports-[backdrop-filter]:bg-secondary-900/60',
          isMobile ? 'h-14 px-3' : 'h-16 px-6',
          'flex items-center justify-between',
          'transition-all duration-300',
        )}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-accent-500/5" />

        {/* Mobile Navigation Toggle + Logo */}
        <div className="flex items-center space-x-3 relative z-10">
          {shouldUseDrawer && (
            <IconButton
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="ghost"
              size="sm"
              aria-label="Toggle navigation menu"
              icon={
                mobileMenuOpen ? (
                  <CloseIcon className="w-5 h-5" />
                ) : (
                  <HamburgerIcon className="w-5 h-5" />
                )
              }
              className="text-secondary-300 hover:text-white hover:bg-secondary-700/50"
            />
          )}

          {/* Enhanced Logo */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <LogoIcon
                className={cn('text-primary-400 drop-shadow-sm', isMobile ? 'w-6 h-6' : 'w-8 h-8')}
              />
              <div className="absolute inset-0 text-primary-400 blur-sm opacity-50">
                <LogoIcon className={isMobile ? 'w-6 h-6' : 'w-8 h-8'} />
              </div>
            </div>
            <h1
              className={cn(
                'font-bold tracking-wider text-white',
                isMobile ? 'text-lg' : 'text-xl',
                'drop-shadow-sm',
              )}
            >
              <span className="text-primary-400">Astral</span>
              <span className="text-white">Turf</span>
            </h1>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          {!shouldUseDrawer && (
            <div className="flex items-center space-x-2 ml-6">
              <FileMenu />
              <FranchiseMenu />

              <Link
                to="/tactics"
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  'text-secondary-300 hover:text-white hover:bg-secondary-700/50',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                  ' border border-transparent hover:border-secondary-600/50',
                )}
                title="Go to Tactics Board"
                data-testid="header-tactics-button"
              >
                <GridIcon className="w-4 h-4 mr-2" />
                Tactics
              </Link>

              {isTacticsPage && (
                <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-secondary-700/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to reset the current tactic board? This will reset player positions and drawings.',
                        )
                      ) {
                        dispatch({ type: 'SOFT_RESET_APP' });
                      }
                    }}
                    leftIcon={<ResetIcon className="w-4 h-4" />}
                    className="text-secondary-300 hover:text-white"
                  >
                    Reset
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      dispatch({ type: 'ADVANCE_WEEK' });
                      uiDispatch({
                        type: 'ADD_NOTIFICATION',
                        payload: { message: `Advanced to Week ${gameWeek + 1}`, type: 'info' },
                      });
                    }}
                    leftIcon={<PlayIcon className="w-4 h-4" />}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-glow-accent"
                  >
                    {isTablet ? 'Week' : 'Advance Week'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Team Toggle */}
        {isTacticsPage && !shouldUseDrawer && (
          <div className="flex items-center space-x-1 bg-secondary-800/50  p-1 rounded-xl border border-secondary-700/50 shadow-soft">
            <TeamToggleButton
              view="home"
              activeContext={activeTeamContext}
              onClick={handleTeamContextChange}
              variant="home"
            >
              {isMobile ? 'H' : 'Home'}
            </TeamToggleButton>
            <TeamToggleButton
              view="away"
              activeContext={activeTeamContext}
              onClick={handleTeamContextChange}
              variant="away"
            >
              {isMobile ? 'A' : 'Away'}
            </TeamToggleButton>
            <TeamToggleButton
              view="both"
              activeContext={activeTeamContext}
              onClick={handleTeamContextChange}
              variant="both"
            >
              {isMobile ? 'B' : 'Both'}
            </TeamToggleButton>
          </div>
        )}

        {/* Enhanced Right Side Actions */}
        <div className="flex items-center space-x-2 relative z-10">
          {/* Mobile Essential Actions */}
          {isMobile && isTacticsPage && (
            <IconButton
              onClick={handleSimulateMatch}
              disabled={isSimulatingMatch}
              variant="primary"
              size="sm"
              icon={<PlayIcon className="w-4 h-4" />}
              aria-label="Simulate Match"
              className="bg-gradient-to-r from-success-600 to-success-500 hover:from-success-500 hover:to-success-400 shadow-glow-primary"
            />
          )}

          {/* Desktop Actions */}
          {!shouldUseDrawer && isTacticsPage && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSimulateMatch}
                disabled={isSimulatingMatch}
                variant="primary"
                size="sm"
                leftIcon={<PlayIcon className="w-4 h-4" />}
                className="bg-gradient-to-r from-success-600 to-success-500 hover:from-success-500 hover:to-success-400 shadow-glow-primary"
              >
                {isSimulatingMatch ? 'Simulating...' : 'Simulate Match'}
              </Button>

              <Button
                onClick={handlePresentationMode}
                variant="ghost"
                size="sm"
                leftIcon={<PresentationIcon className="w-4 h-4" />}
                className="text-secondary-300 hover:text-white"
              >
                Present
              </Button>
            </div>
          )}

          {/* Global Actions */}
          <div className="flex items-center space-x-1">
            <IconButton
              onClick={() => uiDispatch({ type: 'TOGGLE_THEME' })}
              variant="ghost"
              size="sm"
              icon={
                uiState.theme === 'dark' ? (
                  <SunIcon className="w-4 h-4" />
                ) : (
                  <MoonIcon className="w-4 h-4" />
                )
              }
              aria-label="Toggle Theme"
              className="text-secondary-300 hover:text-accent-400 hover:bg-secondary-700/50"
            />

            {!shouldUseDrawer && (
              <>
                <IconButton
                  as={Link}
                  to="/settings"
                  variant="ghost"
                  size="sm"
                  icon={<CogIcon className="w-4 h-4" />}
                  aria-label="Settings"
                  className="text-secondary-300 hover:text-white hover:bg-secondary-700/50"
                />

                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-secondary-300 hover:text-error-400"
                >
                  Logout
                </Button>
              </>
            )}

            {/* Mobile Settings */}
            {shouldUseDrawer && (
              <IconButton
                as={Link}
                to="/settings"
                variant="ghost"
                size="sm"
                icon={<CogIcon className="w-4 h-4" />}
                aria-label="Settings"
                className="text-secondary-300 hover:text-white hover:bg-secondary-700/50"
              />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {shouldUseDrawer && (
        <>
          {/* Mobile Drawer Overlay */}
          {mobileMenuOpen && (
            <div
              className="mobile-drawer-overlay visible"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Mobile Navigation Drawer */}
          <nav className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-safe-area p-4">
              {/* Mobile Navigation Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center space-x-2">
                  <LogoIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">
                    <span className="text-[var(--accent-primary)]">Astral</span>Turf
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-mobile p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className="flex items-center px-3 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tactics"
                  className="flex items-center px-3 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <GridIcon className="w-5 h-5 mr-3" />
                  Tactics Board
                </Link>

                {/* Mobile-Only Actions */}
                {isTacticsPage && (
                  <>
                    <div className="border-t border-[var(--border-primary)] my-4"></div>

                    {/* Team Context Toggle for Mobile */}
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Team View
                      </p>
                      <div className="flex space-x-1">
                        <TeamToggleButton
                          view="home"
                          activeContext={activeTeamContext}
                          onClick={view => {
                            handleTeamContextChange(view);
                            setMobileMenuOpen(false);
                          }}
                          variant="home"
                        >
                          Home
                        </TeamToggleButton>
                        <TeamToggleButton
                          view="away"
                          activeContext={activeTeamContext}
                          onClick={view => {
                            handleTeamContextChange(view);
                            setMobileMenuOpen(false);
                          }}
                          variant="away"
                        >
                          Away
                        </TeamToggleButton>
                        <TeamToggleButton
                          view="both"
                          activeContext={activeTeamContext}
                          onClick={view => {
                            handleTeamContextChange(view);
                            setMobileMenuOpen(false);
                          }}
                          variant="both"
                        >
                          Both
                        </TeamToggleButton>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to reset the current tactic board? This will reset player positions and drawings.',
                          )
                        ) {
                          dispatch({ type: 'SOFT_RESET_APP' });
                        }
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center px-3 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors w-full"
                    >
                      <ResetIcon className="w-5 h-5 mr-3" />
                      Reset Board
                    </button>

                    <button
                      onClick={() => {
                        handlePresentationMode();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center px-3 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors w-full"
                    >
                      <PresentationIcon className="w-5 h-5 mr-3" />
                      Presentation Mode
                    </button>

                    <button
                      onClick={() => {
                        handleSimulateMatch();
                        setMobileMenuOpen(false);
                      }}
                      disabled={isSimulatingMatch}
                      className="flex items-center px-3 py-3 text-base font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors w-full disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      <PlayIcon className="w-5 h-5 mr-3" />
                      {isSimulatingMatch ? 'Simulating...' : 'Simulate Match'}
                    </button>
                  </>
                )}

                <div className="border-t border-[var(--border-primary)] my-4"></div>

                <button
                  onClick={() => {
                    dispatch({ type: 'ADVANCE_WEEK' });
                    uiDispatch({
                      type: 'ADD_NOTIFICATION',
                      payload: { message: `Advanced to Week ${gameWeek + 1}`, type: 'info' },
                    });
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-3 text-base font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors w-full"
                >
                  <PlayIcon className="w-5 h-5 mr-3" />
                  Advance to Week {gameWeek + 1}
                </button>

                <Link
                  to="/settings"
                  className="flex items-center px-3 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <CogIcon className="w-5 h-5 mr-3" />
                  Settings
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-3 text-base font-medium text-red-400 hover:bg-red-950 rounded-lg transition-colors w-full"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
});
