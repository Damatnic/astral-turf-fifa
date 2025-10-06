/**
 * Offline Indicator Component
 * Shows network status and offline capabilities
 */

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle, Cloud } from 'lucide-react';
import { usePWA } from '../../utils/pwaUtils';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showWhenOnline = false,
}) => {
  const { isOnline, connectionType } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    // Show indicator when offline or on slow connection
    setIsVisible(!isOnline || connectionType === 'slow');

    // Show temporary notification when coming back online
    if (isOnline && !justCameOnline) {
      setJustCameOnline(true);
      const timer = setTimeout(() => {
        setJustCameOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isOnline, connectionType, justCameOnline]);

  // Show when online if requested
  if (isOnline && showWhenOnline && !justCameOnline) {
    return (
      <div
        className={`fixed top-4 right-4 z-40 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${className}`}
        role="status"
        aria-live="polite"
      >
        <Cloud className="w-4 h-4" />
        <span className="text-sm font-medium">Online</span>
      </div>
    );
  }

  // Don't show if online and not requested to show
  if (!isVisible && !justCameOnline) {
    return null;
  }

  // Just came back online notification
  if (justCameOnline && isOnline) {
    return (
      <div
        className={`fixed top-4 right-4 z-40 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-500 ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Back Online</p>
            <p className="text-xs opacity-90">Syncing your data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Offline or slow connection indicator
  return (
    <div
      className={`fixed top-4 right-4 z-40 ${
        connectionType === 'slow' ? 'bg-yellow-600' : 'bg-red-600'
      } text-white px-4 py-3 rounded-lg shadow-lg ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          {connectionType === 'slow' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">
            {connectionType === 'slow' ? 'Slow Connection' : 'Offline Mode'}
          </p>
          <p className="text-xs opacity-90">
            {connectionType === 'slow'
              ? 'Using cached data for better performance'
              : 'Your changes will sync when reconnected'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
