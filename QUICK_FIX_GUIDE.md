# Quick Fix Guide - Tactical Board

**Priority**: Complete before deployment  
**Estimated Time**: 4-6 hours

---

## 🔥 Critical Fixes Needed

### 1. Add SwapMode to UI Types (15 min)

**File**: `src/types/index.ts`

Add to UIState interface:
```typescript
swapMode?: {
  enabled: boolean;
  sourcePlayerId: string | null;
};
```

Add to UIAction type:
```typescript
| { type: 'SET_SWAP_MODE'; payload: { enabled: boolean; playerId: string } }
| { type: 'COMPLETE_SWAP' }
```

**File**: `src/context/reducers/uiReducer.ts`

Add cases:
```typescript
case 'SET_SWAP_MODE':
  return {
    ...state,
    swapMode: {
      enabled: action.payload.enabled,
      sourcePlayerId: action.payload.playerId,
    },
  };

case 'COMPLETE_SWAP':
  return {
    ...state,
    swapMode: { enabled: false, sourcePlayerId: null },
  };
```

---

### 2. Add Player Instructions Panel (15 min)

**File**: `src/types/index.ts`

Update PanelKey type:
```typescript
export type PanelKey =
  | 'formationTemplates'
  | 'aiAssistant'
  | 'tacticalPlaybook'
  | 'analytics'
  | 'aiAnalysis'
  | 'dugout'
  | 'challenges'
  | 'collaboration'
  | 'exportImport'
  | 'aiIntelligence'
  | 'quickStart'
  | 'keyboardShortcuts'
  | 'history'
  | 'playerInstructions'; // ADD THIS
```

---

### 3. Fix Preset Player Type (30 min)

**File**: `src/components/tactics/UnifiedTacticsBoard.tsx` (line 872)

Replace:
```typescript
const newPlayers: Player[] = preset.players.map((presetPlayer, index) => {
```

With:
```typescript
const newPlayers: Player[] = preset.players.map((presetPlayer, index) => {
  const attributes: PlayerAttributes = {
    speed: presetPlayer.attributes?.speed ?? 50,
    passing: presetPlayer.attributes?.passing ?? 50,
    tackling: presetPlayer.attributes?.tackling ?? 50,
    shooting: presetPlayer.attributes?.shooting ?? 50,
    dribbling: presetPlayer.attributes?.dribbling ?? 50,
    physicalStrength: presetPlayer.attributes?.physicalStrength ?? 50,
    positioning: presetPlayer.attributes?.positioning ?? 50,
  };

  return {
    ...presetPlayer,
    attributes,
  } as Player;
});
```

---

### 4. Fix History System Call (10 min)

**File**: `src/components/tactics/UnifiedTacticsBoard.tsx` (line 1010)

Replace:
```typescript
historySystem.saveSnapshot(
  createHistorySnapshot(newFormation, newPlayers, `Applied preset: ${preset.metadata.name}`),
);
```

With:
```typescript
// Check what methods are available on historySystem
// Option 1: If there's an addState method
historySystem.addState?.({
  formation: newFormation,
  players: newPlayers,
  drawings: [],
});

// Option 2: If history is automatic, just remove this call
```

---

### 5. Fix UPDATE_STATE Dispatches (20 min)

**File**: `src/components/tactics/UnifiedTacticsBoard.tsx`

Replace all instances of:
```typescript
tacticsDispatch({ type: 'UPDATE_STATE', payload: {...} } as any);
```

With proper action types:
```typescript
// Line 330, 334
tacticsDispatch({ 
  type: 'UPDATE_FORMATION', 
  payload: { 
    id: activeFormationId || 'default', 
    formation: state.formation 
  } 
});

tacticsDispatch({ 
  type: 'UPDATE_DRAWINGS', 
  payload: state.drawings 
});

// Or check what actions are available in tacticsReducer
```

---

## 🧹 Quick Cleanup (30 min)

### Remove Unused Imports

**File**: `src/components/tactics/UnifiedTacticsBoard.tsx`

