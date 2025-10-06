/**
 * Enhanced Field Background Component
 * Provides depth, realistic grass patterns, and dynamic lighting
 */

import React from 'react';

interface EnhancedFieldBackgroundProps {
  viewMode?: 'standard' | 'fullscreen' | 'presentation';
  performanceMode?: boolean;
  showGrassPattern?: boolean;
  grassStyle?: 'striped' | 'checkered' | 'radial' | 'natural';
  className?: string;
}

export const EnhancedFieldBackground: React.FC<EnhancedFieldBackgroundProps> = ({
  viewMode = 'standard',
  performanceMode = false,
  showGrassPattern = true,
  grassStyle = 'striped',
  className = '',
}) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Base gradient with depth */}
      <div
        className="absolute inset-0"
        style={{
          background: performanceMode
            ? // Simplified for performance
              'linear-gradient(135deg, #166534 0%, #15803d 50%, #166534 100%)'
            : // Full quality with depth
              `
                radial-gradient(ellipse 120% 100% at 50% 0%, rgba(34, 197, 94, 0.2) 0%, transparent 40%),
                radial-gradient(ellipse 120% 100% at 50% 100%, rgba(21, 128, 61, 0.3) 0%, transparent 40%),
                linear-gradient(to bottom,
                  #14532d 0%,
                  #166534 15%,
                  #15803d 30%,
                  #16a34a 50%,
                  #15803d 70%,
                  #166534 85%,
                  #14532d 100%
                )
              `,
        }}
      />

      {/* Grass pattern overlay */}
      {showGrassPattern && !performanceMode && (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Striped grass pattern */}
            {grassStyle === 'striped' && (
              <pattern id="grassStripes" patternUnits="userSpaceOnUse" width="10" height="100">
                <rect x="0" y="0" width="5" height="100" fill="rgba(21, 128, 61, 0.15)" />
                <rect x="5" y="0" width="5" height="100" fill="rgba(22, 163, 74, 0.15)" />
              </pattern>
            )}

            {/* Checkered grass pattern */}
            {grassStyle === 'checkered' && (
              <pattern id="grassCheckered" patternUnits="userSpaceOnUse" width="10" height="10">
                <rect x="0" y="0" width="5" height="5" fill="rgba(21, 128, 61, 0.15)" />
                <rect x="5" y="5" width="5" height="5" fill="rgba(21, 128, 61, 0.15)" />
                <rect x="5" y="0" width="5" height="5" fill="rgba(22, 163, 74, 0.15)" />
                <rect x="0" y="5" width="5" height="5" fill="rgba(22, 163, 74, 0.15)" />
              </pattern>
            )}

            {/* Radial grass pattern */}
            {grassStyle === 'radial' && (
              <pattern id="grassRadial" patternUnits="userSpaceOnUse" width="20" height="20">
                <circle cx="10" cy="10" r="8" fill="rgba(21, 128, 61, 0.1)" />
                <circle cx="10" cy="10" r="4" fill="rgba(22, 163, 74, 0.1)" />
              </pattern>
            )}

            {/* Natural grass texture */}
            {grassStyle === 'natural' && (
              <pattern id="grassNatural" patternUnits="userSpaceOnUse" width="15" height="15">
                <path d="M 7.5 0 Q 6 5 7.5 10 Q 9 5 7.5 0" fill="rgba(21, 128, 61, 0.08)" />
                <path d="M 3 3 Q 2 7 3 11 Q 4 7 3 3" fill="rgba(22, 163, 74, 0.08)" />
                <path d="M 12 2 Q 11 6 12 10 Q 13 6 12 2" fill="rgba(21, 128, 61, 0.08)" />
              </pattern>
            )}
          </defs>

          {/* Apply grass pattern */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={`url(#grass${grassStyle === 'striped' ? 'Stripes' : grassStyle === 'checkered' ? 'Checkered' : grassStyle === 'radial' ? 'Radial' : 'Natural'})`}
          />
        </svg>
      )}

      {/* Stadium lighting effects */}
      {!performanceMode && (
        <>
          {/* Top spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%)`,
            }}
          />

          {/* Side spotlights */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 60% 40% at 10% 50%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 90% 50%, rgba(255, 255, 255, 0.06) 0%, transparent 50%)
              `,
            }}
          />

          {/* Bottom ambient light */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 70% 50% at 50% 110%, rgba(22, 163, 74, 0.08) 0%, transparent 50%)`,
            }}
          />
        </>
      )}

      {/* Depth shadow edges */}
      {!performanceMode && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `
              inset 0 0 100px rgba(0, 0, 0, 0.3),
              inset 0 0 50px rgba(34, 197, 94, 0.1),
              ${viewMode !== 'fullscreen' ? '0 20px 40px rgba(0, 0, 0, 0.2)' : ''}
            `,
            borderRadius: viewMode === 'fullscreen' ? '0' : '12px',
          }}
        />
      )}

      {/* Corner vignette */}
      {!performanceMode && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at top left, transparent 60%, rgba(0, 0, 0, 0.15) 100%),
              radial-gradient(ellipse at top right, transparent 60%, rgba(0, 0, 0, 0.15) 100%),
              radial-gradient(ellipse at bottom left, transparent 60%, rgba(0, 0, 0, 0.15) 100%),
              radial-gradient(ellipse at bottom right, transparent 60%, rgba(0, 0, 0, 0.15) 100%)
            `,
            borderRadius: viewMode === 'fullscreen' ? '0' : '12px',
          }}
        />
      )}
    </div>
  );
};

export default EnhancedFieldBackground;
