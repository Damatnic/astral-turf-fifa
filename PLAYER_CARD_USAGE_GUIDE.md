# Player Ranking Cards - Usage Guide

## 🎯 Quick Start

### Installation

```bash
npm install html2canvas
```

### Basic Imports

```tsx
import EnhancedPlayerRankingCard from '@/components/ranking/EnhancedPlayerRankingCard';
import PlayerCardComparison from '@/components/ranking/PlayerCardComparison';
import PlayerStatRadar from '@/components/ranking/PlayerStatRadar';
import PlayerCardShowcase from '@/components/ranking/PlayerCardShowcase';
```

## 🎴 Component Examples

### 1. Enhanced Player Card - Single View

**Common Card (Simple)**
```tsx
<EnhancedPlayerRankingCard
  player={player}
  profile={profile}
  rarity="common"
  is3D={true}
  showStats={true}
/>
```

**Legendary Card (Premium)**
```tsx
<EnhancedPlayerRankingCard
  player={player}
  profile={profile}
  rarity="legendary"
  is3D={true}
  showStats={true}
  rank={1}
/>
```

**With Previous Stats (Show Progress)**
```tsx
<EnhancedPlayerRankingCard
  player={player}
  profile={profile}
  rarity="epic"
  previousStats={{
    level: 45,
    totalXP: 180000,
    weeklyXP: 3500,
  }}
/>
```

**Compact List Mode**
```tsx
{players.map((p, idx) => (
  <EnhancedPlayerRankingCard
    key={p.id}
    player={p.player}
    profile={p.profile}
    rarity={p.rarity}
    compact={true}
    rank={idx + 1}
    onFlip={() => selectPlayer(p)}
  />
))}
```

### 2. Card Comparison

**2 Players**
```tsx
<PlayerCardComparison
  players={[
    { player: player1, profile: profile1, rarity: 'legendary' },
    { player: player2, profile: profile2, rarity: 'epic' },
  ]}
  onClose={() => setShowComparison(false)}
/>
```

**4 Players (Full Grid)**
```tsx
<PlayerCardComparison
  players={[
    { player: player1, profile: profile1, rarity: 'legendary' },
    { player: player2, profile: profile2, rarity: 'epic' },
    { player: player3, profile: profile3, rarity: 'rare' },
    { player: player4, profile: profile4, rarity: 'uncommon' },
  ]}
  maxPlayers={4}
  onClose={closeComparison}
/>
```

### 3. Stat Radar Chart

**Single Player**
```tsx
<PlayerStatRadar
  player={player}
  size={300}
  color="#A855F7"
  backgroundColor="rgba(168, 85, 247, 0.1)"
  animated={true}
  showLabels={true}
/>
```

**Two Player Comparison**
```tsx
<PlayerStatRadar
  player={player1}
  comparisonPlayer={player2}
  size={400}
  color="#3B82F6"
  comparisonColor="#10B981"
  animated={true}
/>
```

**Rarity-Based Colors**
```tsx
const rarityColors = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#FBB040',
};

<PlayerStatRadar
  player={player}
  color={rarityColors[rarity]}
  size={350}
/>
```

### 4. Complete Showcase

**Full Featured**
```tsx
<PlayerCardShowcase
  player={player}
  profile={profile}
  rarity="legendary"
  comparisonPlayers={[
    { player: rival1, profile: profile1, rarity: 'epic' },
    { player: rival2, profile: profile2, rarity: 'rare' },
  ]}
/>
```

**Export Only Mode**
```tsx
import { useRef } from 'react';
import { exportPlayerCard, downloadCardImage, generateCardFilename } from '@/utils/cardExport';

function ExportableCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!cardRef.current) return;
    
    const result = await exportPlayerCard(cardRef.current, {
      player,
      profile,
      rarity,
      format: 'png',
      quality: 0.95,
      includeWatermark: true,
    });

    if (result.success && result.dataUrl) {
      const filename = generateCardFilename(player, profile, rarity);
      downloadCardImage(result.dataUrl, filename);
    }
  };

  return (
    <div>
      <div ref={cardRef}>
        <EnhancedPlayerRankingCard
          player={player}
          profile={profile}
          rarity={rarity}
        />
      </div>
      <button onClick={handleExport}>Download PNG</button>
    </div>
  );
}
```

