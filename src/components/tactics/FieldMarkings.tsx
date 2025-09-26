import React from 'react';

interface FieldMarkingsProps {
  showGrid: boolean;
  viewMode: 'standard' | 'fullscreen' | 'presentation';
}

const FieldMarkings: React.FC<FieldMarkingsProps> = ({ showGrid, viewMode }) => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Enhanced gradient definitions */}
        <linearGradient id="fieldLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="50%" stopColor="rgba(255,255,255,1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
        </linearGradient>

        <filter id="fieldLineShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodColor="rgba(0,0,0,0.4)" />
        </filter>

        <filter id="fieldLineGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id="centerSpotGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Field Border */}
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.3"
        filter="url(#fieldLineShadow)"
        opacity="0.9"
      />

      {/* Center Circle */}
      <circle
        cx="50"
        cy="50"
        r="9.15"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.25"
        filter="url(#fieldLineShadow)"
        opacity="0.9"
      />

      {/* Center Spot */}
      <circle
        cx="50"
        cy="50"
        r="0.6"
        fill="url(#fieldLineGradient)"
        filter="url(#centerSpotGlow)"
        opacity="0.95"
      />

      {/* Center Line */}
      <line
        x1="50"
        y1="0"
        x2="50"
        y2="100"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.2"
        filter="url(#fieldLineShadow)"
        opacity="0.8"
      />

      {/* Penalty Areas */}
      <rect
        x="0"
        y="21.1"
        width="16.5"
        height="57.8"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.2"
        filter="url(#fieldLineShadow)"
        opacity="0.8"
      />
      <rect
        x="83.5"
        y="21.1"
        width="16.5"
        height="57.8"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.2"
        filter="url(#fieldLineShadow)"
        opacity="0.8"
      />

      {/* Goal Areas */}
      <rect
        x="0"
        y="36.8"
        width="5.5"
        height="26.4"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.2"
        filter="url(#fieldLineShadow)"
        opacity="0.8"
      />
      <rect
        x="94.5"
        y="36.8"
        width="5.5"
        height="26.4"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.2"
        filter="url(#fieldLineShadow)"
        opacity="0.8"
      />

      {/* Penalty Spots */}
      <circle
        cx="11"
        cy="50"
        r="0.4"
        fill="url(#fieldLineGradient)"
        filter="url(#fieldLineGlow)"
        opacity="0.9"
      />
      <circle
        cx="89"
        cy="50"
        r="0.4"
        fill="url(#fieldLineGradient)"
        filter="url(#fieldLineGlow)"
        opacity="0.9"
      />

      {/* Penalty Arcs */}
      <path
        d="M 6.85 41.9 A 9.15 9.15 0 0 1 6.85 58.1"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.2"
        filter="url(#fieldLineShadow)"
        opacity="0.8"
      />
      <path
        d="M 93.15 41.9 A 9.15 9.15 0 0 0 93.15 58.1"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.2"
        filter="url(#fieldLineShadow)"
        opacity="0.8"
      />

      {/* Corner Arcs */}
      <path
        d="M 0 0 A 1 1 0 0 1 1 1"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.15"
        filter="url(#fieldLineShadow)"
        opacity="0.7"
      />
      <path
        d="M 100 0 A 1 1 0 0 0 99 1"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.15"
        filter="url(#fieldLineShadow)"
        opacity="0.7"
      />
      <path
        d="M 0 100 A 1 1 0 0 0 1 99"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.15"
        filter="url(#fieldLineShadow)"
        opacity="0.7"
      />
      <path
        d="M 100 100 A 1 1 0 0 1 99 99"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.15"
        filter="url(#fieldLineShadow)"
        opacity="0.7"
      />

      {/* Goals */}
      <rect
        x="-2"
        y="44"
        width="2"
        height="12"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.3"
        filter="url(#fieldLineShadow)"
        opacity="0.9"
      />
      <rect
        x="100"
        y="44"
        width="2"
        height="12"
        fill="none"
        stroke="url(#fieldLineGradient)"
        strokeWidth="0.3"
        filter="url(#fieldLineShadow)"
        opacity="0.9"
      />

      {/* Grid Overlay */}
      {showGrid && (
        <g stroke="rgba(255,255,255,0.1)" strokeWidth="0.05" opacity="0.6">
          {/* Vertical lines */}
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`v-${i}`} x1={i * 5} y1="0" x2={i * 5} y2="100" />
          ))}
          {/* Horizontal lines */}
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 5} x2="100" y2={i * 5} />
          ))}
        </g>
      )}

      {/* Tactical Zones (subtle indicators) */}
      {viewMode !== 'presentation' && (
        <g opacity="0.03">
          {/* Defensive Third */}
          <rect x="0" y="66.67" width="100" height="33.33" fill="rgba(239, 68, 68, 0.5)" />
          {/* Middle Third */}
          <rect x="0" y="33.33" width="100" height="33.34" fill="rgba(245, 158, 11, 0.5)" />
          {/* Attacking Third */}
          <rect x="0" y="0" width="100" height="33.33" fill="rgba(34, 197, 94, 0.5)" />
        </g>
      )}
    </svg>
  );
};

export { FieldMarkings };
export default FieldMarkings;