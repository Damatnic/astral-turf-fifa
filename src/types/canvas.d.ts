/**
 * Type declarations for node-canvas
 * Provides minimal type coverage for canvas operations used in backend APIs
 */

declare module 'canvas' {
  import { Readable } from 'stream';

  export interface Canvas {
    width: number;
    height: number;
    getContext(contextId: '2d'): CanvasRenderingContext2D;
    toBuffer(): Buffer;
    toBuffer(mimeType: string, config?: { compressionLevel?: number; filters?: number }): Buffer;
    toDataURL(): string;
    toDataURL(mimeType: string, quality?: number): string;
    createPNGStream(): Readable;
    createJPEGStream(config?: { quality?: number; progressive?: boolean }): Readable;
    createPDFStream(): Readable;
  }

  export interface CanvasRenderingContext2D {
    canvas: Canvas;
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    lineCap: 'butt' | 'round' | 'square';
    lineJoin: 'bevel' | 'round' | 'miter';
    miterLimit: number;
    lineDashOffset: number;
    font: string;
    textAlign: 'left' | 'right' | 'center' | 'start' | 'end';
    textBaseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
    direction: 'ltr' | 'rtl' | 'inherit';
    globalAlpha: number;
    globalCompositeOperation: string;
    imageSmoothingEnabled: boolean;
    imageSmoothingQuality: 'low' | 'medium' | 'high';
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;

    // Drawing methods
    clearRect(x: number, y: number, w: number, h: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeRect(x: number, y: number, w: number, h: number): void;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): TextMetrics;
    beginPath(): void;
    closePath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    bezierCurveTo(
      cp1x: number,
      cp1y: number,
      cp2x: number,
      cp2y: number,
      x: number,
      y: number
    ): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      anticlockwise?: boolean
    ): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
    ellipse(
      x: number,
      y: number,
      radiusX: number,
      radiusY: number,
      rotation: number,
      startAngle: number,
      endAngle: number,
      anticlockwise?: boolean
    ): void;
    rect(x: number, y: number, w: number, h: number): void;
    fill(): void;
    stroke(): void;
    clip(): void;
    isPointInPath(x: number, y: number): boolean;
    isPointInStroke(x: number, y: number): boolean;

    // Path methods
    setLineDash(segments: number[]): void;
    getLineDash(): number[];

    // Transform methods
    rotate(angle: number): void;
    scale(x: number, y: number): void;
    translate(x: number, y: number): void;
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    resetTransform(): void;

    // State methods
    save(): void;
    restore(): void;

    // Image methods
    drawImage(image: Canvas | Image | ImageData, dx: number, dy: number): void;
    drawImage(
      image: Canvas | Image | ImageData,
      dx: number,
      dy: number,
      dw: number,
      dh: number
    ): void;
    drawImage(
      image: Canvas | Image | ImageData,
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      dx: number,
      dy: number,
      dw: number,
      dh: number
    ): void;
    createImageData(width: number, height: number): ImageData;
    createImageData(imagedata: ImageData): ImageData;
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
    putImageData(imagedata: ImageData, dx: number, dy: number): void;
    putImageData(
      imagedata: ImageData,
      dx: number,
      dy: number,
      dirtyX: number,
      dirtyY: number,
      dirtyWidth: number,
      dirtyHeight: number
    ): void;

    // Gradient and pattern methods
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
    createRadialGradient(
      x0: number,
      y0: number,
      r0: number,
      x1: number,
      y1: number,
      r1: number
    ): CanvasGradient;
    createPattern(
      image: Canvas | Image | ImageData,
      repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' | null
    ): CanvasPattern | null;
  }

  export interface TextMetrics {
    width: number;
    actualBoundingBoxLeft: number;
    actualBoundingBoxRight: number;
    fontBoundingBoxAscent: number;
    fontBoundingBoxDescent: number;
    actualBoundingBoxAscent: number;
    actualBoundingBoxDescent: number;
    emHeightAscent: number;
    emHeightDescent: number;
    hangingBaseline: number;
    alphabeticBaseline: number;
    ideographicBaseline: number;
  }

  export interface ImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
  }

  export interface CanvasGradient {
    addColorStop(offset: number, color: string): void;
  }

  export interface CanvasPattern {
    setTransform(transform?: DOMMatrix2DInit): void;
  }

  export interface DOMMatrix2DInit {
    a?: number;
    b?: number;
    c?: number;
    d?: number;
    e?: number;
    f?: number;
    m11?: number;
    m12?: number;
    m21?: number;
    m22?: number;
    m41?: number;
    m42?: number;
  }

  export interface CanvasImage {
    src: string | Buffer;
    width: number;
    height: number;
    onload: (() => void) | null;
    onerror: ((err: Error) => void) | null;
  }

  export function createCanvas(width: number, height: number, type?: 'pdf' | 'svg'): Canvas;
  export function createImageData(width: number, height: number): ImageData;
  export function createImageData(
    data: Uint8ClampedArray,
    width: number,
    height?: number
  ): ImageData;
  export function loadImage(src: string | Buffer): Promise<CanvasImage>;

  export class Image {
    constructor(width?: number, height?: number);
    src: string | Buffer;
    width: number;
    height: number;
    onload: (() => void) | null;
    onerror: ((err: Error) => void) | null;
  }
}
