import { Spot } from '../types';

export interface StateInfo {
  name: string;
  abbr: string;
  bbox: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  center: [number, number]; // [lat, lng]
}

export interface CampingAreaInfo {
  name: string;
  aliases?: string[];
  state: string;
  stateAbbr: string;
  center: [number, number];
  zoom: number;
  description?: string;
  radiusMiles: number;
  nearbyHavensCount?: number;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle: string;
  type: 'state' | 'area' | 'city' | 'spot' | 'geocode';
  center: [number, number];
  zoom?: number;
  bbox?: [number, number, number, number];
  stateAbbr?: string;
  radiusMiles?: number;
  spot?: Spot;
}

// 50 US States Registry with Geographic Bounding Boxes and Centers
export const US_STATES: Record<string, StateInfo> = {
  AL: { name: 'Alabama', abbr: 'AL', bbox: [30.22, -88.47, 35.01, -84.89], center: [32.61, -86.68] },
  AK: { name: 'Alaska', abbr: 'AK', bbox: [51.21, -179.15, 71.39, -129.98], center: [61.37, -152.4] },
  AZ: { name: 'Arizona', abbr: 'AZ', bbox: [31.33, -114.82, 37.0, -109.04], center: [34.16, -111.93] },
  AR: { name: 'Arkansas', abbr: 'AR', bbox: [33.0, -94.62, 36.5, -89.64], center: [34.75, -92.13] },
  CA: { name: 'California', abbr: 'CA', bbox: [32.53, -124.41, 42.01, -114.13], center: [36.77, -119.41] },
  CO: { name: 'Colorado', abbr: 'CO', bbox: [36.99, -109.06, 41.0, -102.04], center: [39.55, -105.78] },
  CT: { name: 'Connecticut', abbr: 'CT', bbox: [40.98, -73.73, 42.05, -71.79], center: [41.6, -72.75] },
  DE: { name: 'Delaware', abbr: 'DE', bbox: [38.45, -75.79, 39.84, -75.05], center: [38.91, -75.52] },
  FL: { name: 'Florida', abbr: 'FL', bbox: [24.39, -87.63, 31.0, -79.97], center: [27.66, -81.51] },
  GA: { name: 'Georgia', abbr: 'GA', bbox: [30.36, -85.61, 35.0, -80.84], center: [32.16, -82.9] },
  HI: { name: 'Hawaii', abbr: 'HI', bbox: [18.91, -160.25, 22.23, -154.81], center: [19.89, -155.58] },
  ID: { name: 'Idaho', abbr: 'ID', bbox: [41.99, -117.24, 49.0, -111.04], center: [44.06, -114.74] },
  IL: { name: 'Illinois', abbr: 'IL', bbox: [36.97, -91.51, 42.51, -87.5], center: [40.63, -89.39] },
  IN: { name: 'Indiana', abbr: 'IN', bbox: [37.77, -88.09, 41.76, -84.78], center: [40.26, -86.13] },
  IA: { name: 'Iowa', abbr: 'IA', bbox: [40.38, -96.64, 43.5, -90.14], center: [41.87, -93.09] },
  KS: { name: 'Kansas', abbr: 'KS', bbox: [36.99, -102.05, 40.0, -94.59], center: [39.01, -98.48] },
  KY: { name: 'Kentucky', abbr: 'KY', bbox: [36.5, -89.57, 39.14, -81.96], center: [37.83, -84.27] },
  LA: { name: 'Louisiana', abbr: 'LA', bbox: [28.93, -94.04, 33.02, -88.82], center: [30.98, -91.96] },
  ME: { name: 'Maine', abbr: 'ME', bbox: [43.07, -71.08, 47.46, -66.95], center: [45.25, -69.44] },
  MD: { name: 'Maryland', abbr: 'MD', bbox: [37.88, -79.49, 39.72, -75.05], center: [39.04, -76.64] },
  MA: { name: 'Massachusetts', abbr: 'MA', bbox: [41.24, -73.51, 42.89, -69.93], center: [42.4, -71.38] },
  MI: { name: 'Michigan', abbr: 'MI', bbox: [41.69, -90.42, 48.3, -82.12], center: [44.31, -85.6] },
  MN: { name: 'Minnesota', abbr: 'MN', bbox: [43.5, -97.24, 49.38, -89.49], center: [46.72, -94.68] },
  MS: { name: 'Mississippi', abbr: 'MS', bbox: [30.17, -91.66, 35.0, -88.1], center: [32.35, -89.39] },
  MO: { name: 'Missouri', abbr: 'MO', bbox: [35.99, -95.77, 40.61, -89.1], center: [37.96, -91.83] },
  MT: { name: 'Montana', abbr: 'MT', bbox: [44.36, -116.05, 49.0, -104.04], center: [46.87, -110.36] },
  NE: { name: 'Nebraska', abbr: 'NE', bbox: [39.99, -104.05, 43.0, -95.31], center: [41.49, -99.9] },
  NV: { name: 'Nevada', abbr: 'NV', bbox: [35.0, -120.0, 42.0, -114.04], center: [38.8, -116.41] },
  NH: { name: 'New Hampshire', abbr: 'NH', bbox: [42.7, -72.56, 45.31, -70.7], center: [43.19, -71.57] },
  NJ: { name: 'New Jersey', abbr: 'NJ', bbox: [38.93, -75.56, 41.36, -73.89], center: [40.05, -74.4] },
  NM: { name: 'New Mexico', abbr: 'NM', bbox: [31.33, -109.05, 37.0, -103.0], center: [34.51, -105.87] },
  NY: { name: 'New York', abbr: 'NY', bbox: [40.5, -79.76, 45.02, -71.86], center: [43.29, -74.21] },
  NC: { name: 'North Carolina', abbr: 'NC', bbox: [33.84, -84.32, 36.59, -75.46], center: [35.75, -79.01] },
  ND: { name: 'North Dakota', abbr: 'ND', bbox: [45.93, -104.05, 49.0, -96.55], center: [47.55, -101.0] },
  OH: { name: 'Ohio', abbr: 'OH', bbox: [38.4, -84.82, 41.98, -80.52], center: [40.41, -82.9] },
  OK: { name: 'Oklahoma', abbr: 'OK', bbox: [33.62, -103.0, 37.0, -94.43], center: [35.56, -96.92] },
  OR: { name: 'Oregon', abbr: 'OR', bbox: [41.99, -124.57, 46.29, -116.46], center: [43.8, -120.55] },
  PA: { name: 'Pennsylvania', abbr: 'PA', bbox: [39.72, -80.52, 42.27, -74.69], center: [41.2, -77.19] },
  RI: { name: 'Rhode Island', abbr: 'RI', bbox: [41.15, -71.89, 42.02, -71.12], center: [41.58, -71.47] },
  SC: { name: 'South Carolina', abbr: 'SC', bbox: [32.03, -83.35, 35.22, -78.54], center: [33.83, -81.16] },
  SD: { name: 'South Dakota', abbr: 'SD', bbox: [42.48, -104.06, 45.94, -96.44], center: [43.96, -99.9] },
  TN: { name: 'Tennessee', abbr: 'TN', bbox: [34.98, -90.31, 36.68, -81.65], center: [35.51, -86.58] },
  TX: { name: 'Texas', abbr: 'TX', bbox: [25.84, -106.65, 36.5, -93.51], center: [31.96, -99.9] },
  UT: { name: 'Utah', abbr: 'UT', bbox: [37.0, -114.05, 42.0, -109.04], center: [39.32, -111.09] },
  VT: { name: 'Vermont', abbr: 'VT', bbox: [42.73, -73.44, 45.02, -71.46], center: [44.55, -72.57] },
  VA: { name: 'Virginia', abbr: 'VA', bbox: [36.54, -83.67, 39.47, -75.17], center: [37.43, -78.65] },
  WA: { name: 'Washington', abbr: 'WA', bbox: [45.54, -124.85, 49.0, -116.92], center: [47.75, -120.74] },
  WV: { name: 'West Virginia', abbr: 'WV', bbox: [37.2, -82.64, 40.64, -77.72], center: [38.59, -80.45] },
  WI: { name: 'Wisconsin', abbr: 'WI', bbox: [42.49, -92.89, 47.3, -86.76], center: [43.78, -88.78] },
  WY: { name: 'Wyoming', abbr: 'WY', bbox: [40.99, -111.05, 45.0, -104.05], center: [43.07, -107.29] }
};

