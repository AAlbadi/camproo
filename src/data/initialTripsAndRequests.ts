import { StayRequest } from '../types';

export const INITIAL_REQUESTS: StayRequest[] = [
  {
    id: 'req-moab-1',
    spotId: 'spot-moab-redrock',
    travelerId: 'user-traveler-1',
    hostId: 'user-host-1',
    arrivalDate: '2026-09-12',
    departureDate: '2026-09-14',
    nights: 2,
    guestCount: 2,
    travelerRig: {
      type: 'class_c',
      lengthFt: 28,
      description: 'Coachmen Leprechaun 28ft, completely self-contained with solar and 30A plug adapter'
    },
    personalNote: 'Hi Caleb & Sarah! We are roaming south along Highway 191 toward Arches and Canyonlands. We love quiet red rock stargazing and would be thrilled to stay 2 nights on your gravel pad. Our dog Jasper is very calm and will stay on leash.',
    status: 'pending',
    createdAt: '2026-09-02T14:30:00Z',
    arrivalTimeEst: '4:30 PM'
  },
  {
    id: 'req-sedona-confirmed',
    spotId: 'spot-sedona-ridge',
    travelerId: 'user-traveler-1',
    hostId: 'user-host-2',
    arrivalDate: '2026-09-22',
    departureDate: '2026-09-25',
    nights: 3,
    guestCount: 2,
    travelerRig: {
      type: 'class_c',
      lengthFt: 28,
      description: 'Coachmen Leprechaun 28ft'
    },
    personalNote: 'Hi Marcus! Excited to visit Sedona again. We are avid trail runners and photographers. Look forward to meeting you!',
    status: 'accepted',
    createdAt: '2026-08-28T09:15:00Z',
    hostResponseNote: 'Looking forward to hosting you both! The 50A pedestal is set, gate code is SEDONA-50A. Let me know when you cross into Verde Valley.',
    arrivalTimeEst: '3:00 PM'
  },
  {
    id: 'req-bend-completed',
    spotId: 'spot-bend-pines',
    travelerId: 'user-traveler-1',
    hostId: 'user-host-3',
    arrivalDate: '2026-07-10',
    departureDate: '2026-07-12',
    nights: 2,
    guestCount: 2,
    travelerRig: {
      type: 'class_c',
      lengthFt: 28,
      description: 'Coachmen Leprechaun 28ft'
    },
    personalNote: 'Hi Clara & Ben! Passing through Bend for Phil’s Trail singletrack. Would love to share a quiet spot by Tumalo Creek.',
    status: 'completed',
    createdAt: '2026-07-01T11:00:00Z',
    hostResponseNote: 'Welcome to the farm! Fresh marionberries are on the porch for you.',
    arrivalTimeEst: '2:30 PM'
  }
];
