#!/bin/bash

echo "🔧 Setting up Vercel Environment Variables"
echo "=========================================="

# Get Vercel URL
echo "📡 Getting your Vercel app URL..."
VERCEL_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)

if [ -z "$VERCEL_URL" ]; then
    echo "❌ No Vercel app found. Please deploy first:"
    echo "   vercel --prod"
    exit 1
fi

echo "✅ Found Vercel URL: $VERCEL_URL"

# Generate NEXTAUTH_SECRET
echo "🔐 Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo ""
echo "📋 Set these environment variables in your Vercel dashboard:"
echo "=========================================================="
echo "NEXTAUTH_URL=$VERCEL_URL"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo ""
echo "🔗 Update your Discord OAuth redirect URI to:"
echo "$VERCEL_URL/api/auth/callback/discord"
echo ""
echo "📝 Don't forget to also set:"
echo "- DATABASE_URL (your Supabase connection string)"
echo "- DISCORD_CLIENT_ID (from Discord Developer Portal)"
echo "- DISCORD_CLIENT_SECRET (from Discord Developer Portal)"

