import { Review } from '../types';

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-desert-1',
    spotId: 'spot-moab-redrock',
    travelerId: 'user-traveler-1',
    authorId: 'user-traveler-1',
    authorRole: 'traveler',
    ratingOverall: 5,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 5
    },
    wouldWelcomeAgain: true,
    comment: 'Classic Moab BLM dispersed boondocking. Washboard dirt road on the way in, but our 28ft Class C handled it at 10-15 mph with zero issues. Direct satellite line-of-sight for our Starlink dish, 100% solar exposure all day, and mind-blowing dark night skies. Remember to pack out all trash and bring plenty of fresh water.',
    createdAt: '2026-05-18'
  },
  {
    id: 'rev-desert-2',
    spotId: 'spot-moab-redrock',
    travelerId: 'user-host-3',
    authorId: 'user-host-3',
    authorRole: 'traveler',
    ratingOverall: 4.8,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 4.5
    },
    wouldWelcomeAgain: true,
    comment: 'Unbelievable sandstone views right out the rear van doors. Hard-packed slickrock and red dirt turnouts. Plenty of space to turn around. As always on BLM land, zero hookups so arrive with full fresh tank and empty gray/black tanks. 14-day BLM limit is strictly enforced by rangers.',
    createdAt: '2026-04-02'
  },
  {
    id: 'rev-sedona-1',
    spotId: 'spot-sedona-ridge',
    travelerId: 'user-host-4',
    authorId: 'user-host-4',
    authorRole: 'traveler',
    ratingOverall: 5,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 5
    },
    wouldWelcomeAgain: true,
    comment: 'Incredible Coconino USFS dispersed spot. The forest road has some ruts after rains, so take it slow if you have a low overhang, but moderate clearance rigs will have zero trouble. Sunset over the red rock cliffs is unreal. Pristine off-grid solitude.',
    createdAt: '2026-06-11'
  },
  {
    id: 'rev-bend-1',
    spotId: 'spot-bend-pines',
    travelerId: 'user-traveler-1',
    authorId: 'user-traveler-1',
    authorRole: 'traveler',
    ratingOverall: 5,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 5
    },
    wouldWelcomeAgain: true,
    comment: 'Peaceful Deschutes National Forest dispersed pull-off among tall ponderosa pines. Level pine needle surface, easy turnaround, and close enough to Tumalo Creek for soothing background sound. Completely primitive boondocking—pack it in, pack it out!',
    createdAt: '2026-07-13'
  },
  {
    id: 'rev-hill-country-1',
    spotId: 'spot-hill-country',
    travelerId: 'user-traveler-1',
    authorId: 'user-traveler-1',
    authorRole: 'traveler',
    ratingOverall: 5,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 5
    },
    wouldWelcomeAgain: true,
    comment: 'Great primitive Hill Country public dispersed site under ancient live oaks. Hard-packed limestone gravel pull-off with plenty of room to maneuver. Dead quiet at night with great stargazing. Bring your own water and solar panels.',
    createdAt: '2026-06-28'
  },
  {
    id: 'rev-hill-country-2',
    spotId: 'spot-hill-country',
    travelerId: 'user-host-1',
    authorId: 'user-host-1',
    authorRole: 'traveler',
    ratingOverall: 4.9,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 4.8
    },
    wouldWelcomeAgain: true,
    comment: 'Excellent free boondocking spot off the highway corridor. Wide gravel clearing with level parking. Reliable Verizon LTE signal and wide open sky for satellite. Clean site—let us all keep it that way!',
    createdAt: '2026-05-14'
  },
  {
    id: 'rev-maine-1',
    spotId: 'spot-maine-bluff',
    travelerId: 'user-host-1',
    authorId: 'user-host-4',
    authorRole: 'traveler',
    ratingOverall: 5,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 5
    },
    wouldWelcomeAgain: true,
    comment: 'Waking up to Atlantic ocean breezes and harbor fog rolling in was magical. Firm gravel and grass clearing just off the coastal public access route. Pure dry camping: self-contained rigs only.',
    createdAt: '2026-07-04'
  },
  {
    id: 'rev-tahoe-1',
    spotId: 'spot-tahoe-glade',
    travelerId: 'user-traveler-1',
    authorId: 'user-traveler-1',
    authorRole: 'traveler',
    ratingOverall: 4.9,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 4.8
    },
    wouldWelcomeAgain: true,
    comment: 'Tahoe National Forest USFS dispersed road. Pine-scented mountain air and quick access to backcountry trails. Off-grid dry camping at its finest. Make sure you have your California campfire permit if fires are currently allowed.',
    createdAt: '2026-06-20'
  },
  {
    id: 'rev-joshua-1',
    spotId: 'spot-joshua-tree',
    travelerId: 'user-host-3',
    authorId: 'user-host-3',
    authorRole: 'traveler',
    ratingOverall: 5,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 5
    },
    wouldWelcomeAgain: true,
    comment: 'Joshua Tree South BLM dispersed area. Wide open dry lakebed and wash area with virtually unlimited space. Zero light pollution—astrophotography heaven. Arrive fully self-contained with abundant water.',
    createdAt: '2026-04-29'
  },
  {
    id: 'rev-smoky-1',
    spotId: 'spot-smoky-mountains',
    travelerId: 'user-traveler-1',
    authorId: 'user-traveler-1',
    authorRole: 'traveler',
    ratingOverall: 5,
    categories: {
      communication: 5,
      accuracy: 5,
      hospitality: 5,
      safety: 5,
      cleanliness: 5
    },
    wouldWelcomeAgain: true,
    comment: 'Tranquil Pisgah National Forest dispersed cove. Surrounded by lush rhododendron and mountain ridges. Shaded forest pull-out, cool mountain breezes, and total serenity.',
    createdAt: '2026-05-22'
  }
];
