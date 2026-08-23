import { PillarState } from '../types';

export const PILLARS: PillarState[] = [
  {
    id: 'heal',
    label: 'HEAL',
    accentA: '#1f8a5c',
    accentB: '#6fd19a',
    headline: 'Healthcare for every doorstep',
    body: 'Blood donation drives, eye-care camps, and free health checkups — over 8,000 camps and 1.3 million+ units of blood donated so far.',
    cardImageAlt: 'Health camp volunteers',
    shortTagline: 'Come for an evening of purpose — see how HEAL comes to life.',
    stats: [
      { label: 'Blood Donation Camps', value: '8,000+' },
      { label: 'Blood Units Collected', value: '1.3M+' },
      { label: 'Free Health Checkups', value: '500,000+' },
      { label: 'Eye Care Surgeries', value: '75,000+' }
    ],
    keyHighlights: [
      'Nationwide voluntary blood donation camps on Manav Ekta Diwas and year-round.',
      'Mobile dispensaries and diagnostic clinics reaching remote rural communities.',
      'Free cataract operations, spectacles distribution, and ophthalmic checkup vans.',
      'Emergency medical relief teams deployed during natural catastrophes.'
    ],
    subText: 'Healthcare access driven by compassion, selfless service, and state-of-the-art charitable infrastructure.'
  },
  {
    id: 'enrich',
    label: 'ENRICH',
    accentA: '#1565c0',
    accentB: '#64b5f6',
    headline: 'Education that opens doors',
    body: 'Skill-development programs and educational support that build self-reliance in underserved communities.',
    cardImageAlt: 'Skill training classroom',
    shortTagline: 'Come for an evening of purpose — see how ENRICH comes to life.',
    stats: [
      { label: 'Vocational Centers', value: '85+' },
      { label: 'Youths Certified', value: '120,000+' },
      { label: 'Scholarships Awarded', value: '45,000+' },
      { label: 'Adopted Schools', value: '150+' }
    ],
    keyHighlights: [
      'Sant Nirankari Vocational Training Centers offering tailoring, computer science, and technical skills.',
      'Merit-cum-means financial aid and higher education scholarships for promising students.',
      'Digital literacy classrooms and STEM labs installed in rural schools.',
      'Women empowerment self-help groups and artisanal livelihood workshops.'
    ],
    subText: 'Fostering intellectual empowerment, self-reliance, and lifelong dignity through accessible education.'
  },
  {
    id: 'empower',
    label: 'EMPOWER',
    accentA: '#c2185b',
    accentB: '#f48fb1',
    headline: 'Empowering youth, protecting the planet',
    body: 'Youth-led disaster relief, environmental conservation, and community support initiatives nationwide.',
    cardImageAlt: 'Youth volunteers planting trees',
    shortTagline: 'Come for an evening of purpose — see how EMPOWER comes to life.',
    stats: [
      { label: 'Saplings Planted', value: '2.5M+' },
      { label: 'Disaster Missions', value: '400+' },
      { label: 'Youth Volunteers', value: '250,000+' },
      { label: 'Cleanliness Drives', value: '1,200+' }
    ],
    keyHighlights: [
      'Mega cleanliness drives across railway stations, public heritage sites, and riverbanks.',
      'Extensive tree plantation drives creating micro-forests under Oneness Vann.',
      'Swift disaster response and rehabilitation for floods, earthquakes, and emergencies.',
      'Leadership training camps uniting youth across regional and cultural boundaries.'
    ],
    subText: 'Channeling youthful energy toward global ecological balance and humanitarian solidarity.'
  },
  {
    id: 'projects',
    label: 'PROJECTS',
    /* Cyan, taken from the logo's own petals (#6ac8ed). The previous gold was
       not in the logo at all, and on the wheel Projects sits between Empower
       (pink) and the devotional rose — purple, the other unused logo colour,
       lands only 59deg and 45deg from those two and would have read as a third
       pink-ish card, where cyan sits 142deg and 128deg away. It also fixes a
       real legibility problem: white text on the old gold scored 3.25 contrast,
       under the 4.5 AA floor; on this it scores 6.07. */
    accentA: '#0d6a8c',
    accentB: '#6ac8ed',
    headline: 'Our flagship projects',
    body: 'Sant Nirankari Health City · Oneness Vann · Watershed Program · Project Amrit — large-scale initiatives turning these three pillars into permanent infrastructure.',
    cardImageAlt: 'Sant Nirankari Health City campus',
    shortTagline: 'Come for an evening of purpose — see how PROJECTS comes to life.',
    stats: [
      { label: 'Hospital Beds Planned', value: '1,000+' },
      { label: 'Water Bodies Cleaned', value: '1,100+' },
      { label: 'Urban Forests (Vann)', value: '350+' },
      { label: 'Beneficiary Reach', value: '10M+' }
    ],
    keyHighlights: [
      'Sant Nirankari Health City: A 1,000+ bed multispecialty super-hospital in North Delhi.',
      'Project Amrit: "Clean Water, Pure Mind" cleaning 1,100+ water bodies across 27 states.',
      'Oneness Vann: Developing indigenous dense urban forests to combat air pollution.',
      'Watershed & Soil Conservation: Rejuvenating arid zones for sustainable local agriculture.'
    ],
    subText: 'Permanent institutional infrastructure delivering long-term societal resilience.'
  }
];

/**
 * PILLARS plus the two programme cards (Amrit, Oneness).
 *
 * Not rendered anywhere today — the wheel runs on PILLARS — but kept because
 * CardIllustration still carries marks for both. Renamed off the old "HERO2"
 * prefix, which described a hero variant that no longer exists.
 */
export const EXTENDED_PILLARS: PillarState[] = [
  ...PILLARS,
  {
    id: 'amrit',
    label: 'AMRIT',
    accentA: '#00796b',
    accentB: '#4db6ac',
    headline: 'Project Amrit: Clean Water, Pure Mind',
    body: 'A massive nationwide initiative to clean, restore, and safeguard natural water bodies, rivers, lakes, and coastal shores across 27 states.',
    cardImageAlt: 'Volunteers cleaning lake shore',
    shortTagline: 'Come for an evening of purpose — see how AMRIT comes to life.',
    stats: [
      { label: 'Water Bodies Cleaned', value: '1,100+' },
      { label: 'Participating States', value: '27' },
      { label: 'Tons Waste Removed', value: '15,000+' },
      { label: 'Water Volunteers', value: '300,000+' }
    ],
    keyHighlights: [
      'Pan-India water conservation and rejuvenating riverfronts, ponds, and reservoirs.',
      'Community education on eliminating single-use plastic and ecological preservation.',
      'Water filtration installations in water-stressed rural belts.'
    ],
    subText: 'Preserving our natural lifelines through collective devotion and environmental stewardship.'
  },
  {
    id: 'oneness',
    label: 'ONENESS',
    accentA: '#6a1b9a',
    accentB: '#ba68c8',
    headline: 'Universal brotherhood & harmony',
    body: 'Transcending all barriers of caste, creed, colour, and nationality — fostering global human unity through selfless service and spiritual wisdom.',
    cardImageAlt: 'Diverse youth joining hands',
    shortTagline: 'Come for an evening of purpose — see how ONENESS comes to life.',
    stats: [
      { label: 'Global Samagams', value: '77+' },
      { label: 'Countries Reached', value: '60+' },
      { label: 'Youth Conferences', value: '850+' },
      { label: 'Harmony Dialogues', value: '3,000+' }
    ],
    keyHighlights: [
      'Annual International Nirankari Sant Samagam welcoming millions from across the globe.',
      'Interfaith symposiums advocating for peaceful coexistence and global brotherhood.',
      'Cultural harmony galas and multi-faith unity forums.'
    ],
    subText: 'Realizing human brotherhood by knowing the Fatherhood of God.'
  }
];
