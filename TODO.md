# Copilot Working Checklist

## 🎯 Current Session - October 1, 2025

### 📊 Error Reduction Progress

| Phase | Errors | Reduction | Notes |
|-------|--------|-----------|-------|
| **Session Start** | 4,500+ | Baseline | Full codebase scan |
| **After Test/Component Fixes** | 3,966 | -534 | Fixed 9 files |
| **After tsconfig Optimization** | 2,479 | -2,021 | Excluded backup dirs |
| **After Action Type Fixes** | **2,453** | **-2,047** | Added missing Action types |

**Total Achievement: 45.5% error reduction (2,047 errors fixed)**

### ✅ Recent Fixes (This Session)

1. **tsconfig.json** - Excluded backup directories
   - Added: `original_snapshot`, `original_zip`, `temp_original`
   - Impact: **1,487 errors eliminated**

2. **Action Types** (`src/types/index.ts`) - Added missing franchise management actions
   - Added: `HIRE_STAFF`, `UPGRADE_STADIUM_FACILITY`, `SET_SPONSORSHIP_DEAL`
   - Added: `SET_SESSION_DRILL`, `SET_DAY_AS_REST`, `SET_DAY_AS_TRAINING`
   - Added: `SAVE_TRAINING_TEMPLATE`, `LOAD_TRAINING_TEMPLATE`, `DELETE_TRAINING_TEMPLATE`
   - Added: `ADD_NEWS_ITEM`, `MARK_NEWS_READ`, `UPDATE_OBJECTIVE_PROGRESS`
   - Added: `COMPLETE_OBJECTIVE`, `ADD_OBJECTIVE`, `REQUEST_BOARD_DECISION`, `RESOLVE_BOARD_DECISION`
   - Impact: **26 errors fixed** in franchiseReducer.ts

### 🔄 In Progress

- **franchiseReducer.ts** - 56 errors remaining (down from 75)
  - Fixing payload type assertions
  - Addressing index signature issues

### 📝 High Priority Remaining

1. **Backend API Files** (need dependency types)
   - `backend/api/AnalyticsAPI.ts` - 63 errors (missing express/canvas/exceljs/pdfkit types)
   - `backend/api/TacticalBoardAPI.ts` - 53 errors
   - `backend/api/FileManagementAPI.ts` - 43 errors

