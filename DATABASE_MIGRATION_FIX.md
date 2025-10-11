# Fix Database Migration Issues

The `submitterNotes` error occurs because your Vercel database is missing the latest schema changes. Here's how to fix it:

## 🔧 **Quick Fix:**

### **Step 1: Set Up Local Environment**
Create a `.env.local` file in the `web` directory with your Supabase connection string:

```bash
# In web/.env.local
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### **Step 2: Apply Missing Migrations**
```bash
cd web
npx prisma migrate deploy
```

### **Step 3: Generate Prisma Client**
```bash
npx prisma generate
```

### **Step 4: Redeploy to Vercel**
```bash
vercel --prod
```

## 🎯 **Alternative: Direct Database Fix**

If migrations fail, you can manually add the missing column:

### **Connect to Supabase:**
1. Go to your Supabase dashboard
2. Click "SQL Editor"
3. Run this SQL:

```sql
-- Add submitterNotes column if it doesn't exist
ALTER TABLE "Run" ADD COLUMN IF NOT EXISTS "submitterNotes" TEXT;

-- Add other missing columns
ALTER TABLE "Run" ADD COLUMN IF NOT EXISTS "evidenceUrls" TEXT[] DEFAULT '{}';
ALTER TABLE "Run" ADD COLUMN IF NOT EXISTS "submittedById" TEXT;

-- Add foreign key constraint
ALTER TABLE "Run" ADD CONSTRAINT IF NOT EXISTS "Run_submittedById_fkey" 
FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL;
```

## 🚀 **Vercel Environment Variables**

Make sure these are set in your Vercel dashboard:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `NEXTAUTH_URL` | Your Vercel app URL |
| `NEXTAUTH_SECRET` | Generated secret |
| `DISCORD_CLIENT_ID` | From Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | From Discord Developer Portal |

## 🔍 **Verify Fix**

After applying migrations:

1. **Check Vercel logs** for any errors
2. **Test the application** - try submitting a clear
3. **Verify database** - check if `submitterNotes` column exists

## 📋 **Common Issues:**

### **Migration Conflicts:**
```bash
# If migrations fail due to conflicts:
npx prisma migrate resolve --applied [migration-name]
```

### **Database Connection:**
- Ensure `DATABASE_URL` is correct
- Check Supabase database is accessible
- Verify SSL is enabled

### **Schema Mismatch:**
- Run `npx prisma db push` to sync schema
- Or manually apply missing columns

Your database should now have the `submitterNotes` column and work properly! 🎉

