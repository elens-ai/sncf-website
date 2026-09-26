import { bindCMSData, resolveAwards } from '../cms/data';

/**
 * Awards and recognitions.
 *
 * Transcribed from nirankarifoundation.org/honors-and-recognitions/ on
 * 2026-09-26. That page carries photographs only — no captions, titles or
 * years — so every field below is read off the certificate, plaque, letter
 * or post IN the photograph, never inferred. Where a piece shows no date it
 * is left without a year rather than given a plausible one. The pictures
 * are the foundation's own, copied at 1000 px.
 *
 * Leave it empty and the section shows the archival placeholder instead.
 * Both are designed states.
 */

export interface AwardPhoto {
  /** Path under public/, e.g. '/images/awards/manav-ekta-2019.webp'. */
  src: string;
  /**
   * What the photograph SHOWS — the ceremony, the trophy, the certificate.
   * Never the award title repeated; a screen reader already has the title
   * from the heading beside it.
   */
  alt: string;
  /**
   * Intrinsic pixel dimensions. Required, not optional: the tile reserves the
   * right box before the file arrives, so a photo landing late never shoves
   * the rest of the mosaic down the page.
   */
  width: number;
  height: number;
  /**
   * CSS object-position, e.g. '50% 30%'. The wall hangs mounts to their true
   * proportions but still crops with object-fit: cover, so without this a
   * portrait in a wide mount crops to somebody's chest.
   */
  focal?: string;
  /** Optional line shown beneath the photo in the lightbox. */
  caption?: string;
}

export interface Award {
  id: string;
  /** The award exactly as it is named on the certificate. */
  title: string;
  /** The organisation that conferred it. */
  awardedBy: string;
  /** Year conferred, as a string so ranges like '2019–2020' are allowed. */
  year: string;
  /** One line of context, if it needs any. */
  note?: string;
  /** The photographs of it. First one fronts the tile. */
  photos?: AwardPhoto[];
  /**
   * Give this one a double-width cell. Mark two or three at most — the point
   * is rhythm across the wall, and everything featured is nothing featured.
   */
  featured?: boolean;
}

