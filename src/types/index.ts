export type RVType =
  | 'class_a'
  | 'class_b'
  | 'class_c'
  | 'travel_trailer'
  | 'fifth_wheel'
  | 'campervan'
  | 'truck_camper'
  | 'rooftop_tent';

export const RV_TYPE_LABELS: Record<RVType, string> = {
  class_a: 'Class A Motorhome',
  class_b: 'Class B (Campervan)',
  class_c: 'Class C Motorhome',
  travel_trailer: 'Travel Trailer',
  fifth_wheel: 'Fifth Wheel',
  campervan: 'Campervan / Vanlife',
  truck_camper: 'Truck Camper',
  rooftop_tent: 'Overland / Rooftop Tent',
};

export type SpaceType =
  | 'driveway'
  | 'ranch'
  | 'acreage'
  | 'backyard'
  | 'farm'
  | 'vineyard'
  | 'desert_oasis'
  | 'forest_clearing';

export type EnvironmentType =
  | 'forest'
  | 'lakeside'
  | 'mountain'
  | 'desert'
  | 'beach'
  | 'meadow'
  | 'rural'
  | 'farm'
  | 'vineyard'
  | 'residential'
  | 'coastal';

export interface RigCompatibility {
  maxLengthFt: number;
  maxHeightFt: number;
  maxWidthFt: number;
  acceptedTypes: RVType[];
  accessType: 'pull_through' | 'back_in' | 'circular_drive';
  surfaceType: 'level_concrete' | 'packed_gravel' | 'firm_grass' | 'desert_hardpack' | 'dirt';
  isLevel: boolean;
  turnaroundSpace: string;
  lowClearanceNotice?: string;
  trailerDisconnectRequired: boolean;
}

export interface HookupsAndAmenities {
  electricity: 'none' | '15amp' | '30amp' | '50amp';
  water: 'potable_hookup' | 'spigot_fill' | 'non_potable' | 'none';
  sewer: 'full_hookup' | 'dump_station_on_site' | 'nearby_dump' | 'none';
  wifi: boolean;
  wifiSpeed?: string;
  bathroom: boolean;
  shower: boolean;
  firePit: boolean;
  trash: boolean;
  shade: 'full' | 'partial' | 'open_sky';
  generatorsAllowed: boolean;
  generatorHours?: string;
  petsAllowed: boolean;
  petRestrictions?: string;
  familyFriendly: boolean;
  quietSetting: boolean;
  offGridCapable: boolean;
}

export interface ProximityInfo {
  fuelNearbyMiles: number;
  groceriesNearbyMiles: number;
  rvDumpNearbyMiles: number;
  attractionNote: string;
}

export interface HostRules {
  maxStayNights: number;
  checkInWindow: string;
  checkOutTime: string;
  quietHours: string;
  campfirePolicy: string;
  childrenAllowed: boolean;
  extraGuestsAllowed: boolean;
  hostInteraction: 'social_loves_to_chat' | 'peaceful_wave_from_porch' | 'independent_gate_code';
}

export type GatekeepingRequirement =
  | 'any_member'
  | 'verified_id_only'
  | 'experienced_rvers_only';

export interface Spot {
  id: string;
  hostId: string;
  title: string;
  tagline: string;
  description: string;
  locationName: string;
  generalArea: string;
  coordinates: [number, number]; // [lat, lng]
  photos: string[];
  spaceType: SpaceType;
  environment: EnvironmentType;
  rigCompatibility: RigCompatibility;
  amenities: HookupsAndAmenities;
  proximity: ProximityInfo;
  rules: HostRules;
  gatekeeping: GatekeepingRequirement;
  rating: number;
  reviewCount: number;
  isFree: true; // CampRoo is always free
  isFeatured?: boolean;
  exactAddressSecret?: string;
  arrivalGateCodeSecret?: string;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  visibility?: 'public' | 'personal';
  submitterName?: string;
  contactEmail?: string;
  contactPhone?: string;
  reviewStatus?: 'pending_review' | 'approved' | 'personal';
  mileMarker?: number;
  distanceToRoute?: number;
  spotType?: 'public' | 'host';
  googleMapsUrl?: string;
  _pipeline?: any;
}

export function isPublicSpot(spot: Spot, users?: User[]): boolean {
  if (spot.spotType === 'public') return true;
  if (!spot.hostId || spot.hostId === 'pipeline-import' || spot.hostId === 'system' || spot.hostId === 'public') return true;
  if (spot._pipeline) return true;
  // All spots currently available on CampRoo are 100% free public land campsites
  return true;
}

