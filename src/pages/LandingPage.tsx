import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon } from '../../components/ui/icons';

const LandingPage: React.FC = () => {
  useEffect(() => {
    document.body.classList.add('auth-bg');
    return () => {
        document.body.classList.remove('auth-bg');
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4">
      <div className="text-center animate-fade-in-scale">
        <LogoIcon className="w-24 h-24 mx-auto text-teal-400" />
        <h1 className="text-5xl font-bold mt-4 tracking-wider text-white">
            <span className="text-teal-400">Astral</span>Turf
        </h1>
        <p className="text-lg text-slate-400 mt-2 max-w-xl mx-auto">
          Your AI-powered soccer tactical planner and franchise simulator. Visualize formations, manage players, and get AI-driven insights.
        </p>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
        <Link
          to="/login"
          className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;