// Comprehensive Registry of 60+ Major US Travel Hubs, Outdoor Destinations & Metro Cities
export const POPULAR_CAMPING_AREAS: CampingAreaInfo[] = [
  // West Coast & Pacific Northwest
  { name: 'Seattle', aliases: ['seattle', 'tacoma', 'puget sound'], state: 'Washington', stateAbbr: 'WA', center: [47.6062, -122.3321], zoom: 10, radiusMiles: 60, nearbyHavensCount: 15 },
  { name: 'Spokane', aliases: ['spokane', 'eastern washington'], state: 'Washington', stateAbbr: 'WA', center: [47.6588, -117.4260], zoom: 10, radiusMiles: 60, nearbyHavensCount: 407 },
  { name: 'Olympic National Forest', aliases: ['olympic', 'port angeles', 'forks'], state: 'Washington', stateAbbr: 'WA', center: [47.8021, -123.6044], zoom: 9, radiusMiles: 60, nearbyHavensCount: 3 },
  { name: 'Portland', aliases: ['portland', 'vancouver wa', 'willamette'], state: 'Oregon', stateAbbr: 'OR', center: [45.5152, -122.6784], zoom: 10, radiusMiles: 60, nearbyHavensCount: 16 },
  { name: 'Bend', aliases: ['bend', 'deschutes', 'central oregon'], state: 'Oregon', stateAbbr: 'OR', center: [44.0582, -121.3153], zoom: 10, radiusMiles: 50, nearbyHavensCount: 23 },
  { name: 'Eugene', aliases: ['eugene', 'springfield or'], state: 'Oregon', stateAbbr: 'OR', center: [44.0521, -123.0868], zoom: 10, radiusMiles: 60, nearbyHavensCount: 32 },
  { name: 'Medford / Ashland', aliases: ['medford', 'ashland', 'rogue river'], state: 'Oregon', stateAbbr: 'OR', center: [42.3265, -122.8756], zoom: 10, radiusMiles: 60, nearbyHavensCount: 40 },
  { name: 'Mount Hood / Cascades', aliases: ['mount hood', 'mt hood', 'hood river'], state: 'Oregon', stateAbbr: 'OR', center: [45.3736, -121.696], zoom: 10, radiusMiles: 50, nearbyHavensCount: 16 },

  // Rocky Mountains & Northern Rockies
  { name: 'Boise', aliases: ['boise', 'meridian id', 'treasure valley'], state: 'Idaho', stateAbbr: 'ID', center: [43.6150, -116.2023], zoom: 10, radiusMiles: 60, nearbyHavensCount: 32 },
  { name: 'Coeur d\'Alene', aliases: ['coeur d\'alene', 'cda', 'post falls'], state: 'Idaho', stateAbbr: 'ID', center: [47.6777, -116.7805], zoom: 10, radiusMiles: 60, nearbyHavensCount: 380 },
  { name: 'Idaho Falls', aliases: ['idaho falls', 'ammon'], state: 'Idaho', stateAbbr: 'ID', center: [43.4927, -112.0340], zoom: 10, radiusMiles: 60, nearbyHavensCount: 160 },
  { name: 'Twin Falls', aliases: ['twin falls', 'snake river canyon'], state: 'Idaho', stateAbbr: 'ID', center: [42.5629, -114.4609], zoom: 10, radiusMiles: 60, nearbyHavensCount: 85 },
  { name: 'Pocatello', aliases: ['pocatello', 'chubbuck'], state: 'Idaho', stateAbbr: 'ID', center: [42.8621, -112.4506], zoom: 10, radiusMiles: 60, nearbyHavensCount: 140 },
  { name: 'Salmon-Challis', aliases: ['salmon', 'challis', 'salmon-challis'], state: 'Idaho', stateAbbr: 'ID', center: [44.6974, -114.2259], zoom: 9, radiusMiles: 60, nearbyHavensCount: 205 },
  { name: 'Missoula', aliases: ['missoula', 'lolo national forest', 'bitterroot'], state: 'Montana', stateAbbr: 'MT', center: [46.8721, -113.9940], zoom: 10, radiusMiles: 60, nearbyHavensCount: 969 },
  { name: 'Bozeman / Gallatin', aliases: ['bozeman', 'gallatin', 'big sky'], state: 'Montana', stateAbbr: 'MT', center: [45.6770, -111.0429], zoom: 9, radiusMiles: 60, nearbyHavensCount: 898 },
  { name: 'Flathead / Glacier / Whitefish', aliases: ['flathead', 'glacier', 'whitefish', 'kalispell'], state: 'Montana', stateAbbr: 'MT', center: [48.4111, -114.3376], zoom: 9, radiusMiles: 60, nearbyHavensCount: 620 },
  { name: 'Billings', aliases: ['billings', 'yellowstone county'], state: 'Montana', stateAbbr: 'MT', center: [45.7833, -108.5007], zoom: 10, radiusMiles: 60, nearbyHavensCount: 68 },
  { name: 'Helena', aliases: ['helena', 'helena national forest'], state: 'Montana', stateAbbr: 'MT', center: [46.5958, -112.0362], zoom: 10, radiusMiles: 60, nearbyHavensCount: 520 },
  { name: 'Yellowstone', aliases: ['yellowstone', 'west yellowstone', 'gardiner'], state: 'Wyoming / Montana', stateAbbr: 'WY', center: [44.4280, -110.5885], zoom: 9, radiusMiles: 65, nearbyHavensCount: 439 },
  { name: 'Grand Teton / Jackson', aliases: ['grand teton', 'jackson', 'jackson hole', 'teton'], state: 'Wyoming', stateAbbr: 'WY', center: [43.7904, -110.6818], zoom: 10, radiusMiles: 50, nearbyHavensCount: 136 },
  { name: 'Cody', aliases: ['cody wy', 'shoshone national forest'], state: 'Wyoming', stateAbbr: 'WY', center: [44.5263, -109.0565], zoom: 10, radiusMiles: 60, nearbyHavensCount: 80 },
  { name: 'Casper', aliases: ['casper wy', 'central wyoming'], state: 'Wyoming', stateAbbr: 'WY', center: [42.8501, -106.3252], zoom: 10, radiusMiles: 60, nearbyHavensCount: 45 },
  { name: 'Cheyenne', aliases: ['cheyenne wy'], state: 'Wyoming', stateAbbr: 'WY', center: [41.1400, -104.8202], zoom: 10, radiusMiles: 60, nearbyHavensCount: 22 },

  // Colorado & Utah High Country
  { name: 'Denver / Front Range', aliases: ['denver', 'front range', 'boulder'], state: 'Colorado', stateAbbr: 'CO', center: [39.7392, -104.9903], zoom: 9, radiusMiles: 60, nearbyHavensCount: 24 },
  { name: 'Colorado Springs', aliases: ['colorado springs', 'pikes peak'], state: 'Colorado', stateAbbr: 'CO', center: [38.8339, -104.8214], zoom: 10, radiusMiles: 60, nearbyHavensCount: 23 },
  { name: 'Durango', aliases: ['durango', 'san juan national forest'], state: 'Colorado', stateAbbr: 'CO', center: [37.2753, -107.8801], zoom: 10, radiusMiles: 60, nearbyHavensCount: 65 },
  { name: 'San Juan Mountains / Ouray', aliases: ['san juan', 'ouray', 'silverton', 'telluride'], state: 'Colorado', stateAbbr: 'CO', center: [38.0228, -107.6714], zoom: 10, radiusMiles: 50, nearbyHavensCount: 87 },
  { name: 'Aspen / White River', aliases: ['aspen', 'white river', 'glenwood springs'], state: 'Colorado', stateAbbr: 'CO', center: [39.1911, -106.8175], zoom: 10, radiusMiles: 50, nearbyHavensCount: 50 },
  { name: 'Grand Junction', aliases: ['grand junction', 'palisade co', 'fruita'], state: 'Colorado', stateAbbr: 'CO', center: [39.0639, -108.5506], zoom: 10, radiusMiles: 60, nearbyHavensCount: 42 },
  { name: 'Salt Lake / Uintas', aliases: ['salt lake', 'salt lake city', 'slc', 'uintas', 'uinta'], state: 'Utah', stateAbbr: 'UT', center: [40.7608, -111.8910], zoom: 9, radiusMiles: 60, nearbyHavensCount: 45 },
  { name: 'Moab', aliases: ['moab', 'arches', 'canyonlands'], state: 'Utah', stateAbbr: 'UT', center: [38.5733, -109.5498], zoom: 10, radiusMiles: 50, nearbyHavensCount: 17 },
  { name: 'Zion / St. George', aliases: ['zion', 'st george', 'springdale', 'hurricane ut'], state: 'Utah', stateAbbr: 'UT', center: [37.2982, -113.0263], zoom: 10, radiusMiles: 50, nearbyHavensCount: 8 },
  { name: 'Kanab', aliases: ['kanab', 'vermilion cliffs', 'coral pink'], state: 'Utah', stateAbbr: 'UT', center: [37.0475, -112.5263], zoom: 10, radiusMiles: 50, nearbyHavensCount: 18 },

  // Southwest & California
  { name: 'Sedona', aliases: ['sedona', 'oak creek'], state: 'Arizona', stateAbbr: 'AZ', center: [34.8697, -111.7610], zoom: 10, radiusMiles: 50, nearbyHavensCount: 51 },
  { name: 'Flagstaff / Coconino', aliases: ['flagstaff', 'coconino'], state: 'Arizona', stateAbbr: 'AZ', center: [35.1983, -111.6513], zoom: 10, radiusMiles: 50, nearbyHavensCount: 7 },
  { name: 'Phoenix', aliases: ['phoenix', 'scottsdale', 'mesa az', 'tonto'], state: 'Arizona', stateAbbr: 'AZ', center: [33.4484, -112.0740], zoom: 10, radiusMiles: 60, nearbyHavensCount: 6 },
  { name: 'Tucson', aliases: ['tucson', 'coronado national forest'], state: 'Arizona', stateAbbr: 'AZ', center: [32.2226, -110.9747], zoom: 10, radiusMiles: 60, nearbyHavensCount: 5 },
  { name: 'Reno', aliases: ['reno', 'sparks nv'], state: 'Nevada', stateAbbr: 'NV', center: [39.5296, -119.8138], zoom: 10, radiusMiles: 60, nearbyHavensCount: 110 },
  { name: 'Las Vegas', aliases: ['las vegas', 'vegas', 'red rock canyon'], state: 'Nevada', stateAbbr: 'NV', center: [36.1699, -115.1398], zoom: 10, radiusMiles: 60, nearbyHavensCount: 8 },
  { name: 'Lake Tahoe', aliases: ['tahoe', 'lake tahoe', 'truckee'], state: 'California / Nevada', stateAbbr: 'CA', center: [39.0968, -120.0324], zoom: 10, radiusMiles: 50, nearbyHavensCount: 107 },
  { name: 'Inyo / Bishop / Eastern Sierra', aliases: ['bishop', 'inyo', 'eastern sierra', 'mammoth lakes', 'mammoth'], state: 'California', stateAbbr: 'CA', center: [37.3639, -118.3952], zoom: 9, radiusMiles: 60, nearbyHavensCount: 104 },
  { name: 'Yosemite / Sierra', aliases: ['yosemite', 'sierra national forest'], state: 'California', stateAbbr: 'CA', center: [37.8651, -119.5383], zoom: 9, radiusMiles: 55, nearbyHavensCount: 83 },
  { name: 'Joshua Tree', aliases: ['joshua tree', 'twentynine palms', 'palm springs'], state: 'California', stateAbbr: 'CA', center: [33.8734, -115.9010], zoom: 10, radiusMiles: 50, nearbyHavensCount: 8 },
  { name: 'Redding', aliases: ['redding', 'shasta', 'trinity'], state: 'California', stateAbbr: 'CA', center: [40.5865, -122.3917], zoom: 10, radiusMiles: 60, nearbyHavensCount: 52 },
  { name: 'Sacramento', aliases: ['sacramento', 'folsom'], state: 'California', stateAbbr: 'CA', center: [38.5816, -121.4944], zoom: 10, radiusMiles: 60, nearbyHavensCount: 35 },
  { name: 'San Diego', aliases: ['san diego', 'cleveland national forest'], state: 'California', stateAbbr: 'CA', center: [32.7157, -117.1611], zoom: 10, radiusMiles: 60, nearbyHavensCount: 18 },
  { name: 'San Francisco / Bay Area', aliases: ['san francisco', 'sf', 'bay area', 'oakland', 'san jose'], state: 'California', stateAbbr: 'CA', center: [37.7749, -122.4194], zoom: 10, radiusMiles: 60, nearbyHavensCount: 22 },
  { name: 'Albuquerque', aliases: ['albuquerque', 'cibola national forest'], state: 'New Mexico', stateAbbr: 'NM', center: [35.0844, -106.6504], zoom: 10, radiusMiles: 60, nearbyHavensCount: 12 },
  { name: 'Santa Fe', aliases: ['santa fe', 'santa fe national forest'], state: 'New Mexico', stateAbbr: 'NM', center: [35.6870, -105.9378], zoom: 10, radiusMiles: 60, nearbyHavensCount: 30 },
  { name: 'Taos', aliases: ['taos', 'carson national forest'], state: 'New Mexico', stateAbbr: 'NM', center: [36.4072, -105.5734], zoom: 10, radiusMiles: 60, nearbyHavensCount: 40 },

  // Midwest, South, & East Coast
  { name: 'Rapid City / Black Hills', aliases: ['black hills', 'custer', 'rapid city'], state: 'South Dakota', stateAbbr: 'SD', center: [43.8647, -103.6264], zoom: 10, radiusMiles: 50, nearbyHavensCount: 35 },
  { name: 'Superior National Forest', aliases: ['superior', 'boundary waters', 'ely mn', 'duluth'], state: 'Minnesota', stateAbbr: 'MN', center: [47.8547, -91.5647], zoom: 9, radiusMiles: 60, nearbyHavensCount: 28 },
  { name: 'Gatlinburg / Smokies', aliases: ['gatlinburg', 'smokies', 'great smoky', 'pigeon forge'], state: 'Tennessee', stateAbbr: 'TN', center: [35.7143, -83.5102], zoom: 10, radiusMiles: 50, nearbyHavensCount: 12 },
  { name: 'Asheville', aliases: ['asheville', 'pisgah national forest', 'blue ridge'], state: 'North Carolina', stateAbbr: 'NC', center: [35.5951, -82.5515], zoom: 10, radiusMiles: 60, nearbyHavensCount: 28 },
  { name: 'Austin', aliases: ['austin tx', 'hill country tx'], state: 'Texas', stateAbbr: 'TX', center: [30.2672, -97.7431], zoom: 10, radiusMiles: 60, nearbyHavensCount: 5 },
  { name: 'Dallas / Fort Worth', aliases: ['dallas', 'fort worth'], state: 'Texas', stateAbbr: 'TX', center: [32.7767, -96.7970], zoom: 10, radiusMiles: 60, nearbyHavensCount: 6 },
  { name: 'Houston', aliases: ['houston tx'], state: 'Texas', stateAbbr: 'TX', center: [29.7604, -95.3698], zoom: 10, radiusMiles: 60, nearbyHavensCount: 8 },
  { name: 'Chicago', aliases: ['chicago il'], state: 'Illinois', stateAbbr: 'IL', center: [41.8781, -87.6298], zoom: 10, radiusMiles: 60, nearbyHavensCount: 4 },
  { name: 'Atlanta', aliases: ['atlanta ga'], state: 'Georgia', stateAbbr: 'GA', center: [33.7490, -84.3880], zoom: 10, radiusMiles: 60, nearbyHavensCount: 14 },
  { name: 'Bar Harbor / Acadia', aliases: ['bar harbor', 'acadia national park'], state: 'Maine', stateAbbr: 'ME', center: [44.3876, -68.2039], zoom: 10, radiusMiles: 60, nearbyHavensCount: 10 },
  { name: 'Burlington', aliases: ['burlington vt', 'green mountain'], state: 'Vermont', stateAbbr: 'VT', center: [44.4759, -73.2121], zoom: 10, radiusMiles: 60, nearbyHavensCount: 18 }
];