## 🎨 Customization Examples

### Dynamic Rarity Assignment

```tsx
function getRarity(level: number): CardRarity {
  if (level >= 90) return 'legendary';
  if (level >= 70) return 'epic';
  if (level >= 50) return 'rare';
  if (level >= 30) return 'uncommon';
  return 'common';
}

<EnhancedPlayerRankingCard
  player={player}
  profile={profile}
  rarity={getRarity(profile.currentLevel)}
/>
```

### Animated Card Grid

```tsx
import { motion } from 'framer-motion';

<motion.div 
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }}
>
  {players.map((p, idx) => (
    <motion.div
      key={p.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <EnhancedPlayerRankingCard
        player={p.player}
        profile={p.profile}
        rarity={p.rarity}
        rank={idx + 1}
      />
    </motion.div>
  ))}
</motion.div>
```

### Interactive Card Flip

```tsx
import { useState } from 'react';

function InteractiveCard() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div onClick={() => setIsFlipped(!isFlipped)}>
      <EnhancedPlayerRankingCard
        player={player}
        profile={profile}
        rarity="epic"
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
      />
    </div>
  );
}
```

### Leaderboard with Cards

```tsx
function Leaderboard({ players }: { players: PlayerData[] }) {
  const sortedPlayers = players
    .sort((a, b) => b.profile.totalXP - a.profile.totalXP)
    .slice(0, 10);

  return (
    <div className="space-y-3">
      {sortedPlayers.map((p, idx) => (
        <EnhancedPlayerRankingCard
          key={p.id}
          player={p.player}
          profile={p.profile}
          rarity={getRarity(p.profile.currentLevel)}
          rank={idx + 1}
          compact={true}
        />
      ))}
    </div>
  );
}
```

## 🚀 Advanced Usage

### Custom Export Settings

```tsx
import { exportSocialCard } from '@/utils/cardExport';

// Export for Instagram (Square)
const exportForInstagram = async (element: HTMLElement) => {
  return await exportPlayerCard(element, {
    width: 1080,
    height: 1080,
    format: 'jpeg',
    quality: 0.9,
    includeWatermark: true,
    watermarkText: 'Astral Turf',
  });
};

// Export for Twitter (16:9)
const exportForTwitter = async (element: HTMLElement) => {
  return await exportPlayerCard(element, {
    width: 1200,
    height: 675,
    format: 'png',
    quality: 0.95,
  });
};

// Use social media preset
const result = await exportSocialCard(cardElement, {
  player,
  profile,
  rarity,
});
```

### Batch Export

```tsx
import { batchExportCards } from '@/utils/cardExport';

async function exportTeam(playerCards: HTMLElement[]) {
  const results = await batchExportCards(playerCards, {
    format: 'png',
    quality: 0.9,
    includeWatermark: true,
  });

  results.forEach((result, idx) => {
    if (result.success && result.dataUrl) {
      downloadCardImage(result.dataUrl, `player-${idx + 1}.png`);
    }
  });
}
```

### Share with Web Share API

```tsx
import { shareCardImage } from '@/utils/cardExport';

async function handleShare(cardElement: HTMLElement) {
  const result = await exportPlayerCard(cardElement, {
    player,
    profile,
    rarity,
  });

  if (result.success && result.blob) {
    const shared = await shareCardImage(result.blob, player, profile);
    
    if (shared) {
      console.log('Card shared successfully!');
    } else {
      // Fallback to download
      if (result.dataUrl) {
        downloadCardImage(result.dataUrl);
      }
    }
  }
}
```

### Copy to Clipboard

