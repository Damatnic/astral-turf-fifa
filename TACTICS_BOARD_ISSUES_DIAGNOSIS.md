# Tactics Board Issues - Diagnosis & Fix Plan

## 🔴 Critical Issues Reported by User

### Issue 1: Players Won't Click/Select
**Problem**: Clicking on player tokens doesn't trigger selection
**Likely Causes**:
- Event handlers not properly attached
- Click event being consumed by drag handlers
- Missing onClick prop wiring in PlayerToken
- Event bubbling issues

### Issue 2: Players Won't Drag/Move
**Problem**: Drag and drop not working for repositioning players
**Likely Causes**:
- DragEvent handlers not firing
- Missing draggable={true} attribute
- Event preventDefault blocking drag start
- No drop zones defined on field

### Issue 3: Toolbar Not Responding
**Problem**: Tactical toolbar buttons don't work
**Likely Causes**:
- Button click handlers not connected
- Missing dispatch calls to state
- UI state not updating
- Toolbar components not receiving props

### Issue 4: Roster Not Interactive
**Problem**: Can't interact with roster/bench players
**Likely Causes**:
- RosterGrid not receiving player data
- Drag handlers missing on roster items
- No connection between roster and field
- Player selection state not shared

## 🔍 Investigation Checklist

### 1. PlayerToken Component
- [ ] Check if draggable attribute is set
- [ ] Verify onClick handler is attached
- [ ] Confirm onDragStart is implemented
- [ ] Check event.stopPropagation() isn't blocking
- [ ] Verify player prop is valid

### 2. ModernField Component  
- [ ] Check if onDrop handlers exist
- [ ] Verify drop zones are defined
- [ ] Confirm player position updates work
- [ ] Check if field is receiving players prop

### 3. UnifiedTacticsBoard
- [ ] Verify handlePlayerSelect exists
- [ ] Check handlePlayerMove implementation
- [ ] Confirm dispatch calls work
- [ ] Verify tacticsContext is providing state

### 4. useTacticsBoard Hook
- [ ] Check if startDrag is called
- [ ] Verify validateDrop logic
- [ ] Confirm handleSlotDrop works
- [ ] Check boardState updates

## 🛠️ Fix Strategy

### Phase 1: Enable Basic Player Selection (30 min)
1. Add onClick handler to PlayerToken
2. Wire up handlePlayerSelect in UnifiedTacticsBoard
3. Ensure selection state updates
4. Add visual feedback for selected state

### Phase 2: Enable Drag & Drop (1 hour)
1. Set draggable={true} on PlayerToken
2. Implement onDragStart with proper dataTransfer
3. Add onDragOver to formation slots
4. Implement onDrop with position update
5. Add visual drop zones

### Phase 3: Fix Toolbar (30 min)
1. Connect toolbar button onClick handlers
2. Wire up formation selection
3. Enable drawing tools
4. Add positioning mode toggles

### Phase 4: Enable Roster Interaction (45 min)
1. Add draggable to RosterGrid items
2. Connect roster drag to field drop
3. Enable player addition from roster
4. Add player removal back to bench

## 📝 Implementation Files to Modify

### Critical Files:
1. `src/components/tactics/PlayerToken.tsx` - Add event handlers
2. `src/components/tactics/ModernField.tsx` - Add drop zones
3. `src/components/tactics/UnifiedTacticsBoard.tsx` - Wire handlers
4. `src/hooks/useTacticsBoard.ts` - Ensure drag logic works
5. `src/components/tactics/UnifiedFloatingToolbar.tsx` - Connect buttons

### Supporting Files:
6. `src/components/tactics/RosterGrid.tsx` - Enable drag from roster
7. `src/reducers/tacticsReducer.ts` - Ensure actions work
8. `src/context/TacticsContext.tsx` - Verify state management

## 🎯 Success Criteria

### Player Selection:
- ✅ Click player → player highlights
- ✅ Click again → deselects
- ✅ Click different player → switches selection
- ✅ Expanded card shows player info

### Player Movement:
- ✅ Drag player → shows ghost/preview
- ✅ Drag over valid slot → slot highlights
- ✅ Drop on slot → player moves to position
- ✅ Drop on occupied slot → shows conflict menu
- ✅ Drop outside → returns to original position

### Toolbar:
- ✅ Formation dropdown shows formations
- ✅ Selecting formation → updates field layout
- ✅ Drawing tools activate/deactivate
- ✅ Positioning modes switch (grid/free/snap)
- ✅ Save/load buttons work

### Roster:
- ✅ Shows all available players
- ✅ Drag from roster → adds to field
- ✅ Shows player stats on hover
- ✅ Can remove player back to bench

## 🐛 Debugging Steps

### Step 1: Console Logging
Add console.logs to:
- PlayerToken onClick
- PlayerToken onDragStart
- ModernField onDrop
- useTacticsBoard startDrag
- UnifiedTacticsBoard handlePlayerSelect

### Step 2: React DevTools
Check:
- PlayerToken receives correct props
- onClick handler is present in elements
- draggable attribute is true
- State updates when clicking

### Step 3: Browser DevTools
Verify:
- No JavaScript errors in console
- Event listeners attached to elements
- dataTransfer has correct data
- preventDefault not blocking needed events

## 🚀 Quick Test Script

```javascript
// Run in browser console on tactics board page
const playerTokens = document.querySelectorAll('[data-player-id]');
console.log('Player tokens found:', playerTokens.length);

playerTokens.forEach(token => {
  console.log('Draggable:', token.draggable);
  console.log('Has onClick:', token.onclick ? 'Yes' : 'No');
  console.log('Has dragstart:', !!token.ondragstart);
});
```

## ⚡ Next Actions

1. **IMMEDIATE**: Test if PlayerToken has click/drag handlers attached
2. **THEN**: Wire up missing event handlers
3. **AFTER**: Test each interaction type
4. **FINALLY**: Add visual feedback and polish
