-- ==============================================================================
-- CampRoo Spots Schema & Policies for Supabase
-- ==============================================================================

-- 1. Create the spots table
CREATE TABLE IF NOT EXISTS public.spots (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL DEFAULT 'pipeline-import',
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  location_name TEXT,
  general_area TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  photos TEXT[] DEFAULT '{}',
  space_type TEXT DEFAULT 'forest_clearing',
  environment TEXT DEFAULT 'forest',
  
  -- Structured JSONB fields for rich metadata
  rig_compatibility JSONB DEFAULT '{}'::jsonb,
  amenities JSONB DEFAULT '{}'::jsonb,
  proximity JSONB DEFAULT '{}'::jsonb,
  rules JSONB DEFAULT '{}'::jsonb,
  gatekeeping TEXT DEFAULT 'any_member',
  
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pipeline provenance metadata (USFS / BLM / OSM / source URLs)
  pipeline_meta JSONB DEFAULT '{}'::jsonb
);

-- 2. Create spatial and search indexes for instant querying
CREATE INDEX IF NOT EXISTS idx_spots_coordinates ON public.spots (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_spots_environment ON public.spots (environment);
CREATE INDEX IF NOT EXISTS idx_spots_status ON public.spots (status);
CREATE INDEX IF NOT EXISTS idx_spots_is_featured ON public.spots (is_featured);
CREATE INDEX IF NOT EXISTS idx_spots_created_at ON public.spots (created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

-- 4. Policies:
-- Allow anyone (public anon users and logged in users) to read active spots
CREATE POLICY "Public read access for active spots"
  ON public.spots
  FOR SELECT
  USING (status = 'active');

-- Allow authenticated users to insert new spots
CREATE POLICY "Authenticated users can insert spots"
  ON public.spots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow hosts to update their own spots
CREATE POLICY "Hosts can update their own spots"
  ON public.spots
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = host_id)
  WITH CHECK (auth.uid()::text = host_id);

-- Allow hosts to delete their own spots
CREATE POLICY "Hosts can delete their own spots"
  ON public.spots
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = host_id);
