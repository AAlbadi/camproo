import { Review } from '../types';

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-desert-1',
    spotId: 'spot-moab-redrock',
    travelerId: 'user-traveler-1',
    hostId: 'user-host-1',
    stayRequestId: 'req-past-desert',
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
    comment: 'Staying at Caleb and Sarah’s red rock oasis in Moab was the highlight of our Utah parks trip! The gravel pad is dead level, 30A power ran our AC and induction cooktop flawlessly, and Caleb recommended an incredible hidden canyon sunset hike right off their back fence. This is what CampRoo is all about: true RV community hospitality.',
    createdAt: '2026-05-18'
  },
  {
    id: 'rev-desert-2',
    spotId: 'spot-moab-redrock',
    travelerId: 'user-host-3',
    hostId: 'user-host-1',
    stayRequestId: 'req-past-desert-2',
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
    comment: 'Spectacular red sandstone cliffs right outside the camper window. Plenty of turnaround space for our van and easy gate access off Spanish Valley Dr. The well water is icy cold and delicious. We would love to host Caleb & Sarah in Bend whenever they roam the PNW!',
    createdAt: '2026-04-02'
  },
  {
    id: 'rev-sedona-1',
    spotId: 'spot-sedona-ridge',
    travelerId: 'user-host-4',
    hostId: 'user-host-2',
    stayRequestId: 'req-past-sedona-1',
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
    comment: 'Marcus has built an RV paradise. Unbelievable red rock views at golden hour. The 50A hookup is pristine, and having an on-site dump station saved us an hour detour. Marcus gave great advice on high-clearance backroads.',
    createdAt: '2026-06-11'
  },
  {
    id: 'rev-bend-1',
    spotId: 'spot-bend-pines',
    travelerId: 'user-traveler-1',
    hostId: 'user-host-3',
    stayRequestId: 'req-bend-completed',
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
    comment: 'Clara and Ben were the most gracious hosts! Fresh marionberries were waiting on our arrival, and falling asleep to the sound of Tumalo Creek was pure therapy. Very easy pull-through for our 28ft Class C.',
    createdAt: '2026-07-13',
    hostReply: 'Alex & Sam are model CampRoo members! Their rig was spotless, Jasper the pup was a delight, and we loved sharing stories around the fire bowl. Welcome back anytime!'
  }
];