```tsx
import { copyCardToClipboard } from '@/utils/cardExport';

async function handleCopy(cardElement: HTMLElement) {
  const result = await exportPlayerCard(cardElement);

  if (result.success && result.blob) {
    const copied = await copyCardToClipboard(result.blob);
    
    if (copied) {
      // Show success toast
      showToast('Card copied to clipboard!');
    }
  }
}
```

## 📱 Responsive Layouts

### Mobile First

```tsx
<div className="container mx-auto p-4">
  {/* Mobile: Stack vertically */}
  <div className="block md:hidden space-y-4">
    {players.map(p => (
      <EnhancedPlayerRankingCard
        key={p.id}
        player={p.player}
        profile={p.profile}
        rarity={p.rarity}
        compact={true}
      />
    ))}
  </div>

  {/* Desktop: Grid layout */}
  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {players.map(p => (
      <EnhancedPlayerRankingCard
        key={p.id}
        player={p.player}
        profile={p.profile}
        rarity={p.rarity}
      />
    ))}
  </div>
</div>
```

### Modal Comparison

```tsx
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

function ComparisonModal() {
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  return (
    <>
      <button onClick={() => setShowComparison(true)}>
        Compare Players
      </button>

      <AnimatePresence>
        {showComparison && (
          <PlayerCardComparison
            players={selectedPlayers}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
```

## 🎭 Animation Control

### Disable Animations

```tsx
<EnhancedPlayerRankingCard
  player={player}
  profile={profile}
  rarity="rare"
  is3D={false} // Disable 3D tilt
/>

<PlayerStatRadar
  player={player}
  animated={false} // Disable draw animation
/>
```

### Custom Animation Duration

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.8, ease: 'easeOut' }}
>
  <EnhancedPlayerRankingCard
    player={player}
    profile={profile}
    rarity="legendary"
  />
</motion.div>
```

## 🎯 Best Practices

### 1. Memoize Expensive Components

```tsx
import { memo } from 'react';

const MemoizedCard = memo(EnhancedPlayerRankingCard);

// In parent component
{players.map(p => (
  <MemoizedCard
    key={p.id}
    player={p.player}
    profile={p.profile}
    rarity={p.rarity}
  />
))}
```

### 2. Lazy Load Comparison View

```tsx
import { lazy, Suspense } from 'react';

const PlayerCardComparison = lazy(() => 
  import('@/components/ranking/PlayerCardComparison')
);

function ComparisonView() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PlayerCardComparison players={players} />
    </Suspense>
  );
}
```

### 3. Virtualize Long Lists

```tsx
import { FixedSizeList } from 'react-window';

function VirtualizedCardList({ players }: { players: PlayerData[] }) {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <EnhancedPlayerRankingCard
        player={players[index].player}
        profile={players[index].profile}
        rarity={players[index].rarity}
        compact={true}
      />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={players.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

## 🔧 Troubleshooting

### Issue: Export not working

```tsx
// Make sure element is rendered before exporting
const handleExport = async () => {
  // Wait for next frame
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  if (!cardRef.current) {
    console.error('Card element not found');
    return;
  }

  const result = await exportPlayerCard(cardRef.current);
  // ... handle result
};
```

### Issue: Images not showing in export

```tsx
// Enable CORS for external images
<EnhancedPlayerRankingCard
  player={{
    ...player,
    // Use data URL or same-origin images
    photo: dataUrlOrLocalPath,
  }}
  profile={profile}
  rarity="epic"
/>
```

### Issue: 3D effect not smooth

```tsx
// Increase transform performance
<div className="transform-gpu">
  <EnhancedPlayerRankingCard
    player={player}
    profile={profile}
    rarity="legendary"
    is3D={true}
  />
</div>
```

## 📊 Performance Tips

1. **Use compact mode for lists** (80% faster rendering)
2. **Disable 3D for low-end devices** (check `navigator.deviceMemory`)
3. **Lazy load comparison** (only when opened)
4. **Virtualize long lists** (render only visible items)
5. **Memoize static cards** (prevent unnecessary re-renders)
6. **Batch exports** (use small delays between cards)

---

**Need help?** Check the full documentation in `PLAYER_RANKING_CARDS_COMPLETE.md`
