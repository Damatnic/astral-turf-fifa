import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { 
  Zap, 
  Monitor, 
  Settings, 
  TrendingUp, 
  Gauge,
  Cpu,
  MemoryStick,
  Activity,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import type { Player, Position } from '../../types';

interface WebGLPerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  gpuMemory: number;
  renderTime: number;
  frameTime: number;
}

interface WebGLSettings {
  antialiasing: boolean;
  shadowQuality: 'low' | 'medium' | 'high';
  particleCount: number;
  fieldDetail: 'low' | 'medium' | 'high';
  animationQuality: 'low' | 'medium' | 'high';
  enablePostProcessing: boolean;
}

interface WebGLTacticsRendererProps {
  players: Player[];
  fieldWidth: number;
  fieldHeight: number;
  onPlayerMove?: (playerId: string, position: Position) => void;
  enableInteraction?: boolean;
}

export const WebGLTacticsRenderer: React.FC<WebGLTacticsRendererProps> = ({
  players,
  fieldWidth = 800,
  fieldHeight = 520,
  onPlayerMove,
  enableInteraction = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const fpsCounter = useRef<number[]>([]);

  const [isRunning, setIsRunning] = useState(true);
  const [metrics, setMetrics] = useState<WebGLPerformanceMetrics>({
    fps: 60,
    drawCalls: 0,
    triangles: 0,
    gpuMemory: 0,
    renderTime: 0,
    frameTime: 16.67
  });

  const [settings, setSettings] = useState<WebGLSettings>({
    antialiasing: true,
    shadowQuality: 'medium',
    particleCount: 100,
    fieldDetail: 'high',
    animationQuality: 'high',
    enablePostProcessing: true
  });

  const [shaderPrograms, setShaderPrograms] = useState<{
    field: WebGLProgram | null;
    player: WebGLProgram | null;
    particle: WebGLProgram | null;
  }>({
    field: null,
    player: null,
    particle: null
  });

  // Vertex shader source
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec3 a_color;
    attribute vec2 a_texCoord;
    
    uniform vec2 u_resolution;
    uniform mat3 u_transform;
    uniform float u_time;
    
    varying vec3 v_color;
    varying vec2 v_texCoord;
    varying float v_time;
    
    void main() {
      vec3 position = u_transform * vec3(a_position, 1.0);
      vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      
      v_color = a_color;
      v_texCoord = a_texCoord;
      v_time = u_time;
    }
  `;

  // Fragment shader source for field
  const fieldFragmentShaderSource = `
    precision mediump float;
    
    uniform float u_time;
    uniform vec2 u_resolution;
    
    varying vec3 v_color;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      
      // Grass texture simulation
      float grass = sin(st.x * 50.0) * sin(st.y * 50.0) * 0.1;
      vec3 grassColor = vec3(0.2, 0.6, 0.3) + grass;
      
      // Stadium lighting effect
      float light = 1.0 - distance(st, vec2(0.5, 0.5)) * 0.5;
      grassColor *= light;
      
      // Animated grass movement
      float wind = sin(u_time * 0.001 + st.x * 10.0) * 0.02;
      grassColor.g += wind;
      
      gl_FragColor = vec4(grassColor, 1.0);
    }
  `;

  // Fragment shader source for players
  const playerFragmentShaderSource = `
    precision mediump float;
    
    uniform float u_time;
    uniform vec3 u_playerColor;
    uniform float u_selected;
    uniform float u_performance;
    
    varying vec3 v_color;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(v_texCoord, center);
      
      // Player circle
      if (dist > 0.4) {
        discard;
      }
      
      vec3 color = u_playerColor;
      
      // Performance glow
      float glow = (1.0 - dist) * u_performance * 0.5;
      color += vec3(glow, glow * 0.5, 0.0);
      
      // Selection highlight
      if (u_selected > 0.5) {
        float pulse = sin(u_time * 0.01) * 0.3 + 0.7;
        color = mix(color, vec3(1.0, 1.0, 0.0), pulse * 0.5);
      }
      
      // Anti-aliasing
      float alpha = smoothstep(0.4, 0.35, dist);
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Fragment shader for particles
  const particleFragmentShaderSource = `
    precision mediump float;
    
    uniform float u_time;
    uniform vec3 u_particleColor;
    
    varying vec2 v_texCoord;
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(v_texCoord, center);
      
      if (dist > 0.5) {
        discard;
      }
      
      float alpha = (1.0 - dist * 2.0) * 0.8;
      gl_FragColor = vec4(u_particleColor, alpha);
    }
  `;

  // Initialize WebGL context and shaders
  const initializeWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl', {
      antialias: settings.antialiasing,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });

    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }

    glRef.current = gl;

    // Create shaders
    const fieldProgram = createShaderProgram(gl, vertexShaderSource, fieldFragmentShaderSource);
    const playerProgram = createShaderProgram(gl, vertexShaderSource, playerFragmentShaderSource);
    const particleProgram = createShaderProgram(gl, vertexShaderSource, particleFragmentShaderSource);

    setShaderPrograms({
      field: fieldProgram,
      player: playerProgram,
      particle: particleProgram
    });

    // Set initial WebGL state
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.4, 0.0, 1.0);

    return true;
  }, [settings.antialiasing]);

  const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const createShaderProgram = (gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  // Render function
  const render = useCallback((timestamp: number) => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;

    // Calculate FPS
    const deltaTime = timestamp - lastFrameTime.current;
    lastFrameTime.current = timestamp;
    
    fpsCounter.current.push(1000 / deltaTime);
    if (fpsCounter.current.length > 60) {
      fpsCounter.current.shift();
    }

    const currentFPS = fpsCounter.current.reduce((a, b) => a + b, 0) / fpsCounter.current.length;

    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let drawCalls = 0;
    let triangles = 0;

    // Render field
    if (shaderPrograms.field) {
      drawCalls += renderField(gl, shaderPrograms.field, timestamp);
      triangles += 2; // Field is made of 2 triangles
    }

    // Render players
    if (shaderPrograms.player) {
      const playerData = renderPlayers(gl, shaderPrograms.player, timestamp);
      drawCalls += playerData.drawCalls;
      triangles += playerData.triangles;
    }

    // Render particles (if enabled)
    if (settings.particleCount > 0 && shaderPrograms.particle) {
      const particleData = renderParticles(gl, shaderPrograms.particle, timestamp);
      drawCalls += particleData.drawCalls;
      triangles += particleData.triangles;
    }

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      fps: Math.round(currentFPS),
      drawCalls,
      triangles,
      frameTime: deltaTime,
      renderTime: performance.now() - timestamp
    }));

    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [isRunning, shaderPrograms, settings.particleCount, players]);

  const renderField = (gl: WebGLRenderingContext, program: WebGLProgram, timestamp: number): number => {
    gl.useProgram(program);

    // Field vertices (full screen quad)
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1, -1,
       1,  1,
      -1,  1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

    gl.uniform1f(timeLocation, timestamp);
    gl.uniform2f(resolutionLocation, fieldWidth, fieldHeight);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return 1; // One draw call
  };

  const renderPlayers = (gl: WebGLRenderingContext, program: WebGLProgram, timestamp: number) => {
    gl.useProgram(program);

    let drawCalls = 0;
    let triangles = 0;

    players.forEach(player => {
      // Create player quad
      const size = 30;
      const x = (player.position.x / 100) * fieldWidth;
      const y = (player.position.y / 100) * fieldHeight;

      const vertices = new Float32Array([
        x - size, y - size, 0.0, 0.0, 1.0, 0.0, 0.0, // position, color, texCoord
        x + size, y - size, 0.0, 0.0, 1.0, 1.0, 0.0,
        x - size, y + size, 0.0, 0.0, 1.0, 0.0, 1.0,
        x + size, y - size, 0.0, 0.0, 1.0, 1.0, 0.0,
        x + size, y + size, 0.0, 0.0, 1.0, 1.0, 1.0,
        x - size, y + size, 0.0, 0.0, 1.0, 0.0, 1.0
      ]);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

      // Set attributes
      const stride = 7 * 4; // 7 floats per vertex
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const colorLocation = gl.getAttribLocation(program, 'a_color');
      const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);

      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, stride, 2 * 4);

      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, stride, 5 * 4);

      // Set uniforms
      const timeLocation = gl.getUniformLocation(program, 'u_time');
      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      const playerColorLocation = gl.getUniformLocation(program, 'u_playerColor');
      const selectedLocation = gl.getUniformLocation(program, 'u_selected');
      const performanceLocation = gl.getUniformLocation(program, 'u_performance');

      gl.uniform1f(timeLocation, timestamp);
      gl.uniform2f(resolutionLocation, fieldWidth, fieldHeight);
      gl.uniform3f(playerColorLocation, 0.2, 0.4, 0.8);
      gl.uniform1f(selectedLocation, 0.0);
      gl.uniform1f(performanceLocation, player.performance || 0.7);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      drawCalls++;
      triangles += 2;
    });

    return { drawCalls, triangles };
  };

  const renderParticles = (gl: WebGLRenderingContext, program: WebGLProgram, timestamp: number) => {
    // Simplified particle system for performance demo
    gl.useProgram(program);

    let drawCalls = 0;
    let triangles = 0;

    for (let i = 0; i < Math.min(settings.particleCount, 50); i++) {
      const x = Math.random() * fieldWidth;
      const y = Math.random() * fieldHeight;
      const size = 5;

      const vertices = new Float32Array([
        x - size, y - size, 0.0, 0.0,
        x + size, y - size, 1.0, 0.0,
        x - size, y + size, 0.0, 1.0,
        x + size, y - size, 1.0, 0.0,
        x + size, y + size, 1.0, 1.0,
        x - size, y + size, 0.0, 1.0
      ]);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 4 * 4, 0);

      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

      const timeLocation = gl.getUniformLocation(program, 'u_time');
      const particleColorLocation = gl.getUniformLocation(program, 'u_particleColor');

      gl.uniform1f(timeLocation, timestamp);
      gl.uniform3f(particleColorLocation, 1.0, 1.0, 0.5);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      drawCalls++;
      triangles += 2;
    }

    return { drawCalls, triangles };
  };

  // Initialize WebGL on mount
  useEffect(() => {
    initializeWebGL();
  }, [initializeWebGL]);

  // Start/stop rendering
  useEffect(() => {
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, render]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const getPerformanceColor = (value: number) => {
    if (value >= 55) return 'text-green-400';
    if (value >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'low': return { color: 'text-yellow-400', label: 'Low' };
      case 'medium': return { color: 'text-blue-400', label: 'Medium' };
      case 'high': return { color: 'text-green-400', label: 'High' };
      default: return { color: 'text-gray-400', label: 'Unknown' };
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* WebGL Canvas */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              WebGL Tactics Renderer
              <Badge className="bg-green-500/20 text-green-400">
                60 FPS
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsRunning(!isRunning)}
                className="bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  setIsRunning(false);
                  setTimeout(() => setIsRunning(true), 100);
                }}
                className="bg-white/10 hover:bg-white/20 border-white/20"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            className="w-full h-96 bg-green-800"
            style={{ display: 'block' }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Metrics */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Monitor className="w-5 h-5 text-blue-400" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">FPS</span>
                </div>
                <span className={`font-bold ${getPerformanceColor(metrics.fps)}`}>
                  {metrics.fps}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Frame Time</span>
                </div>
                <span className="text-white font-bold">
                  {metrics.frameTime.toFixed(1)}ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Draw Calls</span>
                </div>
                <span className="text-white font-bold">
                  {metrics.drawCalls}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300">Triangles</span>
                </div>
                <span className="text-white font-bold">
                  {metrics.triangles.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">GPU Performance</span>
                <span className={`text-sm ${getPerformanceColor(metrics.fps)}`}>
                  {metrics.fps >= 55 ? 'Excellent' : metrics.fps >= 30 ? 'Good' : 'Poor'}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.fps >= 55 ? 'bg-green-400' : 
                    metrics.fps >= 30 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min((metrics.fps / 60) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Settings */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="w-5 h-5 text-purple-400" />
              Quality Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Shadow Quality</span>
                <Badge className={getQualityLabel(settings.shadowQuality).color}>
                  {getQualityLabel(settings.shadowQuality).label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Field Detail</span>
                <Badge className={getQualityLabel(settings.fieldDetail).color}>
                  {getQualityLabel(settings.fieldDetail).label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Animation Quality</span>
                <Badge className={getQualityLabel(settings.animationQuality).color}>
                  {getQualityLabel(settings.animationQuality).label}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Particle Count</span>
                  <span className="text-white">{settings.particleCount}</span>
                </div>
                <Slider
                  value={[settings.particleCount]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, particleCount: value[0] }))}
                  max={200}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Antialiasing</span>
                <Button
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, antialiasing: !prev.antialiasing }))}
                  className={settings.antialiasing 
                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {settings.antialiasing ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Post Processing</span>
                <Button
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, enablePostProcessing: !prev.enablePostProcessing }))}
                  className={settings.enablePostProcessing 
                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {settings.enablePostProcessing ? 'On' : 'Off'}
                </Button>
              </div>
            </div>

            <Button className="w-full bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30">
              <TrendingUp className="w-4 h-4 mr-2" />
              Auto-Optimize
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};