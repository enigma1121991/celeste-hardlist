@echo off
echo 🔧 Setting up Vercel Environment Variables
echo ==========================================

REM Get Vercel URL
echo 📡 Getting your Vercel app URL...
for /f "tokens=*" %%i in ('vercel ls ^| findstr "https://"') do (
    set VERCEL_URL=%%i
    goto :found
)

:found
if "%VERCEL_URL%"=="" (
    echo ❌ No Vercel app found. Please deploy first:
    echo    vercel --prod
    pause
    exit /b 1
)

echo ✅ Found Vercel URL: %VERCEL_URL%

REM Generate NEXTAUTH_SECRET
echo 🔐 Generating NEXTAUTH_SECRET...
for /f %%i in ('openssl rand -base64 32') do set NEXTAUTH_SECRET=%%i

echo.
echo 📋 Set these environment variables in your Vercel dashboard:
echo ==========================================================
echo NEXTAUTH_URL=%VERCEL_URL%
echo NEXTAUTH_SECRET=%NEXTAUTH_SECRET%
echo.
echo 🔗 Update your Discord OAuth redirect URI to:
echo %VERCEL_URL%/api/auth/callback/discord
echo.
echo 📝 Don't forget to also set:
echo - DATABASE_URL (your Supabase connection string)
echo - DISCORD_CLIENT_ID (from Discord Developer Portal)
echo - DISCORD_CLIENT_SECRET (from Discord Developer Portal)
pause