export const DEFAULT_AWARDS: Award[] = [
  {
    id: 'csr-summit-most-impactful-ngo-2024',
    title: 'Most Impactful NGO of the Year',
    awardedBy: '11th CSR Summit & Awards',
    year: '2024',
    note: 'Received on 28 August 2024 at Hotel Vivanta, Dwarka, New Delhi, by the foundation’s Secretary, Shri Joginder Sukhija Ji. Source: nirankarifoundation.org, 30 August 2024.',
    featured: true,
    photos: [{
      src: '/images/awards/csr-summit-most-impactful-ngo-2024.jpg',
      alt: 'Shri Joginder Sukhija Ji receiving the trophy on stage beneath the words “Winner — Most Impactful NGO of the Year”',
      width: 318, height: 159, focal: '50% 40%',
      caption: 'The only photograph the foundation published of the evening, at the size it was posted.',
    }],
  },
  {
    id: 'nbtc-award-of-excellence-2016',
    title: 'Award of Excellence — World Blood Donor Day',
    awardedBy: 'National Blood Transfusion Council and NACO, Ministry of Health & Family Welfare, Government of India',
    year: '2016',
    note: 'Presented to Sant Nirankari Mission, New Delhi, on 14 June 2016 “for working towards 100% voluntary blood donation”.',
    photos: [{
      src: '/images/awards/nbtc-award-of-excellence-2016.jpg',
      alt: 'The framed Award of Excellence certificate, signed for the National Blood Transfusion Council and NACO',
      width: 1000, height: 796, focal: '50% 50%',
      caption: 'World Blood Donor Day 2016 — “Blood Connects Us All”.',
    }],
  },
  {
    id: 'toi-green-drive-letter-2018',
    title: 'Letter of Appreciation — Hero TOI Green Drive 2018',
    awardedBy: 'The Times of India (Bennett, Coleman & Co. Ltd.)',
    year: '2018',
    note: 'For planting 70,000 native saplings at Samalkha on 28 October 2018, and as “a constant support to Hero TOI Green Drive since its very inception in 2015”.',
    photos: [{
      src: '/images/awards/toi-green-drive-letter-2018.jpg',
      alt: 'The Times Group letter of appreciation, signed by the director of The Times of India brand, dated 12 December 2018',
      width: 748, height: 1000, focal: '50% 30%',
    }],
  },
  {
    id: 'toi-green-drive-2015',
    title: 'Highest participation — TOI Green Drive',
    awardedBy: 'The Times of India',
    year: '2015',
    note: 'The Times of India recorded the foundation as the drive’s largest contingent, with over 30,000 volunteers planting at Tilpath Valley, Delhi.',
    featured: true,
    photos: [
      {
        src: '/images/awards/toi-green-drive-2015-participation.jpg',
        alt: 'Times of India panel of 1 September 2015 headed “TOI Green Drive”, naming the foundation for the highest participation with over 30,000 volunteers',
        width: 955, height: 615, focal: '50% 50%',
        caption: 'The Times of India, New Delhi, 1 September 2015.',
      },
      {
        src: '/images/awards/toi-green-drive-2015-tilpath.jpg',
        alt: 'Newspaper report headed “40,000 paint Tilpath green in 6 hrs” with photographs of volunteers carrying saplings',
        width: 1000, height: 549, focal: '50% 40%',
        caption: 'Coverage of the planting day at Tilpath Valley.',
      },
      {
        src: '/images/awards/toi-green-drive-2015-delhi.jpg',
        alt: 'Newspaper report headed “For a greener, cleaner Delhi”, with Baba Hardev Singh Ji Maharaj planting a sapling',
        width: 1000, height: 549, focal: '50% 40%',
        caption: 'Baba Hardev Singh Ji Maharaj planting at the drive.',
      },
    ],
  },
  {
    id: 'pm-cares-2020',
    title: 'Appreciation for the PM-CARES contribution',
    awardedBy: 'Shri Narendra Modi, Prime Minister of India',
    year: '2020',
    note: '“I would like to laud the Sant Nirankari Mandal for contributing to PM-CARES and making the fight against COVID-19 even more effective.” — 9 April 2020.',
    photos: [{
      src: '/images/awards/pm-cares-2020.jpg',
      alt: 'The Prime Minister’s post of 9 April 2020 lauding the Sant Nirankari Mandal’s contribution to PM-CARES',
      width: 1000, height: 800, focal: '50% 50%',
    }],
  },
  {
    id: 'vadodara-swachhata-2019',
    title: 'Swachhata Competition 2019 — outstanding work',
    awardedBy: 'Vadodara Municipal Corporation',
    year: '2019',
    note: 'A plaque, in Gujarati, with the corporation’s best wishes for the foundation’s outstanding work in the 2019 cleanliness competition.',
    photos: [{
      src: '/images/awards/vadodara-swachhata-2019.jpg',
      alt: 'A plaque shaped as a tree over the Laxmi Vilas Palace, inscribed in Gujarati by the Vadodara Municipal Corporation',
      width: 1000, height: 759, focal: '50% 55%',
    }],
  },
  {
    id: 'rpf-northern-railway-2022',
    title: 'Thanks from the Railway Protection Force',
    awardedBy: 'RPF, Northern Railway',
    year: '2022',
    note: 'For accommodating the RPF motorcyclists of the Azadi Ka Amrit Mahotsav rally — 17 August 2022.',
    photos: [{
      src: '/images/awards/rpf-northern-railway-2022.jpg',
      alt: 'RPF Northern Railway’s post of 17 August 2022 thanking the Mission for hosting its rally motorcyclists',
      width: 1000, height: 588, focal: '50% 50%',
    }],
  },
  {
    id: 'swachh-bharat-mission-memento',
    title: 'Swachh Bharat Mission memento',
    awardedBy: 'Swachh Bharat Mission',
    year: '',
    note: 'The gilded spectacles of the Swachh Bharat emblem — “Ek kadam swachhata ki ore”. No year is recorded on the piece.',
    photos: [{
      src: '/images/awards/swachh-bharat-mission-memento.jpg',
      alt: 'A gilded memento of the Swachh Bharat Mission spectacles on a plinth',
      width: 1000, height: 666, focal: '50% 50%',
    }],
  },
  {
    id: 'swachh-rail-bct',
    title: 'Swachh Rail Swachh Bharat Abhiyan at Mumbai Central',
    awardedBy: 'Ministry of Railways',
    year: '',
    note: 'The Ministry’s post on the campaign at BCT “with help of Sant Nirankari volunteers”. The post shows no date.',
    photos: [{
      src: '/images/awards/swachh-rail-bct.jpg',
      alt: 'Ministry of Railways post showing rows of volunteers seated at Mumbai Central for the Swachh Rail campaign',
      width: 717, height: 668, focal: '50% 45%',
    }],
  },
];

export let AWARDS: Award[] = bindCMSData(DEFAULT_AWARDS, resolveAwards, value => { AWARDS = value; });