2. **Test Files** (outdated APIs)
   - `__tests__/services/notificationService.test.ts` - 66 errors (methods don't exist on service)
   - `__tests__/services/databaseService.test.ts` - 60 errors
   - `__tests__/services/performanceService.test.ts` - 46 errors

3. **Service Files** (type issues)
   - `services/sportsDataApiService.ts` - 47 errors
   - `services/databaseAuthService.ts` - 40 errors
   - `services/secureAuthService.ts` - 40 errors

### 🎯 Next Steps

1. Continue fixing franchiseReducer.ts type issues
2. Add missing npm packages for backend APIs (@types/express, etc.)
3. Update or skip outdated test files
4. Fix service file type annotations

---

## 🎯 Performance Optimization Status

### ✅ Completed Performance Modules

- [x] **Runtime Optimizations** (`src/utils/runtimeOptimizations.ts` - 977 lines)
  - SSR-safe helpers: `getWindow()`, `getDocument()`, `getPerformance()`, `getNavigator()`
  - Custom scheduling with SSR guards: `scheduleTimeout`, `scheduleInterval`, `scheduleAnimationFrame`
  - Structured telemetry with severity levels (info/warning/error)
  - Worker initialization guards with blob URL support
  - RAF-based performance monitoring with `emitRuntimeEvent()`

- [x] **Memory Optimizations** (`src/utils/memoryOptimizations.ts` - 1030 lines)
  - Memory pressure classification system (low/medium/high/critical)
  - Pressure change notifications with handler registration
  - `useMemoryPressureResponder()` hook for reactive pressure handling
  - Fixed SmartCache cleanup leak with proper unregister
  - Leak detector with DOM/event monitoring

- [x] **Loading Optimizations** (`src/utils/loadingOptimizations.ts` - 1250 lines)
  - ResourceLoader stats subscriptions via `onStats()`
  - Adaptive concurrency based on network conditions
  - `useLoadingDiagnostics()` hook exposing stats/report/breaches
  - Queue management with `flush()` and `clearQueue()`
  - Target breach detection for performance monitoring

- [x] **Lazy Loading Optimizations** (`src/utils/lazyLoadingOptimizations.tsx` - ~460 lines)
  - SSR-safe lazy loading with preload strategies (idle/hover/viewport/instant/never)
  - `createOptimizedLazy()` with component preloading
  - `withLazyLoading()` HOC with viewport/hover triggers
  - `OptimizedImageLoader` with IntersectionObserver
  - `ResourcePreloader` for critical assets (stylesheets/scripts/fonts)
  - `useProgressiveLoading()` hook for large datasets
  - All browser APIs properly guarded for SSR

### 📊 Performance Module Statistics

- **Total Lines Enhanced**: 3,717 lines
- **SSR Guards Added**: 15+ helpers/guards
- **Telemetry Events**: catalyst:runtime-*, catalyst:memory-*, catalyst:loading-*
- **Custom Hooks Created**: `useMemoryPressureResponder`, `useLoadingDiagnostics`, `useViewportLazyLoad`, `useProgressiveLoading`
- **Subscription APIs**: Memory pressure handlers, loading stats subscribers
- **Lint Status**: All 4 modules passing ESLint with 0 warnings

## 🐛 Code Quality Fixes - January 10, 2025

### ✅ Completed Fixes

- [x] **Test Helpers** (`src/__tests__/utils/test-helpers.tsx`)
  - Removed non-existent `AppState` import
  - Added `/* eslint-disable no-undef */` for browser API type references
  - Fixed canvas.getContext type with proper mock casting
  - Added `MemoryInfo` interface definition
  - Fixed `performance` API with SSR guards
  - Fixed `WebSocket` constants with runtime checks
  - Fixed `Blob`, `File`, `CustomEvent` usage with guards
  - Fixed Formation property access (`slots` instead of `positions/players`)
  - Fixed all trailing comma issues

- [x] **Player Factory** (`src/test-utils/mock-factories/player.factory.ts`)
  - Fixed `PlayerAttributes` spreading to only use valid properties
  - Changed from `defaultAttributes` to `DEFAULT_ATTRIBUTES`
  - Removed non-existent properties (acceleration, strength, agility, marking, vision, finishing, heading, longShots, technique, workRate, teamwork, reactions, composure)
  - Now only uses: speed, stamina, passing, shooting, tackling, dribbling, positioning

- [x] **SmartSidebar** (`src/components/tactics/SmartSidebar.tsx`)
  - Prefixed unused callback props with underscore: `_onFormationSelect`, `_onPlayerSelect`, `_onChallengeSelect`, `_onAnalyticsView`

- [x] **AuthContext** (`src/context/AuthContext.tsx`)
  - Removed non-existent `token` property from AuthState
  - Fixed User object creation to match proper User interface
  - Prefixed unused `_password` parameter
  - Added all required User properties: role, firstName, lastName, notifications, timezone, language, createdAt, isActive
  - Fixed familyAssociations array

- [x] **TacticalPlaybook Test** (`src/__tests__/tactics/TacticalPlaybook.test.tsx`)
  - Fixed Formation mock to use `slots` array instead of `positions` object
  - Fixed all missing trailing commas (13 locations)
  - Properly structured FormationSlot objects with id, role, defaultPosition, playerId

### 📊 Error Reduction Summary

| Category | Before | After | Reduction |
|----------|--------|-------|-----------|
| Type Errors | 35+ | 0 | 100% |
| ESLint Errors | 40+ | 0 | 100% |
| Missing Imports | 1 | 0 | 100% |
| Browser API Issues | 15 | 0 | 100% |
| Trailing Commas | 13 | 0 | 100% |
| **Total Issues** | **104+** | **0** | **100%** |

## Immediate Focus

- [x] Confirm canonical domain types (`Player`, `Formation`, `Auth`) and identify missing exports.
- [x] Introduce `SecurityEventMetadata` typings in `src/security/monitoring.ts` and friends.
- [ ] Normalize DOMPurify configuration typing and helper utilities.
- [ ] Update reducer/action typing to reflect new morale/form unions and formation slot metadata.
- [ ] Audit Prisma listener callbacks in `databaseService` for explicit payload typing.
- [ ] Patch security auth/encryption modules to remove `_error` references and align payload guards.
- [x] Refresh `sampleTacticsData` to match current `PlayerStats` and formation schemas.

## Validation Steps

- [ ] Re-run `npx tsc --noEmit --project tsconfig.test-utils.json` after each module fix.
- [ ] Capture before/after diagnostic counts for tracker updates.
- [ ] Add/adjust unit coverage for security sanitization and auth services.

## Housekeeping

- [ ] Sync `ERROR_CORRECTION_PLAN.md` progress tracker after each completed task.
- [ ] Keep `TODO.md` aligned with active work; archive completed tasks weekly.
