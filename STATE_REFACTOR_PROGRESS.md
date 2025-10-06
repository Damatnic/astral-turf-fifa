# State Management Refactor Progress Report

**Task:** Consolidate 30+ useState hooks into useReducer pattern  
**Status:** 70% Complete  
**Date:** October 4, 2025

---

## ✅ COMPLETED WORK

### 1. Created UI State Reducer (`src/reducers/tacticsBoardUIReducer.ts`)

**New centralized state structure:**
```typescript
interface UIState {
  viewMode: ViewMode;                    // 'standard' | 'fullscreen' | 'presentation'
  sidebars: { left: boolean; right: boolean };
  panels: {                              // 10 modal/panel toggles consolidated
    formationTemplates, aiAssistant, tacticalPlaybook,
    analytics, aiAnalysis, aiIntelligence,
    dugout, challenges, collaboration, exportImport
  };
  display: {                             // 5 display overlays consolidated
    heatMap, playerStats, chemistry, grid, formationStrength
  };
  interaction: {                         // 4 interaction states consolidated
    selectedPlayer, isDragging, isPresenting, positioningMode
  };
  conflict: { showMenu, data };          // Conflict resolution consolidated
  expandedCard: { visible, position };   // Expanded player card consolidated
  playerDisplayConfig: {...};           // Player display settings
  aiMinimized: boolean;
}
```

**Total consolidation:**
- **Before:** 30+ separate useState hooks
- **After:** 1 useReducer with typed actions (30 action types)

### 2. Updated Component Imports

✅ Added `useReducer` import  
✅ Added reducer and types imports  
✅ Fixed duplicate imports

### 3. Refactored Core State Declaration

**Before:**
```typescript
const [viewMode, setViewMode] = useState('standard');
const [showLeftSidebar, setShowLeftSidebar] = useState(!isMobile);
// ... 28 more useState declarations
```

**After:**
```typescript
const [boardUIState, uiDispatch] = useReducer(uiReducer, getInitialUIState(isMobile));

// Extract for easier access
const { viewMode, sidebars, panels, display, interaction, conflict, expandedCard } = boardUIState;
const { selectedPlayer, isDragging, isPresenting } = interaction;
```

### 4. Updated Event Handlers

✅ **Sample data initialization** - Uses `tacticsDispatch`  
✅ **Responsive sidebar management** - Uses `uiDispatch`  
✅ **Player movement** - Uses `tacticsDispatch` (20+ refs fixed)  
✅ **Formation change** - Uses `tacticsDispatch`  
✅ **Player selection** - Uses `uiDispatch`  
✅ **Conflict resolution** - Uses both dispatchers  
✅ **Player actions** - Uses both dispatchers  
✅ **Drawing handlers** - Uses `tacticsDispatch` for drawings, `contextUIState` for tool/color  
✅ **Grid/strength toggles** - Uses `uiDispatch`  
✅ **Sidebar toggles** - Uses `uiDispatch`  
✅ **AI handlers** - Uses `tacticsDispatch`  
✅ **View mode handlers** - Uses `uiDispatch`  
✅ **Quick actions array** - Uses `uiDispatch` and new state references

---

## 🚧 REMAINING WORK (30% - JSX Render Section)

### Issues to Fix

The JSX render section (lines 900-1300) still references old state variables and setters that no longer exist. Need to update ~50+ references:

**Pattern to fix:**
```typescript
// OLD (doesn't exist anymore):
{showFormationTemplates && <FormationTemplates onClose={() => setShowFormationTemplates(false)} />}
{showHeatMap && <HeatMap />}
setIsDragging={setIsDragging}

// NEW (need to change to):
{panels.formationTemplates && <FormationTemplates onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'formationTemplates' })} />}
{display.heatMap && <HeatMap />}
setIsDragging={(dragging) => uiDispatch({ type: 'SET_DRAGGING', payload: dragging })}
```

### Specific Lines Needing Updates

