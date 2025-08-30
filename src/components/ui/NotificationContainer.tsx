
import React, { useCallback, useEffect, useState } from 'react';
import { useUIContext } from '../../hooks';
import { CloseIcon, CheckCircleIcon, AlertTriangleIcon, InfoIcon } from './icons';
import type { Notification } from '../../types';

const NOTIFICATION_ICONS: Record<Notification['type'], React.ReactNode> = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
    error: <AlertTriangleIcon className="w-6 h-6 text-red-400" />,
    info: <InfoIcon className="w-6 h-6 text-blue-400" />,
};

const NOTIFICATION_STYLES: Record<Notification['type'], string> = {
    success: 'border-green-500/50 bg-green-500/5',
    error: 'border-red-500/50 bg-red-500/5',
    info: 'border-blue-500/50 bg-blue-500/5',
};

const Toast: React.FC<{ notification: Notification }> = ({ notification }) => {
    const { dispatch } = useUIContext();
    const [isVisible, setIsVisible] = useState(false);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
        }, 300); // Animation duration
    }, [dispatch, notification.id]);

    useEffect(() => {
        setIsVisible(true);
        const timerId = setTimeout(() => {
            handleClose();
        }, notification.duration || 5000);

        return () => clearTimeout(timerId);
    }, [notification, handleClose]);

    return (
        <div 
            className={`relative w-full max-w-sm p-4 pr-10 rounded-lg shadow-2xl border-l-4 transition-all duration-300 ease-in-out bg-slate-800/80 backdrop-blur-md ${NOTIFICATION_STYLES[notification.type]} ${isVisible ? 'animate-toast-in' : 'animate-toast-out'}`}
        >
            <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">{NOTIFICATION_ICONS[notification.type]}</div>
                <p className="text-sm font-medium text-slate-200">{notification.message}</p>
            </div>
            <button 
                onClick={handleClose} 
                className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"
                aria-label="Close notification"
            >
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const NotificationContainer: React.FC = () => {
    const { uiState } = useUIContext();
    const { notifications } = uiState;

    return (
        <div className="fixed bottom-28 right-8 z-50 flex flex-col items-end space-y-3 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className="pointer-events-auto">
                    <Toast notification={n} />
                </div>
            ))}
        </div>
    );
};

export default NotificationContainer;
