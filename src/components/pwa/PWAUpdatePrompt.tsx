/**
 * PWA Update Prompt Component
 * Notifies users when a new version is available
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '../../utils/pwaUtils';

interface PWAUpdatePromptProps {
  className?: string;
}

export const PWAUpdatePrompt: React.FC<PWAUpdatePromptProps> = ({ className = '' }) => {
  const { hasUpdate, updateApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (hasUpdate) {
      setIsVisible(true);
    }
  }, [hasUpdate]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    await updateApp();
    // The app will reload automatically
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !hasUpdate) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl shadow-2xl transform transition-all duration-500 ${className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="text-lg font-bold">Update Available</h3>
          </div>

          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss update notification"
            disabled={isUpdating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm mb-4 opacity-90">
          A new version of Astral Turf is available! Update now to get the latest features and
          improvements.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-white text-green-600 py-2.5 px-5 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            aria-label="Update application now"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Update Now
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            disabled={isUpdating}
            className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Update later"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
