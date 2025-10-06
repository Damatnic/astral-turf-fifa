# 🎴 Player Ranking Cards - Quick Reference

## 🚀 Import & Use (Copy-Paste Ready)

### Single Card
```tsx
import EnhancedPlayerRankingCard from '@/components/ranking/EnhancedPlayerRankingCard';

<EnhancedPlayerRankingCard
  player={player}
  profile={profile}
  rarity="legendary"  // common | uncommon | rare | epic | legendary
  is3D={true}
  showStats={true}
  rank={1}
/>
```

### Comparison (2-4 Players)
```tsx
import PlayerCardComparison from '@/components/ranking/PlayerCardComparison';

<PlayerCardComparison
  players={[
    { player: p1, profile: prof1, rarity: 'legendary' },
    { player: p2, profile: prof2, rarity: 'epic' },
  ]}
  onClose={() => setShow(false)}
/>
```

### Radar Chart
```tsx
import PlayerStatRadar from '@/components/ranking/PlayerStatRadar';

<PlayerStatRadar
  player={player}
  size={300}
  color="#A855F7"
  animated={true}
/>
```

### Full Showcase
```tsx
import PlayerCardShowcase from '@/components/ranking/PlayerCardShowcase';

<PlayerCardShowcase
  player={player}
  profile={profile}
  rarity="legendary"
  comparisonPlayers={rivals}  // Array of {player, profile, rarity}
/>
```

### Export Card
```tsx
import { exportPlayerCard, downloadCardImage } from '@/utils/cardExport';

const handleExport = async () => {
  const result = await exportPlayerCard(cardRef.current, {
    player,
    profile,
    rarity,
    format: 'png',
    quality: 0.95,
  });
  
  if (result.success && result.dataUrl) {
    downloadCardImage(result.dataUrl, 'player-card.png');
  }
};
```

---

## 🎨 Rarity Tiers

| Tier | Color | Particles | Effects |
|------|-------|-----------|---------|
| `common` | Gray | 0 | None |
| `uncommon` | Green | 3 | Shimmer |
| `rare` | Blue | 5 | Shimmer |
| `epic` | Purple | 8 | Shimmer |
| `legendary` | Gold | 12 | Holographic + Shimmer |

---

## ⚙️ Props Quick Reference

### EnhancedPlayerRankingCard
```tsx
{
  player: Player;                    // Required
  profile: PlayerRankingProfile;     // Required
  rarity?: CardRarity;               // Default: 'common'
  showStats?: boolean;               // Default: true
  is3D?: boolean;                    // Default: true
  isFlipped?: boolean;               // Default: false
  onFlip?: () => void;               // Optional callback
  compact?: boolean;                 // Default: false
  rank?: number;                     // Optional leaderboard position
  previousStats?: {                  // Optional for stat changes
    level: number;
    totalXP: number;
    weeklyXP: number;
  };
}
```

### PlayerCardComparison
```tsx
{
  players: Array<{                   // Required (2-4 players)
    player: Player;
    profile: PlayerRankingProfile;
    rarity?: CardRarity;
  }>;
  onClose?: () => void;              // Optional callback
  maxPlayers?: number;               // Default: 4
}
```

### PlayerStatRadar
```tsx
{
  player: Player;                    // Required
  size?: number;                     // Default: 300
  showLabels?: boolean;              // Default: true
  color?: string;                    // Default: '#3B82F6'
  backgroundColor?: string;          // Default: 'rgba(59,130,246,0.1)'
  animated?: boolean;                // Default: true
  comparisonPlayer?: Player;         // Optional for 2-player mode
  comparisonColor?: string;          // Default: '#10B981'
}
```

### PlayerCardShowcase
```tsx
{
  player: Player;                    // Required
  profile: PlayerRankingProfile;     // Required
  rarity?: CardRarity;               // Default: 'common'
  comparisonPlayers?: Array<{        // Optional
    player: Player;
    profile: PlayerRankingProfile;
    rarity?: CardRarity;
  }>;
}
```

---

## 🎯 Common Patterns

### Leaderboard List
```tsx
{topPlayers.map((p, idx) => (
  <EnhancedPlayerRankingCard
    key={p.id}
    player={p.player}
    profile={p.profile}
    rarity={p.rarity}
    rank={idx + 1}
    compact={true}
  />
))}
```

### Dynamic Rarity
```tsx
const getRarity = (level: number) => {
  if (level >= 90) return 'legendary';
  if (level >= 70) return 'epic';
  if (level >= 50) return 'rare';
  if (level >= 30) return 'uncommon';
  return 'common';
};
```

### With Modal
```tsx
const [show, setShow] = useState(false);

<button onClick={() => setShow(true)}>Compare</button>

<AnimatePresence>
  {show && (
    <PlayerCardComparison
      players={players}
      onClose={() => setShow(false)}
    />
  )}
</AnimatePresence>
```

---

## 📤 Export Options

### Download PNG
```tsx
downloadCardImage(dataUrl, 'player-card.png');
```

### Share (Native Dialog)
```tsx
await shareCardImage(blob, player, profile);
```

### Copy to Clipboard
```tsx
await copyCardToClipboard(blob);
```

### Social Media
```tsx
await exportSocialCard(element, {
  format: 'jpeg',
  quality: 0.9,
  width: 1200,
  height: 630,
});
```

---

## 🎬 Animation Control

### Disable 3D
```tsx
<EnhancedPlayerRankingCard {...props} is3D={false} />
```

### Disable Radar Animation
```tsx
<PlayerStatRadar {...props} animated={false} />
```

### Reduce Motion (Auto-detected)
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations automatically disabled */
}
```

---

## 🔧 Troubleshooting

### Card not exporting?
```tsx
// Wait for render before exporting
await new Promise(resolve => requestAnimationFrame(resolve));
```

### CORS errors on export?
```tsx
// Use data URLs or same-origin images
player.photo = dataUrlOrLocalPath;
```

### Slow performance?
```tsx
// Use compact mode for lists
<EnhancedPlayerRankingCard compact={true} />

// Disable 3D for low-end devices
<EnhancedPlayerRankingCard is3D={false} />
```

---

## 📊 Performance Tips

1. **Lists**: Use `compact={true}`
2. **Mobile**: Disable 3D effects
3. **Export**: Add loading states
4. **Comparison**: Limit to 2-3 players on mobile
5. **Batch Export**: Add 100ms delays

---

## 🎨 Customization

### Custom Colors
```tsx
const colors = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#FBB040',
};

<PlayerStatRadar color={colors[rarity]} />
```

### Custom Size
```tsx
<PlayerStatRadar size={400} />  // Larger radar
<PlayerStatRadar size={200} />  // Smaller radar
```

---

## 📚 Documentation

- **Full Docs**: `PLAYER_RANKING_CARDS_COMPLETE.md`
- **Usage Guide**: `PLAYER_CARD_USAGE_GUIDE.md`
- **Summary**: `PLAYER_CARDS_IMPLEMENTATION_SUMMARY.md`

---

**Built with**: React 18, TypeScript, Framer Motion, Tailwind CSS, html2canvas  
**Total Code**: 1,850+ lines across 5 components  
**Status**: ✅ Production Ready
