

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTacticsContext, useUIContext, useFranchiseContext, useAuthContext, useResponsive, useResponsiveNavigation } from '../../hooks';
import { LogoIcon, ResetIcon, PresentationIcon, MoonIcon, SunIcon, PlayIcon, CogIcon, GridIcon } from './icons';
import type { TeamView, MatchEvent, MatchResult, MatchCommentary } from '../../types';
import { FileMenu } from './menus/FileMenu';
import { FranchiseMenu } from './menus/FranchiseMenu';
import { simulateMatch } from '../../services/simulationService';

const TeamToggleButton: React.FC<{
    view: TeamView,
    activeContext: TeamView,
    onClick: (view: TeamView) => void,
    children: React.ReactNode,
    className: string,
}> = React.memo(({ view, activeContext, onClick, children, className}) => (
    <button
        onClick={() => onClick(view)}
        className={`px-3 py-1 rounded-md text-sm font-semibold transition-all duration-200 ${
            activeContext === view
            ? `shadow-md text-white ${className}`
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
        }`}
    >
        {children}
    </button>
));

// Mobile Hamburger Menu Icon
const HamburgerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Select a play from the playbook to enter presentation mode.', type: 'info' } });
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
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Both teams must have 11 players on the field to start a simulation.', type: 'error' } });
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
            {/* Mobile-First Responsive Header */}
            <header className={`
                flex-shrink-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] shadow-sm
                ${isMobile ? 'h-14' : 'h-16'}
                flex items-center justify-between
                ${isMobile ? 'px-3' : 'px-4'}
            `}>
                {/* Mobile Navigation Toggle + Logo */}
                <div className="flex items-center space-x-2">
                    {shouldUseDrawer && (
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`
                                btn-mobile p-2 rounded-lg
                                text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]
                                transition-colors duration-200
                            `}
                            aria-label="Toggle navigation menu"
                        >
                            {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <HamburgerIcon className="w-5 h-5" />}
                        </button>
                    )}

                    {/* Logo - Responsive Size */}
                    <LogoIcon className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-[var(--accent-primary)]`} />
                    <h1 className={`
                        font-bold tracking-wider text-[var(--text-primary)]
                        ${isMobile ? 'text-lg' : 'text-xl'}
                    `}>
                        <span className="text-[var(--accent-primary)]">Astral</span>Turf
                    </h1>

                    {/* Desktop Navigation - Hidden on Mobile */}
                    {!shouldUseDrawer && (
                        <div className="flex items-center space-x-2 ml-4">
                            <FileMenu />
                            <FranchiseMenu />
                            <Link
                                to="/tactics"
                                className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                                title="Go to Tactics Board"
                                data-testid="header-tactics-button"
                            >
                                <GridIcon className="w-4 h-4 mr-2" />
                                Tactics
                            </Link>
                            {isTacticsPage && (
                                <>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to reset the current tactic board? This will reset player positions and drawings.')) {
                                                dispatch({ type: 'SOFT_RESET_APP' });
                                            }
                                        }}
                                        className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                                        title="Reset tactic board"
                                    >
                                        <ResetIcon className="w-4 h-4 mr-2" />
                                        Reset
                                    </button>
                                    <button
                                        onClick={() => {
                                            dispatch({type: 'ADVANCE_WEEK'});
                                            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Advanced to Week ${gameWeek + 1}`, type: 'info' } });
                                        }}
                                        className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
                                        title="Advance to next week"
                                    >
                                        <PlayIcon className="w-4 h-4 mr-2" />
                                        {isTablet ? 'Week' : 'Advance Week'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Tactics Team Toggle - Responsive */}
                {isTacticsPage && !shouldUseDrawer && (
                    <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-lg">
                        <TeamToggleButton view="home" activeContext={activeTeamContext} onClick={handleTeamContextChange} className="bg-blue-600">
                            {isMobile ? 'H' : 'Home'}
                        </TeamToggleButton>
                        <TeamToggleButton view="away" activeContext={activeTeamContext} onClick={handleTeamContextChange} className="bg-red-600">
                            {isMobile ? 'A' : 'Away'}
                        </TeamToggleButton>
                        <TeamToggleButton view="both" activeContext={activeTeamContext} onClick={handleTeamContextChange} className="bg-gray-600">
                            {isMobile ? 'B' : 'Both'}
                        </TeamToggleButton>
                    </div>
                )}

                {/* Right Side Actions - Mobile Optimized */}
                <div className="flex items-center space-x-1">
                    {/* Mobile-Only Essential Actions */}
                    {isMobile && isTacticsPage && (
                        <button
                            onClick={handleSimulateMatch}
                            disabled={isSimulatingMatch}
                            className="btn-mobile bg-green-600 hover:bg-green-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            title="Simulate Match"
                        >
                            <PlayIcon className="w-4 h-4" />
                        </button>
                    )}

                    {/* Desktop Actions - Hidden on Mobile */}
                    {!shouldUseDrawer && isTacticsPage && (
                        <>
                            <button onClick={handleSimulateMatch} disabled={isSimulatingMatch} className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" title="Simulate Match">
                                <PlayIcon className="w-4 h-4 mr-2" />
                                {isSimulatingMatch ? 'Simulating...' : 'Simulate Match'}
                            </button>
                            <button onClick={handlePresentationMode} className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors" title="Presentation Mode">
                                <PresentationIcon className="w-4 h-4 mr-2" />
                                Present
                            </button>
                        </>
                    )}

                    {/* Always Visible Actions - Mobile Optimized */}
                    <button
                        onClick={() => uiDispatch({type: 'TOGGLE_THEME'})}
                        className={`
                            btn-mobile text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors
                            ${isMobile ? 'p-2' : 'px-3 py-2'}
                        `}
                        title="Toggle Theme"
                    >
                        {uiState.theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                    </button>

                    {!shouldUseDrawer && (
                        <>
                            <Link
                                to="/settings"
                                className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                                title="Settings"
                            >
                                <CogIcon className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    )}

                    {/* Mobile Settings Icon */}
                    {shouldUseDrawer && (
                        <Link
                            to="/settings"
                            className="btn-mobile p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Settings"
                        >
                            <CogIcon className="w-5 h-5" />
                        </Link>
                    )}
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
                                            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Team View</p>
                                            <div className="flex space-x-1">
                                                <TeamToggleButton view="home" activeContext={activeTeamContext} onClick={(view) => { handleTeamContextChange(view); setMobileMenuOpen(false); }} className="bg-blue-600 flex-1 text-center">
                                                    Home
                                                </TeamToggleButton>
                                                <TeamToggleButton view="away" activeContext={activeTeamContext} onClick={(view) => { handleTeamContextChange(view); setMobileMenuOpen(false); }} className="bg-red-600 flex-1 text-center">
                                                    Away
                                                </TeamToggleButton>
                                                <TeamToggleButton view="both" activeContext={activeTeamContext} onClick={(view) => { handleTeamContextChange(view); setMobileMenuOpen(false); }} className="bg-gray-600 flex-1 text-center">
                                                    Both
                                                </TeamToggleButton>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to reset the current tactic board? This will reset player positions and drawings.')) {
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
                                        dispatch({type: 'ADVANCE_WEEK'});
                                        uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Advanced to Week ${gameWeek + 1}`, type: 'info' } });
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
                                    className="flex items-center px-3 py-3 text-base font-medium text-red-400 hover:bg-red-900/20 rounded-lg transition-colors w-full"
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