/**
 * Match a text query against our recognized camping destinations
 */
export function findCampingArea(query: string): CampingAreaInfo | null {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return null;

  // 1. Exact name match
  for (const area of POPULAR_CAMPING_AREAS) {
    if (area.name.toLowerCase() === q) return area;
  }

  // 2. Exact alias match
  for (const area of POPULAR_CAMPING_AREAS) {
    if (area.aliases && area.aliases.some((a) => a.toLowerCase() === q)) {
      return area;
    }
  }

  // 3. Substring match
  for (const area of POPULAR_CAMPING_AREAS) {
    const areaName = area.name.toLowerCase();
    if (q.includes(areaName) || areaName.includes(q)) return area;
    if (area.aliases && area.aliases.some((a) => q.includes(a.toLowerCase()) || a.toLowerCase().includes(q))) {
      return area;
    }
  }

  return null;
}

// Helper: Haversine distance in miles
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// In-memory cache for Nominatim geocoding requests to prevent repeat network calls
const geocodeCache = new Map<string, { center: [number, number]; bbox?: [number, number, number, number]; displayName: string }>();

/**
 * Resolves state name or abbreviation to standard 2-letter code
 */
export function getStateAbbr(stateName?: string): string | undefined {
  if (!stateName) return undefined;
  const lower = stateName.toLowerCase().trim();
  for (const [abbr, info] of Object.entries(US_STATES)) {
    if (info.name.toLowerCase() === lower || abbr.toLowerCase() === lower) {
      return abbr;
    }
  }
  return undefined;
}

