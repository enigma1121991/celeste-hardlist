# Fix Supabase Connection Issues

The "prepared statement does not exist" error is a common issue with Supabase connection pooling. Here's how to fix it:

## 🔧 **Quick Fixes:**

### **Fix 1: Update Connection String**
Your Supabase connection string needs to use the **pooler** endpoint:

```bash
# OLD (direct connection):
postgresql://postgres:password@db.abc123.supabase.co:5432/postgres

# NEW (pooler connection):
postgresql://postgres:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### **Fix 2: Add Connection Pooling Parameters**
Add these parameters to your connection string:

```bash
DATABASE_URL="postgresql://postgres:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

### **Fix 3: Update Prisma Configuration**
Create or update `web/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Add this for migrations
}
```

### **Fix 4: Add Direct URL for Migrations**
Add a `DIRECT_URL` environment variable:

```bash
# For migrations (direct connection)
DIRECT_URL="postgresql://postgres:password@db.abc123.supabase.co:5432/postgres"

# For app (pooler connection)
DATABASE_URL="postgresql://postgres:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

## 🚀 **Step-by-Step Fix:**

### **Step 1: Get Correct Connection Strings**
1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Copy **Connection string** (for migrations)
3. Copy **Connection pooling** string (for app)

### **Step 2: Update Environment Variables**
In your Vercel dashboard, set:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Pooler connection string |
| `DIRECT_URL` | Direct connection string |

### **Step 3: Update Prisma Schema**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### **Step 4: Redeploy**
```bash
vercel --prod
```

## 🔍 **Alternative: Disable Connection Pooling**

If the above doesn't work, try disabling connection pooling:

```bash
DATABASE_URL="postgresql://postgres:password@db.abc123.supabase.co:5432/postgres?sslmode=require"
```

## 📋 **Common Supabase Connection Strings:**

### **Direct Connection (for migrations):**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### **Pooler Connection (for app):**
```
postgresql://postgres:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

### **Session Mode (alternative):**
```
postgresql://postgres:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&pgbouncer=true
```

## 🎯 **Quick Test:**

After updating the connection string:

1. **Redeploy** your Vercel app
2. **Check Vercel logs** for any errors
3. **Test the maps page** - it should load without errors
4. **Test other features** to ensure everything works

## 🔧 **Troubleshooting:**

### **Still Getting Errors:**
- Try the **direct connection** string instead of pooler
- Check if your Supabase database is accessible
- Verify SSL is enabled in the connection string

### **Migration Issues:**
- Use `DIRECT_URL` for migrations
- Use `DATABASE_URL` for the app

Your app should now work properly without the prepared statement errors! 🎉

