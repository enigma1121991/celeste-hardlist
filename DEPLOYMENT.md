# Vercel Deployment Guide

This guide will help you deploy the Celeste Hardlist web application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Database**: Set up a PostgreSQL database (recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))
4. **Discord App**: Create a Discord application for OAuth

## Step 1: Database Setup

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://username:password@hostname/database?sslmode=require`)

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > Database
3. Copy the connection string

### Option C: Railway
1. Go to [railway.app](https://railway.app) and create a new project
2. Add a PostgreSQL database
3. Copy the connection string

## Step 2: Run Database Migrations

After setting up your database, run the migrations locally:

```bash
# In the root directory
npm run prisma:migrate

# Import your data
npm run import -- --csv "https://docs.google.com/spreadsheets/d/1A88F3X2lOQJry-Da2NpnAr-w5WDrkjDtg7Wt0kLCiz8/export?format=csv"
```

## Step 3: Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 > General
4. Add redirect URI: `https://your-app-name.vercel.app/api/auth/callback/discord`
5. Copy Client ID and Client Secret

## Step 4: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from web directory**:
   ```bash
   cd web
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL
   # Paste your database connection string
   
   vercel env add NEXTAUTH_URL
   # Set to: https://your-app-name.vercel.app
   
   vercel env add NEXTAUTH_SECRET
   # Generate with: openssl rand -base64 32
   
   vercel env add DISCORD_CLIENT_ID
   # Your Discord app client ID
   
   vercel env add DISCORD_CLIENT_SECRET
   # Your Discord app client secret
   ```

5. **Redeploy**:
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Set Root Directory to `web`
   - Add environment variables (see below)

## Step 5: Environment Variables

In your Vercel dashboard, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Your database connection string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel app URL |
| `NEXTAUTH_SECRET` | `your-secret-here` | Generate with `openssl rand -base64 32` |
| `DISCORD_CLIENT_ID` | `your-client-id` | From Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | `your-client-secret` | From Discord Developer Portal |

## Step 6: Update Discord OAuth

1. Go back to your Discord application
2. Update the redirect URI to: `https://your-app-name.vercel.app/api/auth/callback/discord`
3. Save changes

## Step 7: Test Deployment

1. Visit your Vercel app URL
2. Try signing in with Discord
3. Test the main features:
   - Browse maps
   - Submit a clear
   - View player profiles

## Troubleshooting

### Build Errors
- Check that all environment variables are set
- Ensure database is accessible from Vercel
- Check Vercel function logs for errors

### Database Connection Issues
- Verify your database allows connections from Vercel IPs
- Check that SSL is enabled in your connection string
- Ensure the database has the correct schema

### Authentication Issues
- Verify Discord OAuth redirect URI matches your Vercel URL
- Check that all environment variables are set correctly
- Ensure NEXTAUTH_SECRET is properly generated

## Production Considerations

1. **Database**: Consider upgrading to a paid database plan for production
2. **Monitoring**: Set up error monitoring (Sentry, LogRocket, etc.)
3. **Backups**: Regular database backups
4. **Performance**: Monitor Vercel function execution times
5. **Security**: Regularly rotate secrets and API keys

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify all environment variables
3. Test database connectivity
4. Check Discord OAuth configuration
