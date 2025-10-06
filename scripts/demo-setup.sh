#!/bin/bash

# Astral Turf Demo Environment Setup
# This script sets up minimal environment variables for the demo

echo "🚀 Setting up Astral Turf demo environment variables..."

# Set essential environment variables
vercel env add NODE_ENV << EOF
production
EOF

vercel env add JWT_SECRET << EOF
demo-jwt-secret-key-for-astral-turf-tactical-board-2024
EOF

# For demo purposes, we'll use a mock database URL initially
vercel env add DATABASE_URL << EOF
postgresql://demo:demo@localhost:5432/demo?schema=public
EOF

vercel env add POSTGRES_PRISMA_URL << EOF
postgresql://demo:demo@localhost:5432/demo?schema=public&pgbouncer=true
EOF

echo "✅ Demo environment variables set!"
echo "📝 Note: Database URLs are set to demo values. Set up Vercel Postgres for full functionality."