import type { PastSNCFEvent, SNCFEvent } from './events';

/**
 * THE FOUNDATION'S OWN RECORD OF ITS EVENTS, read from nirankarifoundation.org
 * (all 447 of its posts, 2014–2024, and its programme pages) and sorted the
 * way the events section shows them.
 *
 *  RECURRING_EVENTS — what comes round again: the dated drives the site says
 *    are held "every year" (23 February, Van Mahotsav week), and the camps it
 *    reports year after year with no fixed date, whose `cadence` says how
 *    often. The routine camp reports are not listed one by one; each recurring
 *    event counts them and links to them on the foundation's site.
 *  UPCOMING_EVENTS — what is open now.
 *  MAJOR_PAST_EVENTS — one-time milestones: openings, launches, relief
 *    operations and honours. Each is dated by its report's own dateline where
 *    it gives one (`dateBasis: 'held'`), otherwise by the report's publication
 *    date (`'reported'`), and the section says which.
 *
 * Photographs are the reports' own, linked from nirankarifoundation.org, or
 * the same honour's photograph already in this site. Where a report carried
 * none, the event has none — never a borrowed one.
 *
 * These lists are bundled with the site, beside the CMS-managed events in
 * events.ts; move them into the CMS once the Events collection carries a
 * "recurring" kind.
 */

const SITE = 'https://nirankarifoundation.org';
const upload = (path: string) => `${SITE}/wp-content/uploads/${path}`;

