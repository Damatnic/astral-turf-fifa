# PHASE 3 - QUICK API REFERENCE

Quick reference for testing all Phase 3 endpoints with PowerShell examples.

---

## 🔐 AUTHENTICATION

First, get your JWT token:

```powershell
# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body (@{
  email = "admin@example.com"
  password = "YourPassword123"
} | ConvertTo-Json)

$token = $loginResponse.access_token
$headers = @{ Authorization = "Bearer $token" }
```

---

## 📤 MODULE 1: FILE UPLOADS

### Upload Image
```powershell
$filePath = "C:\path\to\image.jpg"
$form = @{
  file = Get-Item -Path $filePath
}
Invoke-RestMethod -Uri "http://localhost:3000/uploads/image" -Method POST -Form $form -Headers $headers
```

### List Files
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/uploads/list" -Headers $headers
```

### Delete File
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/uploads/filename.jpg" -Method DELETE -Headers $headers
```

---

## 👥 MODULE 2: TEAM MANAGEMENT

### Create Team
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/teams" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  name = "FC Barcelona"
  description = "Professional football team"
  maxPlayers = 25
} | ConvertTo-Json)
```

### Get All Teams
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/teams" -Headers $headers
```

### Get Team Details
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/teams/1" -Headers $headers
```

### Update Team
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/teams/1" -Method PATCH -ContentType "application/json" -Headers $headers -Body (@{
  name = "FC Barcelona Updated"
  description = "Updated description"
} | ConvertTo-Json)
```

### Create Team Invitation
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/teams/1/invite" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  email = "player@example.com"
  role = "member"
} | ConvertTo-Json)
```

### Accept Invitation
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/teams/invitations/{token}/accept" -Method POST -Headers $headers
```

### Get Team Members
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/teams/1/members" -Headers $headers
```

### Update Member Role
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/teams/1/members/2/role" -Method PATCH -ContentType "application/json" -Headers $headers -Body (@{
  role = "coach"
} | ConvertTo-Json)
```

---

## ⚽ MODULE 3: PLAYER PROFILES

### Create Player
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/players" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  firstName = "Lionel"
  lastName = "Messi"
  dateOfBirth = "1987-06-24"
  position = "RW"
  preferredFoot = "LEFT"
  height = 170
  weight = 72
  nationality = "Argentina"
  jerseyNumber = 10
  teamId = 1
} | ConvertTo-Json)
```

### Get All Players (with filters)
```powershell
# All players
Invoke-RestMethod -Uri "http://localhost:3000/players" -Headers $headers

# Filter by team
Invoke-RestMethod -Uri "http://localhost:3000/players?teamId=1" -Headers $headers

# Filter by position
Invoke-RestMethod -Uri "http://localhost:3000/players?position=ST" -Headers $headers

# Filter by status
Invoke-RestMethod -Uri "http://localhost:3000/players?status=ACTIVE" -Headers $headers
```

### Get Player Details
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/players/1" -Headers $headers
```

### Get Top Players
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/players/top?limit=10" -Headers $headers
```

### Get Free Agents
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/players/free-agents" -Headers $headers
```

### Update Player Attributes
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/players/1/attributes" -Method PATCH -ContentType "application/json" -Headers $headers -Body (@{
  pace = 85
  shooting = 90
  passing = 88
  dribbling = 92
  defending = 30
  physical = 65
} | ConvertTo-Json)
```

### Create Player Stats
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/players/1/stats" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  playerId = 1
  season = "2024-2025"
  matchesPlayed = 10
  goals = 8
  assists = 5
  yellowCards = 2
  redCards = 0
} | ConvertTo-Json)
```

### Assign Player to Team
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/players/1/assign-team" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  teamId = 1
} | ConvertTo-Json)
```

---

## 🎯 MODULE 4: FORMATION BUILDER

### Create Formation
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/formations" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  name = "Classic 4-4-2"
  shape = "4-4-2"
  description = "Traditional balanced formation"
  teamId = 1
  isDefault = $true
  tacticalInstructions = @{
    tempo = "normal"
    width = "wide"
    pressing = "medium"
    defensiveLine = "normal"
  }
} | ConvertTo-Json)
```

