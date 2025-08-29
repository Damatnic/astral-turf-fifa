import React from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import CoachDashboard from '../components/dashboards/CoachDashboard';
import PlayerDashboard from '../components/dashboards/PlayerDashboard';

const DashboardPage: React.FC = () => {
    const { authState } = useAuthContext();

    if (!authState.user) {
        return <div>Loading...</div>;
    }

    if (authState.user.role === 'coach') {
        return <CoachDashboard />;
    }

    if (authState.user.role === 'player') {
        return <PlayerDashboard />;
    }

    return <div>Invalid user role.</div>;
};

export default DashboardPage;