export const RECURRING_EVENTS: SNCFEvent[] = [
  {
    id: 'baba-hardev-singh-ji-birthday-drives',
    title: 'Mega cleanliness & plantation drives',
    kind: 'annual', month: 2, day: 23,
    tag: 'Baba Hardev Singh Ji’s birthday',
    blurb: 'Every year on 23 February, the birthday of Nirankari Baba Hardev Singh Ji Maharaj, the foundation holds mega cleanliness and tree plantation drives across India — at railway stations, hospitals, monuments and water bodies. In 2020 the drive covered 1,320 government hospitals.',
    pillarId: 'empower',
    facts: [{ value: '1,320', label: 'Government hospitals, 2020' }, { value: '≈3.5 lakh', label: 'Volunteers, 2020' }],
    source: `${SITE}/2019/02/26/mega-cleanliness-and-tree-plantation-drive-by-sncf/`,
  },
  {
    id: 'van-mahotsav-week',
    title: 'Van Mahotsav week',
    kind: 'annual', month: 7, day: 1,
    tag: 'Tree plantation · 1–7 July',
    blurb: 'From the first week of July, observed as Van Mahotsav week, the foundation runs a tree plantation and tree saving campaign across India — in 2020 continuing through the month to World Nature Conservation Day on 28 July.',
    pillarId: 'empower',
    href: '/core-values#tree-plantation',
    source: `${SITE}/2020/07/10/sncf-observed-van-mahotsav-week/`,
  },
  {
    id: 'blood-donation-camps',
    title: 'Blood donation camps',
    kind: 'ongoing', cadence: 'Held all year, across India',
    tag: 'Year-round',
    blurb: 'Regular voluntary blood donation camps, held by the Mission’s devotees for over 38 years and led by the foundation since 2010. The largest come each year on Manav Ekta Diwas, 24 April.',
    pillarId: 'heal',
    facts: [{ value: '223', label: 'Camp reports on the foundation’s site, 2014–2020' }],
    href: '/core-values#blood-donation',
    source: `${SITE}/category/heal/blood-donation-drive/`,
  },
  {
    id: 'cleanliness-drives',
    title: 'Cleanliness drives',
    kind: 'ongoing', cadence: 'Held all year',
    tag: 'Year-round',
    blurb: 'Volunteer clean-ups of railway stations, hospitals, streets, parks and riverbanks, held through the year and as part of Swachh Bharat Abhiyan.',
    pillarId: 'empower',
    facts: [{ value: '80', label: 'Drive reports on the foundation’s site, 2014–2020' }],
    href: '/core-values#cleanliness',
    source: `${SITE}/category/empower/cleanliness-drives/`,
  },
  {
    id: 'tree-plantation-drives',
    title: 'Tree plantation drives',
    kind: 'ongoing', cadence: 'Held all year · most around World Environment Day and the monsoon',
    tag: 'Year-round',
    blurb: 'Saplings planted and cared for by volunteers, from school grounds to hillsides, with the most drives around World Environment Day and in the monsoon.',
    pillarId: 'empower',
    facts: [{ value: '39', label: 'Drive reports on the foundation’s site, 2014–2021' }],
    href: '/core-values#tree-plantation',
    source: `${SITE}/category/empower/tree-plantation/`,
  },
  {
    id: 'eye-checkup-camps',
    title: 'Eye check-up camps',
    kind: 'ongoing', cadence: 'Held all year',
    tag: 'Year-round',
    blurb: 'Free eye check-ups, spectacles and cataract surgery referrals, with eye donation campaigns alongside.',
    pillarId: 'heal',
    facts: [{ value: '20', label: 'Camp reports on the foundation’s site, 2014–2018' }],
    href: '/core-values#eye-checkup',
    source: `${SITE}/category/heal/eye-care/`,
  },
  {
    id: 'health-checkup-camps',
    title: 'Health check-up camps',
    kind: 'ongoing', cadence: 'Held all year',
    tag: 'Year-round',
    blurb: 'Free medical and health check-up camps — in towns, in the adopted villages and in prisons — for people far from regular care.',
    pillarId: 'heal',
    facts: [{ value: '10', label: 'Camp reports on the foundation’s site, 2015–2018' }],
    href: '/core-values#health-checkup',
    source: `${SITE}/category/heal/health-checkup-camps/`,
  },
  {
    id: 'asthma-medicine-camp-hyderabad',
    title: 'Asthma medicine camp, Hyderabad',
    kind: 'ongoing', cadence: 'Every June',
    tag: 'Every June',
    blurb: 'Each June the foundation’s volunteers serve at Hyderabad’s asthma (fish) medicine camp — 500 of them in 2015, and 600 in 2016 and 2018.',
    pillarId: 'heal',
    location: 'Hyderabad, Telangana',
    facts: [{ value: '600', label: 'Volunteers, 2018' }],
    source: `${SITE}/category/heal/asthma-medicine-camp/`,
  },
  {
    id: 'children-summer-camp',
    title: 'Children’s summer camp',
    kind: 'ongoing', cadence: 'Every summer',
    tag: 'Every summer',
    blurb: 'A summer camp for school children each year — the fourth in Rohini, Delhi, in 2015, and at Nirankari Colony, Delhi, from 21 May to 1 June 2018.',
    pillarId: 'enrich',
    source: `${SITE}/category/empower/safe-childhood/`,
  },
];

export const UPCOMING_EVENTS: SNCFEvent[] = [
  {
    id: 'rajmata-scholarship-2026-27',
    title: 'Nirankari Rajmata Scholarship 2026–27',
    kind: 'ongoing', cadence: 'For the 2026–27 academic year',
    tag: 'Scholarship',
    blurb: 'The scheme for 2026–27 is published on the foundation’s website, with its details, checklist and application form: merit-cum-means support for professional and technical courses at graduate and post-graduate level, given every year since 2014–15.',
    pillarId: 'enrich',
    href: '/core-values#scholarships',
    source: `${SITE}/scholarship/`,
  },
];

