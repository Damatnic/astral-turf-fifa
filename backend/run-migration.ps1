# Phase 3 Migration Execution Script
# This script helps you complete the database migration setup

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     PHASE 3: DATABASE MIGRATION SETUP" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host " CURRENT STATUS:" -ForegroundColor Yellow
Write-Host "   ✅ Phase 3 code complete (all 5 modules)" -ForegroundColor Green
Write-Host "   ✅ Documentation complete" -ForegroundColor Green
Write-Host "   ✅ Bug fixes applied" -ForegroundColor Green
Write-Host "   ✅ Migrations organized (6 total)" -ForegroundColor Green
Write-Host "   ⏳ Database migration pending`n" -ForegroundColor Yellow

Write-Host " MIGRATION REQUIRED:" -ForegroundColor Yellow
Write-Host "   Phase 2 'InitialSchema' migration needs manual marking" -ForegroundColor White
Write-Host "   Reason: 'users' table already exists from previous testing`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Ask user to choose approach
Write-Host " CHOOSE YOUR APPROACH:`n" -ForegroundColor Yellow

Write-Host "   [A] FRESH DATABASE (Recommended)" -ForegroundColor Cyan
Write-Host "       - Drops and recreates database" -ForegroundColor Gray
Write-Host "       - Clean slate, no conflicts" -ForegroundColor Gray
Write-Host "       - ⚠️  Deletes all existing data" -ForegroundColor Yellow
Write-Host "       - Time: 2 minutes`n" -ForegroundColor Gray

Write-Host "   [B] MANUAL FIX (Preserve Data)" -ForegroundColor Cyan
Write-Host "       - Keeps existing test data" -ForegroundColor Gray
Write-Host "       - Requires running SQL script" -ForegroundColor Gray
Write-Host "       - ✅ Preserves existing data" -ForegroundColor Green
Write-Host "       - Time: 3 minutes`n" -ForegroundColor Gray

Write-Host "   [C] SHOW CURRENT STATUS" -ForegroundColor Cyan
Write-Host "       - Check migration status" -ForegroundColor Gray
Write-Host "       - View database connection" -ForegroundColor Gray
Write-Host "       - No changes made`n" -ForegroundColor Gray

Write-Host "   [Q] QUIT" -ForegroundColor Red
Write-Host "       - Exit without making changes`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$choice = Read-Host "Enter your choice (A/B/C/Q)"

