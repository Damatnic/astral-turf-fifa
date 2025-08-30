import React, { lazy, Suspense } from 'react';
import { useAuthContext, useFranchiseContext, useUIContext } from '../hooks';
import { LoadingSpinner } from '../components/ui/icons';

// Lazy load role-specific dashboard components
const CoachDashboard = lazy(() => import('../components/dashboards/CoachDashboard'));
const PlayerDashboard = lazy(() => import('../components/dashboards/PlayerDashboard'));
const FamilyDashboard = lazy(() => import('../components/dashboards/FamilyDashboard'));

const DashboardPage: React.FC = () => {
    const { authState } = useAuthContext();
    const { franchiseState } = useFranchiseContext();
    const { uiState } = useUIContext();

    if (!authState.user) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
                <LoadingSpinner className="w-12 h-12 text-teal-400" />
            </div>
        );
    }

    // Route to appropriate dashboard based on user role
    const renderDashboard = () => {
        switch (authState.user?.role) {
            case 'coach':
                return <CoachDashboard />;
            case 'player':
                return <PlayerDashboard />;
            case 'family':
                return <FamilyDashboard />;
            default:
                return (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
                        <div className="text-center">
                            <div className="text-red-400 text-lg mb-2">Unknown User Role</div>
                            <div className="text-[var(--text-secondary)]">
                                Unable to determine dashboard for role: {authState.user?.role}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Suspense
            fallback={
                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
                    <LoadingSpinner className="w-12 h-12 text-teal-400" />
                </div>
            }
        >
            {renderDashboard()}
        </Suspense>
    );
};

export default DashboardPage;