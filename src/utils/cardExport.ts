import html2canvas from 'html2canvas';
import type { Player } from '../../types/player';
import type { PlayerRankingProfile } from '../../types/challenges';
import type { CardRarity } from '../ranking/EnhancedPlayerRankingCard';

export interface CardExportOptions {
  player: Player;
  profile: PlayerRankingProfile;
  rarity: CardRarity;
  includeWatermark?: boolean;
  watermarkText?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
  width?: number;
  height?: number;
}

export interface ExportResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  error?: string;
}

/**
 * Export a player card as an image
 */
export const exportPlayerCard = async (
  element: HTMLElement,
  options: Partial<CardExportOptions> = {},
): Promise<ExportResult> => {
  try {
    const {
      includeWatermark = true,
      watermarkText = 'Astral Turf',
      format = 'png',
      quality = 0.95,
      width = 1200,
      height = 630,
    } = options;

    // Create canvas from element
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    // Create final canvas with desired dimensions
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const ctx = finalCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill background with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0F172A'); // slate-900
    gradient.addColorStop(1, '#1E293B'); // slate-800
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Calculate scaling to fit card
    const scale = Math.min(
      (width * 0.8) / canvas.width,
      (height * 0.8) / canvas.height,
    );
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;

    // Draw card
    ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

    // Add watermark
    if (includeWatermark) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(watermarkText, width - 30, height - 30);
      ctx.restore();
    }

    // Convert to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      finalCanvas.toBlob(
        (b) => resolve(b),
        format === 'png' ? 'image/png' : 'image/jpeg',
        quality,
      );
    });

    if (!blob) {
      throw new Error('Failed to create blob');
    }

    const dataUrl = finalCanvas.toDataURL(
      format === 'png' ? 'image/png' : 'image/jpeg',
      quality,
    );

    return {
      success: true,
      dataUrl,
      blob,
    };
  } catch (error) {
    console.error('Failed to export card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Download exported card as file
 */
export const downloadCardImage = (
  dataUrl: string,
  filename: string = 'player-card.png',
): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Share card via Web Share API
 */
export const shareCardImage = async (
  blob: Blob,
  player: Player,
  profile: PlayerRankingProfile,
): Promise<boolean> => {
  if (!navigator.share) {
    console.warn('Web Share API not supported');
    return false;
  }

  try {
    const file = new File([blob], `${player.name}-card.png`, {
      type: 'image/png',
    });

    await navigator.share({
      title: `${player.name} - Level ${profile.currentLevel}`,
      text: `Check out my player card! Level ${profile.currentLevel} with ${profile.totalXP.toLocaleString()} XP!`,
      files: [file],
    });

    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Failed to share card:', error);
    }
    return false;
  }
};

/**
 * Copy card image to clipboard
 */
export const copyCardToClipboard = async (blob: Blob): Promise<boolean> => {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    console.warn('Clipboard API not supported');
    return false;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy card to clipboard:', error);
    return false;
  }
};

/**
 * Generate card filename based on player data
 */
export const generateCardFilename = (
  player: Player,
  profile: PlayerRankingProfile,
  rarity: CardRarity,
): string => {
  const sanitizedName = player.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  return `${sanitizedName}-${rarity}-lvl${profile.currentLevel}-${timestamp}.png`;
};

/**
 * Batch export multiple player cards
 */
export const batchExportCards = async (
  elements: HTMLElement[],
  options: Partial<CardExportOptions> = {},
): Promise<ExportResult[]> => {
  const results: ExportResult[] = [];

  for (const element of elements) {
    const result = await exportPlayerCard(element, options);
    results.push(result);
    // Small delay to avoid overwhelming the browser
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
};

/**
 * Create a social media optimized card image
 */
export const exportSocialCard = async (
  element: HTMLElement,
  options: Partial<CardExportOptions> = {},
): Promise<ExportResult> => {
  // Social media optimal dimensions
  const socialDimensions = {
    twitter: { width: 1200, height: 675 },
    instagram: { width: 1080, height: 1080 },
    facebook: { width: 1200, height: 630 },
  };

  return exportPlayerCard(element, {
    ...options,
    width: socialDimensions.facebook.width,
    height: socialDimensions.facebook.height,
    format: 'jpeg',
    quality: 0.9,
  });
};
