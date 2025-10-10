# 1. Create database
CREATE DATABASE hardlist;

# DATABASE_URL="postgresql://username:password@localhost:5432/hardlist?schema=public"
# GOOGLE_SHEETS_API_KEY="your-sheets-key"

npm install
npm run prisma:gen
npm run prisma:migrate

npm run import -- --sheet "https://docs.google.com/spreadsheets/d/1A88F3X2lOQJry-Da2NpnAr-w5WDrkjDtg7Wt0kLCiz8/edit?gid=0#gid=0" --sheet-name "Clears"

cd web
npm install
npx prisma generate

# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="your-secret-here"
# DISCORD_CLIENT_ID="your-client-id"
# DISCORD_CLIENT_SECRET="your-client-secret"

npm run dev