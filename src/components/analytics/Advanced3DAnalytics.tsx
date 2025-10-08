import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Eye,
  Target,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Settings,
} from 'lucide-react';
import type { Player, Position } from '../../types';

interface HeatMapData {
  x: number;
  y: number;
  intensity: number;
  playerName: string;
  actions: number;
}

interface MovementData {
  playerId: string;
  path: Position[];
  speed: number[];
  timestamp: number[];
}

interface AnalyticsMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: 'performance' | 'tactical' | 'physical';
}

interface Advanced3DAnalyticsProps {
  players: Player[];
  matchData?: {
    duration: number;
    events: any[];
    heatMapData: HeatMapData[];
    movementData: MovementData[];
  };
  onMetricSelect?: (metric: string) => void;
}

export const Advanced3DAnalytics: React.FC<Advanced3DAnalyticsProps> = ({
  players,
  matchData,
  onMetricSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('heat-map');
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 90]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [intensity, setIntensity] = useState(0.7);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');

  const metrics: AnalyticsMetric[] = [
    { name: 'Pass Accuracy', value: 87.3, unit: '%', trend: 'up', category: 'tactical' },
    { name: 'Distance Covered', value: 11.2, unit: 'km', trend: 'up', category: 'physical' },
    { name: 'Possession %', value: 64.8, unit: '%', trend: 'down', category: 'tactical' },
    { name: 'Shots on Target', value: 7, unit: '', trend: 'up', category: 'performance' },
    { name: 'Tackles Won', value: 12, unit: '', trend: 'stable', category: 'performance' },
    { name: 'Sprint Speed', value: 28.4, unit: 'km/h', trend: 'up', category: 'physical' },
  ];

  const generateHeatMapData = (): HeatMapData[] => {
    const data: HeatMapData[] = [];

    // Generate realistic heat map data for each player
    players.forEach(player => {
      // Main position cluster
      for (let i = 0; i < 20; i++) {
        data.push({
          x: player.position.x + (Math.random() - 0.5) * 20,
          y: player.position.y + (Math.random() - 0.5) * 15,
          intensity: 0.8 + Math.random() * 0.2,
          playerName: player.name,
          actions: Math.floor(Math.random() * 15) + 5,
        });
      }

      // Secondary position clusters (movement patterns)
      if (player.roleId === 'midfielder') {
        // Midfielders cover more area
        for (let i = 0; i < 15; i++) {
          data.push({
            x: 30 + Math.random() * 40,
            y: player.position.y + (Math.random() - 0.5) * 30,
            intensity: 0.4 + Math.random() * 0.4,
            playerName: player.name,
            actions: Math.floor(Math.random() * 10) + 2,
          });
        }
      }

      if (player.roleId === 'forward') {
        // Forwards concentrate in attacking third
        for (let i = 0; i < 10; i++) {
          data.push({
            x: 60 + Math.random() * 30,
            y: 20 + Math.random() * 30,
            intensity: 0.6 + Math.random() * 0.3,
            playerName: player.name,
            actions: Math.floor(Math.random() * 8) + 3,
          });
        }
      }
    });

    return data;
  };

  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>(() => generateHeatMapData());

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= timeRange[1]) {
            setIsPlaying(false);
            return timeRange[1];
          }
          return prev + 0.1;
        });
      }, 100);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isPlaying, timeRange]);

  useEffect(() => {
    drawHeatMap();
  }, [selectedMetric, intensity, selectedPlayer, currentTime]);

  const drawHeatMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = 800;
    canvas.height = 520;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw field background
    drawField(ctx);

    if (selectedMetric === 'heat-map') {
      drawHeatMapVisualization(ctx);
    } else if (selectedMetric === 'movement-trails') {
      drawMovementTrails(ctx);
    } else if (selectedMetric === 'pass-network') {
      drawPassNetwork(ctx);
    } else if (selectedMetric === 'pressure-zones') {
      drawPressureZones(ctx);
    }
  };

  const drawField = (ctx: CanvasRenderingContext2D) => {
    // Field background
    ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
    ctx.fillRect(0, 0, 800, 520);

    // Field lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(40, 40, 720, 440);

    // Center line
    ctx.beginPath();
    ctx.moveTo(400, 40);
    ctx.lineTo(400, 480);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(400, 260, 60, 0, 2 * Math.PI);
    ctx.stroke();

    // Penalty areas
    ctx.strokeRect(40, 160, 120, 200);
    ctx.strokeRect(640, 160, 120, 200);

    // Goal areas
    ctx.strokeRect(40, 210, 40, 100);
    ctx.strokeRect(720, 210, 40, 100);
  };

  const drawHeatMapVisualization = (ctx: CanvasRenderingContext2D) => {
    const filteredData =
      selectedPlayer === 'all'
        ? heatMapData
        : heatMapData.filter(d => d.playerName === selectedPlayer);

    filteredData.forEach(point => {
      const x = (point.x / 100) * 720 + 40;
      const y = (point.y / 100) * 440 + 40;
      const radius = 25 * intensity;

      // Create radial gradient for heat effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const alpha = point.intensity * intensity;

      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha * 0.8})`);
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.4})`);
      gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Add intensity legend
    drawIntensityLegend(ctx);
  };

  const drawMovementTrails = (ctx: CanvasRenderingContext2D) => {
    players.forEach((player, index) => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
      const color = colors[index % colors.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);

      // Generate random movement trail
      ctx.beginPath();
      let startX = (player.position.x / 100) * 720 + 40;
      let startY = (player.position.y / 100) * 440 + 40;

      ctx.moveTo(startX, startY);

      for (let i = 0; i < 20; i++) {
        const progress = (currentTime / 90) * 20;
        if (i <= progress) {
          startX += (Math.random() - 0.5) * 30;
          startY += (Math.random() - 0.5) * 20;
          startX = Math.max(40, Math.min(760, startX));
          startY = Math.max(40, Math.min(480, startY));
          ctx.lineTo(startX, startY);
        }
      }

      ctx.stroke();
      ctx.setLineDash([]);

      // Player dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(startX, startY, 6, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawPassNetwork = (ctx: CanvasRenderingContext2D) => {
    players.forEach((player, i) => {
      const x1 = (player.position.x / 100) * 720 + 40;
      const y1 = (player.position.y / 100) * 440 + 40;

      // Draw connections to nearby players
      players.forEach((otherPlayer, j) => {
        if (i !== j) {
          const x2 = (otherPlayer.position.x / 100) * 720 + 40;
          const y2 = (otherPlayer.position.y / 100) * 440 + 40;
          const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

          if (distance < 150) {
            const strength = Math.random();
            ctx.strokeStyle = `rgba(74, 144, 226, ${strength * 0.6})`;
            ctx.lineWidth = strength * 4 + 1;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      });

      // Player nodes
      ctx.fillStyle = '#4a90e2';
      ctx.beginPath();
      ctx.arc(x1, y1, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.jerseyNumber?.toString() || '?', x1, y1 + 3);
    });
  };

  const drawPressureZones = (ctx: CanvasRenderingContext2D) => {
    // High pressure zones in red
    const pressureZones = [
      { x: 300, y: 200, radius: 80, intensity: 0.8 },
      { x: 500, y: 300, radius: 60, intensity: 0.6 },
      { x: 150, y: 150, radius: 70, intensity: 0.7 },
    ];

    pressureZones.forEach(zone => {
      const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${zone.intensity * 0.5})`);
      gradient.addColorStop(0.7, `rgba(255, 100, 0, ${zone.intensity * 0.3})`);
      gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawIntensityLegend = (ctx: CanvasRenderingContext2D) => {
    const legendX = 650;
    const legendY = 50;
    const legendWidth = 100;
    const legendHeight = 15;

    // Gradient legend
    const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)');

    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    // Legend labels
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('Low', legendX - 5, legendY + 25);
    ctx.fillText('High', legendX + legendWidth - 15, legendY + 25);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'bg-blue-500/20 text-blue-400';
      case 'tactical':
        return 'bg-green-500/20 text-green-400';
      case 'physical':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <Card className="w-full max-w-6xl bg-slate-800  border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          Advanced 3D Analytics & Heat Maps
          <Badge variant="secondary" className="ml-auto">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/5">
            <TabsTrigger value="heat-map" className="data-[state=active]:bg-purple-500/20">
              Heat Map
            </TabsTrigger>
            <TabsTrigger value="movement-trails" className="data-[state=active]:bg-purple-500/20">
              Movement
            </TabsTrigger>
            <TabsTrigger value="pass-network" className="data-[state=active]:bg-purple-500/20">
              Pass Network
            </TabsTrigger>
            <TabsTrigger value="pressure-zones" className="data-[state=active]:bg-purple-500/20">
              Pressure
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Visualization Canvas */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-slate-700">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto border border-slate-600 rounded"
                  style={{ maxHeight: '400px' }}
                />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-4 items-center justify-between bg-white/5 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentTime(0);
                      setIsPlaying(false);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 border-slate-600"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <span className="text-white text-sm">{currentTime.toFixed(1)}'</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-white" />
                    <span className="text-white text-sm">Intensity:</span>
                    <Slider
                      value={[intensity]}
                      onValueChange={value => setIntensity(value[0])}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="w-20"
                    />
                  </div>

                  <select
                    value={selectedPlayer}
                    onChange={e => setSelectedPlayer(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                  >
                    <option value="all">All Players</option>
                    {players.map(player => (
                      <option key={player.id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Metrics Panel */}
            <div className="space-y-4">
              <Card className="bg-white/5 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium text-sm">{metric.name}</span>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <Badge className={getCategoryColor(metric.category)}>
                          {metric.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {metric.value}
                          <span className="text-gray-400 text-sm ml-1">{metric.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    Visualization Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-white text-sm block mb-2">Time Range (min)</label>
                    <Slider
                      value={timeRange}
                      onValueChange={(value: number[]) => setTimeRange([value[0], value[1]])}
                      max={90}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-gray-400 text-xs mt-1">
                      <span>{timeRange[0]}'</span>
                      <span>{timeRange[1]}'</span>
                    </div>
                  </div>

                  <Button className="w-full bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30">
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
