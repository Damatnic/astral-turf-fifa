import React, { useRef, useEffect, useState } from 'react';
import type { TacticalHeatMap } from '../../services/advancedAiService';

interface TacticalHeatMapCanvasProps {
  heatMapData: TacticalHeatMap;
  width?: number;
  height?: number;
  className?: string;
}

const TacticalHeatMapCanvas: React.FC<TacticalHeatMapCanvasProps> = ({
  heatMapData,
  width = 400,
  height = 600,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showMovementPatterns, setShowMovementPatterns] = useState(true);
  const [showInfluenceZones, setShowInfluenceZones] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw field background
    drawField(ctx, width, height);

    // Draw position heat map
    if (heatMapData.positions.length > 0) {
      drawPositionHeatMap(ctx, heatMapData.positions, width, height);
    }

    // Draw movement patterns
    if (showMovementPatterns && heatMapData.movementPatterns.length > 0) {
      drawMovementPatterns(ctx, heatMapData.movementPatterns, width, height);
    }

    // Draw influence zones
    if (showInfluenceZones && heatMapData.influenceZones.length > 0) {
      drawInfluenceZones(ctx, heatMapData.influenceZones, width, height);
    }
  }, [heatMapData, width, height, showMovementPatterns, showInfluenceZones]);

  const drawField = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Field background
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, w, h);

    // Field lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Center line
    ctx.beginPath();
    ctx.moveTo(10, h / 2);
    ctx.lineTo(w - 10, h / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    const penaltyWidth = 80;
    const penaltyHeight = 160;
    const goalAreaWidth = 30;
    const goalAreaHeight = 80;

    // Top penalty area
    ctx.strokeRect((w - penaltyWidth) / 2, 10, penaltyWidth, penaltyHeight);

    // Top goal area
    ctx.strokeRect((w - goalAreaWidth) / 2, 10, goalAreaWidth, goalAreaHeight);

    // Bottom penalty area
    ctx.strokeRect((w - penaltyWidth) / 2, h - 10 - penaltyHeight, penaltyWidth, penaltyHeight);

    // Bottom goal area
    ctx.strokeRect((w - goalAreaWidth) / 2, h - 10 - goalAreaHeight, goalAreaWidth, goalAreaHeight);
  };

  const drawPositionHeatMap = (
    ctx: CanvasRenderingContext2D,
    positions: TacticalHeatMap['positions'],
    w: number,
    h: number,
  ) => {
    positions.forEach(pos => {
      const x = (pos.x / 100) * (w - 20) + 10;
      const y = (pos.y / 100) * (h - 20) + 10;

      // Create gradient for heat effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);

      // Color intensity based on frequency and effectiveness
      const intensity = (pos.frequency * pos.effectiveness) / 100;
      const alpha = Math.min(intensity / 100, 0.8);

      if (intensity > 70) {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`); // Red - Hot zone
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      } else if (intensity > 40) {
        gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`); // Yellow - Warm zone
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      } else {
        gradient.addColorStop(0, `rgba(0, 255, 0, ${alpha})`); // Green - Cool zone
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawMovementPatterns = (
    ctx: CanvasRenderingContext2D,
    patterns: TacticalHeatMap['movementPatterns'],
    w: number,
    h: number,
  ) => {
    patterns.forEach(pattern => {
      const fromX = (pattern.from.x / 100) * (w - 20) + 10;
      const fromY = (pattern.from.y / 100) * (h - 20) + 10;
      const toX = (pattern.to.x / 100) * (w - 20) + 10;
      const toY = (pattern.to.y / 100) * (h - 20) + 10;

      // Line thickness based on frequency
      ctx.lineWidth = Math.max(pattern.frequency / 20, 1);

      // Color based on success rate
      if (pattern.successRate > 70) {
        ctx.strokeStyle = `rgba(0, 255, 0, 0.7)`; // Green for high success
      } else if (pattern.successRate > 40) {
        ctx.strokeStyle = `rgba(255, 255, 0, 0.7)`; // Yellow for medium success
      } else {
        ctx.strokeStyle = `rgba(255, 0, 0, 0.7)`; // Red for low success
      }

      // Draw arrow
      drawArrow(ctx, fromX, fromY, toX, toY);
    });
  };

  const drawInfluenceZones = (
    ctx: CanvasRenderingContext2D,
    zones: TacticalHeatMap['influenceZones'],
    w: number,
    h: number,
  ) => {
    zones.forEach(zone => {
      const x = (zone.centerX / 100) * (w - 20) + 10;
      const y = (zone.centerY / 100) * (h - 20) + 10;
      const radius = zone.radius * 2; // Scale radius for display

      // Create gradient for influence visualization
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const alpha = zone.influence / 200; // Normalize influence to alpha

      gradient.addColorStop(0, `rgba(138, 43, 226, ${alpha})`); // Purple center
      gradient.addColorStop(0.5, `rgba(138, 43, 226, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(138, 43, 226, 0)'); // Fade out

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw influence circle outline
      ctx.strokeStyle = `rgba(138, 43, 226, 0.8)`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    });
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ) => {
    const headlen = 10; // Length of head in pixels
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6),
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6),
    );
    ctx.stroke();
  };

  return (
    <div className={`tactical-heatmap ${className}`}>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Tactical Heat Map - Player Analysis</h3>
          <div className="flex space-x-4 text-sm">
            <label className="flex items-center text-gray-300">
              <input
                type="checkbox"
                checked={showMovementPatterns}
                onChange={e => setShowMovementPatterns(e.target.checked)}
                className="mr-2"
              />
              Movement Patterns
            </label>
            <label className="flex items-center text-gray-300">
              <input
                type="checkbox"
                checked={showInfluenceZones}
                onChange={e => setShowInfluenceZones(e.target.checked)}
                className="mr-2"
              />
              Influence Zones
            </label>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-shrink-0">
            <canvas
              ref={canvasRef}
              className="border border-gray-600 rounded bg-gray-900"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-blue-400 mb-2">Heat Map Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span className="text-gray-300">High Activity (Hot Zone)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span className="text-gray-300">Medium Activity (Warm Zone)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span className="text-gray-300">Low Activity (Cool Zone)</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-purple-400 mb-2">Movement Analysis</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-green-500 mr-2"></div>
                  <span>High Success Rate (70%+)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-yellow-500 mr-2"></div>
                  <span>Medium Success Rate (40-70%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-red-500 mr-2"></div>
                  <span>Low Success Rate (&lt;40%)</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-yellow-400 mb-2">Key Insights</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• Position frequency shows player&apos;s primary operating zones</p>
                <p>• Movement patterns reveal tactical discipline and creativity</p>
                <p>• Influence zones indicate areas of maximum impact</p>
                <p>• Heat intensity correlates with effectiveness in each area</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticalHeatMapCanvas;