1. **Line 917:** `setIsDragging={setIsDragging}` → Create wrapper function
2. **Line 920:** `showHeatMap` → `display.heatMap`
3. **Line 921:** `showPlayerStats` → `display.playerStats`
4. **Line 940:** `showChemistry` → `display.chemistry`
5. **Line 959-960:** `setShowConflictMenu(false); setConflictData(null);` → `uiDispatch({ type: 'HIDE_CONFLICT_MENU' })`
6. **Line 971:** `setShowExpandedPlayerCard(false)` → `uiDispatch({ type: 'HIDE_EXPANDED_CARD' })`
7. **Line 977:** `uiState.activePlaybookItemId` → `contextUIState.activePlaybookItemId`
8. **Lines 1006-1021:** FormationTemplates panel
9. **Lines 1026-1044:** AIAssistant panel
10. **Lines 1050-1068:** TacticalPlaybook panel
11. **Lines 1073-1090:** AnalyticsPanel
12. **Lines 1098-1106:** AIAnalysis panel
13. **More panels:** Dugout, Challenges, Collaboration, ExportImport, AIIntelligence

---

## 📊 IMPACT ASSESSMENT

### Performance Benefits (Expected)

✅ **Reduced re-renders:** Single dispatch vs 30+ state updates  
✅ **Predictable state:** All UI state changes go through reducer  
✅ **Easier debugging:** Redux DevTools compatible  
✅ **Better organization:** Related state grouped logically  

### Code Quality Benefits

✅ **Reduced complexity:** 1,303 lines → cleaner state management  
✅ **Type safety:** All actions typed with discriminated unions  
✅ **Maintainability:** Centralized state logic  
✅ **Testability:** Reducer can be unit tested independently  

---

## 🎯 NEXT STEPS

### Immediate (Complete Phase 1, Task 1)

1. Update all JSX references to use new state structure
2. Create wrapper functions for callbacks that need dispatch
3. Test all panels open/close correctly
4. Test all display toggles work
5. Test conflict resolution flow
6. Run full UI interaction test

### Then Continue to Phase 1 Remaining Tasks

2. Implement undo/redo system
3. Add keyboard shortcuts panel  
4. Create quick start templates
5. Improve touch targets for mobile

---

## 🔧 TECHNICAL NOTES

### Dispatch Separation

We maintain **two separate dispatchers**:

```typescript
tacticsDispatch  // For game logic (players, formations, drawings)
uiDispatch       // For UI state (panels, display, modals)
```

This separation of concerns keeps UI state changes independent from game state.

### Migration Pattern Used

```typescript
// Pattern 1: Simple state toggle
setShowPanel(true) → uiDispatch({ type: 'OPEN_PANEL', payload: 'panelName' })

// Pattern 2: State toggle (boolean flip)
setShowPanel(prev => !prev) → uiDispatch({ type: 'TOGGLE_PANEL', payload: 'panelName' })

// Pattern 3: Complex state update
setConflictData({...}); setShowConflictMenu(true);
→ uiDispatch({ type: 'SHOW_CONFLICT_MENU', payload: {...} })
```

### Files Modified

1. ✅ `src/reducers/tacticsBoardUIReducer.ts` (NEW - 450 lines)
2. 🚧 `src/components/tactics/UnifiedTacticsBoard.tsx` (70% updated)

### Files Not Modified (No breaking changes)

- All child components still work with existing props
- Context providers unchanged
- Type definitions unchanged

---

## ⚠️ KNOWN ISSUES

### Current Build Errors (~87 lint errors)

All errors are in the JSX render section where old state references exist. Once JSX is updated, all errors will resolve.

**Error categories:**
- `Cannot find name 'setShowXXX'` → Need to use `uiDispatch`
- `Cannot find name 'showXXX'` → Need to use `panels.XXX` or `display.XXX`
- `Cannot find name 'uiState'` → Need to use `contextUIState` for non-board UI state

---

## 💡 RECOMMENDATIONS

1. **Complete JSX updates in batches** (panels → displays → interactions)
2. **Test each batch** before moving to next
3. **Add comprehensive type checking** after completion
4. **Create unit tests** for reducer logic
5. **Document state shape** for future developers

---

**Estimated time to complete:** 30-45 minutes  
**Risk level:** Low (patterns are clear, just need systematic updates)  
**Testing requirement:** High (all UI interactions must be verified)
