# Phase 3: Core Application Features - Implementation Plan

**Created:** October 7, 2025  
**Status:** Planning  
**Prerequisites:** Phase 2 Complete ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Overview](#architecture-overview)
3. [Module Breakdown](#module-breakdown)
4. [Implementation Order](#implementation-order)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Timeline](#timeline)
8. [Success Criteria](#success-criteria)

---

## Overview

Phase 3 focuses on building the core football management features that make Astral Turf unique. This includes team management, player profiles, tactical planning, and match management.

### Goals

- Enable coaches to manage teams and players
- Provide detailed player profiling and statistics
- Support tactical planning with formation builder
- Facilitate match planning and lineup management
- Track performance metrics and analytics

### Key Features

1. **Team Management** - Create and manage teams, invite members
2. **Player Profiles** - Comprehensive player data and statistics
3. **Formation Builder** - Visual tactical planning tool
4. **Match Planning** - Schedule matches, assign lineups
5. **Analytics Dashboard** - Performance insights and metrics

---

## Architecture Overview

### Technology Stack

**Backend:**
- NestJS (existing)
- TypeORM (existing)
- PostgreSQL (existing)
- Redis (existing, optional)

**New Additions:**
- File uploads for player photos
- Real-time updates (WebSockets) - optional for Phase 3
- Image processing (sharp) for photo optimization

### Module Structure

```
src/
├── teams/                  # Team management
│   ├── teams.module.ts
│   ├── teams.controller.ts
│   ├── teams.service.ts
│   ├── entities/
│   │   └── team.entity.ts
│   └── dto/
│       ├── create-team.dto.ts
│       └── update-team.dto.ts
├── players/                # Player management
│   ├── players.module.ts
│   ├── players.controller.ts
│   ├── players.service.ts
│   ├── entities/
│   │   ├── player.entity.ts
│   │   └── player-stats.entity.ts
│   └── dto/
│       ├── create-player.dto.ts
│       └── update-player.dto.ts
├── formations/             # Formation builder
│   ├── formations.module.ts
│   ├── formations.controller.ts
│   ├── formations.service.ts
│   ├── entities/
│   │   └── formation.entity.ts
│   └── dto/
│       ├── create-formation.dto.ts
│       └── update-formation.dto.ts
├── matches/                # Match management
│   ├── matches.module.ts
│   ├── matches.controller.ts
│   ├── matches.service.ts
│   ├── entities/
│   │   ├── match.entity.ts
│   │   └── lineup.entity.ts
│   └── dto/
│       ├── create-match.dto.ts
│       └── create-lineup.dto.ts
└── uploads/                # File upload handling
    ├── uploads.module.ts
    ├── uploads.service.ts
    └── interceptors/
        └── file-upload.interceptor.ts
```

---

## Module Breakdown

### Module 1: Team Management

**Priority:** HIGH  
**Estimated Time:** 3-5 days  
**Dependencies:** Phase 2 (Auth & Users)

#### Features

1. **Team Creation**
   - Create new teams with basic information
   - Set team name, logo, colors
   - Coach assignment (automatic for creator)

2. **Team Settings**
   - Update team details
   - Manage team privacy settings
   - Team branding (logo, colors)

3. **Member Management**
   - Invite players/coaches via email
   - Accept/reject invitations
   - Remove members
   - Role assignment within team

4. **Team Roster**
   - View all team members
   - Filter by role (player, coach, staff)
   - Search functionality

#### Database Schema

**Teams Table:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  founded_date DATE,
  coach_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teams_coach_id ON teams(coach_id);
CREATE INDEX idx_teams_slug ON teams(slug);
```

**Team Members Table:**
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- player, coach, assistant_coach, staff
  jersey_number INTEGER,
  position VARCHAR(50),
  joined_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, invited
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
```

**Team Invitations Table:**
```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
```

#### API Endpoints

**Teams:**
- `POST /api/teams` - Create team (coach only)
- `GET /api/teams` - List all teams (filtered by user role)
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team (coach only)
- `DELETE /api/teams/:id` - Delete team (coach only)

**Team Members:**
- `GET /api/teams/:id/members` - List team members
- `POST /api/teams/:id/members` - Add member (coach only)
- `DELETE /api/teams/:id/members/:userId` - Remove member (coach only)
- `PUT /api/teams/:id/members/:userId` - Update member role/details (coach only)

**Team Invitations:**
- `POST /api/teams/:id/invitations` - Send invitation (coach only)
- `GET /api/teams/:id/invitations` - List pending invitations (coach only)
- `POST /api/teams/invitations/:token/accept` - Accept invitation
- `POST /api/teams/invitations/:token/reject` - Reject invitation

#### RBAC Rules

- **Admin:** Full access to all teams
- **Coach:** Full access to their teams only
- **Player:** View their teams, accept/reject invitations
- **Family:** View family member's teams (read-only)

---

### Module 2: Player Profiles

**Priority:** HIGH  
**Estimated Time:** 4-6 days  
**Dependencies:** Module 1 (Teams)

#### Features

1. **Player Profile**
   - Personal information (linked to user)
   - Photo upload
   - Physical attributes (height, weight, preferred foot)
   - Position(s)
   - Jersey number

2. **Player Statistics**
   - Games played
   - Goals scored
   - Assists
   - Minutes played
   - Custom stats (per position)

3. **Player Skills**
   - Skill ratings (pace, shooting, passing, dribbling, defending, physical)
   - Custom attributes
   - Skill progression tracking

4. **Player History**
   - Previous teams
   - Achievements
   - Injuries log

#### Database Schema

**Players Table:**
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  photo_url VARCHAR(500),
  date_of_birth DATE,
  height INTEGER, -- in cm
  weight INTEGER, -- in kg
  preferred_foot VARCHAR(10), -- left, right, both
  primary_position VARCHAR(50),
  secondary_positions VARCHAR(255)[], -- array of positions
  jersey_number INTEGER,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_team_id ON players(team_id);
```

**Player Stats Table:**
```sql
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season VARCHAR(20),
  games_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  clean_sheets INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, season)
);

CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX idx_player_stats_season ON player_stats(season);
```

**Player Attributes Table:**
```sql
CREATE TABLE player_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pace INTEGER CHECK (pace >= 0 AND pace <= 100),
  shooting INTEGER CHECK (shooting >= 0 AND shooting <= 100),
  passing INTEGER CHECK (passing >= 0 AND passing <= 100),
  dribbling INTEGER CHECK (dribbling >= 0 AND dribbling <= 100),
  defending INTEGER CHECK (defending >= 0 AND defending <= 100),
  physical INTEGER CHECK (physical >= 0 AND physical <= 100),
  overall_rating INTEGER GENERATED ALWAYS AS (
    (pace + shooting + passing + dribbling + defending + physical) / 6
  ) STORED,
  assessed_at TIMESTAMP DEFAULT NOW(),
  assessed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE INDEX idx_player_attributes_player_id ON player_attributes(player_id);
```

#### API Endpoints

**Player Profiles:**
- `POST /api/players` - Create player profile
- `GET /api/players` - List all players (filtered by team/role)
- `GET /api/players/:id` - Get player details
- `PUT /api/players/:id` - Update player profile
- `DELETE /api/players/:id` - Delete player profile
- `POST /api/players/:id/photo` - Upload player photo

**Player Stats:**
- `GET /api/players/:id/stats` - Get player statistics
- `PUT /api/players/:id/stats` - Update player statistics (coach only)
- `GET /api/players/:id/stats/history` - Get stats history across seasons

**Player Attributes:**
- `GET /api/players/:id/attributes` - Get player attributes
- `PUT /api/players/:id/attributes` - Update attributes (coach only)
- `GET /api/players/:id/attributes/history` - Get attribute progression

#### RBAC Rules

- **Admin:** Full access to all players
- **Coach:** Full access to team players
- **Player:** View own profile, limited edit (not stats/attributes)
- **Family:** View family member's profile (read-only)

---

### Module 3: Formation Builder

**Priority:** MEDIUM  
**Estimated Time:** 5-7 days  
**Dependencies:** Module 2 (Players)

#### Features

1. **Formation Templates**
   - Pre-defined formations (4-4-2, 4-3-3, 3-5-2, etc.)
   - Custom formations
   - Save/load formations

2. **Visual Editor**
   - Drag-and-drop player positioning
   - Field visualization
   - Position markers
   - Formation validation

3. **Player Assignment**
   - Assign players to positions
   - Player recommendations based on attributes
   - Substitute planning

4. **Formation Analytics**
   - Formation strengths/weaknesses
   - Coverage maps
   - Tactical notes

#### Database Schema

**Formations Table:**
```sql
CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  formation_type VARCHAR(20) NOT NULL, -- e.g., "4-4-2", "4-3-3"
  description TEXT,
  positions JSONB NOT NULL, -- [{position: "GK", x: 50, y: 5}, ...]
  is_template BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_formations_team_id ON formations(team_id);
CREATE INDEX idx_formations_type ON formations(formation_type);
```

**Formation Assignments Table:**
```sql
CREATE TABLE formation_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position VARCHAR(50) NOT NULL,
  position_x DECIMAL(5,2), -- percentage across field
  position_y DECIMAL(5,2), -- percentage down field
  is_substitute BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_formation_assignments_formation_id ON formation_assignments(formation_id);
CREATE INDEX idx_formation_assignments_player_id ON formation_assignments(player_id);
```

#### API Endpoints

**Formations:**
- `POST /api/formations` - Create formation (coach only)
- `GET /api/formations` - List formations (filtered by team)
- `GET /api/formations/:id` - Get formation details
- `PUT /api/formations/:id` - Update formation (coach only)
- `DELETE /api/formations/:id` - Delete formation (coach only)
- `POST /api/formations/:id/clone` - Clone formation

**Formation Templates:**
- `GET /api/formations/templates` - List pre-defined templates
- `POST /api/formations/templates/:type` - Create from template

**Player Assignments:**
- `POST /api/formations/:id/assignments` - Assign player to position
- `GET /api/formations/:id/assignments` - Get all assignments
- `PUT /api/formations/:id/assignments/:assignmentId` - Update assignment
- `DELETE /api/formations/:id/assignments/:assignmentId` - Remove assignment

#### RBAC Rules

- **Admin:** Full access to all formations
- **Coach:** Full access to team formations
- **Player:** View team formations (read-only)
- **Family:** View team formations (read-only)

---

### Module 4: Match Planning

**Priority:** MEDIUM-HIGH  
**Estimated Time:** 4-6 days  
**Dependencies:** Module 3 (Formations)

#### Features

1. **Match Scheduling**
   - Create matches
   - Set date, time, location
   - Opponent details
   - Match type (friendly, league, tournament)

2. **Match Preparation**
   - Assign formation
   - Select starting lineup
   - Select substitutes
   - Pre-match notes

3. **Match Tracking**
   - Record match events (goals, substitutions, cards)
   - Track player performance
   - Match statistics

4. **Post-Match Analysis**
   - Match summary
   - Player ratings
   - Performance insights
   - Notes and feedback

#### Database Schema

**Matches Table:**
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent_name VARCHAR(100) NOT NULL,
  match_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  match_type VARCHAR(50), -- friendly, league, cup, tournament
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  home_score INTEGER,
  away_score INTEGER,
  is_home_match BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_matches_team_id ON matches(team_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
```

**Match Lineups Table:**
```sql
CREATE TABLE match_lineups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES formations(id),
  player_id UUID NOT NULL REFERENCES players(id),
  position VARCHAR(50) NOT NULL,
  jersey_number INTEGER,
  is_starter BOOLEAN DEFAULT TRUE,
  substituted_in BOOLEAN DEFAULT FALSE,
  substituted_out BOOLEAN DEFAULT FALSE,
  minutes_played INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_match_lineups_match_id ON match_lineups(match_id);
CREATE INDEX idx_match_lineups_player_id ON match_lineups(player_id);
```

**Match Events Table:**
```sql
CREATE TABLE match_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  event_type VARCHAR(50) NOT NULL, -- goal, assist, yellow_card, red_card, substitution
  minute INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_match_events_match_id ON match_events(match_id);
CREATE INDEX idx_match_events_player_id ON match_events(player_id);
```

**Player Match Ratings Table:**
```sql
CREATE TABLE player_match_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  feedback TEXT,
  rated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

CREATE INDEX idx_player_match_ratings_match_id ON player_match_ratings(match_id);
CREATE INDEX idx_player_match_ratings_player_id ON player_match_ratings(player_id);
```

#### API Endpoints

**Matches:**
- `POST /api/matches` - Create match (coach only)
- `GET /api/matches` - List matches (filtered by team)
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id` - Update match (coach only)
- `DELETE /api/matches/:id` - Delete match (coach only)

**Match Lineups:**
- `POST /api/matches/:id/lineup` - Set match lineup (coach only)
- `GET /api/matches/:id/lineup` - Get match lineup
- `PUT /api/matches/:id/lineup` - Update lineup (coach only)

**Match Events:**
- `POST /api/matches/:id/events` - Record match event (coach only)
- `GET /api/matches/:id/events` - Get match events
- `PUT /api/matches/:id/events/:eventId` - Update event (coach only)
- `DELETE /api/matches/:id/events/:eventId` - Delete event (coach only)

**Player Ratings:**
- `POST /api/matches/:id/ratings` - Submit player ratings (coach only)
- `GET /api/matches/:id/ratings` - Get match ratings
- `PUT /api/matches/:id/ratings/:playerId` - Update rating (coach only)

#### RBAC Rules

- **Admin:** Full access to all matches
- **Coach:** Full access to team matches
- **Player:** View team matches and own ratings (read-only)
- **Family:** View team matches (read-only)

---

### Module 5: File Uploads (Supporting Module)

**Priority:** HIGH (Required for Module 2)  
**Estimated Time:** 2-3 days  
**Dependencies:** None

#### Features

1. **Image Upload**
   - Team logos
   - Player photos
   - File validation
   - Size limits

2. **Image Processing**
   - Resize and optimize images
   - Generate thumbnails
   - Format conversion

3. **Storage**
   - Local file storage (development)
   - Cloud storage support (AWS S3, Azure Blob - future)

4. **Security**
   - File type validation
   - Size limits
   - Virus scanning (optional)
   - Authenticated uploads only

#### Implementation

**Upload Service:**
```typescript
@Injectable()
export class UploadsService {
  async uploadImage(file: Express.Multer.File, type: 'team' | 'player'): Promise<string> {
    // Validate file
    // Process/optimize image
    // Save to storage
    // Return URL
  }

  async deleteImage(url: string): Promise<void> {
    // Delete from storage
  }
}
```

**API Endpoints:**
- `POST /api/uploads/image` - Upload image
- `DELETE /api/uploads/image` - Delete image

---

## Implementation Order

### Week 1: Foundation
**Days 1-2:** Module 5 - File Uploads
- Set up multer for file handling
- Image processing with sharp
- Storage service
- Upload endpoints

**Days 3-5:** Module 1 - Team Management (Part 1)
- Team entity and basic CRUD
- Team members management
- Database migrations

**Days 6-7:** Module 1 - Team Management (Part 2)
- Team invitations system
- Email notifications
- Testing

### Week 2: Player Profiles
**Days 1-3:** Module 2 - Player Profiles (Part 1)
- Player entity and basic CRUD
- Player stats entity
- Photo upload integration

**Days 4-6:** Module 2 - Player Profiles (Part 2)
- Player attributes system
- Stats tracking
- Testing

**Day 7:** Buffer/Documentation
- Update API documentation
- Integration testing
- Bug fixes

### Week 3: Tactical Planning
**Days 1-4:** Module 3 - Formation Builder
- Formation entity and CRUD
- Formation templates
- Player assignments
- Position validation

**Days 5-7:** Module 4 - Match Planning (Part 1)
- Match entity and CRUD
- Match scheduling
- Basic lineup management

### Week 4: Match Management & Polish
**Days 1-3:** Module 4 - Match Planning (Part 2)
- Match events tracking
- Player ratings
- Match statistics

**Days 4-7:** Integration & Testing
- End-to-end testing
- Performance optimization
- Documentation
- Bug fixes

---

## Database Migrations Plan

### Migration 1: Teams (Week 1)
- Create teams table
- Create team_members table
- Create team_invitations table
- Create indexes

### Migration 2: Players (Week 2)
- Create players table
- Create player_stats table
- Create player_attributes table
- Create indexes

### Migration 3: Formations (Week 3)
- Create formations table
- Create formation_assignments table
- Create indexes

### Migration 4: Matches (Week 3-4)
- Create matches table
- Create match_lineups table
- Create match_events table
- Create player_match_ratings table
- Create indexes

---

## API Endpoints Summary

### Total Endpoints: ~40-50 endpoints

**Teams Module:** ~10 endpoints
- Teams CRUD (5)
- Team members (4)
- Team invitations (4)

**Players Module:** ~12 endpoints
- Player CRUD (6)
- Player stats (3)
- Player attributes (3)

**Formations Module:** ~8 endpoints
- Formations CRUD (6)
- Formation templates (2)

**Matches Module:** ~12 endpoints
- Matches CRUD (5)
- Match lineups (3)
- Match events (4)
- Player ratings (3)

**Uploads Module:** ~2 endpoints
- Image upload/delete (2)

---

## Success Criteria

### Module 1: Team Management ✅
- [ ] Coaches can create and manage teams
- [ ] Team invitations work via email
- [ ] Members can join/leave teams
- [ ] Team roster displays correctly
- [ ] RBAC rules enforced

### Module 2: Player Profiles ✅
- [ ] Players can create profiles with photos
- [ ] Stats tracking works correctly
- [ ] Attributes system functional
- [ ] Profile updates work
- [ ] RBAC rules enforced

### Module 3: Formation Builder ✅
- [ ] Formations can be created and saved
- [ ] Players can be assigned to positions
- [ ] Visual representation works
- [ ] Formation templates available
- [ ] RBAC rules enforced

### Module 4: Match Planning ✅
- [ ] Matches can be scheduled
- [ ] Lineups can be set
- [ ] Match events can be recorded
- [ ] Player ratings can be submitted
- [ ] Match statistics calculated
- [ ] RBAC rules enforced

### Module 5: File Uploads ✅
- [ ] Images upload successfully
- [ ] Images are optimized
- [ ] File validation works
- [ ] Security measures in place

---

## Testing Strategy

### Unit Tests
- All services
- All controllers
- All DTOs/validators
- All entities

### Integration Tests
- API endpoints
- Database operations
- File uploads
- Email sending

### E2E Tests
- Complete workflows:
  - Team creation → Player invitation → Profile setup
  - Formation creation → Player assignment
  - Match creation → Lineup setup → Event recording

---

## Documentation Requirements

### API Documentation
- OpenAPI/Swagger documentation
- Request/response examples
- Authentication requirements
- RBAC rules per endpoint

### Developer Documentation
- Module architecture
- Database schema
- Entity relationships
- Service methods

### User Documentation
- Feature guides
- API usage examples
- Troubleshooting

---

## Performance Considerations

### Database
- Proper indexing on all foreign keys
- Query optimization
- Pagination for list endpoints
- Caching for frequently accessed data

### File Storage
- Image optimization
- CDN for file serving (future)
- Cleanup of unused files

### API
- Response pagination
- Rate limiting
- Query filtering
- Response compression

---

## Security Considerations

### Authentication & Authorization
- All endpoints require authentication (except invitations)
- RBAC enforced on all operations
- Team-level access control
- Owner validation

### File Uploads
- File type validation
- Size limits
- Authenticated uploads only
- Secure file storage

### Data Privacy
- Users can only see their teams
- Family members have limited access
- Sensitive data protected

---

## Next Steps

1. **Review this plan** - Ensure all requirements are covered
2. **Set up project board** - Track tasks and progress
3. **Create first migration** - Teams module database schema
4. **Start with Module 5** - File uploads (foundation)
5. **Implement Module 1** - Team management
6. **Continue in order** - Following the implementation timeline

---

## Questions to Consider

1. **Real-time features?** - Do we need WebSockets for live match updates?
2. **Mobile app?** - Will there be a mobile app consuming this API?
3. **Analytics?** - How detailed should player/team analytics be?
4. **Notifications?** - Email, push, or in-app notifications?
5. **Internationalization?** - Multi-language support needed?

---

**Ready to begin Phase 3!** 🚀

Let's start building the core features that make Astral Turf an amazing football management platform!
