import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon } from '../components/ui/icons';
import { useResponsive } from '../hooks';

const LandingPage: React.FC = () => {
  const responsive = useResponsive();
  const { isMobile, isTablet, currentBreakpoint } = responsive;

  useEffect(() => {
    document.body.classList.add('auth-bg');
    return () => {
        document.body.classList.remove('auth-bg');
    };
  }, []);

  return (
    <div className={`
      mobile-full-height mobile-safe-area w-screen 
      flex flex-col items-center justify-center
      ${isMobile ? 'mobile-p-3' : 'p-4'}
    `}>
      {/* Mobile-First Hero Content */}
      <div className={`
        text-center animate-fade-in-scale
        ${isMobile ? 'max-w-sm' : isTablet ? 'max-w-lg' : 'max-w-xl'}
        w-full
      `}>
        {/* Responsive Logo */}
        <LogoIcon className={`
          mx-auto text-teal-400
          ${isMobile ? 'w-16 h-16' : isTablet ? 'w-20 h-20' : 'w-24 h-24'}
        `} />
        
        {/* Mobile-First Typography */}
        <h1 className={`
          font-bold tracking-wider text-white mt-4
          ${isMobile ? 'text-3xl' : isTablet ? 'text-4xl' : 'text-5xl'}
        `}>
            <span className="text-teal-400">Astral</span>Turf
        </h1>
        
        {/* Responsive Description */}
        <p className={`
          text-slate-400 mt-3 mx-auto leading-relaxed
          ${isMobile ? 'text-base px-2' : isTablet ? 'text-lg' : 'text-lg max-w-xl'}
        `}>
          {isMobile 
            ? "AI-powered soccer tactical planner. Create formations, manage players, and get intelligent insights."
            : "Your AI-powered soccer tactical planner and franchise simulator. Visualize formations, manage players, and get AI-driven insights."
          }
        </p>
      </div>

      {/* Mobile-First Action Buttons */}
      <div className={`
        mt-8 w-full max-w-sm
        ${isMobile ? 'mobile-grid mobile-grid-1 gap-3' : 'flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6'}
      `}>
        <Link
          to="/login"
          className={`
            btn-mobile bg-teal-600 hover:bg-teal-500 active:bg-teal-700
            text-white font-bold rounded-lg transition-all duration-200
            flex items-center justify-center
            ${isMobile ? 'text-base py-4' : 'px-8 py-3 text-lg'}
            ${isMobile ? '' : 'transform hover:scale-105'}
          `}
        >
          Login
        </Link>
        <Link
          to="/signup"
          className={`
            btn-mobile bg-slate-700 hover:bg-slate-600 active:bg-slate-800
            text-white font-bold rounded-lg transition-all duration-200
            flex items-center justify-center
            ${isMobile ? 'text-base py-4' : 'px-8 py-3 text-lg'}
            ${isMobile ? '' : 'transform hover:scale-105'}
          `}
        >
          Sign Up
        </Link>
      </div>

      {/* Mobile-Friendly Features Preview */}
      {!isMobile && (
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl text-center">
          <div className="p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-teal-600/20 rounded-full flex items-center justify-center">
              <span className="text-teal-400 text-xl">⚽</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Tactical Planning</h3>
            <p className="text-sm text-slate-400">Create and visualize soccer formations with drag-and-drop interface</p>
          </div>
          <div className="p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-teal-600/20 rounded-full flex items-center justify-center">
              <span className="text-teal-400 text-xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Insights</h3>
            <p className="text-sm text-slate-400">Get intelligent suggestions for formations and player positioning</p>
          </div>
          <div className="p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-teal-600/20 rounded-full flex items-center justify-center">
              <span className="text-teal-400 text-xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Team Management</h3>
            <p className="text-sm text-slate-400">Manage players, track performance, and simulate matches</p>
          </div>
        </div>
      )}
      
      {/* Mobile-Only Quick Features */}
      {isMobile && (
        <div className="mt-8 w-full max-w-sm">
          <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
            <h3 className="text-center text-white font-semibold mb-3">Key Features</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
                <span>Drag & drop tactical formations</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
                <span>AI-powered insights & suggestions</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
                <span>Player management & analytics</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
                <span>Match simulation & training</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;