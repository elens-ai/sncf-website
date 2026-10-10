import { bindCMSData, resolveActivities } from '../cms/data';
import type { ActivityIcon } from './activityIcons';

/**
 * EVERY ACTIVITY THE FOUNDATION REPORTS, and every figure it reports for it.
 *
 * Transcribed from SNCF_Activity_Report_Sept2026 — the executive dashboard
 * and the four per-pillar detail sheets, which the report itself calls the
 * source of truth. Only the report's latest figures are shown, and every
 * activity is dated to the report: As on September 2026. Earlier rows of a
 * sheet (previous periods, yearly breakdowns, "added" rows) are left out, as
 * the foundation asked. Chiropractic Services is from the foundation's own
 * record of its camps at the Samagams (camp by camp, 2017 to 2026), of which
 * only the totals are shown, likewise.
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
    ],
    images: [],
  },
  {
    id: 'chiropractic',
    pillarId: 'heal',
    title: 'Chiropractic Services',
    period: 'As on September 2026',
    blurb:
      'Chiropractic care at the International Samagams in Delhi–Samalkha and Maharashtra, given by visiting doctors.',
    headline: { label: 'Patients treated', value: '83,146' },
    dataPoints: [
      { label: 'Patients treated', value: '83,146' },
      { label: 'Camps organised', value: '14' },
      { label: 'Years of service', value: '9' },
      { label: 'Camps at Delhi–Samalkha', value: '7' },
      { label: 'Camps in Maharashtra', value: '7' },
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
    dataPoints: [
      { label: 'Units', value: '54,261' },
      { label: 'Camps', value: '444' },
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

  /* -------------------------------------------------------------- ENRICH */
  {
    id: 'schools-colleges',
    pillarId: 'enrich',
    title: 'Schools & Colleges',
    period: 'As on September 2026',
    blurb: 'Institutions run by the foundation, and the students in them.',
    headline: { label: 'Students benefitted', value: '217,723' },
    dataPoints: [
      { label: 'Students benefitted', value: '217,723' },
      { label: 'Schools', value: '14' },
      { label: 'Colleges', value: '1' },
      { label: 'College students', value: '25,880' },
    ],
    images: [],
  },
  {
    id: 'scholarships',
    pillarId: 'enrich',
    title: 'Scholarships',
    period: 'As on September 2026',
    blurb: 'Merit-cum-means aid and higher-education scholarships.',
    headline: { label: 'Disbursed', value: '₹5,40,97,718' },
    dataPoints: [
      { label: 'Scholarship students', value: '1,829' },
      { label: 'Disbursed', value: '₹5,40,97,718' },
    ],
    images: [],
  },
  {
    id: 'free-schools',
    pillarId: 'enrich',
    title: 'Free Schools',
    period: 'As on September 2026',
    blurb: 'Schools charging no fees, schools the foundation supports, and free coaching centres.',
    headline: { label: 'Students', value: '9,696' },
    /* The free coaching centres come from the report's skill development
       sheet; they are kept here, with the other free classrooms. */
    dataPoints: [
      { label: 'Free schools', value: '4' },
      { label: 'Students in free schools', value: '9,696' },
      { label: 'Schools supported by SNCF', value: '2' },
      { label: 'Free coaching centres', value: '3' },
      { label: 'Free coaching students', value: '1,370' },
    ],
    images: [],
  },
  {
    id: 'skill-nima',
    pillarId: 'enrich',
    title: 'NIMA Skill Centres',
    period: 'As on September 2026',
    blurb: 'Music, dance and painting, taught at the Nirankari Institute of Music and Art.',
    headline: { label: 'Youth benefitted', value: '4,114' },
    dataPoints: [
      { label: 'NIMA centres', value: '27' },
      { label: 'Youth benefitted', value: '4,114' },
    ],
    images: [],
  },
  {
    id: 'skill-trades',
    pillarId: 'enrich',
    title: 'Sewing & Beautician',
    period: 'As on September 2026',
    blurb: 'Livelihood trades taught to women and youth in local centres.',
    headline: { label: 'Youth benefitted', value: '17,131' },
    dataPoints: [
      { label: 'Sewing centres', value: '45' },
      { label: 'Sewing youth benefitted', value: '16,500' },
      { label: 'Beautician centres', value: '1' },
      { label: 'Beautician youth benefitted', value: '631' },
    ],
    images: [],
  },

  /* ------------------------------------------------------------- EMPOWER */
  {
    id: 'tree-plantation',
    pillarId: 'empower',
    title: 'Tree Plantation Drives',
    period: 'As on September 2026',
    blurb:
      'Plantation drives including World Environment Day and Vann Mahotsav.',
    /* "Trees planted" is the dashboard's total, which counts Oneness Vann's
       600,330 plants; the sheet's own column leaves them out (2,041,947). */
    headline: { label: 'Trees planted', value: '2,642,277' },
    dataPoints: [
      { label: 'Trees planted', value: '2,642,277' },
      { label: 'Excluding Oneness Vann', value: '2,041,947' },
      { label: 'Total drives', value: '3,518' },
      { label: 'WED drives', value: '18' },
      { label: 'WED plantation', value: '3,100' },
      { label: 'Vann Mahotsav drives', value: '80' },
      { label: 'Vann Mahotsav plantation', value: '16,000' },
    ],
    images: [],
  },
  {
    id: 'cleanliness',
    pillarId: 'empower',
    title: 'Cleanliness Drives',
    period: 'As on September 2026',
    blurb:
      'Mega drives across railway stations, hospitals and riverbanks.',
    headline: { label: 'Manhours', value: '35,223,330' },
    dataPoints: [
      { label: 'Total manhours', value: '35,223,330' },
      { label: 'Total drives', value: '7,809' },
      { label: 'Railway stations', value: '444' },
      { label: 'Hospitals', value: '1,385' },
      { label: 'WED drives', value: '18' },
      { label: 'Rly / hospital volunteers', value: '420,788' },
      { label: 'Waterbodies', value: '5,962' },
      { label: 'Waterbody volunteers', value: '5,449,767' },
    ],
    images: [],
  },
  {
    id: 'covid-relief',
    pillarId: 'empower',
    title: 'COVID-19 Relief',
    period: 'As on September 2026',
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
    period: 'As on September 2026',
    blurb: 'Collective weddings held since 1998, at no cost to the families.',
    headline: { label: 'Couples married', value: '5,652' },
    dataPoints: [
      { label: 'Couples married', value: '5,652' },
      { label: 'Events held', value: '61' },
    ],
    images: [],
  },
  {
    id: 'financial-support',
    pillarId: 'empower',
    title: 'Financial & Support',
    period: 'As on September 2026',
    blurb: 'Direct financial help, disaster relief, and support for youth sport.',
    headline: { label: 'Financial help', value: '₹10,45,83,834' },
    dataPoints: [
      { label: 'Financial help', value: '₹10,45,83,834' },
      { label: 'Disaster relief & fund', value: '₹7,95,21,918' },
      { label: 'Youth sport (NBGSMCT)', value: '26 years, 26 tournaments' },
    ],
    images: [],
  },

  /* ------------------------------------------------------------ PROJECTS */
  {
    id: 'project-amrit',
    pillarId: 'projects',
    title: 'Project Amrit',
    period: 'As on September 2026',
    blurb: '“Clean Water, Pure Mind” — cleaning and reviving water bodies.',
    headline: { label: 'Water bodies', value: '1,600+' },
    dataPoints: [
      { label: 'Water bodies', value: '1,600+' },
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
    period: 'As on September 2026',
    blurb: 'Dense indigenous urban forests, grown to cut air pollution.',
    headline: { label: 'Plants', value: '600,330' },
    dataPoints: [
      { label: 'Plants', value: '600,330' },
      { label: 'Sites', value: '700' },
      { label: 'Area', value: '19,582,822 sq ft' },
      { label: 'Acres', value: '449' },
      { label: 'Hectares', value: '182' },
      { label: 'States / UTs', value: '27' },
    ],
    images: [],
  },
  {
    id: 'watershed',
    pillarId: 'projects',
    title: 'Watershed Programme',
    period: 'As on September 2026',
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
    period: 'As on September 2026',
    blurb:
      'Patti Kalyana, Bhodwal Majri, Panchi Gujran and Mandaura in Haryana, adopted whole.',
    headline: { label: 'Impacted population', value: '112,500' },
    /* The overview row, then the village-level sheet's totals. */
    dataPoints: [
      { label: 'Villages', value: '4' },
      { label: 'Impacted population', value: '112,500' },
      { label: 'Schools', value: '7' },
      { label: 'School children', value: '10,000' },
      { label: 'Total village population', value: '35,127' },
      { label: 'Direct beneficiaries', value: '29,627' },
      { label: 'Health & eye camps', value: '19' },
      { label: 'Patients treated', value: '3,420' },
      { label: 'Students benefitting', value: '7,750' },
      { label: 'Sewing centres', value: '3' },
      { label: 'Saplings planted', value: '91,500' },
      { label: 'Green cover', value: '732,000 sq ft' },
    ],
    images: [],
  },
];

