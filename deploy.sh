#!/bin/bash

# Vercel Deployment Script for Celeste Hardlist
echo "🚀 Deploying Celeste Hardlist to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🔧 Don't forget to set up your environment variables in the Vercel dashboard:"
echo "   - DATABASE_URL"
echo "   - NEXTAUTH_URL" 
echo "   - NEXTAUTH_SECRET"
echo "   - DISCORD_CLIENT_ID"
echo "   - DISCORD_CLIENT_SECRET"
