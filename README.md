# Hard Clears - Local Dev Setup
The [hard clears website](https://www.hardclears.com/) runs on the Next.js framework, as well as Prisma and PostgreSQL for the back-end stuff.
Make sure you're knowledgeable in those and can set up the database locally.

## 1. Create your database (PostgreSQL)
```sql
CREATE DATABASE hardlist;
```
Add your environmental variables in a `.env` file in the root.
```
DATABASE_URL="postgresql://username:password@localhost:5432/hardlist?schema=public"
GOOGLE_SHEETS_API_KEY="your-sheets-key"
```

## 2. Prisma Setup
Run the following commands:
```ts
npm install
npm run prisma:gen
npm run prisma:migrate
```
## 3. Import hard list data
Make sure you have `tsx` installed globally. Then, run the following:
```bash
npm run import -- --sheet "https://docs.google.com/spreadsheets/d/1A88F3X2lOQJry-Da2NpnAr-w5WDrkjDtg7Wt0kLCiz8/edit?gid=0#gid=0" --sheet-name "Clears"
```
In the recent addition to the `import.ts` `youtube-date.ts` script, make sure you also get your YouTube API Key:
```
YOUTUBE_API_KEY="your-youtube-key"
```

## 4. Front-end Setup
Navigate to the `cd app` directory, then run the following commands:
```bash
npm install
npx prisma generate
```
Add these to your `.env.local` file inside `/app`
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
```

## 5. Start the server
Make sure your PostgreSQL database is running. Then, simply run:
```bash
npm run dev
```
That's it, your local website should be up at [http://localhost:3000](http://localhost:3000). 
Before making any commits, make sure the website compiles with 
```bash
npm run build
```

[Hard List Spreadsheet Link](https://docs.google.com/spreadsheets/d/1A88F3X2lOQJry-Da2NpnAr-w5WDrkjDtg7Wt0kLCiz8/edit?gid=0#gid=0).
[Discord Developer Portal](https://discord.com/developers/docs/intro).
[Google Cloud Console](https://console.cloud.google.com/apis/dashboard).