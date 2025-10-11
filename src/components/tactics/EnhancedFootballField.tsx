/**
 * Enhanced Football Field Component
 *
 * Professional football pitch with:
 * - Vertical orientation with proper aspect ratio
 * - Realistic grass texture and shading
 * - All FIFA-standard pitch markings
 * - 3D depth effects
 * - Animated elements
 */

import React from 'react';

export const FootballField: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Container - Fill entire space to match player positioning */}
      <div className="relative w-full h-full">
        {/* Main Field - Enhanced grass with realistic texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-800 via-green-700 to-green-800 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-4 border-green-900/30">
          
          {/* Multi-layered grass stripes for depth - VERTICAL stripes for horizontal field */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[repeating-linear-gradient(90deg,rgba(0,80,0,0.4)_0px,rgba(0,80,0,0.4)_35px,rgba(0,120,0,0.2)_35px,rgba(0,120,0,0.2)_70px)]" />
          </div>
          
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          
          {/* Shadow vignette for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
        </div>

        {/* Direction indicators */}
        <div className="absolute top-4 left-8 bg-blue-600/90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm border border-blue-400/30">
          ⬅️ DEFENDING
        </div>
        <div className="absolute top-4 right-8 bg-red-600/90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm border border-red-400/30">
          ATTACKING ➡️
        </div>

        {/* SVG for field markings - COMPENSATE FOR HORIZONTAL STRETCHING */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100">
        <defs>
          <style>
            {`.field-line { stroke: rgba(255,255,255,0.98); stroke-width: 0.35; fill: none; stroke-linecap: round; filter: drop-shadow(0 0 2px rgba(255,255,255,0.5)); }`}
            {`.field-line-bold { stroke: rgba(255,255,255,0.98); stroke-width: 0.45; fill: none; stroke-linecap: round; filter: drop-shadow(0 0 2px rgba(255,255,255,0.5)); }`}
            {`.goal-structure { stroke: rgba(230,230,230,0.95); stroke-width: 0.6; fill: rgba(255,255,255,0.08); }`}
            {`.goal-net { stroke: rgba(255,255,255,0.3); stroke-width: 0.18; }`}
          </style>

          {/* Gradient for goal depth */}
          <linearGradient id="goalDepth" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Outer boundary - PROPER SOCCER FIELD DIMENSIONS FOR 100x100 */}
        <rect x="2" y="2" width="96" height="96" className="field-line-bold" />

        {/* Halfway line - Bold (vertical for horizontal field) */}
        <line x1="50" y1="2" x2="50" y2="98" className="field-line-bold" />

        {/* Center circle */}
        <circle cx="50" cy="50" r="10" className="field-line" />
        <circle cx="50" cy="50" r="0.8" fill="white" opacity="0.95" filter="drop-shadow(0 0 3px rgba(255,255,255,0.8))" />

        {/* LEFT HALF (Attacking - Opponent's Goal) */}
        {/* Penalty area */}
        <rect x="2" y="25" width="20" height="50" className="field-line" />
        
        {/* Goal area (6-yard box) */}
        <rect x="2" y="38" width="8" height="24" className="field-line" />

        {/* Penalty spot with glow */}
        <circle cx="15" cy="50" r="0.6" fill="white" opacity="0.95" filter="drop-shadow(0 0 2px rgba(255,255,255,0.7))" />

        {/* Penalty arc */}
        <path d="M 22 35 Q 27 50, 22 65" className="field-line" fill="none" />

        {/* RIGHT HALF (Defending - Your Goal) */}
        {/* Penalty area */}
        <rect x="78" y="25" width="20" height="50" className="field-line" />
        
        {/* Goal area (6-yard box) */}
        <rect x="90" y="38" width="8" height="24" className="field-line" />

        {/* Penalty spot with glow */}
        <circle cx="85" cy="50" r="0.6" fill="white" opacity="0.95" filter="drop-shadow(0 0 2px rgba(255,255,255,0.7))" />

        {/* Penalty arc */}
        <path d="M 78 35 Q 73 50, 78 65" className="field-line" fill="none" />

        {/* Corner arcs - All four corners */}
        <path d="M 2 5 Q 2 2, 5 2" className="field-line" />
        <path d="M 95 2 Q 98 2, 98 5" className="field-line" />
        <path d="M 5 98 Q 2 98, 2 95" className="field-line" />
        <path d="M 98 95 Q 98 98, 95 98" className="field-line" />

        {/* LEFT GOAL (Attacking - Opponent's Goal) */}
        <g>
          {/* Goal depth background */}
          <rect x="0" y="42" width="2" height="16" fill="url(#goalDepth)" opacity="0.6" />
          
          {/* Goal mouth opening */}
          <rect x="0.5" y="42" width="1.5" height="16" className="goal-structure" />
          
          {/* Goal posts - thicker and more visible */}
          <line x1="0.5" y1="42" x2="2" y2="42" className="goal-structure" strokeWidth="0.7" />
          <line x1="0.5" y1="58" x2="2" y2="58" className="goal-structure" strokeWidth="0.7" />
          
          {/* Crossbar */}
          <line x1="0.5" y1="42" x2="0.5" y2="58" className="goal-structure" strokeWidth="0.7" />
          
          {/* Enhanced goal net - vertical lines */}
          <line x1="0.5" y1="44" x2="2" y2="44" className="goal-net" />
          <line x1="0.5" y1="47" x2="2" y2="47" className="goal-net" />
          <line x1="0.5" y1="50" x2="2" y2="50" className="goal-net" />
          <line x1="0.5" y1="52" x2="2" y2="52" className="goal-net" strokeWidth="0.22" />
          <line x1="0.5" y1="55" x2="2" y2="55" className="goal-net" />
          <line x1="0.5" y1="57" x2="2" y2="57" className="goal-net" />
          
          {/* Horizontal net lines */}
          <line x1="1" y1="42" x2="1" y2="58" className="goal-net" opacity="0.5" />
          <line x1="1.5" y1="42" x2="1.5" y2="58" className="goal-net" opacity="0.5" />
        </g>

        {/* RIGHT GOAL (Defending - Your Goal) */}
        <g>
          {/* Goal depth background */}
          <rect x="98" y="42" width="2" height="16" fill="url(#goalDepth)" opacity="0.6" />
          
          {/* Goal mouth opening */}
          <rect x="98.5" y="42" width="1.5" height="16" className="goal-structure" />
          
          {/* Goal posts - thicker and more visible */}
          <line x1="98" y1="42" x2="99.5" y2="42" className="goal-structure" strokeWidth="0.7" />
          <line x1="98" y1="58" x2="99.5" y2="58" className="goal-structure" strokeWidth="0.7" />
          
          {/* Crossbar */}
          <line x1="100" y1="42" x2="100" y2="58" className="goal-structure" strokeWidth="0.7" />
          
          {/* Enhanced goal net */}
          <line x1="98" y1="44" x2="99.5" y2="44" className="goal-net" />
          <line x1="98" y1="47" x2="99.5" y2="47" className="goal-net" />
          <line x1="98" y1="50" x2="99.5" y2="50" className="goal-net" />
          <line x1="98" y1="52" x2="99.5" y2="52" className="goal-net" strokeWidth="0.22" />
          <line x1="98" y1="55" x2="99.5" y2="55" className="goal-net" />
          <line x1="98" y1="57" x2="99.5" y2="57" className="goal-net" />
          
          {/* Horizontal net lines */}
          <line x1="98.5" y1="42" x2="98.5" y2="58" className="goal-net" opacity="0.5" />
          <line x1="99" y1="42" x2="99" y2="58" className="goal-net" opacity="0.5" />
        </g>
      </svg>
      </div>
    </div>
  );
};
