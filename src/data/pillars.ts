import { bindCMSData, resolvePillars } from '../cms/data';
import { PillarState } from '../types';

export const DEFAULT_PILLARS: PillarState[] = [
  {
    id: 'heal',
    label: 'HEAL',
    accentA: '#1f8a5c',
    accentB: '#6fd19a',
    headline: 'Bringing Wellness to Every Door',
    body: 'Delivering accessible healthcare through hospitals, blood banks, and dispensaries. Strengthening community well being with compassionate initiatives.',
    cardImageAlt: 'Health camp volunteers',
    shortTagline: 'Come for an evening of purpose — see how HEAL comes to life.',
    emblemCaption: 'Care, in every leaf.',
    /* Figures from the SNCF Heal activity sheet, September 2026. */
    stats: [
      { label: 'Blood Donation Camps', value: '9,174+' },
      { label: 'Blood Units Collected', value: '1.5M+' },
      { label: 'Patients Treated', value: '483,439+' },
      { label: 'Cataract Surgeries', value: '15,493+' }
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
    accentA: '#2dacc3',
    accentB: '#8dd4df',
    headline: 'Learning that Unlocks Every Future',
    body: 'Expanding access to education across schools, colleges, and training centers. Nurturing creativity and self reliance through libraries and arts initiatives.',
    cardImageAlt: 'Skill training classroom',
    shortTagline: 'Come for an evening of purpose — see how ENRICH comes to life.',
    emblemCaption: 'Possibility on every page.',
    /* Figures from the SNCF activity report, September 2026. Youth skilled
       sums the NIMA, sewing and beautician programmes (4,114 + 16,500 + 631
       = 21,245); schools & colleges is 14 schools and 1 college. */
    stats: [
      { label: 'Students Benefitted', value: '217,723+' },
      { label: 'Youth Skilled', value: '21,200+' },
      { label: 'Scholarship Students', value: '1,829' },
      { label: 'Schools & Colleges', value: '15' }
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
    headline: 'Empowering Lives, Strengthening Society',
    body: 'Driving sustainable social and economic development. Creating skills and career opportunities while working for a clean and green environment.',
    cardImageAlt: 'Youth volunteers planting trees',
    shortTagline: 'Come for an evening of purpose — see how EMPOWER comes to life.',
    emblemCaption: 'Together, we rise.',
    /* Figures from the SNCF activity report, September 2026: 2,642,277 trees
       planted in 4,218 drives (3,518 plantation drives and 700 Oneness Vann
       sites, as the dashboard counts them), 35,223,330 cleanliness manhours. */
    stats: [
      { label: 'Trees Planted', value: '2.6M+' },
      { label: 'Cleanliness Manhours', value: '35.2M+' },
      { label: 'Couples Married', value: '5,652' },
      { label: 'Drives Held', value: '4,200+' }
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
    headline: 'Transforming Vision into Lasting Impact',
    body: 'Flagship projects for health, harmony and sustainability, from Sant Nirankari Health City to Oneness Vann, the Watershed Program, Project Amrit and village development.',
    cardImageAlt: 'Sant Nirankari Health City campus',
    shortTagline: 'Come for an evening of purpose — see how PROJECTS comes to life.',
    emblemCaption: 'One purpose. Lasting impact.',
    /* Figures from the SNCF activity report, September 2026. */
    stats: [
      { label: 'Water Bodies Revived', value: '5,962' },
      { label: 'Oneness Vann Plants', value: '600,330' },
      { label: 'Cities Reached', value: '3,460' },
      { label: 'Adopted Villages', value: '4' }
    ],
    keyHighlights: [
      'Sant Nirankari Health City: A 1,000+ bed multispecialty super-hospital in North Delhi.',
      'Project Amrit: "Clean Water, Pure Mind" cleaning 5,962 water bodies across 28 states and UTs.',
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
export const DEFAULT_EXTENDED_PILLARS: PillarState[] = [
  ...DEFAULT_PILLARS,
  {
    id: 'amrit',
    label: 'AMRIT',
    accentA: '#00796b',
    accentB: '#4db6ac',
    headline: 'Project Amrit: Clean Water, Pure Mind',
    body: 'A massive nationwide initiative to clean, restore, and safeguard natural water bodies, rivers, lakes, and coastal shores across 28 states and UTs.',
    cardImageAlt: 'Volunteers cleaning lake shore',
    shortTagline: 'Come for an evening of purpose — see how AMRIT comes to life.',
    stats: [
      { label: 'Water Bodies Cleaned', value: '5,962' },
      { label: 'Participating States', value: '28' },
      { label: 'Tons Waste Removed', value: '15,000+' },
      { label: 'Water Volunteers', value: '3.9M+' }
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

export let PILLARS: PillarState[] = bindCMSData(DEFAULT_PILLARS, resolvePillars, value => { PILLARS = value; });
export let EXTENDED_PILLARS: PillarState[] = bindCMSData(DEFAULT_EXTENDED_PILLARS, resolvePillars, value => { EXTENDED_PILLARS = value; });
