/**
 * Catalyst High-Performance Canvas Renderer
 * WebGL-accelerated rendering for thousands of tactical elements
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useAnimationFrame, useFastMemo } from '../../utils/performanceOptimizations';
import {
  useIntersectionObserver,
  useLevelOfDetail,
  useOcclusionCulling,
} from '../../utils/virtualizationOptimizations';
import type { Player, Formation } from '../../types';

interface CanvasRendererProps {
  width: number;
  height: number;
  players: Player[];
  formation?: Formation;
  viewportScale: number;
  cameraPosition: { x: number; y: number };
  onPlayerClick?: (player: Player) => void;
  enableWebGL?: boolean;
  renderMode: 'standard' | 'performance' | 'ultra';
  showTrails?: boolean;
  showHeatMap?: boolean;
  className?: string;
}

interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  gl?: WebGLRenderingContext;
  programs?: {
    player: WebGLProgram;
    trail: WebGLProgram;
    heatmap: WebGLProgram;
  };
  buffers?: {
    vertices: WebGLBuffer;
    colors: WebGLBuffer;
    indices: WebGLBuffer;
  };
  uniforms?: {
    projection: WebGLUniformLocation;
    view: WebGLUniformLocation;
    time: WebGLUniformLocation;
  };
}

interface RenderableBatch {
  type: 'player' | 'trail' | 'heatmap' | 'formation';
  items: any[];
  priority: number;
}

// WebGL Shader Sources
const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  attribute vec4 a_color;
  
  uniform mat3 u_projection;
  uniform mat3 u_view;
  uniform float u_time;
  
  varying vec4 v_color;
  
  void main() {
    vec3 position = u_projection * u_view * vec3(a_position, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = 8.0;
    v_color = a_color;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  
  varying vec4 v_color;
  uniform float u_time;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    // Smooth circle with glow effect
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
  }
`;

// Advanced WebGL Renderer Class
class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private programs: Map<string, WebGLProgram> = new Map();
  private buffers: Map<string, WebGLBuffer> = new Map();
  private uniforms: Map<string, WebGLUniformLocation> = new Map();
  private vertexData: Float32Array;
  private colorData: Float32Array;
  private indexData: Uint16Array;
  private maxVertices: number;
  private vertexCount = 0;

  constructor(canvas: HTMLCanvasElement, maxVertices = 10000) {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    this.gl = gl;
    this.maxVertices = maxVertices;
    this.vertexData = new Float32Array(maxVertices * 2); // x, y
    this.colorData = new Float32Array(maxVertices * 4); // r, g, b, a
    this.indexData = new Uint16Array(maxVertices);

    this.initializeWebGL();
  }

  private initializeWebGL(): void {
    const { gl } = this;

    // Create and compile shaders
    const vertexShader = this.createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    // Create program
    const program = this.createProgram(vertexShader, fragmentShader);
    this.programs.set('default', program);

    // Create buffers
    const vertexBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    if (!vertexBuffer || !colorBuffer || !indexBuffer) {
      throw new Error('Failed to create WebGL buffers');
    }

    this.buffers.set('vertices', vertexBuffer);
    this.buffers.set('colors', colorBuffer);
    this.buffers.set('indices', indexBuffer);

    // Get uniform locations
    const projectionUniform = gl.getUniformLocation(program, 'u_projection');
    const viewUniform = gl.getUniformLocation(program, 'u_view');
    const timeUniform = gl.getUniformLocation(program, 'u_time');

    if (projectionUniform) {
      this.uniforms.set('projection', projectionUniform);
    }
    if (viewUniform) {
      this.uniforms.set('view', viewUniform);
    }
    if (timeUniform) {
      this.uniforms.set('time', timeUniform);
    }

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Set initial viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  private createShader(type: number, source: string): WebGLShader {
    const { gl } = this;
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error('Failed to create shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation error: ${error}`);
    }

    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const { gl } = this;
    const program = gl.createProgram();

    if (!program) {
      throw new Error('Failed to create program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program linking error: ${error}`);
    }

    return program;
  }

  addVertex(x: number, y: number, r: number, g: number, b: number, a: number): void {
    if (this.vertexCount >= this.maxVertices) {
      return;
    }

    const index = this.vertexCount * 2;
    const colorIndex = this.vertexCount * 4;

    this.vertexData[index] = x;
    this.vertexData[index + 1] = y;

    this.colorData[colorIndex] = r;
    this.colorData[colorIndex + 1] = g;
    this.colorData[colorIndex + 2] = b;
    this.colorData[colorIndex + 3] = a;

    this.indexData[this.vertexCount] = this.vertexCount;
    this.vertexCount++;
  }

  render(projectionMatrix: number[], viewMatrix: number[], time: number): void {
    const { gl } = this;
    const program = this.programs.get('default');

    if (!program) {
      return;
    }

    // Clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use program
    gl.useProgram(program);

    // Set uniforms
    const projectionUniform = this.uniforms.get('projection');
    const viewUniform = this.uniforms.get('view');
    const timeUniform = this.uniforms.get('time');

    if (projectionUniform) {
      gl.uniformMatrix3fv(projectionUniform, false, projectionMatrix);
    }

    if (viewUniform) {
      gl.uniformMatrix3fv(viewUniform, false, viewMatrix);
    }

    if (timeUniform) {
      gl.uniform1f(timeUniform, time);
    }

    // Bind and update vertex buffer
    const vertexBuffer = this.buffers.get('vertices');
    const colorBuffer = this.buffers.get('colors');

    if (vertexBuffer && colorBuffer) {
      // Position attribute
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        this.vertexData.subarray(0, this.vertexCount * 2),
        gl.DYNAMIC_DRAW
      );

      const positionAttrib = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionAttrib);
      gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

      // Color attribute
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        this.colorData.subarray(0, this.vertexCount * 4),
        gl.DYNAMIC_DRAW
      );

      const colorAttrib = gl.getAttribLocation(program, 'a_color');
      gl.enableVertexAttribArray(colorAttrib);
      gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 0, 0);

      // Draw points
      gl.drawArrays(gl.POINTS, 0, this.vertexCount);
    }

    // Reset for next frame
    this.vertexCount = 0;
  }

  resize(width: number, height: number): void {
    const { gl } = this;
    gl.viewport(0, 0, width, height);
  }

  destroy(): void {
    const { gl } = this;

    // Clean up resources
    for (const program of this.programs.values()) {
      gl.deleteProgram(program);
    }

    for (const buffer of this.buffers.values()) {
      gl.deleteBuffer(buffer);
    }

    this.programs.clear();
    this.buffers.clear();
    this.uniforms.clear();
  }
}

// High-Performance Canvas Renderer Component
export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  width,
  height,
  players,
  formation,
  viewportScale,
  cameraPosition,
  onPlayerClick,
  enableWebGL = true,
  renderMode = 'standard',
  showTrails = false,
  showHeatMap = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const contextRef = useRef<RenderContext | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);

  // Intersection observer for performance
  const [containerRef, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Level of detail calculator
  const getLOD = useLevelOfDetail(cameraPosition, {
    highDetail: 100 / viewportScale,
    mediumDetail: 300 / viewportScale,
    lowDetail: 600 / viewportScale,
  });

  // Occlusion culling
  const isVisible_culling = useOcclusionCulling({
    x: cameraPosition.x - width / 2 / viewportScale,
    y: cameraPosition.y - height / 2 / viewportScale,
    width: width / viewportScale,
    height: height / viewportScale,
  });

  // Memoized render batches
  const renderBatches = useFastMemo(() => {
    const batches: RenderableBatch[] = [];

    // Filter and batch players by LOD
    const visiblePlayers = players.filter(player => {
      const playerBounds = {
        x: player.position.x - 5,
        y: player.position.y - 5,
        width: 10,
        height: 10,
      };

      return isVisible_culling(playerBounds);
    });

    // Group players by detail level
    const highDetailPlayers = visiblePlayers.filter(p => getLOD(p.position) === 'high');
    const mediumDetailPlayers = visiblePlayers.filter(p => getLOD(p.position) === 'medium');
    const lowDetailPlayers = visiblePlayers.filter(p => getLOD(p.position) === 'low');

    if (highDetailPlayers.length > 0) {
      batches.push({
        type: 'player',
        items: highDetailPlayers,
        priority: 3,
      });
    }

    if (mediumDetailPlayers.length > 0) {
      batches.push({
        type: 'player',
        items: mediumDetailPlayers,
        priority: 2,
      });
    }

    if (lowDetailPlayers.length > 0) {
      batches.push({
        type: 'player',
        items: lowDetailPlayers,
        priority: 1,
      });
    }

    return batches.sort((a, b) => b.priority - a.priority);
  }, [players, viewportScale, cameraPosition, width, height]);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    try {
      if (enableWebGL) {
        rendererRef.current = new WebGLRenderer(canvas, 10000);
        console.log('[CanvasRenderer] WebGL renderer initialized');
      } else {
        const ctx = canvas.getContext('2d', {
          alpha: true,
          desynchronized: true,
        });

        if (ctx) {
          contextRef.current = { canvas, ctx };
          console.log('[CanvasRenderer] 2D renderer initialized');
        }
      }
    } catch (error) {
      console.warn('[CanvasRenderer] WebGL failed, falling back to 2D:', error);

      const ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true,
      });

      if (ctx) {
        contextRef.current = { canvas, ctx };
      }
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [width, height, enableWebGL]);

  // Resize handler
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
  }, [width, height]);

  // Performance-optimized render function
  const render = useCallback(
    (time: number) => {
      if (!isVisible) {
        return;
      }

      // FPS calculation
      const deltaTime = time - lastFrameTimeRef.current;
      frameCountRef.current++;

      if (frameCountRef.current % 60 === 0) {
        fpsRef.current = Math.round(1000 / (deltaTime / 60));
      }

      lastFrameTimeRef.current = time;

      // Adaptive quality based on performance
      const targetFPS = renderMode === 'ultra' ? 120 : renderMode === 'performance' ? 60 : 30;
      const qualityScale = Math.min(1, fpsRef.current / targetFPS);

      if (rendererRef.current) {
        // WebGL rendering
        renderWithWebGL(time, qualityScale);
      } else if (contextRef.current?.ctx) {
        // Canvas 2D rendering
        renderWith2D(contextRef.current.ctx, time, qualityScale);
      }
    },
    [isVisible, renderMode, renderBatches, viewportScale, cameraPosition]
  );

  const renderWithWebGL = useCallback(
    (time: number, qualityScale: number) => {
      if (!rendererRef.current) {
        return;
      }

      // Create projection matrix (orthographic)
      const left = cameraPosition.x - width / 2 / viewportScale;
      const right = cameraPosition.x + width / 2 / viewportScale;
      const bottom = cameraPosition.y + height / 2 / viewportScale;
      const top = cameraPosition.y - height / 2 / viewportScale;

      const projectionMatrix = [
        2 / (right - left),
        0,
        0,
        0,
        2 / (top - bottom),
        0,
        -(right + left) / (right - left),
        -(top + bottom) / (top - bottom),
        1,
      ];

      const viewMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Identity for now

      // Add vertices for each render batch
      for (const batch of renderBatches) {
        if (batch.type === 'player') {
          for (const player of batch.items) {
            const lod = getLOD(player.position);
            let color = { r: 0.2, g: 0.8, b: 1.0, a: 1.0 };

            // Team colors
            if (player.team === 'home') {
              color = { r: 0.2, g: 0.8, b: 1.0, a: 1.0 };
            } else {
              color = { r: 1.0, g: 0.2, b: 0.2, a: 1.0 };
            }

            // Reduce alpha for distant players
            if (lod === 'medium') {
              color.a *= 0.8;
            }
            if (lod === 'low') {
              color.a *= 0.6;
            }

            // Scale based on quality
            if (qualityScale < 0.5 && lod !== 'high') {
              continue;
            }

            rendererRef.current.addVertex(
              player.position.x,
              player.position.y,
              color.r,
              color.g,
              color.b,
              color.a
            );
          }
        }
      }

      rendererRef.current.render(projectionMatrix, viewMatrix, time / 1000);
    },
    [renderBatches, viewportScale, cameraPosition, width, height, getLOD]
  );

  const renderWith2D = useCallback(
    (ctx: CanvasRenderingContext2D, time: number, qualityScale: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Set up coordinate system
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(viewportScale, viewportScale);
      ctx.translate(-cameraPosition.x, -cameraPosition.y);

      // Render batches
      for (const batch of renderBatches) {
        if (batch.type === 'player') {
          for (const player of batch.items) {
            const lod = getLOD(player.position);

            // Skip low detail in performance mode
            if (qualityScale < 0.5 && lod === 'low') {
              continue;
            }

            ctx.save();
            ctx.translate(player.position.x, player.position.y);

            // Draw player based on LOD
            if (lod === 'high') {
              // High detail rendering
              ctx.fillStyle = player.team === 'home' ? '#3b82f6' : '#ef4444';
              ctx.beginPath();
              ctx.arc(0, 0, 3, 0, Math.PI * 2);
              ctx.fill();

              // Player number
              ctx.fillStyle = 'white';
              ctx.font = '8px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(player.jerseyNumber.toString(), 0, 2);
            } else if (lod === 'medium') {
              // Medium detail
              ctx.fillStyle = player.team === 'home' ? '#3b82f6' : '#ef4444';
              ctx.beginPath();
              ctx.arc(0, 0, 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Low detail - just a dot
              ctx.fillStyle = player.team === 'home' ? '#3b82f6' : '#ef4444';
              ctx.fillRect(-1, -1, 2, 2);
            }

            ctx.restore();
          }
        }
      }

      ctx.restore();
    },
    [renderBatches, viewportScale, cameraPosition, width, height, getLOD]
  );

  // Animation loop
  useAnimationFrame(render);

  // Click handler
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onPlayerClick) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;

      // Convert to world coordinates
      const worldX = cameraPosition.x + (canvasX - width / 2) / viewportScale;
      const worldY = cameraPosition.y + (canvasY - height / 2) / viewportScale;

      // Find clicked player
      for (const player of players) {
        const distance = Math.sqrt(
          Math.pow(player.position.x - worldX, 2) + Math.pow(player.position.y - worldY, 2)
        );

        if (distance < 5) {
          onPlayerClick(player);
          break;
        }
      }
    },
    [players, cameraPosition, viewportScale, width, height, onPlayerClick]
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-pointer"
        style={{ imageRendering: renderMode === 'performance' ? 'pixelated' : 'auto' }}
      />

      {/* Performance overlay in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
          <div>FPS: {fpsRef.current}</div>
          <div>Players: {players.length}</div>
          <div>Visible: {renderBatches.reduce((sum, batch) => sum + batch.items.length, 0)}</div>
          <div>Renderer: {rendererRef.current ? 'WebGL' : '2D'}</div>
          <div>Mode: {renderMode}</div>
        </div>
      )}
    </div>
  );
};

export default CanvasRenderer;