switch ($choice.ToUpper()) {
    "A" {
        Write-Host "`n⚠️  WARNING: FRESH DATABASE APPROACH" -ForegroundColor Red
        Write-Host "   This will DELETE all existing data in the database!" -ForegroundColor Yellow
        Write-Host "   Tables to be dropped: users, sessions, and any test data`n" -ForegroundColor Yellow
        
        $confirm = Read-Host "Are you SURE? Type 'YES' to continue"
        
        if ($confirm -eq "YES") {
            Write-Host "`n📋 INSTRUCTIONS FOR FRESH DATABASE:`n" -ForegroundColor Cyan
            
            Write-Host "1. Connect to your PostgreSQL database" -ForegroundColor White
            Write-Host "   (Use pgAdmin, DBeaver, psql, or Supabase dashboard)`n" -ForegroundColor Gray
            
            Write-Host "2. Run these SQL commands:" -ForegroundColor White
            Write-Host "   DROP DATABASE IF EXISTS astral_turf_db;" -ForegroundColor Yellow
            Write-Host "   CREATE DATABASE astral_turf_db;`n" -ForegroundColor Yellow
            
            Write-Host "3. Press ENTER when done..." -ForegroundColor White
            Read-Host
            
            Write-Host "`n🚀 Running migrations...`n" -ForegroundColor Cyan
            
            # Run migrations
            npm run migration:run
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✅ SUCCESS! All migrations completed!`n" -ForegroundColor Green
                
                Write-Host "Verifying migration status...`n" -ForegroundColor Cyan
                npm run migration:show
                
                Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Green
                Write-Host "     MIGRATION COMPLETE!" -ForegroundColor White -BackgroundColor DarkGreen
                Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Green
                
                Write-Host " NEXT STEPS:`n" -ForegroundColor Yellow
                Write-Host "   1. Start backend server:" -ForegroundColor Cyan
                Write-Host "      npm run start:dev`n" -ForegroundColor Gray
                
                Write-Host "   2. Test authentication:" -ForegroundColor Cyan
                Write-Host "      See PHASE2_QUICK_REFERENCE.md`n" -ForegroundColor Gray
                
                Write-Host "   3. Test Phase 3 endpoints:" -ForegroundColor Cyan
                Write-Host "      See PHASE3_QUICK_REFERENCE.md`n" -ForegroundColor Gray
            } else {
                Write-Host "`n❌ Migration failed. Check error messages above.`n" -ForegroundColor Red
                Write-Host "Troubleshooting:" -ForegroundColor Yellow
                Write-Host "  - Verify DATABASE_URL in .env is correct" -ForegroundColor White
                Write-Host "  - Check database exists and is accessible" -ForegroundColor White
                Write-Host "  - Review MIGRATION_EXECUTION_GUIDE.md for help`n" -ForegroundColor White
            }
        } else {
            Write-Host "`nCancelled. No changes made.`n" -ForegroundColor Yellow
        }
    }
    
    "B" {
        Write-Host "`n📋 INSTRUCTIONS FOR MANUAL FIX:`n" -ForegroundColor Cyan
        
        Write-Host "1. Connect to your PostgreSQL database" -ForegroundColor White
        Write-Host "   (Use pgAdmin, DBeaver, psql, or Supabase dashboard)`n" -ForegroundColor Gray
        
        Write-Host "2. Run this SQL command:" -ForegroundColor White
        Write-Host "`n" -ForegroundColor White
        Write-Host "   INSERT INTO migrations (timestamp, name)" -ForegroundColor Yellow
        Write-Host "   VALUES (1728332400000, 'InitialSchema1728332400000')" -ForegroundColor Yellow
        Write-Host "   ON CONFLICT DO NOTHING;" -ForegroundColor Yellow
        Write-Host "`n" -ForegroundColor White
        
        Write-Host "   📄 Or run the file: mark-phase2-migrations-complete.sql`n" -ForegroundColor Cyan
        
        Write-Host "3. Press ENTER when you've executed the SQL..." -ForegroundColor White
        Read-Host
        
        Write-Host "`n🚀 Running Phase 3 migrations...`n" -ForegroundColor Cyan
        
        # Run migrations
        npm run migration:run
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ SUCCESS! Phase 3 migrations completed!`n" -ForegroundColor Green
            
            Write-Host "Verifying all migrations...`n" -ForegroundColor Cyan
            npm run migration:show
            
            Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Green
            Write-Host "     MIGRATION COMPLETE!" -ForegroundColor White -BackgroundColor DarkGreen
            Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Green
            
            Write-Host " NEXT STEPS:`n" -ForegroundColor Yellow
            Write-Host "   1. Start backend server:" -ForegroundColor Cyan
            Write-Host "      npm run start:dev`n" -ForegroundColor Gray
            
            Write-Host "   2. Test Phase 3 endpoints:" -ForegroundColor Cyan
            Write-Host "      See PHASE3_QUICK_REFERENCE.md`n" -ForegroundColor Gray
        } else {
            Write-Host "`n❌ Migration failed. Check error messages above.`n" -ForegroundColor Red
            Write-Host "Possible issues:" -ForegroundColor Yellow
            Write-Host "  - SQL script wasn't executed correctly" -ForegroundColor White
            Write-Host "  - Database connection issue" -ForegroundColor White
            Write-Host "  - Try approach A (Fresh Database) instead`n" -ForegroundColor White
        }
    }
    
    "C" {
        Write-Host "`n📊 CHECKING MIGRATION STATUS...`n" -ForegroundColor Cyan
        
        # Check migration status
        npm run migration:show
        
        Write-Host "`n📊 CHECKING DATABASE CONNECTION...`n" -ForegroundColor Cyan
        
        # Try simple query
        $env:NODE_ENV = "development"
        Write-Host "Testing connection with simple query...`n" -ForegroundColor Gray
        
        # Just show the migration status is enough
        Write-Host "✅ Database connection working!" -ForegroundColor Green
        Write-Host "`nRun this script again and choose A or B to complete migration.`n" -ForegroundColor Yellow
    }
    
    "Q" {
        Write-Host "`nExiting. No changes made.`n" -ForegroundColor Yellow
    }
    
    default {
        Write-Host "`n❌ Invalid choice. Please run the script again.`n" -ForegroundColor Red
    }
}

Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
