# Database Setup for OSEM

OSEM works with **mock data by default** - no database needed!

But if you want to connect your own database with real data, here's how.

## Quick Start with Supabase

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to finish provisioning

### 2. Run the Migrations

The database schema is in `docs/database/migrations/`. You can apply it using the Supabase CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push the migrations
supabase db push
```

**Or manually:** Copy the SQL from the migration files and run it in your Supabase SQL Editor.

### 3. Add Environment Variables

Create `.env.local` in the OSEM root:

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
VITE_MAPBOX_TOKEN=your-mapbox-token
```

### 4. Start the App

```bash
npm run dev
```

OSEM will automatically detect the database and use it instead of mock data!

## Database Schema

The complete schema is documented in:

- **Prisma Schema:** `docs/database/schema.prisma` - Human-readable schema definition
- **SQL Migrations:** `docs/database/migrations/` - Actual SQL to create tables

### Main Tables

- **projectTable** - Restoration projects
- **landTable** - Land parcels within projects
- **cropTable** - Crop/species planted
- **plantingTable** - Planting events
- **polygonTable** - Geographic polygons for the map
- **stakeholderTable** - Organizations and stakeholders

### Key Relationships

```
projectTable (1) → (many) landTable
projectTable (1) → (many) cropTable
projectTable (1) → (many) plantingTable
landTable (1) → (many) polygonTable
```

## Using Another Database (PostgreSQL)

OSEM uses Supabase (PostgreSQL), but you can use any PostgreSQL database:

1. Run the migrations from `docs/database/migrations/`
2. Create a Supabase project that connects to your existing PostgreSQL
3. Or modify `src/lib/supabase.ts` to use a different PostgreSQL client

## Troubleshooting

### "Cannot read properties of null (reading 'from')"

This means Supabase isn't configured. Either:

- Add the environment variables to `.env.local`
- Or just use mock data (remove the env vars)

### "Row Level Security policy violation"

The migrations include RLS policies. Make sure you're using the `SUPABASE_ANON_KEY`, not the service role key.

### Tables are empty

The migrations create the schema but don't include sample data. You'll need to add your own projects, lands, crops, etc. through the Supabase dashboard or by importing data.

## Schema Updates

This schema is automatically synced from ReTreeverData. When you run `npm run sync` in OSEM, it pulls the latest schema from the main project.

**Don't manually edit the schema files** - they'll be overwritten on the next sync.
