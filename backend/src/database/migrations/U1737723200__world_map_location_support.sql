-- Rollback migration for world map location support

-- Drop indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_members_country_code";
DROP INDEX CONCURRENTLY IF EXISTS "idx_members_coordinates";
DROP INDEX CONCURRENTLY IF EXISTS "idx_organizations_country_code";
DROP INDEX CONCURRENTLY IF EXISTS "idx_organizations_coordinates";

-- Drop function
DROP FUNCTION IF EXISTS parse_location_to_country_code(TEXT);

-- Drop columns from members table
ALTER TABLE public."members" DROP COLUMN IF EXISTS "countryCode";
ALTER TABLE public."members" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE public."members" DROP COLUMN IF EXISTS "longitude";

-- Drop columns from organizations table
ALTER TABLE public."organizations" DROP COLUMN IF EXISTS "countryCode";
ALTER TABLE public."organizations" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE public."organizations" DROP COLUMN IF EXISTS "longitude";