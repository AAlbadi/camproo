const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env
const envFile = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const url = env['VITE_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'] || env['VITE_SUPABASE_ANON_KEY'];

if (!url || !key) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function main() {
  const datasetPath = path.resolve(__dirname, '../src/data/imported/curatedFreeSpots.json');
  console.log(`Reading spots from ${datasetPath}...`);
  const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log(`Total spots in file: ${rawData.length}`);

  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
    const chunk = rawData.slice(i, i + BATCH_SIZE).map(s => ({
      id: s.id,
      host_id: s.hostId || 'pipeline-import',
      title: s.title,
      tagline: s.tagline || '',
      description: s.description || '',
      location_name: s.locationName || '',
      general_area: s.generalArea || '',
      latitude: s.coordinates ? s.coordinates[0] : 0,
      longitude: s.coordinates ? s.coordinates[1] : 0,
      photos: s.photos || [],
      space_type: s.spaceType || 'forest_clearing',
      environment: s.environment || 'forest',
      rig_compatibility: s.rigCompatibility || {},
      amenities: s.amenities || {},
      proximity: s.proximity || {},
      rules: s.rules || {},
      gatekeeping: s.gatekeeping || 'any_member',
      rating: s.rating || 0,
      review_count: s.reviewCount || 0,
      is_free: s.isFree !== undefined ? s.isFree : true,
      is_featured: Boolean(s.isFeatured),
      status: s.status || 'active',
      pipeline_meta: s._pipeline || {}
    }));

    const { error } = await supabase.from('spots').upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`Error uploading batch ${i} - ${i + chunk.length}:`, error.message);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
      process.stdout.write(`\rProgress: ${inserted}/${rawData.length} spots synced to Supabase...`);
    }
  }

  console.log(`\nSync finished. Successfully synced: ${inserted}, Errors: ${errors}`);
}

main().catch(console.error);
