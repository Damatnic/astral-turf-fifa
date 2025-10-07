import type { TacticalPreset, PlayerPresetData } from '../types/presets';

/**
 * Generates a thumbnail image for a tactical preset
 */
export function generatePresetThumbnail(preset: TacticalPreset, width = 400, height = 300): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  // Draw field background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a3d29');
  gradient.addColorStop(1, '#0a2d1f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw field lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;

  // Border
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Center line
  ctx.beginPath();
  ctx.moveTo(width / 2, 10);
  ctx.lineTo(width / 2, height - 10);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
  ctx.stroke();

  // Penalty boxes
  ctx.strokeRect(10, height / 2 - 40, 40, 80);
  ctx.strokeRect(width - 50, height / 2 - 40, 40, 80);

  // Draw players
  preset.players.forEach((player: PlayerPresetData) => {
    const x = (player.position.x / 100) * (width - 40) + 20;
    const y = (player.position.y / 100) * (height - 40) + 20;

    // Player circle
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Player border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player number (if available)
    if (player.id) {
      const number = player.id.replace(/\D/g, '').slice(-2) || '0';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number, x, y);
    }
  });

  // Draw formation text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(preset.metadata.formation, width / 2, height - 25);

  // Convert to base64
  return canvas.toDataURL('image/png');
}

/**
 * Converts a tactical board state to preset format
 */
export function boardStateToPreset(
  name: string,
  description: string,
  category: import('../types/presets').PresetCategory,
  formation: string,
  players: Array<{ id: string; position: { x: number; y: number }; role?: string }>,
  tacticalInstructions?: import('../types/presets').TacticalInstructions,
  tags?: string[],
): Omit<TacticalPreset, 'metadata'> & {
  metadata: Omit<
    import('../types/presets').PresetMetadata,
    'id' | 'createdAt' | 'updatedAt' | 'version'
  >;
} {
  return {
    metadata: {
      name,
      description,
      category,
      formation,
      tags,
      isPublic: false,
    },
    players: players.map(p => ({
      id: p.id,
      position: p.position,
      role: p.role,
    })),
    tacticalInstructions: tacticalInstructions || {},
  };
}

/**
 * Applies a preset to the tactical board
 */
export function applyPresetToBoard(
  preset: TacticalPreset,
  onUpdatePlayer: (id: string, position: { x: number; y: number }, role?: string) => void,
): void {
  preset.players.forEach(player => {
    onUpdatePlayer(player.id, player.position, player.role);
  });
}

/**
 * Validates preset data structure
 */