/**
 * Live Geocoding Autocomplete for US Cities and Towns via Photon API
 * Ultra-fast (<150ms), no API key needed, covers all US cities, towns, and places.
 */
export async function fetchLiveCitySuggestions(query: string): Promise<SearchSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !data.features || !Array.isArray(data.features)) return [];

    const suggestions: SearchSuggestion[] = [];
    const seenKeys = new Set<string>();

    for (const f of data.features) {
      const props = f.properties || {};
      // Prioritize US places
      if (props.countrycode && props.countrycode.toUpperCase() !== 'US') continue;

      const name = props.name;
      if (!name) continue;

      // Filter to places, cities, towns, administrative areas, counties
      const osmKey = props.osm_key;
      const osmValue = props.osm_value;
      const type = props.type;
      const isPlace =
        osmKey === 'place' ||
        type === 'city' ||
        osmValue === 'city' ||
        osmValue === 'town' ||
        osmValue === 'village' ||
        osmValue === 'hamlet' ||
        osmValue === 'administrative' ||
        osmValue === 'suburb';

      // Skip non-places if there are plenty of results
      if (!isPlace && data.features.length > 3) continue;

      const stateName = props.state;
      const stateAbbr = getStateAbbr(stateName);
      const county = props.county;
      const coords = f.geometry?.coordinates; // [lon, lat]
      if (!coords || coords.length < 2) continue;

      const lat = coords[1];
      const lng = coords[0];

      // Format subtitle (e.g. "Multnomah County · Oregon (OR) · USA")
      const subtitleParts: string[] = [];
      if (county && !county.toLowerCase().includes('county')) {
        subtitleParts.push(`${county} County`);
      } else if (county) {
        subtitleParts.push(county);
      }
      if (stateName) {
        subtitleParts.push(stateAbbr ? `${stateName} (${stateAbbr})` : stateName);
      } else if (stateAbbr) {
        subtitleParts.push(stateAbbr);
      }
      subtitleParts.push('USA');

      const fullKey = `${name.toLowerCase()}-${stateAbbr || stateName || ''}`;
      if (seenKeys.has(fullKey)) continue;
      seenKeys.add(fullKey);

      let bbox: [number, number, number, number] | undefined = undefined;
      if (Array.isArray(props.extent) && props.extent.length === 4) {
        // Photon extent: [minLng, maxLat, maxLng, minLat]
        bbox = [props.extent[3], props.extent[0], props.extent[1], props.extent[2]];
      }

      suggestions.push({
        id: `city-${props.osm_id || Math.random().toString(36).substring(2, 9)}`,
        title: name,
        subtitle: subtitleParts.join(' · '),
        type: 'city',
        center: [lat, lng],
        zoom: 10,
        bbox,
        stateAbbr,
        radiusMiles: 50,
      });
    }

    return suggestions;
  } catch (err) {
    console.warn('Live city suggestion fetch failed:', err);
    return [];
  }
}