/* How each programme is presented: tile symbol, menu name and photographs.
   Kept beside the figures so the CMS import carries them as editable fields.

   `images` are the programme's own photographs, from the foundation's 2026
   exhibition archive: the first leads its tile, the rest hang in its detail
   view. Programmes without hover photographs of their own blend these in
   instead, and the lead one sits behind their card. COVID-19 relief and the
   watershed programme have none in the archive yet, so their tiles still
   borrow a pillar photograph, marked illustrative. */
const photo = (name: string) => ({ src: `/images/programmes/${name}` });
const own = (name: string, alt: string) => ({ src: `/images/programmes/${name}`, alt });
const album = (images: { src: string; alt: string }[]): Partial<Activity> =>
  ({ images, hoverPhotos: images.map(({ src, alt }) => ({ src, alt })), cardPhoto: { src: images[0].src, alt: images[0].alt } });
const PRESENTATION: Record<string, Partial<Activity>> = {
  'blood-donation': {
    icon: 'droplets', menuLabel: 'Blood Donation',
    images: [
      own('blood-donation-manav-ekta-diwas.webp', 'Donors giving blood at the Manav Ekta Diwas drive in Delhi, April 2026'),
      own('blood-donation-donor-2026.webp', 'A young woman donating blood at a foundation camp'),
      own('blood-donation-badge-of-honour.webp', 'A volunteer holds a sign reading “This isn’t a band-aid, it’s a badge of honor”'),
    ],
    hoverPhotos: [photo('blood-donation-donor.jpg'), photo('blood-donation-volunteers.png'), photo('blood-donation-satguru.jpg')],
    /* Satguru Mata ji beside the donor; the two fill most of the panel. */
    hoverFocus: { photo: 3, x: 48, y: 42, width: 34, height: 38 },
    cardPhoto: photo('blood-donation.jpg'),
  },
  'health-checkup': {
    icon: 'stethoscope', menuLabel: 'Health Checkup Camps',
    images: [
      own('health-checkup-school-camp.webp', 'A doctor examines a student at a school health checkup camp'),
      own('health-checkup-blood-pressure-2026.webp', 'A volunteer checks an elderly woman’s blood pressure at a health screening camp'),
      own('health-checkup-screening.webp', 'A woman has her blood pressure taken at a health screening camp'),
    ],
    hoverPhotos: [photo('health-checkup-blood-pressure.jpg'), photo('health-checkup-snhc-team.jpg'), photo('health-checkup-satguru-banner.jpg')],
  },
  'eye-checkup': {
    icon: 'eye', menuLabel: 'Eye Care',
    images: [
      own('eye-checkup-trial-frame.webp', 'An elderly woman tries trial lenses at a free eye checkup camp in Mumbai'),
      own('eye-checkup-khopoli.webp', 'A woman in a trial frame during an eye test at Khopoli'),
      own('eye-checkup-barnala.webp', 'A volunteer examines a woman’s eyes at an eye checkup camp in Barnala'),
    ],
    hoverPhotos: [photo('eye-checkup-trial-lens.jpg'), photo('eye-checkup-examination.jpg'), photo('eye-checkup-vision-test.jpg')],
  },
  'health-centre': {
    icon: 'hospital', menuLabel: 'Health Centre',
    images: [
      own('health-centre-building.jpg', 'The Sant Nirankari Health Centre'),
      own('health-centre-team.jpg', 'Satguru Mata Sudiksha Ji Maharaj with the health centre’s team'),
      own('health-centre-inauguration.jpg', 'The inauguration of the health centre'),
    ],
    hoverPhotos: [photo('health-centre-building.jpg'), photo('health-centre-team.jpg'), photo('health-centre-inauguration.jpg'), photo('health-centre-dedication.jpg')],
    /* Satguru Mata ji and Ramit ji at the centre of the team photograph. */
    hoverFocus: { photo: 2, x: 52, y: 63, width: 11, height: 21 },
  },
  /* its tile shows its symbol; the clinics at the Samagams blend in behind the chapter on hover */
  chiropractic: {
    icon: 'spine', menuLabel: 'Chiropractic',
    hoverPhotos: [photo('chiropractic-adjustment.jpg'), photo('chiropractic-clinic.jpg'), photo('chiropractic-satguru.jpg')],
  },
  'blood-bank': {
    icon: 'droplet', menuLabel: 'Blood Bank',
    images: [
      own('blood-bank-mixer.webp', 'A unit of blood on a collection mixer'),
      own('blood-bank-bags.webp', 'Collected units of blood'),
      own('blood-bank-samples.webp', 'Blood samples racked for testing'),
    ],
    hoverPhotos: [photo('blood-bank-processing.jpg'), photo('blood-bank-storage.jpg'), photo('blood-bank-centrifuge.jpg')],
  },
  'schools-colleges': { icon: 'graduation-cap', menuLabel: 'Schools & Colleges', ...album([
    own('schools-classroom.webp', 'Students in a classroom at Sant Nirankari Public School, Tilak Nagar'),
    own('schools-library.webp', 'Students reading in the school library, Malviya Nagar'),
    own('schools-band.webp', 'The school band of Sant Nirankari Public School, Govindpuri'),
  ]) },
  scholarships: { icon: 'award', menuLabel: 'Scholarships', ...album([
    own('scholarships-graduation.webp', 'Young graduates at a Sant Nirankari Public School graduation ceremony'),
    own('scholarships-graduates.webp', 'Graduates gathered at the graduation ceremony, Nirankari Colony'),
  ]) },
  'free-schools': { icon: 'book-open', menuLabel: 'Free Schools', ...album([
    own('free-schools-independence-day.webp', 'Students celebrating Independence Day at Sant Nirankari School, Paharganj'),
    own('free-schools-assembly.webp', 'A Republic Day assembly at Sant Nirankari School, Paharganj'),
    own('free-schools-group-work.webp', 'Students working together around a table'),
  ]) },
  'skill-nima': { icon: 'laptop', menuLabel: 'NIMA Skill Centres', ...album([
    own('nima-tabla.webp', 'Two students playing tabla at a Nirankari Institute of Music and Art evening in Mumbai'),
    own('nima-music-class.webp', 'A music class with harmonium and tabla in Mumbai'),
    own('nima-vocational-centre.webp', 'Students with their instruments at the new Nirankari Vocational Centre'),
  ]) },
  'skill-trades': { icon: 'scissors', menuLabel: 'Sewing & Beautician', ...album([
    own('sewing-centre-machines.webp', 'Women at their sewing machines in the Yamuna Nagar sewing centre'),
    own('sewing-centre-learner.webp', 'A learner at a sewing machine in Matiala'),
    own('sewing-centre-class.webp', 'A full class at the Mukandpur sewing centre'),
  ]) },
  'tree-plantation': { icon: 'trees', menuLabel: 'Tree Plantation', ...album([
    own('tree-plantation-hillside.webp', 'A volunteer plants a sapling on a hillside in Mussoorie on World Environment Day'),
    own('tree-plantation-forest.webp', 'Volunteers planting in a pine forest in Manali'),
    own('tree-plantation-drive.webp', 'Planting a tree at a World Environment Day drive in Lonavala'),
  ]) },
  cleanliness: { icon: 'sparkles', menuLabel: 'Cleanliness Drives', ...album([
    own('cleanliness-lake-shore.webp', 'Volunteers clearing the shore of the Tehri lake on World Environment Day'),
    own('cleanliness-hillside.webp', 'Volunteers bagging litter on a hillside in Mussoorie'),
    own('cleanliness-recycle.webp', 'Students with reduce, reuse and recycle placards in Shimla'),
  ]) },
  'covid-relief': {
    icon: 'package-check', menuLabel: 'COVID-19 Relief',
    hoverPhotos: [photo('covid-relief-meals.jpg'), photo('covid-relief-care-centre.jpg'), photo('covid-relief-vaccination.jpg')],
  },
  'mass-marriages': { icon: 'heart', menuLabel: 'Mass Marriages', ...album([
    own('mass-marriages-couples.webp', 'Couples at the mass marriage ceremony, showered with rose petals'),
    own('mass-marriages-hall.webp', 'The mass marriage ceremony, April 2026'),
    own('mass-marriages-petals.webp', 'Newly married couples beneath falling petals'),
  ]) },
  'financial-support': { icon: 'hand-coins', menuLabel: 'Financial Support', ...album([
    own('youth-sport-sprint.webp', 'Athletes sprinting at Jawaharlal Nehru Stadium, Delhi'),
    own('youth-sport-para-athletes.webp', 'Volunteers with para-athletes at Jawaharlal Nehru Stadium'),
    own('youth-sport-hurdles.webp', 'A hurdles race at Jawaharlal Nehru Stadium'),
  ]) },
  'project-amrit': { icon: 'waves', ...album([
    own('amrit-riverbank.webp', 'Project Amrit volunteers clearing a riverbank in Mantova, Italy'),
    own('amrit-volunteers.webp', 'Volunteers filling bags with litter in Mantova'),
    own('amrit-christchurch.webp', 'Project Amrit volunteers by the water in Christchurch, New Zealand'),
  ]) },
  'oneness-vann': { icon: 'sprout', ...album([
    own('oneness-vann-planting.webp', 'Women planting saplings for Oneness Vann in Solapur'),
    own('oneness-vann-sapling.webp', 'A woman and a child plant a sapling in Solapur'),
    own('oneness-vann-group.webp', 'Planting beneath the Oneness Vann banner in Solapur'),
  ]) },
  watershed: { icon: 'mountain' },
  'adopted-villages': { icon: 'house', ...album([
    own('adopted-villages-health-camp.webp', 'Villagers at a health screening camp in Mandaura, one of the adopted villages'),
    own('adopted-villages-mandaura.webp', 'A volunteer checks an elderly villager in Mandaura'),
  ]) },
};
for (const activity of DEFAULT_ACTIVITIES) Object.assign(activity, PRESENTATION[activity.id]);

/** Activities for one pillar, in report order. */
export let ACTIVITIES: Activity[] = bindCMSData(DEFAULT_ACTIVITIES, resolveActivities, value => { ACTIVITIES = value; });

export const activitiesFor = (pillarId: string) =>
  ACTIVITIES.filter((a) => a.pillarId === pillarId);
