#!/usr/bin/env node
/**
 * Enrich ALL spots with real Wikimedia Commons photos.
 *
 * Strategy:
 *   1. Load all_spots_processed.json (9,777 spots)
 *   2. For each unique (land_manager, state) combo (~51), query Wikimedia Commons
 *      text search for landscape/nature photos of that forest/region.
 *   3. Assign real photos to every spot based on its land_manager+state.
 *   4. For spots that already have individual photos, keep those.
 *   5. Output the full curatedFreeSpots.json with ALL spots having real photos.
 *
 * Key fix: Strip query strings from Wikimedia URLs before checking file extension.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// ── Paths ──────────────────────────────────────────────────────
const PROCESSED_PATH = join(PROJECT_ROOT, "pipeline/data/processed/all_spots_processed.json");
const OUTPUT_PATH = join(PROJECT_ROOT, "src/data/imported/curatedFreeSpots.json");
const PHOTO_CACHE_PATH = join(PROJECT_ROOT, "scripts/wikimedia_photo_cache.json");

// ── Wikimedia Commons API ──────────────────────────────────────
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";

// Better search terms per land manager type
const SEARCH_TEMPLATES = {
  USFS: [
    "{state} national forest landscape",
    "{state} forest campground",
    "{state} wilderness hiking trail",
  ],
  BLM: [
    "{state} BLM public lands landscape",
    "{state} desert camping landscape",
    "{state} open range public land",
  ],
  DEFAULT: [
    "{state} public lands landscape nature",
    "{state} camping outdoors scenery",
  ],
};

// State abbreviation to full name
const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

/**
 * Check if a URL points to a valid image (strip query params first!)
 */
function isImageUrl(url) {
  if (!url) return false;
  // Strip query string before checking extension
  const cleanUrl = url.split("?")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".webp")
  );
}

/**
 * Check if a URL is from a stock photo site
 */
function isStockPhoto(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("unsplash.com") ||
    lower.includes("pexels.com") ||
    lower.includes("shutterstock") ||
    lower.includes("istockphoto") ||
    lower.includes("gettyimages") ||
    lower.includes("stock") ||
    lower.includes("placeholder")
  );
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Query Wikimedia Commons text search for images
 * Returns array of image URLs
 */
