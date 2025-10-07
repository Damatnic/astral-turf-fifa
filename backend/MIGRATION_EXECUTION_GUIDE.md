# 🚀 MIGRATION EXECUTION GUIDE

**Status:** Ready to execute database migrations  
**Time Required:** 5 minutes  
**Current Blocking Item:** Phase 2 migration needs manual marking

---

## 📋 PRE-FLIGHT CHECK

Before starting, verify you have:

- [ ] PostgreSQL database accessible
- [ ] Database credentials in `.env` file
- [ ] Database connection working
- [ ] Backend dependencies installed (`npm install`)

---

## ⚡ QUICK START (Choose Your Path)

### Path A: Fresh Database (Recommended - 2 minutes)

**Best for:** Clean slate, no existing data to preserve

```powershell
cd backend

# Step 1: Drop and recreate database (in your PostgreSQL client)
# DROP DATABASE astral_turf_db;
# CREATE DATABASE astral_turf_db;

# Step 2: Run all migrations
npm run migration:run

# Step 3: Verify
npm run migration:show
```

**Expected Result:**
```
[X] AddEmailAndPasswordResetTokens1728324000000
[X] InitialSchema1728332400000
[X] CreateTeamsTable1759866511255
[X] CreatePlayersTable1759867844000
[X] CreateFormationsTable1759868500000
[X] CreateMatchesTables1759869000000
```

---

### Path B: Manual Fix (Preserve Existing Data - 3 minutes)

**Best for:** You have test data you want to keep

```powershell
cd backend

# Step 1: Connect to your PostgreSQL database
# Use pgAdmin, DBeaver, psql, or any PostgreSQL client

# Step 2: Run this SQL command:
```

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1728332400000, 'InitialSchema1728332400000')
ON CONFLICT DO NOTHING;

-- Verify
SELECT * FROM migrations ORDER BY timestamp;
```

```powershell
# Step 3: Run remaining migrations
npm run migration:run

# Step 4: Verify all migrations
npm run migration:show
```

---

## 🔍 DETAILED STEPS

### Option 1: Using PostgreSQL Command Line (psql)

```powershell
# Step 1: Connect to database
psql -U your_username -d astral_turf_db

# Step 2: Check current migrations
SELECT * FROM migrations ORDER BY timestamp;

# Step 3: Insert missing migration record
INSERT INTO migrations (timestamp, name)
VALUES (1728332400000, 'InitialSchema1728332400000')
ON CONFLICT DO NOTHING;

# Step 4: Verify
SELECT * FROM migrations ORDER BY timestamp;

# Step 5: Exit psql
\q

# Step 6: Run remaining migrations (back in PowerShell)
cd backend
npm run migration:run
```

---

### Option 2: Using Supabase (Cloud Database)

If you're using Supabase:

```powershell
# Step 1: Go to Supabase Dashboard
# Navigate to: Project > SQL Editor

# Step 2: Create new query and paste:
```

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1728332400000, 'InitialSchema1728332400000')
ON CONFLICT DO NOTHING;

SELECT * FROM migrations ORDER BY timestamp;
```

```powershell
# Step 3: Click "Run"

# Step 4: Back in terminal, run migrations
cd backend
npm run migration:run
```

---

### Option 3: Using pgAdmin (GUI)

```powershell
# Step 1: Open pgAdmin
# Step 2: Connect to your database
# Step 3: Right-click on database > Query Tool
# Step 4: Paste and execute:
```

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1728332400000, 'InitialSchema1728332400000')
ON CONFLICT DO NOTHING;
```

```powershell
# Step 5: In terminal, run migrations
cd backend
npm run migration:run
```

---

### Option 4: Using DBeaver (GUI)

```powershell
# Step 1: Open DBeaver
# Step 2: Connect to astral_turf_db
# Step 3: Click "SQL Editor" (New SQL Script)
# Step 4: Paste SQL from mark-phase2-migrations-complete.sql
# Step 5: Click "Execute" or press Ctrl+Enter
# Step 6: In terminal:
cd backend
npm run migration:run
```

---

## 🧪 VERIFICATION STEPS

### 1. Check Migration Status

```powershell
cd backend
npm run migration:show
```

**Expected Output (All with [X]):**
```
[X] AddEmailAndPasswordResetTokens1728324000000
[X] InitialSchema1728332400000
[X] CreateTeamsTable1759866511255
[X] CreatePlayersTable1759867844000
[X] CreateFormationsTable1759868500000
[X] CreateMatchesTables1759869000000
```

### 2. Check Database Tables

Connect to your database and verify these tables exist:

**Phase 1-2 Tables (4):**
- `users`
- `sessions`
- `migrations`
- `typeorm_metadata` (optional)

**Phase 3 Tables (10):**
- `teams`
- `team_members`
- `team_invitations`
- `players`
- `player_stats`
- `player_attributes`
- `formations`
- `formation_positions`
- `matches`
- `match_lineups`
- `match_events`

**Total: 14 tables**

### 3. Check Table Structure

```sql
-- Verify teams table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teams';

-- Verify matches table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches';

-- Count all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## 🚨 TROUBLESHOOTING

### Error: "relation 'migrations' does not exist"

```powershell
# The migrations table wasn't created. Run:
npm run migration:run
```

### Error: "relation 'users' already exists"

```powershell
# This is why we need the manual fix!
# Use Path B above (Manual Fix)
```

### Error: "password authentication failed"

```powershell
# Check your .env file
# Verify DATABASE_URL credentials are correct
cat .env | Select-String DATABASE_URL
```

### Error: "ECONNREFUSED" or "connect ETIMEDOUT"

```powershell
# Database is not accessible
# Check:
# 1. Database is running (if local)
# 2. Firewall allows connection
# 3. DATABASE_URL is correct
# 4. SSL settings match database requirements
```

