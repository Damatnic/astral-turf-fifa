import React, { useRef, useEffect } from 'react';
import type { PlayerPerformanceMetrics } from '../../services/advancedAiService';

interface AdvancedMetricsRadarProps {
  playerMetrics: PlayerPerformanceMetrics;
  comparisonMetrics?: PlayerPerformanceMetrics;
  width?: number;
  height?: number;
  className?: string;
}

interface RadarDataPoint {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

const AdvancedMetricsRadar: React.FC<AdvancedMetricsRadarProps> = ({
  playerMetrics,
  comparisonMetrics,
  width = 400,
  height = 400,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {return;}

    const ctx = canvas.getContext('2d');
    if (!ctx) {return;}

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Prepare radar data
    const radarData: RadarDataPoint[] = [
      {
        label: 'Expected Goals',
        value: playerMetrics.expectedGoals * 10, // Scale for visualization
        maxValue: 100,
        color: '#ef4444',
      },
      {
        label: 'Expected Assists',
        value: playerMetrics.expectedAssists * 10,
        maxValue: 100,
        color: '#f97316',
      },
      {
        label: 'Pass Completion',
        value: playerMetrics.passCompletionRate,
        maxValue: 100,
        color: '#eab308',
      },
      {
        label: 'Progressive Passes',
        value: Math.min(playerMetrics.progressivePasses, 100),
        maxValue: 100,
        color: '#22c55e',
      },
      {
        label: 'Defensive Actions',
        value: Math.min(playerMetrics.defensiveActions, 100),
        maxValue: 100,
        color: '#06b6d4',
      },
      {
        label: 'Aerial Duels',
        value: playerMetrics.aerialDuelsWon,
        maxValue: 100,
        color: '#3b82f6',
      },
      {
        label: 'Pressure Resistance',
        value: playerMetrics.pressureResistance,
        maxValue: 100,
        color: '#8b5cf6',
      },
      {
        label: 'Creative Index',
        value: playerMetrics.creativeIndex,
        maxValue: 100,
        color: '#ec4899',
      },
    ];

    // Draw radar chart
    drawRadarChart(ctx, radarData, width, height);

    // Draw comparison if provided
    if (comparisonMetrics) {
      const comparisonData: RadarDataPoint[] = [
        {
          label: 'Expected Goals',
          value: comparisonMetrics.expectedGoals * 10,
          maxValue: 100,
          color: '#64748b',
        },
        {
          label: 'Expected Assists',
          value: comparisonMetrics.expectedAssists * 10,
          maxValue: 100,
          color: '#64748b',
        },
        {
          label: 'Pass Completion',
          value: comparisonMetrics.passCompletionRate,
          maxValue: 100,
          color: '#64748b',
        },
        {
          label: 'Progressive Passes',
          value: Math.min(comparisonMetrics.progressivePasses, 100),
          maxValue: 100,
          color: '#64748b',
        },
        {
          label: 'Defensive Actions',
          value: Math.min(comparisonMetrics.defensiveActions, 100),
          maxValue: 100,
          color: '#64748b',
        },
        {
          label: 'Aerial Duels',
          value: comparisonMetrics.aerialDuelsWon,
          maxValue: 100,
          color: '#64748b',
        },
        {
          label: 'Pressure Resistance',
          value: comparisonMetrics.pressureResistance,
          maxValue: 100,
          color: '#64748b',
        },
        {
          label: 'Creative Index',
          value: comparisonMetrics.creativeIndex,
          maxValue: 100,
          color: '#64748b',
        },
      ];

      drawRadarChart(ctx, comparisonData, width, height, true);
    }

  }, [playerMetrics, comparisonMetrics, width, height]);

  const drawRadarChart = (
    ctx: CanvasRenderingContext2D,
    data: RadarDataPoint[],
    w: number,
    h: number,
    isComparison: boolean = false,
  ) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.35;
    const numPoints = data.length;

    // Draw background circles (grid)
    if (!isComparison) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw axis lines
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    // Draw data polygon
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const value = data[i].value;
      const distance = (value / 100) * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Fill polygon
    if (isComparison) {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
    } else {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
    }

    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw data points and labels
    if (!isComparison) {
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
        const value = data[i].value;
        const distance = (value / 100) * radius;
        const pointX = centerX + distance * Math.cos(angle);
        const pointY = centerY + distance * Math.sin(angle);

        // Draw point
        ctx.fillStyle = data[i].color;
        ctx.beginPath();
        ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw label
        const labelDistance = radius + 20;
        const labelX = centerX + labelDistance * Math.cos(angle);
        const labelY = centerY + labelDistance * Math.sin(angle);

        ctx.fillStyle = '#d1d5db';
        ctx.fillText(data[i].label, labelX, labelY);

        // Draw value
        ctx.fillStyle = data[i].color;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(value.toFixed(1), labelX, labelY + 15);
        ctx.font = '12px sans-serif';
      }
    }
  };

  return (
    <div className={`advanced-metrics-radar ${className}`}>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Advanced Performance Radar
          </h3>
          <div className="text-sm text-gray-400">
            Expected values and efficiency metrics
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-shrink-0 flex justify-center">
            <canvas
              ref={canvasRef}
              className="border border-gray-600 rounded bg-gray-900"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-lg font-bold text-green-400">
                  {playerMetrics.consistencyRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">Consistency Rating</div>
              </div>

              <div className="bg-gray-700 p-3 rounded">
                <div className="text-lg font-bold text-blue-400">
                  {playerMetrics.workRateIndex.toFixed(1)}
                </div>
                <div className="text-sm text-gray-300">Work Rate Index</div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-yellow-400 mb-2">Performance Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Expected Goals (xG)</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-600 rounded-full h-2 mr-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${Math.min(playerMetrics.expectedGoals * 50, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-white w-12">
                      {playerMetrics.expectedGoals.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Expected Assists (xA)</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-600 rounded-full h-2 mr-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${Math.min(playerMetrics.expectedAssists * 50, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-white w-12">
                      {playerMetrics.expectedAssists.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Pass Completion %</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-600 rounded-full h-2 mr-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${playerMetrics.passCompletionRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-white w-12">
                      {playerMetrics.passCompletionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Creative Index</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-600 rounded-full h-2 mr-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full"
                        style={{ width: `${playerMetrics.creativeIndex}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-white w-12">
                      {playerMetrics.creativeIndex.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-blue-400 mb-2">Metric Explanations</h4>
              <div className="text-xs text-gray-300 space-y-1">
                <p><strong>xG:</strong> Expected goals based on shot quality and position</p>
                <p><strong>xA:</strong> Expected assists from pass quality and recipient position</p>
                <p><strong>Creative Index:</strong> Combines key passes, through balls, and chance creation</p>
                <p><strong>Work Rate:</strong> Defensive actions + distance covered + pressing intensity</p>
                <p><strong>Consistency:</strong> Performance variance across matches and situations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMetricsRadar;