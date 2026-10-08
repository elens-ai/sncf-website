import type { PastSNCFEvent } from './events';

/**
 * Dated reports, not past instances inferred from an annual observance.
 * Each photograph comes from the linked event's own official gallery.
 * Original media URLs and report provenance: docs/past-events-sources.md.
 * These records live in the existing Events CMS collection with kind "past".
 */
export const DEFAULT_PAST_EVENTS: PastSNCFEvent[] = [
  {
    id: 'health-city-opening-2026',
    kind: 'past',
    occurredOn: '2026-08-15',
    title: 'Health City opens its doors',
    tag: 'Inaugural ceremony',
    pillarId: 'projects',
    location: 'Nirankari Sarovar, Delhi',
    blurb: 'The inaugural ceremony brought Sant Nirankari Health City a step closer to its purpose: affordable, compassionate healthcare. Her Holiness Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji blessed the occasion, ahead of the start of outpatient services.',
    facts: [{ value: '17 Aug 2026', label: 'OPD services began' }],
    photos: [{ src: '/images/events/health-city-opening-2026.jpg', alt: 'Her Holiness Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji at the Health City inaugural ceremony on 15 August 2026' }],
    source: 'https://nirankarihealthcity.org/news/sant-nirankari-health-city-opens-its-doors-to-humanity/',
    href: '/projects#health-city',
  },
  {
    id: 'yoga-day-mumbai-2026',
    kind: 'past',
    occurredOn: '2026-06-21',
    title: 'A shared moment of wellbeing',
    tag: 'International Day of Yoga',
    pillarId: 'heal',
    location: 'Mumbai zone, Maharashtra',
    blurb: 'Communities across the Mumbai zone came together for International Day of Yoga. The Mission’s photographic record captures group sessions in Chembur, Borivali, Kopri and other branches, with movement, breathing and time for collective wellbeing.',
    photos: [
      { src: '/images/events/yoga-kopri-2026.jpg', alt: 'The official photo collection of International Day of Yoga sessions at Kopri on 21 June 2026' },
      { src: '/images/events/yoga-chembur-2026.jpg', alt: 'Participants practising yoga at Chembur on International Day of Yoga 2026' },
      { src: '/images/events/yoga-borivali-2026.jpg', alt: 'The Mission’s photo collection of International Day of Yoga at Borivali in 2026' },
    ],
    source: 'https://www.nirankari.org/mumbai/events/2026/yogaday/index.shtml',
  },
  {
    id: 'project-amrit-mumbai-2026',
    kind: 'past',
    occurredOn: '2026-02-22',
    title: 'Many hands for cleaner waters',
    tag: 'Project Amrit',
    pillarId: 'projects',
    location: 'Mumbai zone, Maharashtra',
    blurb: 'Volunteers joined Project Amrit clean-up activities along beaches, lakes and ponds across the Mumbai zone. The official gallery records work at Reti Bunder, Eksar Talao, Powai Lake and other local water bodies.',
    photos: [
      { src: '/images/events/amrit-dadar-2026.jpg', alt: 'Project Amrit volunteers clearing litter at Reti Bunder beach on 22 February 2026' },
      { src: '/images/events/amrit-dadar-action-2026.jpg', alt: 'The official gallery of Project Amrit clean-up activities at Reti Bunder beach in February 2026' },
      { src: '/images/events/amrit-borivali-2026.jpg', alt: 'Project Amrit volunteers working at Eksar Talao, Borivali, on 22 February 2026' },
    ],
    source: 'https://www.nirankari.org/mumbai/events/2026/cleanliness/index.shtml',
    href: '/projects#project-amrit',
  },
  {
    id: 'humanness-blood-drive-toronto-2025',
    kind: 'past',
    occurredOn: '2025-04-26',
    title: 'Compassion, one donation at a time',
    tag: 'Humanness Blood Drive',
    pillarId: 'heal',
    location: 'Centre for Oneness, Toronto',
    blurb: 'Donors and volunteers gathered at the Centre for Oneness in Toronto for the Humanness Blood Drive. Held with Canadian Blood Services, the camp honoured the spirit of Manav Ekta Diwas through a shared act of care.',
    facts: [{ value: '114', label: 'Donors participated' }, { value: 'Canadian Blood Services', label: 'Blood donation partner' }],
    photos: [
      { src: '/images/events/blood-drive-toronto-2025.jpg', alt: 'A donor with volunteers at the Humanness Blood Drive in Toronto on 26 April 2025' },
      { src: '/images/events/blood-drive-toronto-donor-2025.jpg', alt: 'A participant donating blood at the Toronto Humanness Blood Drive in April 2025' },
      { src: '/images/events/blood-drive-toronto-team-2025.jpg', alt: 'People taking part in the Toronto Humanness Blood Drive in April 2025' },
    ],
    source: 'https://www.nirankari.org/toronto/events/reports/2025/blood_donation_apr2025.shtml',
  },
];
