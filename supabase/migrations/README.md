# Supabase Migrations

This directory contains all database migrations for the Christmas Wishlist Application.

## Migration Order

Migrations are numbered to ensure they run in the correct order:

1. **20240101000000_initial_schema.sql** - Core schema setup
   - Extensions (uuid-ossp, pgcrypto)
   - Custom types (share_role, resource_type, priority_level)
   - Users table with RLS

2. **20240101000001_locations_tables.sql** - Locations
   - Locations table
   - Location members table (many-to-many)
   - RLS policies for locations and members

3. **20240101000002_lists_table.sql** - Lists
   - Lists table with guest access support
   - RLS policies for list access control

4. **20240101000003_items_table.sql** - Items
   - Items table with full wishlist features
   - Purchase tracking
   - Full-text search index
   - RLS policies for item access

5. **20240101000004_shares_table.sql** - Sharing
   - Shares table for collaboration
   - Expiration support
   - RLS policies for sharing

6. **20240101000005_triggers.sql** - Automation
   - Auto-update timestamps
   - Auto-create user profiles
   - Purchase tracking automation
   - Share validation

7. **20240101000006_functions.sql** - Helper Functions
   - Authorization checks
   - Statistics functions
   - Search functions
   - Batch operations

8. **20240101000007_realtime.sql** - Realtime
   - Enable realtime subscriptions
   - Helper views with context

## Running Migrations

### Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push

# Or run migrations individually
supabase migration up
```

### Manual Migration

If you prefer to run migrations manually:

1. Copy the SQL from each migration file
2. Run them in order in your Supabase SQL Editor
3. Verify each migration completes successfully

## Post-Migration Setup

After running migrations, configure:

1. **Storage Buckets**
   - Create `avatars` bucket (public)
   - Create `item-images` bucket (public)
   - Apply storage policies (see storage_policies.sql)

2. **Realtime Settings**
   - Verify realtime is enabled for: items, lists, shares, location_members
   - Configure broadcast settings if needed

3. **Scheduled Functions** (optional)
   - Set up cron job for `cleanup_expired_shares()`
   - Recommended: Run daily at midnight UTC

## Schema Verification

After migration, verify the schema:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Check functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public';
```

## Rolling Back Migrations

To rollback a migration:

```bash
# Using Supabase CLI
supabase migration down

# Or manually drop objects in reverse order
```

## Development vs Production

- **Development**: Use Supabase local development
  ```bash
  supabase start
  supabase db reset  # Reset to clean state
  ```

- **Production**: Always test migrations locally first
  ```bash
  supabase db push --dry-run  # Preview changes
  supabase db push            # Apply changes
  ```

## TypeScript Types

TypeScript types are auto-generated in `/src/types/database.types.ts`.

To regenerate types:

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

## Troubleshooting

### Common Issues

1. **Extension not found**: Ensure PostgreSQL version supports uuid-ossp and pgcrypto
2. **RLS blocking queries**: Check policies match your access patterns
3. **Foreign key violations**: Ensure parent records exist before creating children
4. **Unique constraint violations**: Check for duplicate data

### Debug Queries

```sql
-- Check RLS for current user
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Test function
SELECT has_list_access('list-uuid', auth.uid());

-- View table statistics
SELECT * FROM get_list_stats('list-uuid');
```

## Best Practices

1. **Never** edit existing migration files
2. **Always** create new migrations for schema changes
3. **Test** migrations locally before production
4. **Backup** database before major migrations
5. **Document** complex changes in migration comments
6. **Version** control all migration files

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review schema: /docs/architecture/schemas/supabase_schema.sql
- Consult TypeScript types: /src/types/database.types.ts
