/**
 * PWA Install Prompt Component
 * Beautiful, accessible installation prompt for Progressive Web App
 * Supports iOS, Android, and Desktop installation flows
 */

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Info } from 'lucide-react';
import { usePWA } from '../../utils/pwaUtils';

interface PWAInstallPromptProps {
  autoShow?: boolean;
  delay?: number;
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  autoShow = true,
  delay = 3000,
  className = '',
}) => {
  const { isInstallable, isInstalled, isStandalone, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);

  useEffect(() => {
    // Detect iOS and Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    setIsIOSDevice(isIOS);
    setIsAndroidDevice(isAndroid);

    // Check if prompt was previously dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissed > 7) {
        localStorage.removeItem('pwa-prompt-dismissed');
      } else {
        setIsDismissed(true);
        return undefined;
      }
    }

    // Auto show after delay if conditions are met
    if (autoShow && !isInstalled && !isStandalone) {
      const timer = setTimeout(() => {
        if (isInstallable || isIOS) {
          setIsVisible(true);
        }
      }, delay);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [autoShow, delay, isInstallable, isInstalled, isStandalone]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
      localStorage.setItem('pwa-installed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  // Don't show if already installed, dismissed, or in standalone mode
  if (!isVisible || isDismissed || isInstalled || isStandalone) {
    return null;
  }

  // iOS Install Instructions Component
  if (isIOSDevice) {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl transform transition-transform duration-500 ${className}`}
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="w-6 h-6" />
                <h3 id="pwa-install-title" className="text-lg font-bold">
                  Install Astral Turf
                </h3>
              </div>

              <p id="pwa-install-description" className="text-sm mb-4 opacity-90">
                Get the best experience! Install our app for offline access, faster loading, and
                home screen convenience.
              </p>

              <div className="bg-slate-800  rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  iOS Installation Steps:
                </p>
                <ol className="text-xs space-y-1 ml-6 list-decimal">
                  <li>Tap the Share button (square with arrow) in Safari</li>
                  <li>Scroll down and tap &ldquo;Add to Home Screen&rdquo;</li>
                  <li>Tap &ldquo;Add&rdquo; to confirm</li>
                </ol>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="ml-4 p-2 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard install prompt for Android/Desktop
  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl transform transition-all duration-500 ${className}`}
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {isAndroidDevice ? (
              <Smartphone className="w-8 h-8" />
            ) : (
              <Monitor className="w-8 h-8" />
            )}
            <h3 id="pwa-install-title" className="text-xl font-bold">
              Install Astral Turf
            </h3>
          </div>

          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p id="pwa-install-description" className="text-sm mb-6 opacity-90 leading-relaxed">
          Install our app for the best experience! Enjoy faster loading, offline access, and the
          convenience of launching from your home screen or desktop.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="bg-slate-800  rounded-lg p-3">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-xs">Faster</div>
          </div>
          <div className="bg-slate-800  rounded-lg p-3">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-xs">Offline</div>
          </div>
          <div className="bg-slate-800  rounded-lg p-3">
            <div className="text-2xl mb-1">🔔</div>
            <div className="text-xs">Notifications</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-white text-purple-600 py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            aria-label="Install Astral Turf application"
          >
            <Download className="w-5 h-5" />
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-6 py-3 bg-slate-800  rounded-xl font-semibold hover:bg-slate-700 transition-colors"
            aria-label="Maybe later"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