/**
 * Fast Geocoding fallback for resolving arbitrary US towns, counties, parks
 * Queries Photon first (<100ms), then Nominatim
 */
export async function geocodeArea(query: string): Promise<{ center: [number, number]; bbox?: [number, number, number, number]; displayName: string } | null> {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  if (geocodeCache.has(clean)) {
    return geocodeCache.get(clean)!;
  }

  // 1. Try ultra-fast Photon API
  try {
    const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`);
    if (photonRes.ok) {
      const data = await photonRes.json();
      if (data?.features?.length > 0) {
        const f = data.features[0];
        const coords = f.geometry?.coordinates;
        if (coords && coords.length >= 2) {
          let bbox: [number, number, number, number] | undefined;
          if (Array.isArray(f.properties?.extent) && f.properties.extent.length === 4) {
            bbox = [f.properties.extent[3], f.properties.extent[0], f.properties.extent[1], f.properties.extent[2]];
          }
          const resObj = {
            center: [coords[1], coords[0]] as [number, number],
            bbox,
            displayName: f.properties?.name || query,
          };
          geocodeCache.set(clean, resObj);
          return resObj;
        }
      }
    }
  } catch (e) {
    // Continue to Nominatim fallback
  }

  // 2. Nominatim fallback
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', United States')}&format=json&limit=1&countrycodes=us`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      let bbox: [number, number, number, number] | undefined;
      if (item.boundingbox && item.boundingbox.length === 4) {
        bbox = [
          parseFloat(item.boundingbox[0]),
          parseFloat(item.boundingbox[2]),
          parseFloat(item.boundingbox[1]),
          parseFloat(item.boundingbox[3]),
        ];
      }
      const result = {
        center: [lat, lon] as [number, number],
        bbox,
        displayName: item.display_name,
      };
      geocodeCache.set(clean, result);
      return result;
    }
  } catch (err) {
    console.warn('Geocoding error:', err);
  }
  return null;
}

