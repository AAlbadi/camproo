import { MessageThread } from '../types';

export const INITIAL_THREADS: MessageThread[] = [
  {
    id: 'thread-moab-stay',
    participants: ['user-traveler-1', 'user-host-1'],
    spotId: 'spot-moab-redrock',
    stayRequestId: 'req-moab-1',
    lastMessage: 'Hey Alex! We saw your stay request for Sept 12. Does your 28ft Class C have a standard 30A TT-30 cord?',
    lastMessageAt: '2026-09-02T15:10:00Z',
    unreadBy: ['user-traveler-1'],
    messages: [
      {
        id: 'msg-1',
        threadId: 'thread-moab-stay',
        senderId: 'user-traveler-1',
        text: 'Hi Caleb & Sarah! We submitted a stay request for Sept 12-14. Really excited about visiting Moab and Arches.',
        timestamp: '2026-09-02T14:32:00Z'
      },
      {
        id: 'msg-2',
        threadId: 'thread-moab-stay',
        senderId: 'user-host-1',
        text: 'Hey Alex! We saw your stay request for Sept 12. Does your 28ft Class C have a standard 30A TT-30 cord or do you need an adapter? Either way, the gravel pad is ready!',
        timestamp: '2026-09-02T15:10:00Z'
      }
    ]
  },
  {
    id: 'thread-sedona-stay',
    participants: ['user-traveler-1', 'user-host-2'],
    spotId: 'spot-sedona-ridge',
    stayRequestId: 'req-sedona-confirmed',
    lastMessage: 'Gate code is set to SEDONA-50A. Safe travels down Highway 89A!',
    lastMessageAt: '2026-08-28T10:45:00Z',
    unreadBy: [],
    messages: [
      {
        id: 'msg-sed-1',
        threadId: 'thread-sedona-stay',
        senderId: 'user-traveler-1',
        text: 'Marcus, thank you so much for accepting our stay request! We will be arriving around 3 PM on Sept 22.',
        timestamp: '2026-08-28T09:30:00Z'
      },
      {
        id: 'msg-sed-2',
        threadId: 'thread-sedona-stay',
        senderId: 'user-host-2',
        text: 'Wonderful! The crushed granite pad has plenty of room for your 28ft Coachmen. Gate code is set to SEDONA-50A. Safe travels down Highway 89A!',
        timestamp: '2026-08-28T10:45:00Z'
      }
    ]
  }
];
