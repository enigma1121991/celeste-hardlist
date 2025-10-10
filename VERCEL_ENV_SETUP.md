# Vercel Environment Variables Setup

This guide will help you set up all the required environment variables in Vercel for your Celeste Hardlist application.

## Step 1: Access Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your account
3. Find your `celeste-hardlist` project
4. Click on the project name

## Step 2: Navigate to Environment Variables

1. Click on **"Settings"** tab
2. Click on **"Environment Variables"** in the left sidebar

## Step 3: Add Required Variables

Add these environment variables one by one:

### 1. NEXTAUTH_URL
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://your-app-name.vercel.app` (replace with your actual Vercel URL)
- **Environment**: Production, Preview, Development

### 2. NEXTAUTH_SECRET
- **Name**: `NEXTAUTH_SECRET`
- **Value**: Generate with: `openssl rand -base64 32`
- **Environment**: Production, Preview, Development

### 3. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: Your Supabase connection string
- **Environment**: Production, Preview, Development

### 4. DISCORD_CLIENT_ID
- **Name**: `DISCORD_CLIENT_ID`
- **Value**: From Discord Developer Portal
- **Environment**: Production, Preview, Development

### 5. DISCORD_CLIENT_SECRET
- **Name**: `DISCORD_CLIENT_SECRET`
- **Value**: From Discord Developer Portal
- **Environment**: Production, Preview, Development

## Step 4: Generate NEXTAUTH_SECRET

Run this command in your terminal to generate a secure secret:

```bash
# Windows (PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32, 0)

# Or use OpenSSL (if installed)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 5: Get Your Vercel URL

1. Go to your Vercel project dashboard
2. Look for the domain name (e.g., `celeste-hardlist-abc123.vercel.app`)
3. Use this as your `NEXTAUTH_URL`

## Step 6: Update Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to OAuth2 → General
4. Add redirect URI: `https://your-vercel-url.vercel.app/api/auth/callback/discord`
5. Save changes

## Step 7: Redeploy

After setting all environment variables:

1. Go to your Vercel project
2. Click **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Or trigger a new deployment by pushing to GitHub

## Troubleshooting

### "Secret does not exist" Error
- Make sure you're using the exact variable name: `NEXTAUTH_URL`
- Check that it's set for the correct environment (Production)
- Ensure there are no extra spaces or characters

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your actual Vercel domain
- Check that Discord OAuth redirect URI is correct
- Ensure `NEXTAUTH_SECRET` is properly generated

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check that your Supabase database allows connections
- Ensure SSL is enabled in the connection string

## Quick Setup Script

You can also use the setup script I created:

```bash
# Run from web directory
cd web
./setup-vercel-env.sh  # Linux/Mac
# or
setup-vercel-env.bat   # Windows
```

This will help you get the correct values for your environment variables.

## Environment Variables Summary

| Variable | Example Value | Required |
|----------|---------------|----------|
| `NEXTAUTH_URL` | `https://celeste-hardlist-abc123.vercel.app` | ✅ |
| `NEXTAUTH_SECRET` | `abc123def456...` | ✅ |
| `DATABASE_URL` | `postgresql://postgres:password@db.abc123.supabase.co:5432/postgres` | ✅ |
| `DISCORD_CLIENT_ID` | `123456789012345678` | ✅ |
| `DISCORD_CLIENT_SECRET` | `abcdef123456...` | ✅ |

## Next Steps

After setting up environment variables:

1. **Redeploy** your application
2. **Test authentication** by signing in with Discord
3. **Verify database connection** by checking if data loads
4. **Test all features** to ensure everything works

Your application should now work properly! 🎉
