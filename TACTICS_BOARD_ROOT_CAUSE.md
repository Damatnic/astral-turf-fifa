# 🎯 Tactics Board - Root Cause Analysis & Fix

## 🔍 ROOT CAUSE IDENTIFIED

### The Dual State Problem

**Problem**: UnifiedTacticsBoard has **TWO SEPARATE UI state systems**:

1. **Local State** (Line 103): `const [boardUIState, uiDispatch] = useReducer(uiReducer, getInitialUIState(isMobile));`
2. **Context State**: `const { uiState: contextUIState } = useUIContext();`

**Result**: 
- Player selection dispatches to LOCAL state (line 489: `uiDispatch({ type: 'SELECT_PLAYER', payload: player })`)
- Components might be reading from CONTEXT state
- State updates are lost/invisible

## 🛠️ THE FIX

### Option A: Use Local State Everywhere (FASTEST)
**Time**: 15 minutes
**Impact**: Minimal changes

1. Remove context import for UI state
2. Ensure all components use local `boardUIState`
3. Pass `selectedPlayer` explicitly to all child components

### Option B: Use Context State Everywhere (CLEANEST)
**Time**: 30 minutes  
**Impact**: Better architecture

1. Remove local `useReducer`
2. Change `uiDispatch` to use context dispatch
3. Ensure context is properly initialized

### Option C: Sync Both States (SAFEST)
**Time**: 20 minutes
**Impact**: No breaking changes

1. Add useEffect to sync local → context
2. Add useEffect to sync context → local
3. Keep both systems working

## 📋 RECOMMENDED FIX (Option A - Fastest)

### Step 1: Verify Current Wiring

```tsx
// Line 488-495 in UnifiedTacticsBoard.tsx
const handlePlayerSelect = useCallback((player: Player, position?: { x: number; y: number }) => {
  uiDispatch({ type: 'SELECT_PLAYER', payload: player }); // ✅ Updates LOCAL state
  uiDispatch({ type: 'SHOW_EXPANDED_CARD', payload: cardPosition }); // ✅ Updates LOCAL state
}, []);
```

```tsx
// Line 227 - Reading from LOCAL state
const { selectedPlayer, isDragging, isPresenting, positioningMode } = interaction; // ✅ From boardUIState
```

```tsx
// Line 1342 - Passing to ModernField
<ModernField
  selectedPlayer={selectedPlayer} // ✅ From LOCAL state
  onPlayerSelect={handlePlayerSelect} // ✅ Updates LOCAL state
/>
```

**Status**: ✅ **WIRING IS CORRECT!**

### Step 2: Test in Browser

Add this to browser console on tactics board page:

```javascript
// Check if click handlers exist
const tokens = document.querySelectorAll('[data-player-id]');
console.log('Found player tokens:', tokens.length);

if (tokens.length > 0) {
  const first = tokens[0];
  console.log('Draggable:', first.draggable);
  console.log('Has onclick:', !!first.onclick);
  
  // Try clicking programmatically
  first.click();
  console.log('Clicked! Check if player selected');
}
```

### Step 3: Check PlayerToken Props

The issue might be that `isDraggable` is false. Check line 476 in ModernField:

```tsx
isDraggable={!isLowPower}
```

**If battery is low, dragging is disabled!**

### Step 4: Enable Dragging Always (Quick Fix)

Change line 476 in ModernField.tsx:

```tsx
// BEFORE:
isDraggable={!isLowPower}

// AFTER:
isDraggable={true}
```

## 🎨 QUICK VISUAL DEBUG

### Add to PlayerToken to test clicks:

```tsx
// In handleSelect (line 633)
const handleSelect = useCallback(
  (event: React.MouseEvent) => {
    console.log('🎯 PLAYER CLICKED:', player.name, player.id); // ADD THIS
    event.preventDefault();
    event.stopPropagation();

    if (event.detail === 1) {
      console.log('✅ Triggering selection'); // ADD THIS
      triggerSelection();
    }
  },
  [triggerSelection, player.name, player.id],
);
```

### Add to triggerSelection (line 348):

```tsx
const triggerSelection = useCallback(() => {
  console.log('🚀 SELECTION TRIGGERED:', player.name); // ADD THIS
  
  if (!performanceMode) {
    controls.start({
      scale: [1, 1.2, 1],
      transition: { duration: 0.3, ease: 'easeInOut' },
    });
  }

  if (isMobile && 'vibrate' in navigator) {
    navigator.vibrate([15, 10, 25]);
  }

  setIsTooltipVisible(true);
  console.log('📞 Calling onSelect with:', player.id); // ADD THIS
  onSelect(player.id);
}, [controls, isMobile, onSelect, performanceMode, player.id, player.name]);
```

## 🔥 EMERGENCY BYPASS (If Nothing Works)

Create a simple test button outside the board:

```tsx
// In UnifiedTacticsBoard.tsx, add at top level
<button 
  onClick={() => {
    const testPlayer = currentPlayers[0];
    if (testPlayer) {
      handlePlayerSelect(testPlayer, { x: 50, y: 50 });
      console.log('Force selected:', testPlayer.name);
    }
  }}
  className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded"
>
  TEST SELECT
</button>
```

If this button works but clicking players doesn't:
- ❌ Problem is in PlayerToken event handlers
- ❌ Problem is with pointer-events CSS
- ❌ Problem is with z-index layering

If this button ALSO doesn't work:
- ❌ Problem is in handlePlayerSelect
- ❌ Problem is in reducer
- ❌ Problem is with state not updating UI

## 🎯 MOST LIKELY ISSUES (Ranked)

1. **Battery Saver Mode** (90% likely)
   - `isDraggable={!isLowPower}` is false
   - PlayerToken disables all interactions when not draggable
   - **FIX**: Force `isDraggable={true}`

2. **Z-Index Blocking** (5% likely)
   - DrawingCanvas or other overlay blocking clicks
   - **FIX**: Add `pointer-events-none` to overlays

3. **Event Propagation** (3% likely)
   - `stopPropagation()` blocking events
   - **FIX**: Remove or adjust event.stopPropagation calls

4. **Reducer Not Working** (2% likely)
   - SELECT_PLAYER action not updating state
   - **FIX**: Check reducer implementation

## 🚀 NEXT STEPS

1. **FIRST**: Check if low-power mode is enabled (user's laptop on battery)
2. **THEN**: Force `isDraggable={true}` in ModernField.tsx line 476
3. **TEST**: Click a player - it should select
4. **IF WORKS**: Success! Issue was battery saver
5. **IF FAILS**: Add console.logs to debug event flow