export function getSpotAgencyInfo(spot: Spot): { agency: string; shortName: string; isFederal: boolean } {
  const lm = spot._pipeline?.land_manager || '';
  const text = (spot.title + ' ' + (spot.tagline || '') + ' ' + (spot.description || '')).toLowerCase();

  if (lm === 'USFS' || text.includes('usfs') || text.includes('national forest') || text.includes('national grassland') || text.includes('ranger district')) {
    return { agency: 'U.S. Forest Service', shortName: 'USFS', isFederal: true };
  }
  if (lm === 'BLM' || text.includes('blm') || text.includes('bureau of land management')) {
    return { agency: 'Bureau of Land Management', shortName: 'BLM', isFederal: true };
  }
  if (text.includes('state forest') || text.includes('state park') || text.includes('dnr') || text.includes('wildlife')) {
    return { agency: 'State Public Lands', shortName: 'State Land', isFederal: false };
  }
  return { agency: 'Public Lands & Dispersed Camping', shortName: 'Public Land', isFederal: false };
}

export interface UserRig {
  type: RVType;
  makeModel: string;
  lengthFt: number;
  year: number;
}

export interface User {
  id: string;
  name: string;
  role: 'traveler' | 'host' | 'admin';
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  homeRegion: string;
  yearsRVing: number;
  rig: UserRig;
  tripsCompleted: number;
  spotsHosted: number;
  verifications: {
    email: boolean;
    phone: boolean;
    idDocument: boolean;
    rvOwnership: boolean;
  };
  blockedUserIds?: string[];
  joinedYear: number;
  rating: number;
  reviewCount: number;
  isSuspended?: boolean;
}

export interface StayRequest {
  id: string;
  spotId: string;
  travelerId: string;
  hostId: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  guestCount: number;
  travelerRig: {
    type: RVType;
    lengthFt: number;
    description: string;
  };
  personalNote: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  createdAt: string;
  hostResponseNote?: string;
  arrivalTimeEst?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface MessageThread {
  id: string;
  participants: [string, string]; // [travelerId, hostId]
  spotId: string;
  stayRequestId?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadBy: string[]; // array of userIds
  messages: ChatMessage[];
}

export interface ReviewCategoryScores {
  communication: number;
  accuracy: number;
  hospitality: number;
  safety: number;
  cleanliness: number;
}

export interface Review {
  id: string;
  spotId?: string;
  travelerId: string;
  hostId?: string;
  stayRequestId?: string;
  authorId: string;
  authorRole: 'traveler' | 'host';
  ratingOverall: number;
  categories: ReviewCategoryScores;
  wouldWelcomeAgain: boolean;
  comment: string;
  createdAt: string;
  hostReply?: string;
  isModerated?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  updatedAt?: string;
  photos?: string[];
  rigType?: string;
  stayDate?: string;
  accessCondition?: 'easy' | 'moderate' | 'rough_4wd';
}

export type SpotEditType =
  | 'rig_limits'
  | 'road_access'
  | 'gps_location'
  | 'amenities'
  | 'closure_season'
  | 'general';

export interface SpotEditRequest {
  id: string;
  spotId: string;
  spotTitle: string;
  submitterName: string;
  submitterEmail?: string;
  editType: SpotEditType;
  suggestedChanges: {
    maxLengthFt?: number;
    roadCondition?: string;
    coordinates?: [number, number];
    amenities?: Partial<HookupsAndAmenities>;
    seasonalNotes?: string;
    title?: string;
    description?: string;
  };
  notes: string;
  createdAt: string;
  status: 'pending' | 'applied' | 'rejected';
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRig: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  category:
    | 'road_trip'
    | 'rv_advice'
    | 'route_tips'
    | 'repairs'
    | 'local_gems'
    | 'meetups'
    | 'hosting_news';
  title: string;
  content: string;
  rigTag?: string;
  locationTag?: string;
  upvotes: number;
  upvotedBy: string[];
  comments: CommunityComment[];
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reportedTargetType: 'user' | 'spot' | 'review';
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  adminNotes?: string;
}

export interface SearchFilterState {
  locationQuery: string;
  stateCode?: string;
  landManager?: 'all' | 'USFS' | 'BLM';
  environments: string[];
  bathroomRequired?: boolean;
  waterRequired?: boolean;
  sewerRequired?: boolean;
  electricRequired?: 'any' | 'none' | '15amp' | '30amp' | '50amp';
  firePitRequired?: boolean;
  trashRequired?: boolean;
  arrivalDate?: string;
  departureDate?: string;
  rvType?: RVType | 'any';
  minLengthFt?: number;
  maxLengthFt?: number;
  isFreeOnly?: boolean;
  wifiRequired?: boolean;
  petsAllowed?: boolean;
  campfireAllowed?: boolean;
  generatorAllowed?: boolean;
  familyFriendlyOnly?: boolean;
  quietOnly?: boolean;
  offGridOnly?: boolean;
  pullThroughOnly?: boolean;
  levelGroundOnly?: boolean;
  featuredOnly?: boolean;
  searchCenter?: [number, number];
  searchRadiusMiles?: number;
  tripRoute?: {
    origin: {
      title: string;
      coordinates: [number, number];
    };
    destination: {
      title: string;
      coordinates: [number, number];
    };
    corridorMiles: number; // e.g. 15, 25, 50 miles
    routeCoordinates?: [number, number][];
    summary?: string;
    distanceMiles?: number;
    durationMinutes?: number;
    formattedDuration?: string;
  } | null;
}