/**
 * Match a spot against an area query:
 * 1. Geographic proximity check if searchCoords (or recognized area) is available
 * 2. Explicit state code filter
 * 3. US State text match
 * 4. General text search against title, locationName, generalArea, description
 */
export function isSpotMatchingQuery(
  spot: Spot,
  query: string,
  stateCode?: string,
  searchCoords?: [number, number],
  searchRadiusMiles?: number
): boolean {
  const q = query.trim().toLowerCase();

  // 1. Proximity matching when searchCoords is provided
  if (searchCoords && searchCoords.length === 2) {
    const radius = searchRadiusMiles || 50;
    const dist = getDistanceMiles(searchCoords[0], searchCoords[1], spot.coordinates[0], spot.coordinates[1]);
    return dist <= radius;
  }

  // 2. Explicit state code filter
  if (stateCode && stateCode !== 'all') {
    const targetState = stateCode.toUpperCase();
    const spotArea = spot.generalArea.toUpperCase();
    const pipelineState = (spot as any)._pipeline?.state?.toUpperCase();
    const matchesState = pipelineState === targetState || spotArea.startsWith(targetState + ',') || spotArea.includes(` ${targetState}`);
    if (!matchesState) return false;
    if (!q) return true;
  }

  if (!q) return true;

  // 3. Proximity check for recognized camping destination hubs
  const recognizedArea = findCampingArea(q);
  if (recognizedArea) {
    const dist = getDistanceMiles(recognizedArea.center[0], recognizedArea.center[1], spot.coordinates[0], spot.coordinates[1]);
    return dist <= recognizedArea.radiusMiles;
  }

  // 4. Check if user typed a state name or state abbreviation
  for (const [abbr, state] of Object.entries(US_STATES)) {
    if (q === state.name.toLowerCase() || q === abbr.toLowerCase()) {
      const spotArea = spot.generalArea.toUpperCase();
      const pipelineState = (spot as any)._pipeline?.state?.toUpperCase();
      return pipelineState === abbr || spotArea.startsWith(abbr + ',') || spotArea.includes(` ${abbr}`);
    }
  }

  // 5. Text search in title, locationName, generalArea, description
  const loc = spot.locationName.toLowerCase();
  const title = spot.title.toLowerCase();
  const area = spot.generalArea.toLowerCase();
  const desc = (spot.description || '').toLowerCase();

  return loc.includes(q) || title.includes(q) || area.includes(q) || desc.includes(q);
}

