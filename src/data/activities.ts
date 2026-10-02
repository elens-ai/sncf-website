import { bindCMSData, resolveActivities } from '../cms/data';
import type { ActivityIcon } from './activityIcons';

/**
 * EVERY ACTIVITY THE FOUNDATION REPORTS, and every figure it reports for it.
 *
 * Transcribed from SNCF_Activity_Report_March2026 — the executive dashboard
 * and the four per-pillar detail sheets, which the report itself calls the
 * source of truth. Where a sheet gives several periods, the figures here are
 * the LATEST row, and `period` names it; that is why the periods differ
 * between activities (the sheets were last updated at different times) and
 * why each one is stated on the piece rather than assumed.
 *
 * `dataPoints` is the whole column set for that activity, not a selection —
 * this is what the frame opens onto, so nothing the report gives should be
 * missing from it. `headline` is the one figure the frame itself carries.
 *
 * Numbers are strings, deliberately: they are transcribed exactly as
 * reported, including the Indian digit grouping the rupee figures use. They
 * are never arithmetic here, so nothing is gained by storing them as numbers
 * and a thousands separator would be lost.
 */
export interface DataPoint {
  label: string;
  value: string;
}

export interface Activity {
  id: string;
  /** PillarState.id this belongs to. */
  pillarId: 'heal' | 'enrich' | 'empower' | 'projects';
  title: string;
  /** The reporting period these figures are as of. */
  period: string;
  /** What the work is, in one line. */
  blurb: string;
  /** The figure the frame carries on the wall. */
  headline: DataPoint;
  /** Every figure the report gives for this activity. */
  dataPoints: DataPoint[];
  /** First entry is the piece on the wall; the rest hang in the detail
      view. Empty until photographs are supplied — see pillarMedia.ts. */
  images: { src: string; alt: string }[];
  /** Symbol on the programme's tile in the home page constellation. */
  icon?: ActivityIcon;
  /** Shorter name for the Core Values menu; the title is used when absent. */
  menuLabel?: string;
  /** Photographs that blend in behind the chapter while the tile is hovered. */
  hoverPhotos?: { src: string; alt?: string }[];
  /** One spot of a hover photo shown clearly rather than faded, in percent of
      that photo's panel: `photo` is its 1-based position in `hoverPhotos`. */
  hoverFocus?: { photo: number; x: number; y: number; width: number; height: number };
  /** Faint photograph behind the "Programme in focus" card on Core Values. */
  cardPhoto?: { src: string; alt?: string };
}

