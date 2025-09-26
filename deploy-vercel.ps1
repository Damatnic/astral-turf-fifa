#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated Vercel deployment script for Astral Turf
.DESCRIPTION
    This script automatically sets up and deploys the Astral Turf application to Vercel
    with all necessary environment variables and configurations.
#>

param(
    [string]$ProjectName = "astral-turf",
    [string]$GeminiApiKey = "",
    [switch]$Production = $false
)

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🚀 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

# Main deployment function
function Deploy-AstralTurf {
    Write-ColorOutput @"
🌟 ================================== 🌟
   ASTRAL TURF VERCEL DEPLOYMENT
🌟 ================================== 🌟
"@ $Blue

    try {
        # Step 1: Check prerequisites
        Write-Step "Checking prerequisites..."
        
        # Check if Vercel CLI is installed
        $vercelVersion = vercel --version 2>$null
        if (-not $vercelVersion) {
            Write-Warning "Vercel CLI not found. Installing..."
            npm install -g vercel@latest
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to install Vercel CLI"
            }
        }
        Write-Success "Vercel CLI installed: $vercelVersion"

        # Step 2: Build the project
        Write-Step "Building the project..."
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        Write-Success "Project built successfully"

        # Step 3: Generate Prisma client
        Write-Step "Generating Prisma client..."
        npx prisma generate
        if ($LASTEXITCODE -ne 0) {
            throw "Prisma generation failed"
        }
        Write-Success "Prisma client generated"

        # Step 4: Create Vercel project configuration
        Write-Step "Creating Vercel project configuration..."
        
        $vercelJson = @{
            name = $ProjectName
            version = 2
            builds = @(
                @{
                    src = "package.json"
                    use = "@vercel/static-build"
                    config = @{
                        distDir = "dist"
                    }
                }
            )
            routes = @(
                @{
                    src = "/health"
                    dest = "/api/health.js"
                },
                @{
                    src = "/api/(.*)"
                    dest = "/api/`$1.js"
                },
                @{
                    src = "/(.*)"
                    dest = "/index.html"
                }
            )
            functions = @{
                "api/health.js" = @{
                    maxDuration = 10
                }
                "api/auth.js" = @{
                    maxDuration = 30
                }
            }
            env = @{
                NODE_ENV = "production"
            }
        } | ConvertTo-Json -Depth 10

        # Step 5: Login to Vercel (non-interactive)
        Write-Step "Setting up Vercel authentication..."
        
        # Create a temporary script for Vercel login
        $loginScript = @"
const { spawn } = require('child_process');

const vercel = spawn('vercel', ['login'], {
    stdio: ['pipe', 'inherit', 'inherit']
});

// Auto-respond to login prompts
setTimeout(() => {
    vercel.stdin.write('\n'); // Press enter for email login
}, 2000);

vercel.on('close', (code) => {
    console.log('Vercel login completed with code:', code);
    process.exit(code);
});
"@
        
        $loginScript | Out-File -FilePath "temp-login.js" -Encoding UTF8
        
        # Step 6: Initialize Vercel project
        Write-Step "Initializing Vercel project..."
        
        $initScript = @"
const { spawn } = require('child_process');
const fs = require('fs');

// Create .vercel directory if it doesn't exist
if (!fs.existsSync('.vercel')) {
    fs.mkdirSync('.vercel');
}

const vercel = spawn('vercel', ['--yes', '--name', '$ProjectName'], {
    stdio: ['pipe', 'inherit', 'inherit']
});

// Auto-respond to setup questions
let responseIndex = 0;
const responses = [
    'y\n',  // Set up and deploy?
    'y\n',  // Link to existing project?
    '$ProjectName\n', // Project name
    'y\n'   // Confirm
];

const sendResponse = () => {
    if (responseIndex < responses.length) {
        setTimeout(() => {
            vercel.stdin.write(responses[responseIndex]);
            responseIndex++;
            sendResponse();
        }, 1000);
    }
};

setTimeout(sendResponse, 2000);

vercel.on('close', (code) => {
    console.log('Vercel initialization completed with code:', code);
    process.exit(code);
});
"@
        
        $initScript | Out-File -FilePath "temp-init.js" -Encoding UTF8
        node temp-init.js
        
        # Step 7: Set environment variables
        Write-Step "Setting up environment variables..."
        
        $envVars = @{
            "NODE_ENV" = "production"
            "APP_VERSION" = "8.0.0"
            "DATABASE_URL" = "postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
            "DATABASE_URL_UNPOOLED" = "postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
            "POSTGRES_URL" = "postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
            "POSTGRES_URL_NON_POOLING" = "postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
            "POSTGRES_USER" = "neondb_owner"
            "POSTGRES_HOST" = "ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech"
            "POSTGRES_PASSWORD" = "npg_z3tIi9kCFDxB"
            "POSTGRES_DATABASE" = "neondb"
            "POSTGRES_PRISMA_URL" = "postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
            "JWT_SECRET" = "astral-turf-super-secure-jwt-secret-key-2024-production-v8"
            "JWT_ROTATION_INTERVAL_HOURS" = "24"
            "JWT_GRACE_PERIOD_HOURS" = "2"
            "JWT_KEY_LENGTH" = "64"
            "JWT_MAX_KEYS" = "5"
            "JWT_AUTO_ROTATION" = "true"
            "LOG_LEVEL" = "info"
            "LOG_FLUSH_INTERVAL_MS" = "30000"
            "RATE_LIMIT_WINDOW_MS" = "900000"
            "RATE_LIMIT_MAX_REQUESTS" = "100"
            "MAX_FILE_SIZE" = "10485760"
            "ALLOWED_FILE_TYPES" = "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain"
            "ENABLE_AI_FEATURES" = "true"
            "ENABLE_REAL_TIME_UPDATES" = "true"
            "ENABLE_ANALYTICS" = "true"
            "ENABLE_ERROR_TRACKING" = "true"
            "SECURE_COOKIES" = "true"
            "CACHE_TTL" = "3600"
            "SESSION_TIMEOUT" = "86400"
            "MAX_CONCURRENT_REQUESTS" = "100"
            "BACKUP_ENABLED" = "true"
            "BACKUP_RETENTION_DAYS" = "30"
        }

        # Add Gemini API key if provided
        if ($GeminiApiKey) {
            $envVars["GEMINI_API_KEY"] = $GeminiApiKey
        } else {
            Write-Warning "No Gemini API key provided. You'll need to add it manually in Vercel dashboard."
            $envVars["GEMINI_API_KEY"] = "your-production-gemini-api-key-here"
        }

        # Set environment variables
        foreach ($key in $envVars.Keys) {
            $value = $envVars[$key]
            Write-Host "Setting $key..."
            vercel env add $key production --value="$value" --yes 2>$null
        }
        Write-Success "Environment variables configured"

        # Step 8: Deploy to Vercel
        Write-Step "Deploying to Vercel..."
        
        if ($Production) {
            vercel --prod --yes
        } else {
            vercel --yes
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Deployment failed"
        }

        # Step 9: Get deployment URL
        Write-Step "Getting deployment information..."
        $deploymentInfo = vercel ls $ProjectName --json | ConvertFrom-Json
        $deploymentUrl = $deploymentInfo[0].url

        # Step 10: Test deployment
        Write-Step "Testing deployment..."
        Start-Sleep -Seconds 10
        
        try {
            $healthResponse = Invoke-RestMethod -Uri "https://$deploymentUrl/health" -Method Get -TimeoutSec 30
            Write-Success "Health check passed: $($healthResponse.status)"
        } catch {
            Write-Warning "Health check failed, but deployment may still be successful"
        }

        # Step 11: Display results
        Write-Success @"

🎉 DEPLOYMENT SUCCESSFUL! 🎉

📱 Application URL: https://$deploymentUrl
🏥 Health Check: https://$deploymentUrl/health
🔐 Auth API: https://$deploymentUrl/api/auth
📊 Dashboard: https://$deploymentUrl

🔧 Next Steps:
1. Update your Gemini API key in Vercel dashboard if not provided
2. Configure your domain in Vercel dashboard
3. Set up monitoring and alerting
4. Test all application features

📋 Vercel Dashboard: https://vercel.com/dashboard
"@

        # Cleanup temporary files
        Remove-Item -Path "temp-login.js" -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "temp-init.js" -Force -ErrorAction SilentlyContinue

    } catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Write-Error "Please check the logs above for more details."
        
        # Cleanup temporary files
        Remove-Item -Path "temp-login.js" -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "temp-init.js" -Force -ErrorAction SilentlyContinue
        
        exit 1
    }
}

# Run the deployment
Deploy-AstralTurf