/**
 * Count total spots in a given state from the dataset
 */
export function countSpotsByState(spots: Spot[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const spot of spots) {
    const pState = (spot as any)._pipeline?.state?.toUpperCase();
    let state = pState;
    if (!state && spot.generalArea) {
      const match = spot.generalArea.match(/^([A-Z]{2}),/i);
      if (match) state = match[1].toUpperCase();
    }
    if (state) {
      counts[state] = (counts[state] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Generate smart autocomplete suggestions for area search
 */
export function getAreaSearchSuggestions(
  query: string,
  spots: Spot[],
  stateCounts: Record<string, number>
): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Return top popular camping areas as default suggestions with verified counts
    return POPULAR_CAMPING_AREAS.slice(0, 8).map((area) => ({
      id: `area-${area.name}`,
      title: area.name,
      subtitle: `${area.nearbyHavensCount ? `${area.nearbyHavensCount} Free Havens Nearby` : 'Top Destination'} · ${area.state}`,
      type: 'area',
      center: area.center,
      zoom: area.zoom,
      stateAbbr: area.stateAbbr,
      radiusMiles: area.radiusMiles,
    }));
  }

  const suggestions: SearchSuggestion[] = [];

  // 1. Check Popular Camping Areas
  for (const area of POPULAR_CAMPING_AREAS) {
    const matchesName = area.name.toLowerCase().includes(q);
    const matchesState = area.state.toLowerCase().includes(q);
    const matchesAlias = area.aliases?.some((a) => a.toLowerCase().includes(q));
    if (matchesName || matchesState || matchesAlias) {
      suggestions.push({
        id: `area-${area.name}`,
        title: area.name,
        subtitle: `${area.nearbyHavensCount ? `${area.nearbyHavensCount} Free Havens Nearby` : 'Top Haven'} · ${area.state}`,
        type: 'area',
        center: area.center,
        zoom: area.zoom,
        stateAbbr: area.stateAbbr,
        radiusMiles: area.radiusMiles,
      });
    }
  }

  // 2. Check US States
  for (const [abbr, state] of Object.entries(US_STATES)) {
    if (state.name.toLowerCase().includes(q) || abbr.toLowerCase() === q) {
      const count = stateCounts[abbr] || 0;
      suggestions.push({
        id: `state-${abbr}`,
        title: state.name,
        subtitle: `${count.toLocaleString()} Free Campsites (${abbr})`,
        type: 'state',
        center: state.center,
        zoom: 7,
        bbox: state.bbox,
        stateAbbr: abbr,
      });
    }
  }

  // 3. Match specific spot titles / locations from dataset (max 4)
  let spotMatches = 0;
  for (const spot of spots) {
    if (spotMatches >= 4) break;
    const title = spot.title.toLowerCase();
    const loc = spot.locationName.toLowerCase();
    if (title.includes(q) || loc.includes(q)) {
      suggestions.push({
        id: `spot-${spot.id}`,
        title: spot.title,
        subtitle: `${spot.locationName}, ${spot.generalArea}`,
        type: 'spot',
        center: [spot.coordinates[0], spot.coordinates[1]],
        zoom: 13,
        spot,
      });
      spotMatches++;
    }
  }

  return suggestions;
}