async function searchWikimediaPhotos(searchQuery, limit = 10, retries = 3) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: searchQuery,
    gsrnamespace: "6", // File namespace
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "1200",
  });

  const url = `${WIKIMEDIA_API}?${params.toString()}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "CampRooBot/1.0 (camping app; https://camproo.com)" },
      });

      if (resp.status === 429) {
        const waitMs = (attempt + 1) * 5000; // 5s, 10s, 15s
        console.warn(`  ⚠ Rate limited (429), waiting ${waitMs / 1000}s before retry ${attempt + 1}/${retries}...`);
        await sleep(waitMs);
        continue;
      }

      if (!resp.ok) {
        console.warn(`  ⚠ HTTP ${resp.status} for query: ${searchQuery}`);
        return [];
      }

      const json = await resp.json();
      const pages = json?.query?.pages;
      if (!pages) return [];

      const photos = [];
      for (const page of Object.values(pages)) {
        const info = page?.imageinfo?.[0];
        if (!info) continue;

        // Use thumbnail URL (1200px wide) if available, else original
        const imageUrl = info.thumburl || info.url;
        if (!imageUrl) continue;

        // Only accept actual images
        const mime = info.mime || "";
        if (!mime.startsWith("image/")) continue;

        // Check it's a real image file
        if (!isImageUrl(imageUrl) && !isImageUrl(info.url)) continue;

        // Skip SVGs, icons, logos
        if (mime === "image/svg+xml") continue;
        const title = (page.title || "").toLowerCase();
        if (title.includes("logo") || title.includes("icon") || title.includes("flag")) continue;

        photos.push(imageUrl);
      }

      return photos;
    } catch (err) {
      console.warn(`  ⚠ Error searching "${searchQuery}": ${err.message}`);
      if (attempt < retries - 1) {
        await sleep(3000);
        continue;
      }
      return [];
    }
  }
  return []; // All retries exhausted
}

/**
 * Fetch photos for a specific land_manager + state combination
 */
async function fetchPhotosForCombo(landManager, state) {
  const stateName = STATE_NAMES[state] || state;
  const templates = SEARCH_TEMPLATES[landManager] || SEARCH_TEMPLATES.DEFAULT;

  const allPhotos = new Set();

  for (const template of templates) {
    const query = template.replace("{state}", stateName);
    console.log(`    🔍 Searching: "${query}"`);

    const photos = await searchWikimediaPhotos(query, 10);
    for (const p of photos) {
      if (!isStockPhoto(p)) {
        allPhotos.add(p);
      }
    }

    // Rate limit: 3 seconds between API calls (Wikimedia is strict)
    await sleep(3000);
  }

  return [...allPhotos];
}

/**
 * Convert a pipeline spot to CampRoo app format
 */
function convertSpotToAppFormat(spot, photos) {
  const env = guessEnvironment(spot);
  const slug = makeSlug(spot.name, spot.id);

  return {
    id: slug,
    hostId: "pipeline-import",
    title: spot.name,
    tagline:
      spot.land_manager !== "Unknown"
        ? `Free ${spot.land_manager} Dispersed Camping — ${spot.state}`
        : `Free Dispersed Camping — ${spot.state}`,
    description:
      spot.description ||
      `Free camping spot managed by ${spot.land_manager}. ${spot.access_notes || ""}`.trim(),
    locationName: spot.name,
    generalArea: `${spot.state}, USA`,
    coordinates: [spot.lat, spot.lon],
    photos: photos,
    spaceType: spot.land_manager === "USFS" ? "forest_clearing" : "acreage",
    environment: env,
    rigCompatibility: {
      maxLengthFt: 35,
      maxHeightFt: 13.5,
      maxWidthFt: 8.5,
      acceptedTypes: [
        "class_b",
        "class_c",
        "campervan",
        "truck_camper",
        "rooftop_tent",
        "travel_trailer",
      ],
      accessType: "back_in",
      surfaceType: "dirt",
      isLevel: false,
      turnaroundSpace: "Forest / BLM access clearing",
      trailerDisconnectRequired: false,
    },
    amenities: {
      electricity: "none",
      water: (spot.amenities || []).includes("drinking_water") ? "potable_hookup" : "none",
      sewer: "none",
      wifi: false,
      bathroom: (spot.amenities || []).includes("toilets"),
      shower: (spot.amenities || []).includes("shower"),
      firePit: (spot.amenities || []).includes("fire_pit"),
      trash: (spot.amenities || []).includes("trash"),
      shade: "partial",
      generatorsAllowed: true,
      petsAllowed: true,
      familyFriendly: true,
      quietSetting: true,
      offGridCapable: true,
    },
    proximity: {
      fuelNearbyMiles: 0,
      groceriesNearbyMiles: 0,
      rvDumpNearbyMiles: 0,
      attractionNote: spot.access_notes || "Scenic public lands area",
    },
    rules: {
      maxStayNights: parseStayLimit(spot.stay_limit),
      checkInWindow: "Anytime",
      checkOutTime: "Anytime",
      quietHours: "Respect other campers",
      campfirePolicy: "Check local fire restrictions",
      childrenAllowed: true,
      extraGuestsAllowed: true,
      hostInteraction: "independent_gate_code",
    },
    gatekeeping: "any_member",
    rating: 0,
    reviewCount: 0,
    isFree: true,
    isFeatured: false,
    status: "active",
    createdAt: spot.scraped_at ? spot.scraped_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    _pipeline: {
      source: spot.source,
      source_url: spot.source_url || "",
      land_manager: spot.land_manager,
      original_id: spot.id,
      amenities_raw: spot.amenities || [],
    },
  };
}

function makeSlug(name, id) {
  const slug = (name || "unnamed")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `spot-${slug}-${id}`;
}

function guessEnvironment(spot) {
  const text = `${spot.name} ${spot.description || ""} ${spot.access_notes || ""}`.toLowerCase();
  if (text.includes("desert") || text.includes("mesa") || text.includes("canyon")) return "desert";
  if (text.includes("beach") || text.includes("coast") || text.includes("shore")) return "beach";
  if (text.includes("mountain") || text.includes("alpine") || text.includes("peak")) return "mountain";
  if (text.includes("lake") || text.includes("river") || text.includes("creek")) return "lakeside";
  if (text.includes("meadow") || text.includes("prairie") || text.includes("grassland")) return "meadow";
  if (spot.land_manager === "BLM") return "desert";
  return "forest";
}

function parseStayLimit(val) {
  if (!val) return 14;
  const match = String(val).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 14;
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log("🏕️  CampRoo Photo Enrichment Script");
  console.log("====================================\n");

  // 1. Load all spots
  console.log("📂 Loading processed spots...");
  const allSpots = JSON.parse(readFileSync(PROCESSED_PATH, "utf-8"));
  console.log(`   Total spots: ${allSpots.length}`);

  // 2. Separate spots with/without existing photos
  const spotsWithPhotos = [];
  const spotsWithoutPhotos = [];

  for (const spot of allSpots) {
    const urls = (spot.photo_urls || [])
      .map((p) => p.url || "")
      .filter((u) => u && isImageUrl(u) && !isStockPhoto(u));
    if (urls.length > 0) {
      spotsWithPhotos.push({ spot, photos: urls });
    } else {
      spotsWithoutPhotos.push(spot);
    }
  }

  console.log(`   Spots with existing real photos: ${spotsWithPhotos.length}`);
  console.log(`   Spots needing photos: ${spotsWithoutPhotos.length}\n`);

  // 3. Find unique land_manager+state combos that need photos
  const combosNeeded = new Map();
  for (const spot of spotsWithoutPhotos) {
    const key = `${spot.land_manager}|${spot.state}`;
    if (!combosNeeded.has(key)) {
      combosNeeded.set(key, { landManager: spot.land_manager, state: spot.state, count: 0 });
    }
    combosNeeded.get(key).count++;
  }

  console.log(`🔎 Unique combos to query: ${combosNeeded.size}\n`);

  // 4. Load photo cache if exists (to resume interrupted runs)
  let photoCache = {};
  if (existsSync(PHOTO_CACHE_PATH)) {
    photoCache = JSON.parse(readFileSync(PHOTO_CACHE_PATH, "utf-8"));
    console.log(`   Loaded ${Object.keys(photoCache).length} cached combos\n`);
  }

  // 5. Fetch photos for each combo
  let queriedCount = 0;
  for (const [key, info] of combosNeeded) {
    if (photoCache[key] && photoCache[key].length > 0) {
      console.log(`  ✅ Cached: ${key} (${photoCache[key].length} photos, ${info.count} spots)`);
      continue;
    }

    queriedCount++;
    console.log(`\n📸 [${queriedCount}/${combosNeeded.size}] Fetching photos for ${key} (${info.count} spots)...`);

    const photos = await fetchPhotosForCombo(info.landManager, info.state);
    photoCache[key] = photos;

    console.log(`   → Found ${photos.length} real photos`);

    // Save cache after each combo (crash recovery)
    writeFileSync(PHOTO_CACHE_PATH, JSON.stringify(photoCache, null, 2));
  }

  console.log(`\n✅ Photo fetching complete!\n`);

  // 6. Check coverage
  let totalWithPhotos = spotsWithPhotos.length;
  let totalWithRegionalPhotos = 0;
  let totalStillMissing = 0;

  for (const spot of spotsWithoutPhotos) {
    const key = `${spot.land_manager}|${spot.state}`;
    const photos = photoCache[key] || [];
    if (photos.length > 0) {
      totalWithRegionalPhotos++;
    } else {
      totalStillMissing++;
    }
  }

  console.log("📊 Photo Coverage:");
  console.log(`   Individual photos: ${totalWithPhotos}`);
  console.log(`   Regional photos: ${totalWithRegionalPhotos}`);
  console.log(`   Still missing: ${totalStillMissing}`);

  // 7. For combos still missing photos, try broader searches
  if (totalStillMissing > 0) {
    console.log(`\n🔄 Attempting broader searches for ${totalStillMissing} spots...`);
    for (const [key, photos] of Object.entries(photoCache)) {
      if (photos.length > 0) continue;

      const [landManager, state] = key.split("|");
      const stateName = STATE_NAMES[state] || state;

      // Try very broad searches
      const broadQueries = [
        `${stateName} nature landscape`,
        `${stateName} outdoor scenery`,
        `${stateName} state park`,
      ];

      const broadPhotos = new Set();
      for (const q of broadQueries) {
        console.log(`    🔍 Broad: "${q}"`);
        const results = await searchWikimediaPhotos(q, 10);
        for (const p of results) {
          if (!isStockPhoto(p)) broadPhotos.add(p);
        }
        await sleep(3000);
      }

      if (broadPhotos.size > 0) {
        photoCache[key] = [...broadPhotos];
        console.log(`    → Found ${broadPhotos.size} photos`);
      }
    }
    writeFileSync(PHOTO_CACHE_PATH, JSON.stringify(photoCache, null, 2));
  }

  // 8. Build the full curatedFreeSpots.json
  console.log("\n🔨 Building curatedFreeSpots.json with ALL spots...");

  const output = [];

  // a) Spots with individual photos
  for (const { spot, photos } of spotsWithPhotos) {
    // Use the spot's own real photos, pick 3 deterministically
    const selected = photos.slice(0, 5);
    const appSpot = convertSpotToAppFormat(spot, selected);
    appSpot.isFeatured = true; // Spots with individual photos are featured
    output.push(appSpot);
  }

  // b) Spots without individual photos → assign regional photos
  for (const spot of spotsWithoutPhotos) {
    const key = `${spot.land_manager}|${spot.state}`;
    const regionPhotos = photoCache[key] || [];

    let selected;
    if (regionPhotos.length > 0) {
      // Deterministically pick 3 photos using hash of spot id
      const hash = crypto.createHash("md5").update(spot.id).digest("hex");
      const seed = parseInt(hash.slice(0, 8), 16);
      const p1 = regionPhotos[seed % regionPhotos.length];
      const p2 = regionPhotos[(seed + 1) % regionPhotos.length];
      const p3 = regionPhotos[(seed + 2) % regionPhotos.length];
      selected = [...new Set([p1, p2, p3])];
    } else {
      // Last resort: use a generic Wikimedia nature photo as fallback
      // These are verified real CC-licensed photos from Wikimedia Commons
      selected = [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Sunset_over_the_sea_in_Kihei.jpg/1200px-Sunset_over_the_sea_in_Kihei.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Evergreen_forest.jpg/1200px-Evergreen_forest.jpg",
      ];
    }

    const appSpot = convertSpotToAppFormat(spot, selected);
    output.push(appSpot);
  }

  console.log(`   Total spots in output: ${output.length}`);
  console.log(`   Featured (individual photos): ${output.filter((s) => s.isFeatured).length}`);

  // 9. Write output
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n✅ Wrote ${output.length} spots to ${OUTPUT_PATH}`);

  // 10. Stats summary
  const sizeBytes = readFileSync(OUTPUT_PATH).length;
  console.log(`   File size: ${(sizeBytes / 1024 / 1024).toFixed(1)} MB`);

  console.log("\n🎉 Done! All spots now have real Wikimedia Commons photos.");
  console.log("   Next: restart the dev server to see the changes.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
