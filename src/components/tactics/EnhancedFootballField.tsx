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

        {/* SVG for field markings - HORIZONTAL PITCH - PROPER SOCCER FIELD PROPORTIONS */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 150 100">
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

        {/* Outer boundary - PROPER SOCCER FIELD DIMENSIONS */}
        <rect x="3" y="3" width="144" height="94" className="field-line-bold" />

        {/* Halfway line - Bold (vertical for horizontal field) */}
        <line x1="75" y1="3" x2="75" y2="97" className="field-line-bold" />

        {/* Center circle */}
        <circle cx="75" cy="50" r="15" className="field-line" />
        <circle cx="75" cy="50" r="1.2" fill="white" opacity="0.95" filter="drop-shadow(0 0 3px rgba(255,255,255,0.8))" />

        {/* LEFT HALF (Attacking - Opponent's Goal) */}
        {/* Penalty area */}
        <rect x="3" y="25" width="30" height="50" className="field-line" />
        
        {/* Goal area (6-yard box) */}
        <rect x="3" y="38" width="12" height="24" className="field-line" />

        {/* Penalty spot with glow */}
        <circle cx="22" cy="50" r="0.8" fill="white" opacity="0.95" filter="drop-shadow(0 0 2px rgba(255,255,255,0.7))" />

        {/* Penalty arc */}
        <path d="M 33 35 Q 38 50, 33 65" className="field-line" fill="none" />

        {/* RIGHT HALF (Defending - Your Goal) */}
        {/* Penalty area */}
        <rect x="117" y="25" width="30" height="50" className="field-line" />
        
        {/* Goal area (6-yard box) */}
        <rect x="135" y="38" width="12" height="24" className="field-line" />

        {/* Penalty spot with glow */}
        <circle cx="128" cy="50" r="0.8" fill="white" opacity="0.95" filter="drop-shadow(0 0 2px rgba(255,255,255,0.7))" />

        {/* Penalty arc */}
        <path d="M 117 35 Q 112 50, 117 65" className="field-line" fill="none" />

        {/* Corner arcs - All four corners */}
        <path d="M 3 6 Q 3 3, 6 3" className="field-line" />
        <path d="M 144 3 Q 147 3, 147 6" className="field-line" />
        <path d="M 6 97 Q 3 97, 3 94" className="field-line" />
        <path d="M 147 94 Q 147 97, 144 97" className="field-line" />

        {/* LEFT GOAL (Attacking - Opponent's Goal) */}
        <g>
          {/* Goal depth background */}
          <rect x="0" y="42" width="3" height="16" fill="url(#goalDepth)" opacity="0.6" />
          
          {/* Goal mouth opening */}
          <rect x="1" y="42" width="2" height="16" className="goal-structure" />
          
          {/* Goal posts - thicker and more visible */}
          <line x1="1" y1="42" x2="3" y2="42" className="goal-structure" strokeWidth="0.7" />
          <line x1="1" y1="58" x2="3" y2="58" className="goal-structure" strokeWidth="0.7" />
          
          {/* Crossbar */}
          <line x1="1" y1="42" x2="1" y2="58" className="goal-structure" strokeWidth="0.7" />
          
          {/* Enhanced goal net - vertical lines */}
          <line x1="1" y1="44" x2="3" y2="44" className="goal-net" />
          <line x1="1" y1="47" x2="3" y2="47" className="goal-net" />
          <line x1="1" y1="50" x2="3" y2="50" className="goal-net" />
          <line x1="1" y1="52" x2="3" y2="52" className="goal-net" strokeWidth="0.22" />
          <line x1="1" y1="55" x2="3" y2="55" className="goal-net" />
          <line x1="1" y1="57" x2="3" y2="57" className="goal-net" />
          
          {/* Horizontal net lines */}
          <line x1="1.5" y1="42" x2="1.5" y2="58" className="goal-net" opacity="0.5" />
          <line x1="2.5" y1="42" x2="2.5" y2="58" className="goal-net" opacity="0.5" />
        </g>

        {/* RIGHT GOAL (Defending - Your Goal) */}
        <g>
          {/* Goal depth background */}
          <rect x="147" y="42" width="3" height="16" fill="url(#goalDepth)" opacity="0.6" />
          
          {/* Goal mouth opening */}
          <rect x="147" y="42" width="2" height="16" className="goal-structure" />
          
          {/* Goal posts - thicker and more visible */}
          <line x1="147" y1="42" x2="149" y2="42" className="goal-structure" strokeWidth="0.7" />
          <line x1="147" y1="58" x2="149" y2="58" className="goal-structure" strokeWidth="0.7" />
          
          {/* Crossbar */}
          <line x1="149" y1="42" x2="149" y2="58" className="goal-structure" strokeWidth="0.7" />
          
          {/* Enhanced goal net */}
          <line x1="147" y1="44" x2="149" y2="44" className="goal-net" />
          <line x1="147" y1="47" x2="149" y2="47" className="goal-net" />
          <line x1="147" y1="50" x2="149" y2="50" className="goal-net" />
          <line x1="147" y1="52" x2="149" y2="52" className="goal-net" strokeWidth="0.22" />
          <line x1="147" y1="55" x2="149" y2="55" className="goal-net" />
          <line x1="147" y1="57" x2="149" y2="57" className="goal-net" />
          
          {/* Horizontal net lines */}
          <line x1="147.5" y1="42" x2="147.5" y2="58" className="goal-net" opacity="0.5" />
          <line x1="148.5" y1="42" x2="148.5" y2="58" className="goal-net" opacity="0.5" />
        </g>
      </svg>
      </div>
    </div>
  );
};
