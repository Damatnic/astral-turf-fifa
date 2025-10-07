# Phase 3: Quick Start Guide

**Status:** Ready to Begin  
**Prerequisites:** Phase 2 Complete ✅  
**Estimated Duration:** 4 weeks

---

## What We're Building

Phase 3 adds the core football management features:

1. **Team Management** - Create teams, manage rosters
2. **Player Profiles** - Stats, attributes, photos
3. **Formation Builder** - Tactical planning
4. **Match Planning** - Schedule, lineups, tracking
5. **File Uploads** - Images for teams and players

---

## Week 1: Start Here

### Day 1-2: File Uploads Module

**Goal:** Enable image uploads for teams and players

**Tasks:**
1. Install dependencies:
   ```bash
   cd backend
   npm install multer @nestjs/platform-express @types/multer sharp
   ```

2. Create uploads module:
   ```bash
   nest g module uploads
   nest g service uploads
   nest g controller uploads
   ```

3. Implement file upload service
4. Add image processing (resize, optimize)
5. Create upload endpoints
6. Test file uploads

**Files to Create:**
- `src/uploads/uploads.module.ts`
- `src/uploads/uploads.service.ts`
- `src/uploads/uploads.controller.ts`
- `src/uploads/interceptors/file-upload.interceptor.ts`

---

### Day 3-5: Team Management (Part 1)

**Goal:** Basic team creation and management

**Tasks:**
1. Create migration for teams tables
2. Generate team module:
   ```bash
   nest g module teams
   nest g service teams
   nest g controller teams
   ```

3. Create team entity
4. Create DTOs (create, update)
5. Implement CRUD operations
6. Add RBAC guards
7. Test all endpoints

**Files to Create:**
- Migration: `src/migrations/xxx-CreateTeams.ts`
- `src/teams/teams.module.ts`
- `src/teams/teams.service.ts`
- `src/teams/teams.controller.ts`
- `src/teams/entities/team.entity.ts`
- `src/teams/dto/create-team.dto.ts`
- `src/teams/dto/update-team.dto.ts`

---

### Day 6-7: Team Management (Part 2)

**Goal:** Team invitations and member management

**Tasks:**
1. Create team members entity
2. Create team invitations entity
3. Implement invitation service
4. Add email notifications
5. Create invitation endpoints
6. Test complete workflow

**Files to Create:**
- `src/teams/entities/team-member.entity.ts`
- `src/teams/entities/team-invitation.entity.ts`
- `src/teams/dto/invite-member.dto.ts`
- `src/mail/templates/team-invitation-email.hbs`

---

## Testing Each Module

### Manual Testing
```powershell
# Start backend
cd backend
npm run start:dev

# Test team creation
$body = @{
  name = "Arsenal Youth"
  description = "Youth team"
  primaryColor = "#EF0107"
  secondaryColor = "#FFFFFF"
} | ConvertTo-Json

$token = "your_access_token"
$headers = @{ "Authorization" = "Bearer $token" }

Invoke-RestMethod -Uri "http://localhost:3333/api/teams" `
  -Method POST `
  -Body $body `
  -Headers $headers `
  -ContentType "application/json"
```

### Unit Tests
```bash
# Run tests
npm run test

# Run specific module tests
npm run test teams

# Coverage
npm run test:cov
```

---

## Database Migrations

### Create Migration
```bash
npm run migration:create src/migrations/CreateTeams
```

### Run Migrations
```bash
npm run migration:run
```

### Revert Migration
```bash
npm run migration:revert
```

---

## Helpful Commands

### Generate NestJS Resources
```bash
# Generate complete module with service, controller
nest g resource <name>

# Generate individual components
nest g module <name>
nest g service <name>
nest g controller <name>
```

### Database
```bash
# Generate migration
npm run migration:create src/migrations/<MigrationName>

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Testing
```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## Next Steps After Week 1

**Week 2:** Player Profiles
- Player entity with stats
- Photo upload integration
- Attributes system

**Week 3:** Formations & Matches
- Formation builder
- Match scheduling
- Lineup management

**Week 4:** Polish & Testing
- Match events
- Player ratings
- Integration testing
- Documentation

---

## Getting Started NOW

**Step 1:** Review the full plan
```bash
code backend/PHASE3_PLAN.md
```

**Step 2:** Install dependencies
```bash
cd backend
npm install multer @nestjs/platform-express @types/multer sharp
```

**Step 3:** Start with uploads module
```bash
nest g module uploads
nest g service uploads
nest g controller uploads
```

**Step 4:** Follow the implementation guide in PHASE3_PLAN.md

---

## Need Help?

**Documentation:**
- Full plan: `backend/PHASE3_PLAN.md`
- Phase 2 reference: `backend/PHASE2_FINAL_STATUS.md`
- API docs: `backend/PHASE2_QUICK_REFERENCE.md`

**Questions to Ask:**
- How should this feature work?
- What are the RBAC rules?
- What validation is needed?
- How does this integrate with existing features?

---

**Let's build amazing features!** 🚀

Start with: `npm install multer @nestjs/platform-express @types/multer sharp`
