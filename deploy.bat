@echo off
echo 🚀 Deploying Celeste Hardlist to Vercel...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if logged in to Vercel
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 Please login to Vercel:
    vercel login
)

REM Deploy to Vercel
echo 📦 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo 🔧 Don't forget to set up your environment variables in the Vercel dashboard:
echo    - DATABASE_URL
echo    - NEXTAUTH_URL
echo    - NEXTAUTH_SECRET
echo    - DISCORD_CLIENT_ID
echo    - DISCORD_CLIENT_SECRET
pause