export const DEFAULT_ACTIVITIES: Activity[] = [
  /* ---------------------------------------------------------------- HEAL */
  {
    id: 'blood-donation',
    pillarId: 'heal',
    title: 'Blood Donation Camp',
    period: 'As on September 2026',
    blurb:
      'Nationwide voluntary blood donation camps, held on Manav Ekta Diwas and year-round.',
    headline: { label: 'Units collected', value: '1,500,230' },
    dataPoints: [
      { label: 'Units collected', value: '1,500,230' },
      { label: 'Camps organised', value: '9,174' },
      { label: 'Potentially saved lives', value: '4,500,690' },
      { label: 'Units — April 2025', value: '1,405,177' },
      { label: 'Camps — April 2025', value: '8,644' },
    ],
    images: [],
  },
  {
    id: 'health-checkup',
    pillarId: 'heal',
    title: 'Health Checkup Camps',
    period: 'As on September 2026',
    blurb: 'General health checkup camps reaching communities without nearby care.',
    headline: { label: 'Patients treated', value: '483,439' },
    dataPoints: [
      { label: 'Patients treated', value: '483,439' },
      { label: 'Camps organised', value: '727' },
      { label: 'Patients — September 2025', value: '454,233' },
      { label: 'Camps — September 2025', value: '671' },
      { label: 'Patients — March 2025', value: '444,648' },
      { label: 'Camps — March 2025', value: '668' },
      { label: 'Added Mar–Sep 2025', value: '9,585' },
    ],
    images: [],
  },
  {
    id: 'eye-checkup',
    pillarId: 'heal',
    title: 'Eye Checkup Camp',
    period: 'As on September 2026',
    blurb:
      'Ophthalmic camps, free cataract operations and spectacles distribution.',
    headline: { label: 'OPD', value: '165,122' },
    dataPoints: [
      { label: 'OPD', value: '165,122' },
      { label: 'Camps', value: '512' },
      { label: 'Cataract surgeries', value: '15,493' },
      { label: 'Free spectacles', value: '38,148' },
      { label: 'OPD — August 2026', value: '164,797' },
      { label: 'OPD — September 2025', value: '160,821' },
      { label: 'OPD — March 2025', value: '158,558' },
      { label: 'Added Mar–Sep 2025', value: '2,263' },
    ],
    images: [],
  },
  {
    id: 'health-centre',
    pillarId: 'heal',
    title: 'Sant Nirankari Health Centre',
    period: 'As on September 2026',
    blurb: 'Standing facilities — clinics, labs, pharmacy and ambulances.',
    headline: { label: 'Allopathic centres', value: '47' },
    dataPoints: [
      { label: 'Allopathic', value: '47' },
      { label: 'Homeopathic', value: '37' },
      { label: 'Physiotherapy', value: '4' },
      { label: 'Oneness labs', value: '4' },
      { label: 'Chiropractic', value: '1' },
      { label: 'Oneness pharmacy', value: '1' },
      { label: 'Ambulances', value: '16' },
      { label: 'X-ray centres', value: '2' },
      { label: 'Dental centres', value: '6' },
      { label: 'Eye centres', value: '5' },
    ],
    images: [],
  },
  {
    id: 'blood-bank',
    pillarId: 'heal',
    title: 'Blood Bank',
    period: 'As on September 2026',
    blurb: 'The foundation’s own blood banking, separate from the donation camps.',
    headline: { label: 'Units', value: '54,261' },
    /* Totals, then the sheet's year-by-year rows (2016–2026), which sum to them. */
    dataPoints: [
      { label: 'Units', value: '54,261' },
      { label: 'Camps', value: '444' },
      ...([
        ['2016', '1,827', '22'], ['2017', '5,188', '42'], ['2018', '1,409', '16'], ['2019', '4,522', '39'],
        ['2020', '2,816', '20'], ['2021', '4,821', '45'], ['2022', '5,531', '41'], ['2023', '5,211', '45'],
        ['2024', '7,115', '53'], ['2025', '8,312', '64'], ['2026', '7,509', '57'],
      ] as const).flatMap(([year, units, camps]) => [
        { label: `Units — ${year}`, value: units },
        { label: `Camps — ${year}`, value: camps },
      ]),
    ],
    images: [],
  },

  /* -------------------------------------------------------------- ENRICH */
  {
    id: 'schools-colleges',
    pillarId: 'enrich',
    title: 'Schools & Colleges',
    period: 'As on September 2025',
    blurb: 'Institutions run by the foundation, and the students in them.',
    headline: { label: 'Students benefitted', value: '209,038' },
    dataPoints: [
      { label: 'Students benefitted', value: '209,038' },
      { label: 'Schools', value: '13' },
      { label: 'Colleges', value: '1' },
      { label: 'College students', value: '24,580' },
    ],
    images: [],
  },
  {
    id: 'scholarships',
    pillarId: 'enrich',
    title: 'Scholarships',
    period: 'As on September 2025',
    blurb: 'Merit-cum-means aid and higher-education scholarships.',
    headline: { label: 'Disbursed', value: '₹4,82,19,252' },
    dataPoints: [
      { label: 'Scholarship students', value: '1,631' },
      { label: 'Disbursed', value: '₹4,82,19,252' },
    ],
    images: [],
  },
  {
    id: 'free-schools',
    pillarId: 'enrich',
    title: 'Free Schools',
    period: 'As on September 2025',
    blurb: 'Schools charging no fees, plus schools the foundation supports.',
    headline: { label: 'Students', value: '9,057' },
    dataPoints: [
      { label: 'Free schools', value: '4' },
      { label: 'Students in free schools', value: '9,057' },
      { label: 'Schools supported by SNCF', value: '2' },
    ],
    images: [],
  },
  {
    id: 'skill-nima',
    pillarId: 'enrich',
    title: 'NIMA Skill Centres',
    period: 'As on September 2025',
    blurb: 'Vocational training centres in computing and allied trades.',
    headline: { label: 'Youth benefitted', value: '3,257' },
    dataPoints: [
      { label: 'NIMA centres', value: '22' },
      { label: 'Youth benefitted', value: '3,257' },
      { label: 'Centres — March 2025', value: '17' },
      { label: 'Added Mar–Sep 2025', value: '427 youth' },
    ],
    images: [],
  },
  {
    id: 'skill-trades',
    pillarId: 'enrich',
    title: 'Sewing & Beautician',
    period: 'As on September 2025',
    blurb: 'Livelihood trades taught to women and youth in local centres.',
    headline: { label: 'Youth benefitted', value: '15,901' },
    dataPoints: [
      { label: 'Sewing centres', value: '45' },
      { label: 'Sewing youth benefitted', value: '15,300' },
      { label: 'Beautician centres', value: '2' },
      { label: 'Beautician youth benefitted', value: '601' },
    ],
    images: [],
  },

  /* ------------------------------------------------------------- EMPOWER */
  {
    id: 'tree-plantation',
    pillarId: 'empower',
    title: 'Tree Plantation Drives',
    period: 'As on March 2026',
    blurb:
      'Plantation drives including World Environment Day and Vann Mahotsav.',
    headline: { label: 'Trees planted', value: '2,639,177' },
    dataPoints: [
      { label: 'Trees planted', value: '2,639,177' },
      { label: 'Total drives', value: '3,500' },
      { label: 'WED drives', value: '18' },
      { label: 'WED plantation', value: '2,200' },
      { label: 'Vann Mahotsav drives', value: '80' },
      { label: 'Vann Mahotsav plantation', value: '16,000' },
    ],
    /* The planting photograph was taken off the album at Rahul's request
       (26 Sep 2026) — its framing cropped badly in the lead print. A
       replacement, as a PNG, goes here when supplied; until then the tile
       borrows the pillar's illustrative set like the others. */
    images: [],
  },
  {
    id: 'cleanliness',
    pillarId: 'empower',
    title: 'Cleanliness Drives',
    period: 'As on September 2025 (cumulative)',
    blurb:
      'Mega drives across railway stations, hospitals and riverbanks.',
    headline: { label: 'Manhours', value: '35,163,330' },
    dataPoints: [
      { label: 'Total manhours', value: '35,163,330' },
      { label: 'Railway stations', value: '444' },
      { label: 'Hospitals', value: '1,385' },
      { label: 'Rly / hospital volunteers', value: '410,788' },
      { label: 'Waterbodies', value: '5,962' },
      { label: 'Waterbody volunteers', value: '5,449,767' },
    ],
    images: [],
  },
  {
    id: 'covid-relief',
    pillarId: 'empower',
    title: 'COVID-19 Relief',
    period: '2022 total',
    blurb: 'Oxygen, food, care centres and beds through the pandemic.',
    headline: { label: 'Food packets', value: '5,000,000' },
    dataPoints: [
      { label: 'Oxygen concentrators', value: '775' },
      { label: 'Food packets', value: '5,000,000' },
      { label: 'PPE kits', value: '30,000' },
      { label: 'Masks', value: '150,000' },
      { label: 'Vaccination centres', value: '55' },
      { label: 'Care centres', value: '13' },
      { label: 'Total beds', value: '1,670' },
      { label: 'ICU beds', value: '200' },
      { label: 'To PM / CM care funds', value: '₹7 Cr' },
    ],
    images: [],
  },
  {
    id: 'mass-marriages',
    pillarId: 'empower',
    title: 'Mass Marriages',
    period: 'As on September 2025',
    blurb: 'Collective weddings held since 1998, at no cost to the families.',
    headline: { label: 'Couples married', value: '5,317' },
    dataPoints: [
      { label: 'Couples married', value: '5,317' },
      { label: 'Events (1998–2025)', value: '57' },
    ],
    images: [],
  },
  {
    id: 'financial-support',
    pillarId: 'empower',
    title: 'Financial & Support',
    period: 'Till 15 May 2025',
    blurb: 'Direct financial help, disaster relief, and support for youth sport.',
    headline: { label: 'Financial help', value: '₹10,45,83,834' },
    dataPoints: [
      { label: 'Financial help', value: '₹10,45,83,834' },
      { label: 'Disaster relief & fund', value: '₹7,95,21,918' },
      { label: 'Youth sport (NBGSMCT)', value: '25 years, 25 tournaments' },
    ],
    images: [],
  },

  /* ------------------------------------------------------------ PROJECTS */
  {
    id: 'project-amrit',
    pillarId: 'projects',
    title: 'Project Amrit',
    period: 'As on March 2026',
    blurb: '“Clean Water, Pure Mind” — cleaning and reviving water bodies.',
    headline: { label: 'Water bodies', value: '5,962' },
    dataPoints: [
      { label: 'Water bodies', value: '5,962' },
      { label: 'Cities', value: '3,460' },
      { label: 'States / UTs', value: '28' },
      { label: 'Volunteers participated', value: '3,927,615' },
      { label: 'Manhours', value: '23,565,690' },
    ],
    images: [],
  },
  {
    id: 'oneness-vann',
    pillarId: 'projects',
    title: 'Project Oneness Vann',
    period: 'As on September 2025',
    blurb: 'Dense indigenous urban forests, grown to cut air pollution.',
    headline: { label: 'Plants', value: '550,000' },
    dataPoints: [
      { label: 'Plants', value: '550,000' },
      { label: 'Sites', value: '630' },
      { label: 'Area', value: '19,582,822 sq ft' },
      { label: 'Acres', value: '449' },
      { label: 'Hectares', value: '182' },
    ],
    images: [],
  },
  {
    id: 'watershed',
    pillarId: 'projects',
    title: 'Watershed Programme',
    period: 'As on September 2025',
    blurb: 'Rejuvenating arid zones for sustainable local agriculture.',
    headline: { label: 'People benefitted', value: '30,000' },
    dataPoints: [
      { label: 'People benefitted', value: '30,000' },
      { label: 'Gram panchayats', value: '9' },
      { label: 'Hamlets', value: '144' },
    ],
    images: [],
  },
  {
    id: 'adopted-villages',
    pillarId: 'projects',
    title: 'Adopted Villages',
    period: 'Since 2017 · Haryana',
    blurb:
      'Patti Kalyana, Bhodwal Majri, Panchi Gujran and Mandaura, adopted whole.',
    headline: { label: 'Impacted population', value: '100,000' },
    dataPoints: [
      { label: 'Villages', value: '4' },
      { label: 'Impacted population', value: '100,000' },
      { label: 'Schools', value: '7' },
      { label: 'School children', value: '8,000' },
      { label: 'Total village population', value: '35,127' },
      { label: 'Direct beneficiaries', value: '29,627' },
    ],
    images: [],
  },
];

