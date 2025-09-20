-- Create location parsing and geocoding support for world map feature
-- This migration adds columns to store parsed location data for world map visualization

-- Add country code and coordinates columns to members table for world map
ALTER TABLE public."members" ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(2) NULL;
ALTER TABLE public."members" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,8) NULL;
ALTER TABLE public."members" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(11,8) NULL;

-- Add country code and coordinates columns to organizations table for world map  
ALTER TABLE public."organizations" ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(2) NULL;
ALTER TABLE public."organizations" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,8) NULL;
ALTER TABLE public."organizations" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(11,8) NULL;

-- Create indexes for world map queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_members_country_code" ON public."members" USING btree ("countryCode") WHERE "countryCode" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_members_coordinates" ON public."members" USING btree ("latitude", "longitude") WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_organizations_country_code" ON public."organizations" USING btree ("countryCode") WHERE "countryCode" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_organizations_coordinates" ON public."organizations" USING btree ("latitude", "longitude") WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;

-- Create function to parse location strings to country codes
CREATE OR REPLACE FUNCTION parse_location_to_country_code(location_text TEXT)
RETURNS VARCHAR(2) AS $$
DECLARE
    country_code VARCHAR(2);
BEGIN
    -- Simple country parsing logic - can be enhanced with a proper geocoding service
    CASE 
        WHEN location_text ILIKE '%united states%' OR location_text ILIKE '%usa%' OR location_text ILIKE '%us%' OR location_text ILIKE '%america%' THEN
            country_code := 'US';
        WHEN location_text ILIKE '%united kingdom%' OR location_text ILIKE '%uk%' OR location_text ILIKE '%britain%' OR location_text ILIKE '%england%' THEN
            country_code := 'GB';
        WHEN location_text ILIKE '%canada%' THEN
            country_code := 'CA';
        WHEN location_text ILIKE '%germany%' OR location_text ILIKE '%deutschland%' THEN
            country_code := 'DE';
        WHEN location_text ILIKE '%france%' THEN
            country_code := 'FR';
        WHEN location_text ILIKE '%spain%' THEN
            country_code := 'ES';
        WHEN location_text ILIKE '%italy%' THEN
            country_code := 'IT';
        WHEN location_text ILIKE '%japan%' THEN
            country_code := 'JP';
        WHEN location_text ILIKE '%china%' THEN
            country_code := 'CN';
        WHEN location_text ILIKE '%india%' THEN
            country_code := 'IN';
        WHEN location_text ILIKE '%australia%' THEN
            country_code := 'AU';
        WHEN location_text ILIKE '%brazil%' THEN
            country_code := 'BR';
        WHEN location_text ILIKE '%netherlands%' THEN
            country_code := 'NL';
        WHEN location_text ILIKE '%sweden%' THEN
            country_code := 'SE';
        WHEN location_text ILIKE '%norway%' THEN
            country_code := 'NO';
        WHEN location_text ILIKE '%denmark%' THEN
            country_code := 'DK';
        -- Add more country mappings as needed
        ELSE
            country_code := NULL;
    END CASE;
    
    RETURN country_code;
END;
$$ LANGUAGE plpgsql;

-- Update existing member location data to extract country codes
UPDATE public."members" 
SET "countryCode" = parse_location_to_country_code(attributes->'location'->>'default')
WHERE attributes->'location'->>'default' IS NOT NULL 
  AND "countryCode" IS NULL;

-- Update existing organization location data to extract country codes  
UPDATE public."organizations"
SET "countryCode" = parse_location_to_country_code("geoLocation")
WHERE "geoLocation" IS NOT NULL 
  AND "countryCode" IS NULL;

-- Update organization location data from address field
UPDATE public."organizations"
SET "countryCode" = parse_location_to_country_code(address->>'country')
WHERE address->>'country' IS NOT NULL 
  AND "countryCode" IS NULL;