### Get All Formations
```powershell
# All formations
Invoke-RestMethod -Uri "http://localhost:3000/formations" -Headers $headers

# Filter by team
Invoke-RestMethod -Uri "http://localhost:3000/formations?teamId=1" -Headers $headers

# Get templates only
Invoke-RestMethod -Uri "http://localhost:3000/formations?isTemplate=true" -Headers $headers
```

### Get Formation Templates
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/formations/templates" -Headers $headers
```

### Clone Formation
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/formations/1/clone?teamId=2" -Method POST -Headers $headers
```

### Add Position to Formation
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/formations/1/positions" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  formationId = 1
  position = "ST"
  positionX = 50
  positionY = 90
  role = "TARGET_MAN"
  playerId = 1
} | ConvertTo-Json)
```

### Assign Player to Position
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/formations/positions/1/player/2" -Method POST -Headers $headers
```

### Get Default Formation
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/formations/team/1/default" -Headers $headers
```

---

## 🏆 MODULE 5: MATCH PLANNING

### Create Match
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  homeTeamId = 1
  awayTeamId = 2
  scheduledAt = "2025-10-15T19:00:00Z"
  venue = "Camp Nou"
  competition = "La Liga"
  round = "Matchday 10"
  homeFormationId = 1
  awayFormationId = 2
} | ConvertTo-Json)
```

### Get All Matches
```powershell
# All matches
Invoke-RestMethod -Uri "http://localhost:3000/matches" -Headers $headers

# Filter by team
Invoke-RestMethod -Uri "http://localhost:3000/matches?teamId=1" -Headers $headers

# Filter by status
Invoke-RestMethod -Uri "http://localhost:3000/matches?status=scheduled" -Headers $headers

# Filter by date range
Invoke-RestMethod -Uri "http://localhost:3000/matches?startDate=2025-10-01&endDate=2025-10-31" -Headers $headers
```

### Get Match Details
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/1" -Headers $headers
```

### Get Match Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/1/summary" -Headers $headers
```

### Start Match
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/1/start" -Method POST -Headers $headers
```

### Add Player to Lineup
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/lineup" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  matchId = 1
  teamId = 1
  playerId = 1
  position = "ST"
  isStarting = $true
  jerseyNumber = 10
} | ConvertTo-Json)
```

### Get Match Lineup
```powershell
# All lineups
Invoke-RestMethod -Uri "http://localhost:3000/matches/1/lineup" -Headers $headers

# Filter by team
Invoke-RestMethod -Uri "http://localhost:3000/matches/1/lineup?teamId=1" -Headers $headers
```

### Record Match Event
```powershell
# Goal
Invoke-RestMethod -Uri "http://localhost:3000/matches/events" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  matchId = 1
  teamId = 1
  playerId = 1
  eventType = "goal"
  minute = 25
  description = "Header from corner"
} | ConvertTo-Json)

# Assist
Invoke-RestMethod -Uri "http://localhost:3000/matches/events" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  matchId = 1
  teamId = 1
  playerId = 2
  eventType = "assist"
  minute = 25
  relatedPlayerId = 1
} | ConvertTo-Json)

# Yellow Card
Invoke-RestMethod -Uri "http://localhost:3000/matches/events" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  matchId = 1
  teamId = 2
  playerId = 5
  eventType = "yellow_card"
  minute = 35
  description = "Tactical foul"
} | ConvertTo-Json)

# Substitution
Invoke-RestMethod -Uri "http://localhost:3000/matches/events" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  matchId = 1
  teamId = 1
  playerId = 10
  eventType = "substitution_in"
  minute = 60
  relatedPlayerId = 8
} | ConvertTo-Json)
```

### Get Match Events
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/1/events" -Headers $headers
```

### End Match
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/1/end" -Method POST -Headers $headers
```

### Update Player Rating
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/lineup/1" -Method PATCH -ContentType "application/json" -Headers $headers -Body (@{
  minutesPlayed = 90
  rating = 8.5
} | ConvertTo-Json)
```

---

## 🔄 COMPLETE WORKFLOW EXAMPLE

### 1. Create Team
```powershell
$team = Invoke-RestMethod -Uri "http://localhost:3000/teams" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  name = "My Team"
  description = "Test team"
} | ConvertTo-Json)
```

### 2. Create Players
```powershell
$player1 = Invoke-RestMethod -Uri "http://localhost:3000/players" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  firstName = "John"
  lastName = "Doe"
  dateOfBirth = "1995-01-15"
  position = "ST"
  teamId = $team.id
  jerseyNumber = 9
} | ConvertTo-Json)

