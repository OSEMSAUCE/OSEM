# Supabase Migration

## Overview

This migration converts the SQLite schema from VigilanTree to PostgreSQL for Supabase.

**Source Schema:** `/Users/chrisharris/Library/CloudStorage/Dropbox/DEV_PROJECTS/retreever_dir/VigilanTree/staging/schema.sqlite.prisma`

**Migration File:** `20251113_initial_schema.sql`

**PostgreSQL Prisma Schema:** `schema.prisma`

## Key Changes from SQLite to PostgreSQL

### 1. Data Types
- `Decimal` remains `DECIMAL` in PostgreSQL (more precise than SQLite)
- `Float` converted to `DOUBLE PRECISION`
- `DateTime` converted to `TIMESTAMPTZ` (timezone-aware)
- `Boolean` native support in PostgreSQL

### 2. Enums
All enums are properly defined as PostgreSQL `ENUM` types, unlike SQLite which stores them as text.

### 3. Many-to-Many Relations
Prisma's implicit many-to-many relationships (in `sourceTable`) are implemented as explicit junction tables:
- `_projectToSource`
- `_landToSource`
- `_cropToSource`
- `_organizationLocalToSource`
- `_plantingToSource`
- `_cropToSpecies`

### 4. Triggers
Automatic `lastEditedAt` timestamp updates via triggers instead of application-level updates.

### 5. Row Level Security (RLS)
- All tables have RLS enabled
- Basic read policy included as example
- **TODO:** Add proper authentication policies for INSERT, UPDATE, DELETE

## Running the Migration

### Option 1: Using Supabase CLI

```bash
# Navigate to the supabase directory
cd /Users/chrisharris/Library/CloudStorage/Dropbox/DEV_PROJECTS/retreever_dir/retreeverData/supabase

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push

# Or if you want to reset and apply all migrations
supabase db reset
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `20251113_initial_schema.sql`
4. Paste and run the SQL

### Option 3: Using Prisma

```bash
# Set your DATABASE_URL in .env file
# Format: postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres

# Generate Prisma client
npx prisma generate --schema=./supabase/schema.prisma

# Push the schema to database
npx prisma db push --schema=./supabase/schema.prisma

# Or create a migration
npx prisma migrate dev --schema=./supabase/schema.prisma
```

## Environment Variables

Create a `.env` file with:

```env
# Get these from your Supabase project settings > Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## Post-Migration Tasks

### 1. Configure RLS Policies
Edit the RLS policies based on your authentication requirements. Example:

```sql
-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON "projectTable"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow users to update their own data
CREATE POLICY "Allow user update own data" ON "projectTable"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 2. Migrate Data from SQLite
If you have existing data in SQLite, you'll need to export and import:

```bash
# Export from SQLite
sqlite3 staging.db .dump > data.sql

# Transform the SQL for PostgreSQL (manual or script)
# Import to Supabase using SQL Editor or psql
```

### 3. Update Application Code
- Update database connection strings
- Update Prisma client imports from `prisma-sqlite` to `prisma-postgres`
- Test all database operations

### 4. Enable Extensions (if needed)
Additional PostgreSQL extensions that might be useful:

```sql
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- Query performance
CREATE EXTENSION IF NOT EXISTS "pg_trgm";              -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "postgis";              -- Spatial data (for GPS coordinates)
```

## Schema Differences to Note

1. **organizationLocalTable.organizationLocalId**: Changed from nullable to required (PRIMARY KEY)
2. **Many-to-many relations**: Now explicit junction tables instead of Prisma's implicit relations
3. **Decimal precision**: PostgreSQL `DECIMAL` is more precise than SQLite's `REAL`
4. **Timezone awareness**: All timestamps are timezone-aware (`TIMESTAMPTZ`)

## Validation

After migration, validate:

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check all enums exist
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';

-- Check triggers
SELECT trigger_name, event_object_table FROM information_schema.triggers;
```

## Troubleshooting

### Foreign Key Violations
If you encounter FK violations during data migration:
1. Disable foreign key checks temporarily
2. Import data
3. Re-enable checks
4. Fix any orphaned records

### Enum Type Errors
If enum values don't match:
```sql
ALTER TYPE "ParentType" ADD VALUE 'newValue';
```

### Performance Issues
Add additional indexes as needed:
```sql
CREATE INDEX idx_custom ON "tableName"("columnName");
```

## Links

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma PostgreSQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL ENUM Types](https://www.postgresql.org/docs/current/datatype-enum.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
