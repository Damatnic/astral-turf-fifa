# 🎯 TACTICS BOARD - QUICK REFERENCE CARD

## 📋 Component Overview

### 1. EnhancedTacticsToolbar
**Purpose**: Modern toolbar with categorized actions  
**Location**: Top of tactics board  
**Key Props**: `actions`, `formationStrength`, `validationStatus`

### 2. SnapToGridOverlay  
**Purpose**: Visual grid with snap points  
**Location**: Overlay on field  
**Key Props**: `isVisible`, `gridSize`, `highlightedPoint`

### 3. FormationStrengthAnalyzer
**Purpose**: Real-time formation metrics  
**Location**: Floating panel  
**Key Props**: `formation`, `players`, `isVisible`

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `G` | Toggle Grid Overlay |
| `A` | Toggle Strength Analyzer |
| `Q` | Open Quick Start |
| `F` | Open Formations |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save Formation |
| `Ctrl+E` | Export Formation |

---

## 🎨 Color Codes

### Strength Levels
- 🟢 **80-100%** = Excellent (Green gradient)
- 🔵 **60-79%** = Good (Blue gradient)  
- 🟡 **40-59%** = Average (Yellow gradient)
- 🔴 **0-39%** = Poor (Red gradient)

### Validation States
- ✅ **Valid** = Green indicator
- ⚠️ **Warning** = Yellow indicator
- ❌ **Error** = Red indicator

---

## 📊 Metrics Explained

| Metric | Calculation | Weight |
|--------|-------------|--------|
| Defense | Tackling + Positioning | 25% |
| Attack | Shooting + Dribbling | 25% |
| Balance | Harmony of def/off | 20% |
| Chemistry | Team cohesion | 15% |
| Coverage | Field distribution | 15% |

---

## 🔧 Quick Integration

```typescript
// 1. Import
import EnhancedTacticsToolbar from './EnhancedTacticsToolbar';
import SnapToGridOverlay from './SnapToGridOverlay';
import FormationStrengthAnalyzer from './FormationStrengthAnalyzer';

// 2. Use
<EnhancedTacticsToolbar actions={actions} formationStrength={85} />
<SnapToGridOverlay isVisible={true} gridSize={10} />
<FormationStrengthAnalyzer formation={formation} players={players} />
```

---

## ✅ Validation Rules

### Must Have
- ✓ Exactly 1 goalkeeper
- ✓ Exactly 11 players
- ✓ All positions in bounds (0-100%)
- ✓ No duplicate assignments

### Should Have  
- ⚠ At least 3 defenders
- ⚠ At least 2 midfielders
- ⚠ At least 1 attacker

---

## 🎬 Animation Timing

| Element | Duration | Easing |
|---------|----------|--------|
| Toolbar expand | 300ms | ease-out |
| Metric bars | 500ms | ease-out |
| Snap pulse | 1500ms | ease-in-out (loop) |
| Button hover | 150ms | cubic-bezier |

---

## 📱 Responsive Grid

| Screen | Columns | Grid Size |
|--------|---------|-----------|
| Desktop (>1024px) | 4 | 10% |
| Tablet (768-1024px) | 2 | 15% |
| Mobile (<768px) | 1 | 20% |

---

## 🐛 Common Issues

**Grid not visible?**  
→ Check `isVisible` prop is `true`

**Strength shows 0?**  
→ Ensure players have valid attributes

**Snap not working?**  
→ Set `positioningMode="snap"`

**TypeScript errors?**  
→ Update icon component types

---

## 📚 Documentation Files

1. **TACTICS_BOARD_UI_UX_ENHANCEMENT_COMPLETE.md** - Full specs
2. **TACTICS_BOARD_VISUAL_GUIDE.md** - Visual layouts  
3. **TACTICS_BOARD_INTEGRATION_GUIDE.md** - Integration steps
4. **TACTICS_BOARD_FINAL_SUMMARY.md** - Project summary

---

## 🎯 Todo Status

✅ **COMPLETED** - `phase4-tactics-board-polish`

Next: Real-time collaboration, Export functionality, Advanced analytics

---

*Quick Reference v1.0 - October 6, 2025*
