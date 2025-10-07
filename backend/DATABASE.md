# Database Management

This document describes how to manage database migrations and seeding for the Astral Turf backend.

## Prerequisites

- PostgreSQL database (Neon PostgreSQL cloud or local)
- DATABASE_URL configured in `.env` file
- Node.js and npm installed

## Database Configuration

The database connection is configured in `src/database/data-source.ts` using TypeORM's DataSource.

## Migrations

Migrations are located in `src/database/migrations/` and track database schema changes.

### Run Migrations

Apply all pending migrations to the database:

```bash
npm run migration:run
```

### Revert Last Migration

Undo the most recently applied migration:

```bash
npm run migration:revert
```

### Generate New Migration

After modifying entity files, generate a new migration:

```bash
npm run migration:generate -- src/database/migrations/YourMigrationName
```

### Show Migration Status

View which migrations have been applied:

```bash
npm run migration:show
```

## Seeding

Seeders populate the database with initial/demo data.

### Run Seeder

Seed the database with demo users and initial data:

```bash
npm run seed
```

### Demo Accounts

After seeding, the following demo accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@astralturf.com | Demo123! | admin |
| coach.demo@astralturf.com | Demo123! | coach |
| player.demo@astralturf.com | Demo123! | player |
| family.demo@astralturf.com | Demo123! | family |

## Database Reset

To completely reset the database (revert all migrations, re-run them, and seed):

```bash
npm run db:reset
```

**⚠️ WARNING:** This will delete all data in the database!

## Manual Database Operations

### Connect to Neon PostgreSQL

Using psql:

```bash
psql "postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Check Current Schema

```sql
-- List all tables
\dt

-- Describe a table
\d users

-- View data
SELECT * FROM users;
SELECT * FROM sessions;
```

## Migration Best Practices

1. **Never edit applied migrations** - Always create new migrations for changes
2. **Test migrations** - Run `migration:run` and `migration:revert` to ensure they work both ways
3. **Version control** - Always commit migrations to git
4. **Production safety** - Review migrations before applying to production
5. **Backup first** - Always backup production data before running migrations

## Troubleshooting

### Migration Already Exists Error

If you see "Migration already exists", the schema is already up to date. Check with:

```bash
npm run migration:show
```

### Connection Errors

1. Verify DATABASE_URL in `.env`
2. Check Neon PostgreSQL is accessible
3. Verify SSL configuration

### Schema Mismatch

If entities don't match the database:

1. Generate a new migration: `npm run migration:generate -- src/database/migrations/FixSchema`
2. Review the generated SQL
3. Run the migration: `npm run migration:run`

## Current Schema

### Users Table

Stores all user accounts (coaches, players, family members, admins).

### Sessions Table

Stores refresh tokens for JWT authentication.

### Family Permissions Table

Manages what family members can see about their players.

## Next Steps

- Add more seeders for teams, matches, statistics
- Create migration for production deployment
- Set up automatic backups
- Implement soft deletes for audit trail
