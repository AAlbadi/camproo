import { CommunityPost } from '../types';

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    authorId: 'user-traveler-1',
    category: 'route_tips',
    title: 'Heading from Zion through Scenic Byway 12 to Moab this weekend — anyone else on the road?',
    content: 'We are leaving Zion on Friday afternoon in our 28ft Class C, heading across Highway 12 toward Escalante and into Moab. Has anyone navigated the Hogsback ridge with a 28ft+ rig recently? Any specific tips on grade management and BLM boondocking spots near Boulder, UT?',
    rigTag: '28ft Class C',
    locationTag: 'Utah Scenic Byway 12',
    upvotes: 29,
    upvotedBy: ['user-host-1', 'user-host-2'],
    createdAt: '2026-09-01T16:20:00Z',
    comments: [
      {
        id: 'c-1',
        authorId: 'user-host-1',
        authorName: 'Caleb Jenkins',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        authorRig: '35ft Fifth Wheel',
        content: 'Hey Alex! Took our 35ft fifth wheel across the Hogsback last fall. Just take it slow in low gear and soak in the drop-offs on both sides — it is magnificent. You are welcome to pull into our Red Rock Roo pad in Moab for a cold water fill-up and 30A plug once you roll in!',
        createdAt: '2026-09-01T17:05:00Z'
      },
      {
        id: 'c-2',
        authorId: 'user-host-4',
        authorName: 'Dave Miller',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
        authorRig: '26ft Airstream',
        content: 'One of the top 5 drives in the USA! Fill up diesel in Escalante before heading over Boulder Mountain. Safe roaming!',
        createdAt: '2026-09-01T19:30:00Z'
      }
    ]
  },
  {
    id: 'post-2',
    authorId: 'user-host-2',
    category: 'rv_advice',
    title: '50-Amp vs 30-Amp hookup etiquette: What every host and guest should know',
    content: 'As a long-time Class A host, I often get requests from rigs asking if they can run both AC units on a 30-amp service with a dogbone adapter. A quick tip for travelers: on 30A (3,600W max), stagger your loads! Run one AC unit at a time, especially if your electric water heater or microwave kicks on. Hosts love guests who understand how to protect their breakers.',
    rigTag: '40ft Class A',
    locationTag: 'Host Wisdom',
    upvotes: 45,
    upvotedBy: ['user-traveler-1', 'user-host-3', 'user-admin'],
    createdAt: '2026-08-25T11:15:00Z',
    comments: [
      {
        id: 'c-3',
        authorId: 'user-host-3',
        authorName: 'Clara Bennett',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        authorRig: 'Sprinter 144',
        content: 'Great reminder Marcus! We also recommend guests use a surge protector with EMS before plugging into host pedestals. Protects both the rig and the host home electrical panel.',
        createdAt: '2026-08-25T13:40:00Z'
      }
    ]
  },
  {
    id: 'post-3',
    authorId: 'user-host-3',
    category: 'hosting_news',
    title: 'Just added a level gravel extension for rigs up to 32ft at Whispering Pines!',
    content: 'We spent the weekend spreading 4 loads of crushed granite by Tumalo Creek. The driveway now has an easy circular radius with no tight backing required. Berry picking season is in full swing — excited to welcome more CampRoo rovers this autumn.',
    rigTag: 'Bend Farm Host',
    locationTag: 'Bend, Oregon',
    upvotes: 38,
    upvotedBy: ['user-traveler-1'],
    createdAt: '2026-08-20T09:00:00Z',
    comments: []
  },
  {
    id: 'post-4',
    authorId: 'user-host-4',
    category: 'repairs',
    title: 'Quick roadside fix: Dealing with a sticky 12V black tank dump valve',
    content: 'If your cable-actuated black tank valve starts binding when you pull into a dump station, do not force the T-handle! Spray silicone lubricant along the cable sheath under the underbelly coroplast, let it sit 5 minutes, and gently cycle it. Saved me a huge headache on the Maine turnpike yesterday.',
    rigTag: '25ft Airstream',
    locationTag: 'DIY Tech Tips',
    upvotes: 52,
    upvotedBy: ['user-host-2', 'user-host-1'],
    createdAt: '2026-08-15T14:45:00Z',
    comments: []
  }
];