export function validatePreset(data: unknown): data is TacticalPreset {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const preset = data as Partial<TacticalPreset>;

  // Check metadata
  if (!preset.metadata || typeof preset.metadata !== 'object') {
    return false;
  }

  const metadata = preset.metadata as Partial<import('../types/presets').PresetMetadata>;
  if (!metadata.name || !metadata.category || !metadata.formation) {
    return false;
  }

  // Check players array
  if (!Array.isArray(preset.players)) {
    return false;
  }

  // Validate each player
  for (const player of preset.players) {
    if (
      !player.id ||
      !player.position ||
      typeof player.position.x !== 'number' ||
      typeof player.position.y !== 'number'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Gets default preset templates
 */
export function getDefaultPresets(): Array<
  Omit<TacticalPreset, 'metadata'> & {
    metadata: Omit<
      import('../types/presets').PresetMetadata,
      'id' | 'createdAt' | 'updatedAt' | 'version'
    >;
  }
> {
  return [
    // 4-3-3 Attacking
    {
      metadata: {
        name: '4-3-3 High Press',
        description: 'Aggressive attacking formation with high defensive line',
        category: 'attacking',
        formation: '4-3-3',
        tags: ['high-press', 'wing-play', 'possession'],
        isPublic: true,
      },
      players: [
        { id: 'gk', position: { x: 50, y: 95 } },
        { id: 'lb', position: { x: 15, y: 75 }, role: 'Full-back' },
        { id: 'lcb', position: { x: 35, y: 80 }, role: 'Center-back' },
        { id: 'rcb', position: { x: 65, y: 80 }, role: 'Center-back' },
        { id: 'rb', position: { x: 85, y: 75 }, role: 'Full-back' },
        { id: 'cdm', position: { x: 50, y: 60 }, role: 'Defensive Mid' },
        { id: 'lcm', position: { x: 30, y: 50 }, role: 'Central Mid' },
        { id: 'rcm', position: { x: 70, y: 50 }, role: 'Central Mid' },
        { id: 'lw', position: { x: 20, y: 25 }, role: 'Winger' },
        { id: 'st', position: { x: 50, y: 20 }, role: 'Striker' },
        { id: 'rw', position: { x: 80, y: 25 }, role: 'Winger' },
      ],
      tacticalInstructions: {
        defensiveLine: 'high',
        width: 'wide',
        tempo: 'fast',
        passingStyle: 'short',
        pressingIntensity: 'high',
      },
    },

    // 4-4-2 Balanced
    {
      metadata: {
        name: '4-4-2 Classic',
        description: 'Balanced formation with solid midfield',
        category: 'balanced',
        formation: '4-4-2',
        tags: ['balanced', 'traditional', 'solid'],
        isPublic: true,
      },
      players: [
        { id: 'gk', position: { x: 50, y: 95 } },
        { id: 'lb', position: { x: 15, y: 75 }, role: 'Full-back' },
        { id: 'lcb', position: { x: 35, y: 80 }, role: 'Center-back' },
        { id: 'rcb', position: { x: 65, y: 80 }, role: 'Center-back' },
        { id: 'rb', position: { x: 85, y: 75 }, role: 'Full-back' },
        { id: 'lm', position: { x: 20, y: 50 }, role: 'Left Mid' },
        { id: 'lcm', position: { x: 40, y: 55 }, role: 'Central Mid' },
        { id: 'rcm', position: { x: 60, y: 55 }, role: 'Central Mid' },
        { id: 'rm', position: { x: 80, y: 50 }, role: 'Right Mid' },
        { id: 'lst', position: { x: 40, y: 25 }, role: 'Striker' },
        { id: 'rst', position: { x: 60, y: 25 }, role: 'Striker' },
      ],
      tacticalInstructions: {
        defensiveLine: 'medium',
        width: 'standard',
        tempo: 'medium',
        passingStyle: 'mixed',
        pressingIntensity: 'medium',
      },
    },

    // 5-3-2 Defensive
    {
      metadata: {
        name: '5-3-2 Defensive',
        description: 'Solid defensive setup with wing-backs',
        category: 'defensive',
        formation: '5-3-2',
        tags: ['defensive', 'counter-attack', 'wing-backs'],
        isPublic: true,
      },
      players: [
        { id: 'gk', position: { x: 50, y: 95 } },
        { id: 'lwb', position: { x: 10, y: 70 }, role: 'Wing-back' },
        { id: 'lcb', position: { x: 30, y: 80 }, role: 'Center-back' },
        { id: 'cb', position: { x: 50, y: 82 }, role: 'Center-back' },
        { id: 'rcb', position: { x: 70, y: 80 }, role: 'Center-back' },
        { id: 'rwb', position: { x: 90, y: 70 }, role: 'Wing-back' },
        { id: 'lcm', position: { x: 35, y: 55 }, role: 'Central Mid' },
        { id: 'cm', position: { x: 50, y: 58 }, role: 'Central Mid' },
        { id: 'rcm', position: { x: 65, y: 55 }, role: 'Central Mid' },
        { id: 'lst', position: { x: 40, y: 30 }, role: 'Striker' },
        { id: 'rst', position: { x: 60, y: 30 }, role: 'Striker' },
      ],
      tacticalInstructions: {
        defensiveLine: 'low',
        width: 'narrow',
        tempo: 'medium',
        passingStyle: 'direct',
        pressingIntensity: 'low',
        counterAttack: true,
      },
    },
  ];
}