Remove these lines:
```typescript
// Line 7
memo,

// Line 17 - duplicate import
import type { HistoryState } from '../../hooks/useFormationHistory';

// Line 22
useKeyboardNavigation,

// Line 34
import PlayerDisplaySettings, { PlayerDisplayConfig } from './PlayerDisplaySettings';

// Line 37
import PositionalBench from './PositionalBench';

// Line 42 - duplicate, merge with other import
import { type Player, type Formation, type Team, type PlayerAttributes } from '../../types';

// Line 66-73
useVirtualization,
createWebWorker,
useCachedFormation,
formationCache,
playerCache,

// Line 76-77
import { useOptimizedRaf } from '../../utils/animationOptimizations';
import { useVirtualList, useIntersectionObserver } from '../../utils/virtualizationOptimizations';

// Line 101
Settings,

// Line 114
Pen,
```

### Remove Unused Variables

```typescript
// Line 134 - remove type alias
type ViewMode = 'standard' | 'fullscreen' | 'presentation';

// Line 145
const { isMobile, isTablet, isTouchDevice, prefersReducedMotion } = useResponsive();
// Change to:
const { isMobile, isTablet, prefersReducedMotion } = useResponsive();

// Line 210 - remove function
const installPWA = useCallback(async () => { ... }, []);

// Line 239-241 - remove unused destructured vars
const { theme, isDark } = useTheme(); // Remove
const { reducedMotion, highContrast, shouldAnimate } = useAccessibility(); // Remove
const motionSafe = useMotionSafe(); // Remove

// Line 245
const renderStartTime = useRef(Date.now()); // Remove

// Line 307
const benchPlayers = useMemo(() => { ... }, []); // Remove

// Line 317
const showAIIntelligence = panels.aiIntelligence; // Remove

// Line 366
const lastUpdateTime = useRef(Date.now()); // Remove

// Line 399
const [containerRef, isIntersecting] = useIntersectionObserver({ ... }); // Remove
```

---

## 🔧 Add Type Guards (15 min)

**File**: `src/components/tactics/UnifiedTacticsBoard.tsx`

Add at top of file:
```typescript
const isBrowser = typeof window !== 'undefined';

const safeRequestAnimationFrame = (callback: FrameRequestCallback): number => {
  if (isBrowser && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16) as unknown as number;
};

const safeCancelAnimationFrame = (id: number): void => {
  if (isBrowser && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};
```

Then replace:
```typescript
// Line 508
cancelAnimationFrame(animationFrameRef.current);
// With:
safeCancelAnimationFrame(animationFrameRef.current);

// Line 511
animationFrameRef.current = requestAnimationFrame(() => {
// With:
animationFrameRef.current = safeRequestAnimationFrame(() => {
```

---

## 🚫 Remove Console Statements (10 min)

Replace all console.log/warn with proper logging or comments:

```typescript
// Line 256
console.warn(`[Performance] Slow component mount: ${mountTime}ms`);
// Replace with:
// Performance monitoring disabled in production

// Line 498
console.warn('Worker validation failed, falling back to sync:', error);
// Replace with error boundary or remove

// Line 603
console.log('Finding alternative position for', targetPlayer.name);
// Replace with:
// Auto-positioning player to alternative slot
```

---

## ✅ Verification Checklist

After making changes:

```bash
# 1. Check TypeScript errors
npm run build

# 2. Fix any new errors
# Edit files as needed

# 3. Test locally
npm run dev -- --port 8000

# 4. Verify in browser
# - No console errors
# - Tactical board loads
# - Player selection works
# - No TypeScript warnings

# 5. Commit changes
git add .
git commit -m "fix: resolve tactical board TypeScript errors"

# 6. Deploy
vercel --prod
```

---

## ⏱️ Time Estimates

| Task | Time | Priority |
|------|------|----------|
| SwapMode types | 15 min | 🔥 Critical |
| Player instructions panel | 15 min | 🔥 Critical |
| Preset player types | 30 min | 🔥 Critical |
| History system call | 10 min | 🔥 Critical |
| UPDATE_STATE fixes | 20 min | 🔥 Critical |
| Remove unused imports | 30 min | 🟡 High |
| Type guards | 15 min | 🟡 High |
| Remove console | 10 min | 🟢 Medium |

**Total**: ~2.5 hours for critical fixes  
**Total**: ~4 hours including cleanup

---

**Start with the critical fixes first, then verify everything works before cleanup!**
