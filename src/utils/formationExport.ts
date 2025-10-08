/**
 * Formation Export Utility
 * 
 * Export formations to various formats (PNG, SVG, PDF)
 * for sharing, printing, and presentations
 */

import html2canvas from 'html-to-image';
import type { Player } from '../types';
import type { ProfessionalFormation } from '../data/professionalFormations';

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf';
  quality?: number; // 0-1 for PNG
  includePlayerNames?: boolean;
  includeStats?: boolean;
  includeFormationInfo?: boolean;
  backgroundColor?: string;
  watermark?: string;
}

/**
 * Export formation to image
 */
export async function exportFormationToImage(
  elementId: string,
  filename: string,
  options: ExportOptions = { format: 'png' }
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found`);
  }

  try {
    let dataUrl: string;

    if (options.format === 'svg') {
      dataUrl = await html2canvas.toSvg(element, {
        backgroundColor: options.backgroundColor || '#0a4d2e',
        cacheBust: true,
      });
    } else {
      // PNG
      dataUrl = await html2canvas.toPng(element, {
        quality: options.quality || 0.95,
        backgroundColor: options.backgroundColor || '#0a4d2e',
        cacheBust: true,
        pixelRatio: 2, // Higher resolution
      });
    }

    // Download the image
    downloadFile(dataUrl, `${filename}.${options.format}`);
  } catch (error) {
    console.error('Error exporting formation:', error);
    throw new Error('Failed to export formation');
  }
}

/**
 * Export formation to PDF
 */
export async function exportFormationToPDF(
  elementId: string,
  formation: ProfessionalFormation,
  players: Player[],
  filename: string
): Promise<void> {
  // For PDF, we'll first export to PNG, then create a PDF
  // This is a simplified version - full PDF export would require jsPDF library
  
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found`);
  }

  try {
    const dataUrl = await html2canvas.toPng(element, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      cacheBust: true,
      pixelRatio: 3, // Very high resolution for PDF
    });

    // For now, download as high-res PNG
    // TODO: Integrate jsPDF for proper PDF generation
    downloadFile(dataUrl, `${filename}.png`);
    
    console.log('PDF export: Downloaded as high-res PNG. Full PDF export requires jsPDF integration.');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export to PDF');
  }
}

/**
 * Generate SVG representation of formation
 */
export function generateFormationSVG(
  formation: ProfessionalFormation,
  players: Player[],
  options: {
    width?: number;
    height?: number;
    showLabels?: boolean;
    showPlayerNames?: boolean;
  } = {}
): string {
  const width = options.width || 800;
  const height = options.height || 1200;
  const showLabels = options.showLabels ?? true;
  const showPlayerNames = options.showPlayerNames ?? false;

  const playerPositions = formation.positions.map((pos, idx) => {
    const player = players[idx];
    const x = (pos.x / 100) * width;
    const y = (pos.y / 100) * height;

    return `
      <g transform="translate(${x}, ${y})">
        <circle cx="0" cy="0" r="20" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
        ${showLabels ? `<text x="0" y="5" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold">${pos.label || pos.roleId}</text>` : ''}
        ${showPlayerNames && player ? `<text x="0" y="35" text-anchor="middle" fill="#ffffff" font-size="10">${player.name}</text>` : ''}
      </g>
    `;
  }).join('\n');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- Field Background -->
      <rect width="${width}" height="${height}" fill="#0a4d2e"/>
      
      <!-- Field Lines -->
      <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="#ffffff" stroke-width="2" opacity="0.3"/>
      <circle cx="${width/2}" cy="${height/2}" r="${width * 0.12}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3"/>
      <rect x="0" y="0" width="${width}" height="${height * 0.15}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3"/>
      <rect x="0" y="${height * 0.85}" width="${width}" height="${height * 0.15}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3"/>
      
      <!-- Players -->
      ${playerPositions}
      
      <!-- Formation Name -->
      <text x="${width/2}" y="30" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="bold">${formation.displayName}</text>
    </svg>
  `.trim();
}

/**
 * Helper to download file
 */
function downloadFile(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Export formation data as JSON
 */
export function exportFormationJSON(
  formation: ProfessionalFormation,
  players: Player[]
): string {
  const exportData = {
    formation: {
      id: formation.id,
      name: formation.name,
      displayName: formation.displayName,
      category: formation.category,
      positions: formation.positions,
    },
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      roleId: p.roleId,
      overall: p.overall,
      jerseyNumber: p.jerseyNumber,
    })),
    exportDate: new Date().toISOString(),
    version: '1.0',
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Share formation as text (for clipboard or social media)
 */
export function generateFormationShareText(
  formation: ProfessionalFormation,
  players: Player[]
): string {
  const playerList = formation.positions
    .map((pos, idx) => {
      const player = players[idx];
      return `${pos.label}: ${player?.name || 'Empty'} (${player?.overall || 'N/A'})`;
    })
    .join('\n');

  return `
${formation.displayName}

${formation.description}

Lineup:
${playerList}

Strengths: ${formation.strengths.join(', ')}
Weaknesses: ${formation.weaknesses.join(', ')}

Created with Astral Turf
`.trim();
}