export const MAJOR_PAST_EVENTS: PastSNCFEvent[] = [
  {
    id: 'run-for-oneness-2014', kind: 'past', occurredOn: '2014-10-26', dateBasis: 'held',
    title: 'Delhi Run for Oneness', tag: 'Social awareness', pillarId: 'empower',
    location: 'Major Dhyan Chand National Stadium, New Delhi',
    blurb: 'Thousands of people — children and elders, rich and poor — ran 8.4 km from Major Dhyan Chand National Stadium to Jantar Mantar and back for oneness and universal brotherhood. Union Home Minister Shri Rajnath Singh was the chief guest.',
    photos: [{ src: upload('2014/12/DDKL9531-scaled.jpg'), alt: 'The flag-off of the Delhi Run for Oneness, October 2014' }],
    source: `${SITE}/2015/01/12/delhi-run-for-oneness-2014/`,
  },
  {
    id: 'jk-flood-relief-2014', kind: 'past', occurredOn: '2014-12-31', dateBasis: 'held',
    title: 'Relief for Jammu & Kashmir flood families', tag: 'Disaster relief', pillarId: 'empower',
    location: 'Kashmiri Gate, Delhi',
    blurb: 'After the Jammu & Kashmir floods, about 250 displaced families were camping at Kashmiri Gate in Delhi. The foundation’s volunteers brought them food, woollen clothes, blankets and other essentials.',
    facts: [{ value: '≈250', label: 'Families helped' }],
    photos: [{ src: upload('2015/01/jammu1.jpg'), alt: 'Volunteers handing out relief to families displaced by the Jammu & Kashmir floods' }],
    source: `${SITE}/2015/01/14/relief-to-jammu-kashmir-flood-effected-families/`,
  },
  {
    id: 'nvc-ludhiana-2015', kind: 'past', occurredOn: '2015-01-06', dateBasis: 'held',
    title: 'Fifth Nirankari Vocational Centre opens in Ludhiana', tag: 'Nirankari Vocational Centre', pillarId: 'enrich',
    location: 'Sant Nirankari Public School, Ludhiana, Punjab',
    blurb: 'The foundation’s fifth Nirankari Vocational Centre was inaugurated at Sant Nirankari Public School (Senior Secondary), Tajpur Road, Ludhiana, in the presence of Holy Sister Bindiya Chhabra Ji.',
    photos: [{ src: upload('2015/01/nvc3.jpg'), alt: 'Scenes from the opening of the fifth Nirankari Vocational Centre in Ludhiana' }],
    source: `${SITE}/2015/01/12/5th-n-v-c-opening-ceremony-at-sant-nirankari-higher-secondary-school-in-ludhiana-by-holy-sister-bindiya-chabra-ji/`,
  },
  {
    id: 'health-city-ground-breaking-2015', kind: 'past', occurredOn: '2015-04-11', dateBasis: 'reported',
    title: 'Ground-breaking of Sant Nirankari Health City', tag: 'Sant Nirankari Health City', pillarId: 'projects',
    location: 'Nirankari Complex, Burari Road, Delhi',
    blurb: 'With the blessings of Baba Hardev Singh Ji Maharaj, ground was broken for Sant Nirankari Health City at the hospital site in the Nirankari Complex, Delhi — the integrated health city he envisioned.',
    photos: [{ src: upload('2015/04/17-e1571997403346.jpg'), alt: 'The ground-breaking ceremony of Sant Nirankari Health City in Delhi' }],
    source: `${SITE}/2015/04/11/ground-breaking-ceremony-of-sant-nirankari-health-city/`,
    href: '/projects#health-city',
  },
  {
    id: 'nepal-earthquake-relief-2015', kind: 'past', occurredOn: '2015-04-25', dateBasis: 'held',
    title: 'Earthquake relief in Nepal', tag: 'Disaster relief', pillarId: 'empower',
    location: 'Kathmandu, Nepal',
    blurb: 'When a devastating earthquake struck Nepal on 25 April 2015, 1,400 Sewadal volunteers led by the Sant Nirankari Mandal Nepal rushed to help, and the Satsang Bhawan in Kathmandu became a relief camp for about 700 people.',
    facts: [{ value: '1,400', label: 'Volunteers' }, { value: '≈700', label: 'People in the relief camp' }],
    photos: [],
    source: `${SITE}/2015/05/15/relief-to-earthquake-sufferers-in-nepal/`,
  },
  {
    id: 'singer-training-centre-2015', kind: 'past', occurredOn: '2015-06-01', dateBasis: 'held',
    title: 'Training centre opens with Singer India', tag: 'Skills for women', pillarId: 'enrich',
    location: 'Vile Parle (East), Mumbai',
    blurb: 'The foundation’s Mumbai chapter opened a training centre with Singer India Ltd at the Nirankari Satsang Bhawan in Vile Parle (East), inaugurated by MLA Shri Parag Alvani.',
    photos: [{ src: upload('2015/06/flicker-thumbnil.jpg'), alt: 'The ribbon cut at the opening of the training centre with Singer India in Vile Parle, Mumbai' }],
    source: `${SITE}/2015/06/05/sncf-starts-its-first-skill-development-centre-in-vile-parle-mumbai/`,
  },
  {
    id: 'red-cross-award-telangana-2015', kind: 'past', occurredOn: '2015-06-14', dateBasis: 'held',
    title: 'Indian Red Cross award for blood donation', tag: 'Honours', pillarId: 'heal',
    location: 'Raj Bhavan, Hyderabad',
    blurb: 'On World Blood Donor Day, the Indian Red Cross Society honoured the foundation for its contribution to blood donation in Telangana. Governor Shri E.S.L. Narasimhan presented the award at Raj Bhavan, Hyderabad.',
    photos: [{ src: upload('2015/07/thumbnil1.jpg'), alt: 'The foundation’s announcement of its Indian Red Cross award for blood donation in Telangana' }],
    source: `${SITE}/2015/07/08/sncf-receives-award-for-blood-donation-in-telangana/`,
  },
  {
    id: 'nvc-faridabad-2015', kind: 'past', occurredOn: '2015-07-10', dateBasis: 'held',
    title: 'Nirankari Vocational Centre opens in Faridabad', tag: 'Nirankari Vocational Centre', pillarId: 'enrich',
    location: 'Sant Nirankari Public School, Sector 16A, Faridabad',
    blurb: 'The sixth Nirankari Vocational Centre run by the foundation opened at Sant Nirankari Public School in Faridabad, inaugurated by Rev C.L. Gulati Ji, Secretary of the foundation.',
    photos: [{ src: upload('2015/07/thumbnil5.jpg'), alt: 'The foundation’s announcement of the Nirankari Vocational Centre opening in Faridabad' }],
    source: `${SITE}/2015/07/22/nirankari-vocational-centre-opens-in-faridabad/`,
  },
  {
    id: 'chennai-flood-relief-2015', kind: 'past', occurredOn: '2015-12-08', dateBasis: 'reported',
    title: 'Flood relief in Chennai', tag: 'Disaster relief', pillarId: 'empower',
    location: 'Chennai, Tamil Nadu',
    blurb: 'As floods left lakhs homeless in Chennai, hundreds of Sewadal members, the foundation’s volunteers and the Mission’s devotees set up a relief camp at the Satsang Bhawan to bring food, clothing and medicines to those cut off.',
    photos: [{ src: upload('2015/12/011.jpg'), alt: 'Volunteers at the foundation’s flood relief camp in Chennai' }],
    source: `${SITE}/2015/12/08/sncf-relief-measures-in-chennai/`,
  },
  {
    id: 'first-blood-bank-2016', kind: 'past', occurredOn: '2016-01-26', dateBasis: 'held',
    title: 'The Mission’s first blood bank', tag: 'Blood bank', pillarId: 'heal',
    location: 'Sant Nirankari Satsang Bhawan, Vile Parle (East), Mumbai',
    blurb: 'On Republic Day 2016, Baba Hardev Singh Ji Maharaj dedicated the Mission’s first blood bank to society at the Satsang Bhawan in Vile Parle, Mumbai — the realisation of a long-cherished dream of Baba Gurbachan Singh Ji.',
    photos: [{ src: upload('2016/02/04.jpg'), alt: 'The dedication of the Mission’s first blood bank in Vile Parle, Mumbai' }],
    source: `${SITE}/2016/02/05/sant-nirankari-mission-dedicates-its-first-blood-bank-to-society-2/`,
    href: '/core-values#blood-bank',
  },
  {
    id: 'vadodara-cleanliness-award-2016', kind: 'past', occurredOn: '2016-03-29', dateBasis: 'held',
    title: 'Honoured for cleanliness in Vadodara', tag: 'Honours', pillarId: 'empower',
    location: 'Vadodara, Gujarat',
    blurb: 'For its outstanding performance in the Vadodara Municipal Corporation’s cleanliness competition (14 February to 20 March 2016), the foundation received a certificate, a shield, a Swachh Bharat memento and a cash award from Governor Shri O.P. Kohli.',
    photos: [],
    source: `${SITE}/2016/03/31/sncf-recognized-outstanding-performance-cleanliness-competition-vadodara/`,
  },
  {
    id: 'ulhasnagar-dispensary-2016', kind: 'past', occurredOn: '2016-04-17', dateBasis: 'held',
    title: 'Charitable dispensary opens in Ulhasnagar', tag: 'Health', pillarId: 'heal',
    location: 'Shahad, Ulhasnagar, Maharashtra',
    blurb: 'An allopathic Sant Nirankari Charitable Dispensary opened at the Satsang Bhawan in Shahad, Ulhasnagar, inaugurated by the city’s Mayor. The Mission was already running 157 charitable dispensaries.',
    photos: [],
    source: `${SITE}/2016/04/28/nirankari-charitable-dispensary-opened-ulhasnagar/`,
  },
  {
    id: 'nbtc-felicitation-2016', kind: 'past', occurredOn: '2016-06-14', dateBasis: 'held',
    title: 'Award of Excellence on World Blood Donor Day', tag: 'Honours', pillarId: 'heal',
    location: 'Dr Ram Manohar Lohia Hospital, New Delhi',
    blurb: 'The National Blood Transfusion Council, Ministry of Health & Family Welfare, felicitated the Sant Nirankari Mission as one of the leading organisations for voluntary blood donation.',
    photos: [{ src: '/images/awards/nbtc-award-of-excellence-2016.webp', alt: 'The Award of Excellence certificate from the National Blood Transfusion Council and NACO' }],
    source: `${SITE}/2016/06/24/snm-felicitated-government-india-world-blood-donor-day/`,
  },
  {
    id: 'allahabad-varanasi-flood-relief-2016', kind: 'past', occurredOn: '2016-09-22', dateBasis: 'reported',
    title: 'Flood relief in Allahabad and Varanasi', tag: 'Disaster relief', pillarId: 'empower',
    location: 'Allahabad and Varanasi, Uttar Pradesh',
    blurb: 'Volunteers of the foundation and the Sant Nirankari Sewadal distributed ready-made clothes, food packets and medicines to flood-affected families, working with the district administration.',
    facts: [{ value: '600', label: 'Garments and sarees given in Allahabad' }],
    photos: [],
    source: `${SITE}/2016/09/22/relief-flood-affected-people-allahabad-varanasi/`,
  },
  {
    id: 'villages-adopted-2017', kind: 'past', occurredOn: '2017-01-12', dateBasis: 'held',
    title: 'Two villages adopted in Haryana', tag: 'Adopted villages', pillarId: 'projects',
    location: 'Panchi Gujran (Sonipat) and Patti Kalyana (Panipat), Haryana',
    blurb: 'To mark the 60th birthday of Satguru Mata Savinder Hardev Ji Maharaj, the foundation adopted Panchi Gujran and Patti Kalyana for their all-round development — cleanliness first, then social and economic uplift.',
    photos: [],
    source: `${SITE}/2017/01/13/mark-satguru-mata-jis-birthday-sncf-adopts-two-villages-haryana/`,
    href: '/projects#adopted-villages',
  },
  {
    id: 'urban-sanitation-hurrah-2017', kind: 'past', occurredOn: '2017-06-09', dateBasis: 'held',
    title: '“Urban Sanitation Hurrah” award', tag: 'Honours', pillarId: 'empower',
    location: 'New Delhi',
    blurb: 'Urban Sanitation magazine recognised the foundation’s sanitation work, especially at railway stations. Rev Sister Bindiya Chhabra Ji, Executive President, received the award.',
    photos: [],
    source: `${SITE}/2017/06/13/sncf-awarded-urban-sanitation-hurrah/`,
  },
  {
    id: 'red-cross-award-telangana-2017', kind: 'past', occurredOn: '2017-06-16', dateBasis: 'held',
    title: 'Excellent Performance Award for blood donation', tag: 'Honours', pillarId: 'heal',
    location: 'Raj Bhavan, Hyderabad',
    blurb: 'On World Blood Donor Day, the Indian Red Cross Society awarded the foundation for excellent performance in blood donation and motivation among NGOs in Telangana.',
    photos: [],
    source: `${SITE}/2017/07/27/excellent-performance-award-blood-donation/`,
  },
  {
    id: 'kerala-flood-relief-2018', kind: 'past', occurredOn: '2018-08-21', dateBasis: 'held',
    title: 'Kerala flood relief and rehabilitation', tag: 'Disaster relief', pillarId: 'empower',
    location: 'Aluva, Paravur and nearby areas, Kerala',
    blurb: 'After the 2018 floods, the foundation’s volunteers and Sewadal reached Kerala on 21 August. By 30 August they had given out 375 kits of food and household essentials and new clothes to over a thousand people, before a longer rehabilitation drive.',
    facts: [{ value: '375', label: 'Relief kits, 22–30 August' }, { value: '1,000+', label: 'People given new clothes' }],
    photos: [],
    source: `${SITE}/2018/09/04/brief-report-of-kerala-relief-and-rehabilitation-drive-by-sncf/`,
  },
  {
    id: 'adopted-village-school-2018', kind: 'past', occurredOn: '2018-10-04', dateBasis: 'held',
    title: 'Toilets and drinking water for a village school', tag: 'Adopted villages', pillarId: 'projects',
    location: 'Patti Kalyana, Haryana',
    blurb: 'In the adopted village of Patti Kalyana, a toilet and drinking-water block was inaugurated at the primary school by Rev. Bindiya Ji.',
    photos: [],
    source: `${SITE}/2018/12/20/construction-of-toilets-and-provision-of-drinking-water-for-school-children-by-sncf/`,
    href: '/projects#adopted-villages',
  },
  {
    id: 'saplings-in-a-day-2018', kind: 'past', occurredOn: '2018-10-27', dateBasis: 'held',
    title: '70,000 saplings in a day', tag: 'Tree plantation', pillarId: 'empower',
    location: 'Sant Nirankari Spiritual Complex, Samalkha',
    blurb: 'Having crossed one million saplings planted across India, the foundation set out to plant 70,000 in a day at Samalkha, beginning with a sapling planted by Satguru Mata Sudiksha Ji Maharaj.',
    facts: [{ value: '70,000', label: 'Saplings, in one day' }],
    photos: [],
    source: `${SITE}/2018/10/29/sncf-planted-70000-saplings-in-a-day/`,
  },
  {
    id: 'wheelchairs-samagam-2018', kind: 'past', occurredOn: '2018-11-26', dateBasis: 'held',
    title: 'Wheelchairs for the specially abled', tag: 'Persons with disabilities', pillarId: 'empower',
    location: '71st Nirankari Sant Samagam, Samalkha',
    blurb: 'With Messe Frankfurt, the foundation distributed advanced wheelchairs to specially abled persons on the third day of the 71st Nirankari Sant Samagam.',
    photos: [],
    source: `${SITE}/2018/11/28/sncf-and-messe-frankfurt-distributed-wheelchairs/`,
  },
  {
    id: 'watershed-programme-2018', kind: 'past', occurredOn: '2018-12-20', dateBasis: 'reported',
    title: 'Watershed programme begins in Maharashtra', tag: 'Watershed programme', pillarId: 'projects',
    location: 'Talasari, Palghar, Maharashtra',
    blurb: 'The foundation began a long-term development project in Talasari, Palghar district, adopting the village to carry out projects for its people — the start of its watershed programme.',
    photos: [],
    source: `${SITE}/2018/12/20/s-n-c-f-started-long-term-project-on-watershed-program-in-maharashtra/`,
    href: '/projects#watershed-programme',
  },
  {
    id: 'nvc-thane-2019', kind: 'past', occurredOn: '2019-01-26', dateBasis: 'reported',
    title: 'Nirankari Vocational Centre opens in Thane', tag: 'Nirankari Vocational Centre', pillarId: 'enrich',
    location: 'Sathe Nagar, Thane, Maharashtra',
    blurb: 'The foundation’s second Nirankari Vocational Centre in Maharashtra opened in Sathe Nagar, Thane, inaugurated by Satguru Mata Sudiksha Ji Maharaj before hundreds of young people seeking IT training.',
    photos: [],
    source: `${SITE}/2019/01/26/inauguration-of-2nd-nirankari-vocational-centre-in-thane-maharashtra/`,
  },
  {
    id: 'varanasi-flood-relief-2019', kind: 'past', occurredOn: '2019-09-23', dateBasis: 'held',
    title: 'Flood relief in Varanasi', tag: 'Disaster relief', pillarId: 'empower',
    location: 'Varanasi, Uttar Pradesh',
    blurb: 'About 100 volunteers distributed food and clean drinking water in the flood-affected areas of Varanasi.',
    facts: [{ value: '≈100', label: 'Volunteers' }],
    photos: [],
    source: `${SITE}/2019/09/30/helping-hands-to-flood-effected-area-in-varanasi/`,
  },
  {
    id: 'devdoot-award-2019', kind: 'past', occurredOn: '2019-09-27', dateBasis: 'reported',
    title: '“Devdoot Award” for flood relief in Vadodara', tag: 'Honours', pillarId: 'empower',
    location: 'Vadodara, Gujarat',
    blurb: 'Spark Today honoured the foundation with its Devdoot Award for selfless service during Vadodara’s floods; the city’s Mayor presented the trophy before thousands.',
    photos: [{ src: upload('2019/09/Devdoot-awards.jpg'), alt: 'The Devdoot Award plaque presented to the Sant Nirankari Charitable Foundation' }],
    source: `${SITE}/2019/09/27/sncf-honored-devdoot-award-by-spark-today/`,
  },
  {
    id: 'railway-stations-cleanliness-2019', kind: 'past', occurredOn: '2019-10-02', dateBasis: 'held',
    title: 'Cleanliness drive at 365 railway stations', tag: 'Swachh Bharat', pillarId: 'empower',
    location: 'Across India',
    blurb: 'On Gandhi Jayanti 2019, the foundation organised a mega cleanliness drive at 365 railway stations across India.',
    facts: [{ value: '365', label: 'Railway stations' }],
    photos: [],
    source: `${SITE}/2019/10/03/sncf-organized-mega-cleanliness-drive-at-365-railway-stations-pan-india-on-2nd-october-2019/`,
  },
  {
    id: 'covid-19-relief-2020', kind: 'past', occurredOn: '2020-04-17', dateBasis: 'reported',
    title: 'COVID-19 relief', tag: 'Disaster relief', pillarId: 'empower',
    location: 'Across India',
    blurb: 'Through the pandemic, nearly one lakh volunteers served in rotation, with PPE kits, masks, sanitisers and meals for frontline workers and migrant families — including 10,000 PPE kits worth ₹1.15 crore given to the Government of Delhi.',
    facts: [{ value: '10,000', label: 'PPE kits to the Government of Delhi' }, { value: '≈1 lakh', label: 'Volunteers serving' }],
    photos: [{ src: '/images/awards/pm-cares-2020.webp', alt: 'The Prime Minister’s post of 9 April 2020 lauding the Sant Nirankari Mandal’s contribution to PM-CARES' }],
    source: `${SITE}/2020/04/17/sncf-a-humble-effort-to-fight-against-covid-19/`,
    href: '/core-values#covid-relief',
  },
  {
    id: 'watershed-check-dam-2021', kind: 'past', occurredOn: '2021-02-21', dateBasis: 'held',
    title: 'Second check dam inaugurated in Palghar', tag: 'Watershed programme', pillarId: 'projects',
    location: 'Kasacha Utar, Saiwan, Palghar, Maharashtra',
    blurb: 'Under the watershed programme, a second cement nallah bund — a check dam — was inaugurated at Kasacha Utar in Saiwan village, Dahanu taluka.',
    photos: [],
    source: `${SITE}/2021/03/06/inauguration-of-second-cement-nallah-bund-c-n-b-at-kasacha-utar-saiwan-maharashtra/`,
    href: '/projects#watershed-programme',
  },
  {
    id: 'oneness-vann-launch-2021', kind: 'past', occurredOn: '2021-08-21', dateBasis: 'held',
    title: 'Oneness Vann begins', tag: 'Oneness Vann', pillarId: 'projects',
    location: 'Delhi',
    blurb: 'Satguru Mata Sudiksha Ji Maharaj launched the Oneness Vann urban forest campaign: around 350 locations in 280 cities across 22 states, with about 1,50,000 trees planted and cared for over the next three years.',
    facts: [{ value: '≈350', label: 'Locations' }, { value: '≈1,50,000', label: 'Trees planted' }],
    photos: [{ src: upload('2021/08/Satguru-Mata-Sudiksha-Ji-Maharaj-Inaugurated-Oneness-Vann-campaign.jpg'), alt: 'Satguru Mata Sudiksha Ji Maharaj launching the Oneness Vann campaign, August 2021' }],
    source: `${SITE}/2021/08/21/sant-nirankari-mission-commences-its-project-of-oneness-van-mini-forestation-drive-on-75th-independence-day-of-the-country/`,
    href: '/projects#project-oneness-vann',
  },
  {
    id: 'csr-summit-award-2024', kind: 'past', occurredOn: '2024-08-28', dateBasis: 'held',
    title: 'Most Impactful NGO of the Year', tag: 'Honours', pillarId: 'empower',
    location: 'Hotel Vivanta, Dwarka, New Delhi',
    blurb: 'At the 11th CSR Summit & Awards the foundation was named Most Impactful NGO of the Year; its Secretary, Shri Joginder Sukhija Ji, received the award on its behalf.',
    photos: [{ src: '/images/awards/csr-summit-most-impactful-ngo-2024.webp', alt: 'The foundation’s Secretary receiving the Most Impactful NGO of the Year award on stage' }],
    source: `${SITE}/2024/08/30/sant-nirankari-charitable-foundation-awarded-for-humanitarian-service/`,
    href: '/#awards-section',
  },
];

/** Dated reports that are an edition of a recurring event rather than a one-time milestone:
    they are shown on that event as its latest edition, not in the past events. */
export const SERIES_OF: Record<string, string> = {
  'yoga-day-mumbai-2026': 'international-yoga-day',
  'project-amrit-mumbai-2026': 'project-amrit',
  'humanness-blood-drive-toronto-2025': 'manav-ekta-diwas',
};
