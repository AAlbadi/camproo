/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Initialize client only if configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Sign in via OAuth provider (Google, Facebook, or Apple)
 */
export async function signInWithSocial(provider: 'google' | 'facebook' | 'apple') {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env') };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });

  return { data, error };
}

/**
 * Listen to auth state changes when user returns from OAuth redirect
 */
export function onAuthStateChange(callback: (user: any) => void) {
  if (!supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });

  return () => subscription.unsubscribe();
}

/**
 * Map Supabase database row (snake_case) to CampRoo Spot interface (camelCase)
 */
export function mapSupabaseSpotToSpot(row: any): any {
  return {
    id: row.id,
    hostId: row.host_id || 'pipeline-import',
    title: row.title,
    tagline: row.tagline || '',
    description: row.description || '',
    locationName: row.location_name || '',
    generalArea: row.general_area || '',
    coordinates: [row.latitude, row.longitude] as [number, number],
    photos: row.photos && row.photos.length > 0 ? row.photos : [],
    spaceType: row.space_type || 'forest_clearing',
    environment: row.environment || 'forest',
    rigCompatibility: row.rig_compatibility || {},
    amenities: row.amenities || {},
    proximity: row.proximity || {},
    rules: row.rules || {},
    gatekeeping: row.gatekeeping || 'any_member',
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    isFree: row.is_free !== undefined ? row.is_free : true,
    isFeatured: Boolean(row.is_featured),
    status: row.status || 'active',
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
    _pipeline: row.pipeline_meta || {}
  };
}

/**
 * Fetch spots from Supabase (with optional limit, bounds, or environment filter)
 */
export async function fetchSupabaseSpots(options?: {
  limit?: number;
  offset?: number;
  environment?: string;
  isFeatured?: boolean;
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}): Promise<any[]> {
  if (!supabase) return [];

  let query = supabase
    .from('spots')
    .select('*')
    .eq('status', 'active');

  if (options?.isFeatured) {
    query = query.eq('is_featured', true);
  }

  if (options?.environment) {
    query = query.eq('environment', options.environment);
  }

  if (options?.bounds) {
    query = query
      .gte('latitude', options.bounds.minLat)
      .lte('latitude', options.bounds.maxLat)
      .gte('longitude', options.bounds.minLng)
      .lte('longitude', options.bounds.maxLng);
  }

  query = query.limit(options?.limit || 500);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching spots from Supabase:', error);
    return [];
  }

  return (data || []).map(mapSupabaseSpotToSpot);
}

/**
 * Create a new spot in Supabase
 */
export async function createSupabaseSpot(spot: any): Promise<boolean> {
  if (!supabase) return false;

  const row = {
    id: spot.id,
    host_id: spot.hostId || 'pipeline-import',
    title: spot.title,
    tagline: spot.tagline || '',
    description: spot.description || '',
    location_name: spot.locationName || '',
    general_area: spot.generalArea || '',
    latitude: spot.coordinates ? spot.coordinates[0] : 0,
    longitude: spot.coordinates ? spot.coordinates[1] : 0,
    photos: spot.photos || [],
    space_type: spot.spaceType || 'forest_clearing',
    environment: spot.environment || 'forest',
    rig_compatibility: spot.rigCompatibility || {},
    amenities: spot.amenities || {},
    proximity: spot.proximity || {},
    rules: spot.rules || {},
    gatekeeping: spot.gatekeeping || 'any_member',
    rating: spot.rating || 0,
    review_count: spot.reviewCount || 0,
    is_free: spot.isFree !== undefined ? spot.isFree : true,
    is_featured: Boolean(spot.isFeatured),
    status: spot.status || 'active',
    pipeline_meta: spot._pipeline || {}
  };

  const { error } = await supabase.from('spots').insert([row]);
  if (error) {
    console.error('Error inserting spot to Supabase:', error);
    return false;
  }
  return true;
}

/**
 * Delete a spot in Supabase
 */
export async function deleteSupabaseSpot(spotId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('spots').delete().eq('id', spotId);
  if (error) {
    console.error('Error deleting spot in Supabase:', error);
    return false;
  }
  return true;
}
