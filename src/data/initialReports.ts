import { ReportItem } from '../types';

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep-1',
    reporterId: 'user-traveler-1',
    reportedTargetType: 'spot',
    targetId: 'spot-sedona-ridge',
    targetName: 'Red Rock Juniper Ridge',
    reason: 'Incorrect road signage query',
    details: 'The listing mentions GPS sometimes routes down Forest Road 152. Just suggesting adding an extra signpost note so rigs don’t miss the cattle guard turn.',
    status: 'resolved',
    createdAt: '2026-08-20T10:00:00Z',
    adminNotes: 'Contacted Marcus. He updated the host arrival instructions with mile marker details.'
  },
  {
    id: 'rep-2',
    reporterId: 'user-host-1',
    reportedTargetType: 'user',
    targetId: 'user-spammer-99',
    targetName: 'Commercial Tour Operator (Fake Profile)',
    reason: 'Commercial solicitation',
    details: 'Sent an unsolicited promo message offering paid desert dune buggy tours instead of normal RV stay communication.',
    status: 'pending',
    createdAt: '2026-09-03T18:40:00Z',
    adminNotes: 'Investigating account history and outbound messaging logs.'
  }
];