/* How each programme is presented: tile symbol, menu name and photographs.
   Kept beside the figures so the CMS import carries them as editable fields. */
const photo = (name: string) => ({ src: `/images/programmes/${name}` });
const PRESENTATION: Record<string, Partial<Activity>> = {
  'blood-donation': {
    icon: 'droplets', menuLabel: 'Blood Donation',
    hoverPhotos: [photo('blood-donation-donor.jpg'), photo('blood-donation-volunteers.png'), photo('blood-donation-satguru.jpg')],
    /* Satguru Mata ji beside the donor; the two fill most of the panel. */
    hoverFocus: { photo: 3, x: 48, y: 42, width: 34, height: 38 },
    cardPhoto: photo('blood-donation.jpg'),
  },
  'health-checkup': {
    icon: 'stethoscope', menuLabel: 'Health Checkup Camps',
    hoverPhotos: [photo('health-checkup-blood-pressure.jpg'), photo('health-checkup-snhc-team.jpg'), photo('health-checkup-satguru-banner.jpg')],
  },
  'eye-checkup': {
    icon: 'eye', menuLabel: 'Eye Care',
    hoverPhotos: [photo('eye-checkup-trial-lens.jpg'), photo('eye-checkup-examination.jpg'), photo('eye-checkup-vision-test.jpg')],
  },
  'health-centre': {
    icon: 'hospital', menuLabel: 'Health Centre',
    hoverPhotos: [photo('health-centre-building.jpg'), photo('health-centre-team.jpg'), photo('health-centre-inauguration.jpg'), photo('health-centre-dedication.jpg')],
    /* Satguru Mata ji and Ramit ji at the centre of the team photograph. */
    hoverFocus: { photo: 2, x: 52, y: 63, width: 11, height: 21 },
  },
  'blood-bank': {
    icon: 'droplet', menuLabel: 'Blood Bank',
    hoverPhotos: [photo('blood-bank-processing.jpg'), photo('blood-bank-storage.jpg'), photo('blood-bank-centrifuge.jpg')],
  },
  'schools-colleges': { icon: 'graduation-cap', menuLabel: 'Schools & Colleges' },
  scholarships: { icon: 'award', menuLabel: 'Scholarships' },
  'free-schools': { icon: 'book-open', menuLabel: 'Free Schools' },
  'skill-nima': { icon: 'laptop', menuLabel: 'NIMA Skill Centres' },
  'skill-trades': { icon: 'scissors', menuLabel: 'Sewing & Beautician' },
  'tree-plantation': { icon: 'trees', menuLabel: 'Tree Plantation' },
  cleanliness: { icon: 'sparkles', menuLabel: 'Cleanliness Drives' },
  'covid-relief': { icon: 'package-check', menuLabel: 'COVID-19 Relief' },
  'mass-marriages': { icon: 'heart', menuLabel: 'Mass Marriages' },
  'financial-support': { icon: 'hand-coins', menuLabel: 'Financial Support' },
  'project-amrit': { icon: 'waves' },
  'oneness-vann': { icon: 'sprout' },
  watershed: { icon: 'mountain' },
  'adopted-villages': { icon: 'house' },
};
for (const activity of DEFAULT_ACTIVITIES) Object.assign(activity, PRESENTATION[activity.id]);

/** Activities for one pillar, in report order. */
export let ACTIVITIES: Activity[] = bindCMSData(DEFAULT_ACTIVITIES, resolveActivities, value => { ACTIVITIES = value; });

export const activitiesFor = (pillarId: string) =>
  ACTIVITIES.filter((a) => a.pillarId === pillarId);