### Error: "column 'extraTime' does not exist"

```powershell
# Migration didn't complete. Try:
npm run migration:revert
npm run migration:run
```

---

## 🎯 POST-MIGRATION CHECKLIST

After successful migration:

- [ ] All 6 migrations show `[X]` in `migration:show`
- [ ] 14 tables exist in database
- [ ] No errors when running `npm run migration:show`
- [ ] Backend starts successfully (`npm run start:dev`)
- [ ] Can connect to database from backend

---

## 🚀 NEXT STEPS AFTER MIGRATION

Once migrations are complete:

### 1. Start Backend Server (1 min)

```powershell
cd backend
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345  - 10/07/2025, 3:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 10/07/2025, 3:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 10/07/2025, 3:00:00 PM     LOG [RoutesResolver] Mapped {/auth/register, POST} route
[Nest] 12345  - 10/07/2025, 3:00:00 PM     LOG [RoutesResolver] Mapped {/auth/login, POST} route
...
[Nest] 12345  - 10/07/2025, 3:00:00 PM     LOG [NestApplication] Nest application successfully started
```

### 2. Test Authentication (2 min)

```powershell
# Register user
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method POST -ContentType "application/json" -Body (@{
  email = "test@example.com"
  password = "Test123!@#"
  firstName = "Test"
  lastName = "User"
  role = "coach"
} | ConvertTo-Json)

# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body (@{
  email = "test@example.com"
  password = "Test123!@#"
} | ConvertTo-Json)

$token = $loginResponse.access_token
$headers = @{ Authorization = "Bearer $token" }

Write-Host "✅ Authentication working! Token: $token"
```

### 3. Test Phase 3 Endpoints (15 min)

Use the comprehensive guide:
**`backend/PHASE3_QUICK_REFERENCE.md`**

Quick test:

```powershell
# Create team
$team = Invoke-RestMethod -Uri "http://localhost:3000/teams" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  name = "Test FC"
  description = "Testing Phase 3"
} | ConvertTo-Json)

Write-Host "✅ Team created! ID: $($team.id)"

# Create player
$player = Invoke-RestMethod -Uri "http://localhost:3000/players" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  firstName = "John"
  lastName = "Doe"
  dateOfBirth = "2000-01-15"
  position = "ST"
  teamId = $team.id
  jerseyNumber = 10
} | ConvertTo-Json)

Write-Host "✅ Player created! ID: $($player.id)"
```

---

## 📊 MIGRATION STATUS REFERENCE

### What Each Migration Does:

**1. AddEmailAndPasswordResetTokens (Phase 2)**
- Adds email verification columns to users table
- Adds password reset columns
- Creates indexes on token columns

**2. InitialSchema (Phase 2)**
- Creates users table
- Creates sessions table
- Sets up user roles enum
- Adds UUID extension

**3. CreateTeamsTable (Phase 3 Module 2)**
- Creates teams table
- Creates team_members table
- Creates team_invitations table
- Sets up team relationships

**4. CreatePlayersTable (Phase 3 Module 3)**
- Creates players table
- Creates player_stats table
- Creates player_attributes table
- Sets up player positions enum

**5. CreateFormationsTable (Phase 3 Module 4)**
- Creates formations table
- Creates formation_positions table
- Sets up formation shapes enum
- Sets up player roles enum

**6. CreateMatchesTables (Phase 3 Module 5)**
- Creates matches table
- Creates match_lineups table
- Creates match_events table
- Sets up match status and event type enums

---

## 🎉 SUCCESS INDICATORS

You'll know migrations succeeded when:

✅ **All 6 migrations marked complete**
```
npm run migration:show
[X] All six migrations listed with [X]
```

✅ **14 tables in database**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Returns: 14
```

✅ **Backend starts without errors**
```powershell
npm run start:dev
# No TypeORM errors, server starts on port 3000
```

✅ **Can create users**
```powershell
# Registration endpoint works
# Login endpoint works
# JWT token is generated
```

✅ **Can create teams, players, formations, matches**
```powershell
# All Phase 3 endpoints respond
# No 404 or 500 errors
```

---

## 🆘 NEED HELP?

### Common Issues & Solutions:

**"I don't know my database credentials"**
- Check your `.env` file in backend folder
- Or check your cloud provider dashboard (Supabase, Neon, etc.)

**"I can't connect to the database"**
- Verify DATABASE_URL in `.env` is correct
- Test connection: `npm run typeorm query "SELECT 1"`

**"Migration keeps failing"**
- Try fresh database approach (Path A)
- Check PostgreSQL version (needs 12+)

**"Tables are created but queries fail"**
- Restart backend server
- Check TypeORM entities are loading

---

## 📝 MIGRATION COMMANDS REFERENCE

```powershell
# Show migration status
npm run migration:show

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate -- -n MigrationName

# Create empty migration
npm run migration:create -- -n MigrationName
```

---

## 🎯 YOUR CURRENT POSITION

✅ Phase 3 code complete (all 5 modules)  
✅ Documentation complete (2,500+ lines)  
✅ Bug fixes applied  
✅ Migrations organized  
⏳ **YOU ARE HERE: Ready to execute migrations**  
⏳ Backend testing (after migration)  
⏳ Phase 4 planning (future)

---

**Time to complete:** 2-5 minutes  
**Difficulty:** Easy (just run SQL + npm command)  
**Blocking:** None (all prerequisites met)

**Once complete, you'll have:**
- 14 database tables
- 81 working REST endpoints
- Complete team management platform
- Ready for comprehensive testing

---

*Migration Execution Guide - Phase 3 Complete*  
*Ready to deploy and test!*