$player2 = Invoke-RestMethod -Uri "http://localhost:3000/players" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  firstName = "Jane"
  lastName = "Smith"
  dateOfBirth = "1997-03-20"
  position = "GK"
  teamId = $team.id
  jerseyNumber = 1
} | ConvertTo-Json)
```

### 3. Create Formation
```powershell
$formation = Invoke-RestMethod -Uri "http://localhost:3000/formations" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  name = "4-4-2"
  shape = "4-4-2"
  teamId = $team.id
  isDefault = $true
} | ConvertTo-Json)
```

### 4. Schedule Match
```powershell
$match = Invoke-RestMethod -Uri "http://localhost:3000/matches" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  homeTeamId = $team.id
  awayTeamId = 2
  scheduledAt = "2025-10-20T15:00:00Z"
  venue = "Home Stadium"
  homeFormationId = $formation.id
} | ConvertTo-Json)
```

### 5. Add Lineup
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/lineup" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  matchId = $match.id
  teamId = $team.id
  playerId = $player1.id
  position = "ST"
  isStarting = $true
  jerseyNumber = 9
} | ConvertTo-Json)
```

### 6. Start Match
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/$($match.id)/start" -Method POST -Headers $headers
```

### 7. Record Goal
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/events" -Method POST -ContentType "application/json" -Headers $headers -Body (@{
  matchId = $match.id
  teamId = $team.id
  playerId = $player1.id
  eventType = "goal"
  minute = 30
} | ConvertTo-Json)
```

### 8. End Match
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/$($match.id)/end" -Method POST -Headers $headers
```

### 9. Get Match Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/matches/$($match.id)/summary" -Headers $headers
```

---

## 📊 COMMON QUERIES

### Get Team with Full Details
```powershell
$team = Invoke-RestMethod -Uri "http://localhost:3000/teams/1" -Headers $headers
$members = Invoke-RestMethod -Uri "http://localhost:3000/teams/1/members" -Headers $headers
$players = Invoke-RestMethod -Uri "http://localhost:3000/players?teamId=1" -Headers $headers
$formations = Invoke-RestMethod -Uri "http://localhost:3000/formations?teamId=1" -Headers $headers
$matches = Invoke-RestMethod -Uri "http://localhost:3000/matches?teamId=1" -Headers $headers
```

### Get Player Complete Profile
```powershell
$player = Invoke-RestMethod -Uri "http://localhost:3000/players/1" -Headers $headers
$stats = Invoke-RestMethod -Uri "http://localhost:3000/players/1/stats" -Headers $headers
$attributes = Invoke-RestMethod -Uri "http://localhost:3000/players/1/attributes" -Headers $headers
```

### Get Live Match Data
```powershell
$match = Invoke-RestMethod -Uri "http://localhost:3000/matches/1" -Headers $headers
$lineup = Invoke-RestMethod -Uri "http://localhost:3000/matches/1/lineup" -Headers $headers
$events = Invoke-RestMethod -Uri "http://localhost:3000/matches/1/events" -Headers $headers
```

---

## 🎯 ENUMS & VALID VALUES

### Player Positions
`GK`, `CB`, `LB`, `RB`, `LWB`, `RWB`, `CDM`, `CM`, `CAM`, `LM`, `RM`, `LW`, `RW`, `ST`, `CF`

### Player Status
`ACTIVE`, `INJURED`, `SUSPENDED`, `INACTIVE`

### Preferred Foot
`LEFT`, `RIGHT`, `BOTH`

### Formation Shapes
`4-4-2`, `4-3-3`, `4-2-3-1`, `3-5-2`, `3-4-3`, `5-3-2`, `4-1-4-1`, `4-3-2-1`, `4-1-2-1-2`, `3-4-1-2`

### Match Status
`scheduled`, `in_progress`, `completed`, `cancelled`, `postponed`

### Match Event Types
`goal`, `assist`, `yellow_card`, `red_card`, `substitution_in`, `substitution_out`, `injury`

### Team Member Roles
`owner`, `coach`, `member`

### User Roles
`admin`, `coach`, `player`, `family`

---

*Quick Reference - Phase 3 Complete*  
*For detailed documentation, see PHASE3_COMPLETE_SUMMARY.md*
