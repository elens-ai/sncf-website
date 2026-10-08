/**
 * THE ROAD SO FAR — the moments whose photographs the Who We Are page's wall
 * brings in year by year (RoadWall.tsx, by way of roadYears.ts and
 * scripts/build-road-wall.ts). Each is the foundation's own record, as the site already
 * states it: the founding and its first programmes from the history it marks,
 * the honours from the awards register (data/awards.ts), and Sant Nirankari
 * Health City from the Health City's own news. A year may hold several; each
 * becomes a branch of its own. Not yet edited in the CMS: a list there will
 * take this one's place.
 */
export interface RoadEvent {
  id: string;
  year: number;
  title: string;
  text: string;
  /** a photograph of it (or, `logo`, a mark to show on white; or, `document`, a post or a certificate, which the
      tree shows as a badge since it cannot be read so small) */
  photo: string;
  alt: string;
  logo?: boolean;
  document?: boolean;
  /** where it is told more fully on the site */
  href?: string;
}

export const ROAD_EVENTS: RoadEvent[] = [
  {
    id: 'founded', year: 2010, title: 'Our beginning',
    text: 'The foundation is established as the Mission’s charitable arm.',
    photo: '/images/sncf-logo.webp', alt: 'The foundation’s seal', logo: true, href: '#account',
  },
  {
    id: 'scholarships', year: 2014, title: 'Learning opens doors',
    text: 'The Rajmata scholarship scheme begins supporting students on merit and means.',
    photo: '/images/programmes/scholarships-graduation.webp', alt: 'Scholarship students at their graduation', href: '/core-values#scholarships',
  },
  {
    id: 'adopted-villages', year: 2017, title: 'Villages adopted whole',
    text: 'The Adopted Villages programme begins in Haryana.',
    photo: '/images/programmes/adopted-villages-mandaura.webp', alt: 'A volunteer checks an elderly villager in Mandaura, an adopted village', href: '/projects#adopted-villages',
  },
  {
    id: 'pm-cares', year: 2020, title: 'Standing with the nation',
    text: 'The Prime Minister lauds the Sant Nirankari Mandal’s contribution to PM-CARES in the fight against COVID-19.',
    photo: '/images/awards/pm-cares-2020.webp', alt: 'The Prime Minister’s post of 9 April 2020 lauding the contribution to PM-CARES', document: true, href: '/#awards-section',
  },
  {
    id: 'ppe-kits', year: 2020, title: '10,000 PPE kits',
    text: 'The foundation commits 10,000 PPE kits for Delhi’s doctors and nurses.',
    photo: '/images/awards/delhi-ppe-kits-2020.webp', alt: 'The Chief Minister of Delhi’s post thanking the foundation for 10,000 PPE kits', document: true, href: '/#awards-section',
  },
  {
    id: 'oneness-vann', year: 2021, title: 'Growing together',
    text: 'Oneness Vann starts planting indigenous micro-forests across the country.',
    photo: '/images/programmes/oneness-vann-planting.webp', alt: 'Volunteers planting a Oneness Vann micro-forest', href: '/projects#project-oneness-vann',
  },
  {
    id: 'amrit', year: 2023, title: 'Reviving our water',
    text: 'Project Amrit launches with the Government of India to revive water bodies.',
    photo: '/images/programmes/amrit-riverbank.webp', alt: 'Project Amrit volunteers clearing a riverbank', href: '/projects#project-amrit',
  },
  {
    id: 'most-impactful', year: 2024, title: 'Most Impactful NGO of the Year',
    text: 'Named Most Impactful NGO of the Year at the 11th CSR Summit & Awards.',
    photo: '/images/awards/csr-summit-most-impactful-ngo-2024.webp', alt: 'The foundation’s Secretary receiving the award on stage', href: '/#awards-section',
  },
  {
    id: 'world-environment-day', year: 2024, title: 'World Environment Day',
    text: 'UNEP’s Certificate of Appreciation for the foundation’s part in World Environment Day 2024.',
    photo: '/images/awards/unep-world-environment-day-2024.webp', alt: 'UNEP’s World Environment Day 2024 Certificate of Appreciation', document: true, href: '/#awards-section',
  },
  {
    id: 'five-lakh-trees', year: 2024, title: 'Five lakh trees',
    text: 'Give Me Trees Trust commends the foundation for planting and tending 5,00,000 trees across 600+ sites.',
    photo: '/images/awards/give-me-trees-commendation-2024.webp', alt: 'The Certificate of Commendation from Give Me Trees Trust', document: true, href: '/#awards-section',
  },
  {
    id: 'health-city-dedicated', year: 2026, title: 'Health City dedicated',
    text: 'Sant Nirankari Health City is dedicated to the service of humanity on 23 February.',
    photo: '/images/projects/health-city/dedication.webp', alt: 'The ceremony dedicating Sant Nirankari Health City to the service of humanity', href: '/projects#health-city',
  },
  {
    id: 'health-city-opd', year: 2026, title: 'Its doors open',
    text: 'Sant Nirankari Health City opens its doors, its OPD services beginning on 17 August.',
    photo: '/images/projects/health-city/team.webp', alt: 'The Health City’s team gathered in the hospital’s atrium', href: '/projects#health-city',
  },
];
