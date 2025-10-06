# 🛠️ Astral Turf Error Correction Plan

**Generated:** September 30, 2025  
**Maintainer:** Astral Turf Upgrade Team  
**Total Outstanding Errors (latest TypeScript sweep):** 318 across 21 files  
**Primary Tooling:** `npx tsc --noEmit --project tsconfig.test-utils.json`

---

## 1. Current Error Snapshot

| Area | File(s) | Approx. Count | Key Symptoms |
|------|---------|---------------|--------------|
| Security Analytics | `src/security/auth.ts`, `src/security/rbac.ts`, `src/security/logging.ts` | ~120 | Auth payload typing gaps, legacy export collisions, remaining guard rails around token helpers |
| Security Sanitization | `src/security/sanitization.ts`, `src/security/encryption.ts`, `src/security/validation.ts` | 65 | DOMPurify config mismatches, implicit `any` on structured data, unsafe spread patterns |
| Auth & Token Services | `src/services/authService.ts`, `src/services/secureAuthService.ts` | 70 | Promise handling on token helpers, missing metadata typing, legacy payload fields (`jti`, `rotationCount`) |
| Database Layer | `src/services/databaseService.ts` | 30 | Prisma event subscription typings, stray `error` identifiers, invalid event payload assumptions |
| Challenge & Player Services | `src/services/challengeService.ts`, `src/services/playerRankingService.ts`, `src/services/formationAutoAssignment.ts` | 22 | Timer type mismatches, enum comparisons against unsupported literals, reward typing gaps |
| Domain State & Reducers | `src/context/reducers/*.ts`, `src/context/UIContext.tsx` | 20 | Expanded domain unions now exposed, requires reducer action typing updates |
| Misc. Support Files | `src/services/apiService.ts`, `src/services/tacticalIntegrationService.ts`, others | 0 | (Monitoring — no new diagnostics surfaced in current sweep) |

> ✅ **Recently cleared:** `src/__tests__/utils/comprehensive-test-providers.tsx` & `src/context/UIContext.tsx` - mock data now type-safe and configurable for tests.

---

## 2. Strategic Fix Plan

1. **Stabilize Domain Types (Phase 1 priority)**
   - Reconcile `Player`, `Formation`, and shared `Auth` types with service usage.
   - Backfill missing exports (`UserRole`, `NotificationSettings`, etc.) and ensure factories align.

2. **Secure Pipeline Hardening**
   - Refactor security modules to use typed metadata objects and guard clauses.
   - Normalize DOMPurify configuration with typed `Config` helpers and whitelist utilities.

3. **Service Layer Cleanup**
   - Enforce explicit typing on Prisma event listeners, timers, and async flows.
   - Restructure sample/tactical data builders to consume canonical types (completed for test utils, pending for runtime sample data).

4. **Regression Net**
   - Add targeted unit coverage for sanitized helpers and auth services before refactor.
   - Re-run scoped `tsc` checks per module (`npx tsc --noEmit --pretty false --include src/security/*`).

---

## 3. Progress Tracker

| Status | Scope | Owner | Notes |
|--------|-------|-------|-------|
| ✅ Done | Align `comprehensive-test-providers` mocks with canonical types | Toolchain | Updated factories, added reusable builders, eliminated TS2307 errors in test utils |
| ✅ Done | Allow `UIProvider` to accept partial initial state | Toolchain | Enables tests to override UI slices without reducer duplication |
| ✅ Done | Collapse `src/types.ts` into modular re-export shim | Toolchain | Ensures `UserRole`, `NotificationSettings`, and friends resolve from canonical modules |
| ✅ Done | Rebuild runtime `sampleTacticsData` to canonical `Player`/`Formation` shape | Toolchain | Added typed player factory, updated formation slots, aligned bench grouping |
| 🔄 In Progress | Phase 1 · Task 1.1.4 – Resolve TS2307/module resolution issues | Toolchain | Domain alignment now exposes 318 diagnostics; next step targets reducer/action unions |
| ✅ Done | Sanitize security module metadata typing | Toolchain | Added `SecurityEventMetadata`, guarded rate-limit checks, reconciled monitoring/logging enums |
| ⏳ Pending | Harden reducer/action typing with expanded unions | TBD | Update context reducers to reflect new morale/form variants and formation slot metadata |

---

## 4. Upcoming Actions

- [x] Draft `SecurityEventMetadata` and `SanitizationTarget` types; replace untyped `{}` usage.
- [x] Normalize security enums/constants so monitoring/logging mappings compile cleanly.
- [ ] Update Prisma event listeners to typed callbacks and guard against `never` payloads.
- [ ] Tighten reducer/action typing to cover new union members and formation slot metadata.
- [ ] Run focused `tsc` audits (`security`, `services`, `utils`) post-refactor; update tracker with delta counts.
- [ ] Patch security auth/encryption modules to eliminate legacy `_error` references and align JWT payload typing.

---

## 5. Change Log

| Date | Update |
|------|--------|
| 2025-09-30 | Document created. Recorded 295 outstanding TypeScript errors and captured remediation strategy. Logged recent test-utils/UIContext fixes as complete. |
| 2025-09-30 | Updated total to 357 errors after aligning domain type exports and refactoring runtime sample data. Added new domain-focused tasks. |
| 2025-09-30 | Hardened security monitoring/logging metadata, added `SecurityEventMetadata`, and dropped outstanding diagnostics to 318 (+ plan refresh). |
