import { bindCMSData, resolveAwards } from '../cms/data';

/**
 * Awards and recognitions.
 *
 * Transcribed from nirankarifoundation.org/honors-and-recognitions/ on
 * 2026-09-26, and from the foundation's own copies of its certificates,
 * letters, mementos and posts, supplied on 2026-10-05. Neither carries
 * captions, so every field below is read off the certificate, plaque, letter
 * or post IN the photograph, never inferred; words in Hindi or Gujarati are
 * given in English and said to be. Where a piece shows no date it is left
 * without a year rather than given a plausible one. Newest first; the
 * undated last. The pictures are the foundation's own, at up to 1200 px.
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

export type RecognitionCategory = 'tweets' | 'awards' | 'press';

export interface Award {
  /** Archive section; optional for publications created before the sections were split. */
  category?: RecognitionCategory;
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
    category: 'awards',
    title: 'Most Impactful NGO of the Year',
    awardedBy: '11th CSR Summit & Awards 2024, UBS Forums',
    year: '2024',
    note: 'Received on 28 August 2024 at Hotel Vivanta, Dwarka, New Delhi, by the foundation’s Secretary, Shri Joginder Sukhija Ji. Source: nirankarifoundation.org, 30 August 2024.',
    featured: true,
    photos: [
      {
        src: '/images/awards/csr-summit-most-impactful-ngo-2024.webp',
        alt: 'Shri Joginder Sukhija Ji receiving the trophy on stage, the backdrop naming the foundation Most Impactful NGO of the Year',
        width: 1123, height: 1200, focal: '50% 40%',
        caption: 'On stage at the 11th CSR Summit & Awards.',
      },
      {
        src: '/images/awards/csr-summit-most-impactful-ngo-2024-trophy.webp',
        alt: 'The glass trophy of the 11th Edition Corporate Social Responsibility Summit & Awards 2024: “Most Impactful NGO of the Year — Sant Nirankari Charitable Foundation — Winner”',
        width: 757, height: 1200, focal: '50% 50%',
      },
    ],
  },
  {
    id: 'give-me-trees-commendation-2024',
    category: 'awards',
    title: 'Certificate of Commendation — 5,00,000 trees',
    awardedBy: 'Give Me Trees Trust',
    year: '2024',
    note: '“In recognition of outstanding contribution to the environment”: for planting 5,00,000 trees and maintaining them across 600+ sites pan India. Signed by Swami Prem Parivartan, Managing Trustee, on 18 November 2024.',
    photos: [{
      src: '/images/awards/give-me-trees-commendation-2024.webp',
      alt: 'The framed Certificate of Commendation from Give Me Trees Trust, awarded to the Sant Nirankari Charitable Foundation',
      width: 910, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'ltmg-sion-lions-club-2024',
    category: 'awards',
    title: 'Certificate of Appreciation — blood donation drives',
    awardedBy: 'Blood Centre, Lokmanya Tilak Municipal General Hospital, Sion, with the Lions Club of (Bombay) Mahanagar',
    year: '2024',
    note: 'A certificate for “exemplary service in blood donation drives”: 105 units of blood from January 2023 to March 2024. A plaque “towards exceptional contribution for humanitarian service” bears the same date: 8 October 2024, LTMG Sion Hospital, Mumbai.',
    photos: [
      {
        src: '/images/awards/ltmg-sion-lions-club-2024.webp',
        alt: 'The Certificate of Appreciation from the LTMG Hospital Sion blood centre and Lions Clubs International District 3231-A1, made out to the “Santa Nirankari Mission”',
        width: 1200, height: 1045, focal: '50% 50%',
      },
      {
        src: '/images/awards/ltmg-sion-lions-club-2024-plaque.webp',
        alt: 'The Lions Clubs International plaque presented to the Mission “towards exceptional contribution for humanitarian service”, dated 8 October 2024',
        width: 794, height: 1200, focal: '50% 50%',
      },
    ],
  },
  {
    id: 'nbtc-ngo-conclave-2024',
    category: 'awards',
    title: 'Certificate of Appreciation — India Blood Donation NGO Conclave 2024',
    awardedBy: 'National Blood Transfusion Council, Ministry of Health & Family Welfare, with the Akhil Bhartiya Terapanth Yuvak Parishad',
    year: '2024',
    note: 'For taking part, as an NGO, in the commemoration of National Voluntary Blood Donors Day in Jaipur, Rajasthan, on 1 October 2024, organised by the Blood Transfusion Services, DGHS.',
    photos: [{
      src: '/images/awards/nbtc-ngo-conclave-2024.webp',
      alt: 'The Certificate of Appreciation for the India Blood Donation NGO Conclave 2024, signed by the Director of NBTC and the President of ABTYP',
      width: 1200, height: 884, focal: '50% 50%',
    }],
  },
  {
    id: 'unep-world-environment-day-2024',
    category: 'awards',
    title: 'Certificate of Appreciation — World Environment Day 2024',
    awardedBy: 'United Nations Environment Programme (UNEP)',
    year: '2024',
    note: 'Congratulating the foundation, from Naini Tal, Uttarakhand, for contributing to World Environment Day 2024 and “joining the #GenerationRestoration movement”.',
    photos: [{
      src: '/images/awards/unep-world-environment-day-2024.webp',
      alt: 'UNEP’s World Environment Day 2024 Certificate of Appreciation made out to the Sant Nirankari Charitable Foundation, Naini Tal',
      width: 1090, height: 1046, focal: '50% 50%',
    }],
  },
  {
    id: 'red-cross-telangana-2024',
    category: 'awards',
    title: 'Highest Blood Donor Motivator — World Blood Donor Day 2024',
    awardedBy: 'Indian Red Cross Society, Telangana Branch',
    year: '2024',
    note: 'Presented on World Blood Donor Day, 14 June 2024, to Rev. Mohini Ahuja Garu, Zonal Incharge (AP & TG), Sant Nirankari Mandal: 461 units collected.',
    photos: [{
      src: '/images/awards/red-cross-telangana-2024.webp',
      alt: 'The Indian Red Cross Society, Telangana, trophy for the “Highest Blood Donor Motivator”, World Blood Donor Day 2024',
      width: 623, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'gmers-junagadh-blood-donor-day-2024',
    category: 'awards',
    title: 'Memento for the best work in blood donation',
    awardedBy: 'Blood Centre, GMERS Medical College & Hospital, Junagadh',
    year: '2024',
    note: 'A memento, in Gujarati, for World Blood Donor Day, 14 June 2024, to the Sant Nirankari Charitable Foundation, Junagadh, as camp organiser, applauding its efforts to bring awareness of blood donation to society.',
    photos: [{
      src: '/images/awards/gmers-junagadh-blood-donor-day-2024.webp',
      alt: 'A memento shaped as a blood drop, inscribed in Gujarati by GMERS Medical College & Hospital, Junagadh, for World Blood Donor Day 2024',
      width: 757, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'iit-roorkee-thomso-2024',
    category: 'awards',
    title: 'Appreciation — Thomso’24',
    awardedBy: 'IIT Roorkee',
    year: '2024',
    note: '“With heartfelt appreciation, we acknowledge your invaluable contribution to the success of Thomso’24”: A Crossroad of Cultures.',
    photos: [{
      src: '/images/awards/iit-roorkee-thomso-2024.webp',
      alt: 'A thank-you certificate from IIT Roorkee for Thomso’24, bordered in bright colours',
      width: 849, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'divyang-para-sports-2024',
    category: 'awards',
    title: 'Guest of Honour — Delhi State Para-Athletics & Para-Powerlifting Championships',
    awardedBy: 'Divyang Para Sports Association of Delhi',
    year: '2024–25',
    note: '“A memento with our greatest appreciation for your commitment and support to us”, presented to the foundation as Guest of Honour at the inaugural event of the 2nd Delhi State Para-Athletics Championship and the 2nd Delhi State Para-Powerlifting Championship, Jawaharlal Nehru Stadium, New Delhi.',
    photos: [{
      src: '/images/awards/divyang-para-sports-2024.webp',
      alt: 'A memento on a red stand with the map of India and the national emblem, presented by the Divyang Para Sports Association of Delhi',
      width: 1158, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'mdacs-blood-donation-day-2023',
    category: 'awards',
    title: 'Certificate of Appreciation — National Voluntary Blood Donation Day 2023',
    awardedBy: 'Mumbai Districts AIDS Control Society, Brihanmumbai Mahanagarpalika',
    year: '2023',
    note: 'On National Voluntary Blood Donation Day, 1 October 2023, to the Sant Nirankari Mission “for their exemplary service as a voluntary blood donation camp organiser”.',
    photos: [{
      src: '/images/awards/mdacs-blood-donation-day-2023.webp',
      alt: 'The Certificate of Appreciation from the Mumbai Districts AIDS Control Society, made out to the Sant Nirankari Mission',
      width: 1173, height: 1018, focal: '50% 50%',
    }],
  },
  {
    id: 'ministry-of-culture-project-amrit-2023',
    category: 'tweets',
    title: 'Swachh Jal Swachh Mann — Project Amrit',
    awardedBy: 'Ministry of Culture, Government of India',
    year: '2023',
    note: 'The Ministry’s post of 25 February 2023: “Project Amrit brings to you, ‘Swachh Jal Swachh Mann’ — a mission to conserve and preserve natural and manmade water bodies across 700 cities in our nation”, with the Mission’s poster for 26 February 2023.',
    photos: [{
      src: '/images/awards/ministry-of-culture-project-amrit-2023.webp',
      alt: 'The Ministry of Culture’s post sharing the Sant Nirankari Mission’s Swachh Jal Swachh Mann poster: 1,000+ locations over 700+ cities, 26 February 2023',
      width: 868, height: 1200, focal: '50% 40%',
    }],
  },
  {
    id: 'aiims-blood-donation-day-2022',
    category: 'awards',
    title: 'Thank you — National Voluntary Blood Donation Day 2022',
    awardedBy: 'Blood Centre, Main Hospital, AIIMS New Delhi, with the BTS Division, DGHS, Ministry of Health & Family Welfare',
    year: '2022',
    note: 'A silver tray presented to Sant Nirankari Mandal on 1 October 2022, “for your wholeheartedness & enthusiasm in supporting voluntary blood donation”.',
    photos: [{
      src: '/images/awards/aiims-blood-donation-day-2022.webp',
      alt: 'An engraved silver tray from the AIIMS New Delhi blood centre, presented to Sant Nirankari Mandal',
      width: 888, height: 915, focal: '50% 50%',
    }],
  },
  {
    id: 'indian-blind-sports-association-2022',
    category: 'tweets',
    title: 'Recognition of the Sant Nirankari Sewadal',
    awardedBy: 'Indian Blind Sports Association',
    year: '2022',
    note: 'The association’s post of 13 December 2022: the Sant Nirankari Sewadal is “a group of volunteers of the Sant Nirankari Mission dedicated to the selfless service of the humankind”.',
    photos: [{
      src: '/images/awards/indian-blind-sports-association-2022.webp',
      alt: 'The Indian Blind Sports Association’s post with photographs of Sewadal volunteers serving meals in a dining tent',
      width: 1200, height: 1016, focal: '50% 50%',
    }],
  },
  {
    id: 'rpf-northern-railway-2022',
    category: 'tweets',
    title: 'Thanks from the Railway Protection Force',
    awardedBy: 'RPF, Northern Railway',
    year: '2022',
    note: 'For accommodating the RPF motorcyclists of the Azadi Ka Amrit Mahotsav rally — 17 August 2022.',
    photos: [{
      src: '/images/awards/rpf-northern-railway-2022.webp',
      alt: 'RPF Northern Railway’s post of 17 August 2022 thanking the Mission for hosting its rally motorcyclists',
      width: 1200, height: 780, focal: '50% 50%',
    }],
  },
  {
    id: 'give-me-trees-sonepat-2022',
    category: 'tweets',
    title: 'Oneness Vann — 2,000 saplings at Sonepat',
    awardedBy: 'Give Me Trees Trust',
    year: '2022',
    note: 'The trust’s post of 24 February 2022: 2,000 saplings planted that day at Sonepat, Haryana, under Oneness Vann, a nation-wide project of the Mission, then at work on 337 sites across India. “Volunteers of the mission have done a great job, born out of love and devotion.”',
    photos: [{
      src: '/images/awards/give-me-trees-sonepat-2022.webp',
      alt: 'Give Me Trees Trust’s post with photographs of volunteers in blue planting saplings at Sonepat, Haryana',
      width: 1200, height: 1049, focal: '50% 50%',
    }],
  },
  {
    id: 'peepal-baba-oneness-vann-2021',
    category: 'tweets',
    title: 'Oneness Vann plantations — Ambala, Yamunanagar and Kurukshetra',
    awardedBy: 'Swami Prem Parivartan (Peepal Baba)',
    year: '2021',
    note: 'His post of 15 October 2021 on the plantation work done under the Oneness Vann programme of Sant Nirankari Mandal in Ambala, Yamunanagar and Kurukshetra.',
    photos: [{
      src: '/images/awards/peepal-baba-oneness-vann-2021.webp',
      alt: 'Peepal Baba’s post with photographs of uniformed volunteers gathered around a sapling, and of three people talking among trees',
      width: 1200, height: 662, focal: '50% 50%',
    }],
  },
  {
    id: 'zee-news-covid-centre-2021',
    category: 'press',
    title: 'Delhi’s temporary COVID-19 centre — in the news',
    awardedBy: 'Zee News English',
    year: '2021',
    note: '22 April 2021: “The Delhi government, in association with the Sant Nirankari Mission, has set up a temporary COVID-19 centre with 1000 beds.”',
    photos: [{
      src: '/images/awards/zee-news-covid-centre-2021.webp',
      alt: 'Zee News English’s post with a photograph of rows of beds at the temporary COVID-19 centre',
      width: 1200, height: 1173, focal: '50% 50%',
    }],
  },
  {
    id: 'pm-cares-2020',
    category: 'tweets',
    title: 'Appreciation for the PM-CARES contribution',
    awardedBy: 'Shri Narendra Modi, Prime Minister of India',
    year: '2020',
    note: '“I would like to laud the Sant Nirankari Mandal for contributing to PM-CARES and making the fight against COVID-19 even more effective.” — 9 April 2020.',
    photos: [{
      src: '/images/awards/pm-cares-2020.webp',
      alt: 'The Prime Minister’s post of 9 April 2020 lauding the Sant Nirankari Mandal’s contribution to PM-CARES',
      width: 1097, height: 1179, focal: '50% 50%',
    }],
  },
  {
    id: 'haryana-corona-relief-fund-2020',
    category: 'tweets',
    title: 'Thanks for the Haryana Corona Relief Fund contribution',
    awardedBy: 'Shri Manohar Lal, Chief Minister of Haryana',
    year: '2020',
    note: 'His post of 8 April 2020, in Hindi, thanking Sant Nirankari Mandal, Delhi, for contributing ₹51 lakh to the Haryana Corona Relief Fund in the fight against the coronavirus.',
    photos: [{
      src: '/images/awards/haryana-corona-relief-fund-2020.webp',
      alt: 'Shri Manohar Lal’s post with a photograph of the contribution being handed over',
      width: 909, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'delhi-ppe-kits-2020',
    category: 'tweets',
    title: 'Thanks for 10,000 PPE kits',
    awardedBy: 'Shri Arvind Kejriwal, Chief Minister of Delhi',
    year: '2020',
    note: '“On behalf of Delhi’s doctors and nurses, I offer my heartfelt thanks to the Sant Nirankari Charitable Foundation for committing 10,000 PPE kits.” — 8 April 2020.',
    photos: [{
      src: '/images/awards/delhi-ppe-kits-2020.webp',
      alt: 'Shri Arvind Kejriwal’s post quoting the foundation’s commitment of 10,000 PPE kits for doctors and front liners in Delhi',
      width: 1200, height: 696, focal: '50% 50%',
    }],
  },
  {
    id: 'aajtak-north-delhi-sanitisation-2020',
    category: 'press',
    title: 'Sanitising North Delhi with the fire brigade — in the news',
    awardedBy: 'Aaj Tak',
    year: '2020',
    note: 'Aaj Tak reported on 8 April 2020, in Hindi, on the Mission’s youth sanitising homes, lanes and vehicles in Mukherjee Nagar and Model Town with the fire brigade.',
    photos: [{
      src: '/images/awards/aajtak-north-delhi-sanitisation-2020.webp',
      alt: 'Aaj Tak’s post of a reporter’s video from North Delhi, volunteers on a fire engine behind him',
      width: 1083, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'vadodara-swachhata-2019',
    category: 'awards',
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
    id: 'toi-green-drive-letter-2018',
    category: 'awards',
    title: 'Letter of Appreciation — Hero TOI Green Drive 2018',
    awardedBy: 'The Times of India (Bennett, Coleman & Co. Ltd.)',
    year: '2018',
    note: 'For planting 70,000 native saplings at Samalkha on 28 October 2018, and as “a constant support to Hero TOI Green Drive since its very inception in 2015”.',
    photos: [{
      src: '/images/awards/toi-green-drive-letter-2018.webp',
      alt: 'The Times Group letter of appreciation, signed by the director of The Times of India brand, dated 12 December 2018',
      width: 905, height: 1200, focal: '50% 30%',
    }],
  },
  {
    id: 'life-chiropractic-college-west-2017',
    category: 'awards',
    title: 'Service to Humanity Award',
    awardedBy: 'Dr. Ronald Oberstein, President, and the Board of Regents, Life Chiropractic College West',
    year: '2017',
    note: 'Thanking Her Holiness Satguru Mata Savinder Hardev Ji, in memory of His Holiness Satguru Baba Hardev Singh Ji, “for their vision and dedication to serving humanity through chiropractic and making the world a healthier place to live” — 4 August 2017.',
    photos: [{
      src: '/images/awards/life-chiropractic-college-west-2017.webp',
      alt: 'A glass trophy engraved by the Life Chiropractic College West, on a plinth reading “Service To Humanity Award, August 4, 2017”',
      width: 766, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'nbtc-award-of-excellence-2016',
    category: 'awards',
    title: 'Award of Excellence — World Blood Donor Day',
    awardedBy: 'National Blood Transfusion Council and NACO, Ministry of Health & Family Welfare, Government of India',
    year: '2016',
    note: 'Presented to Sant Nirankari Mission, New Delhi, on 14 June 2016 “for working towards 100% voluntary blood donation”.',
    photos: [{
      src: '/images/awards/nbtc-award-of-excellence-2016.webp',
      alt: 'The Award of Excellence certificate, signed for the National Blood Transfusion Council and NACO',
      width: 1200, height: 1007, focal: '50% 50%',
      caption: 'World Blood Donor Day 2016 — “Blood Connects Us All”.',
    }],
  },
  {
    id: 'apj-abdul-kalam-world-peace-award-2016',
    category: 'awards',
    title: 'Dr. APJ Abdul Kalam World Peace Award — 2016',
    awardedBy: 'All India Council of Human Rights',
    year: '2016',
    note: 'The Council’s post of 10 May 2018 on the award, for 2016, “upon Baba Hardev Singh Ji Maharaj, former Head of the Sant Nirankari Mission”.',
    photos: [{
      src: '/images/awards/apj-abdul-kalam-world-peace-award-2016.webp',
      alt: 'The All India Council of Human Rights’ post on the Dr. APJ Abdul Kalam World Peace Award 2016',
      width: 1200, height: 546, focal: '50% 50%',
    }],
  },
  {
    id: 'queens-golden-jubilee-award-2015',
    category: 'awards',
    title: 'The Queen’s Golden Jubilee Award for voluntary service by groups in the community',
    awardedBy: 'Her Majesty Queen Elizabeth II',
    year: '2015',
    note: 'Conferred on the Sant Nirankari Mission, “contributing to a broad range of initiatives in order to create a sense of oneness and harmony within the local area”, given at the Court of Saint James’s on 2 June 2015.',
    photos: [{
      src: '/images/awards/queens-golden-jubilee-award-2015.webp',
      alt: 'The framed royal warrant of The Queen’s Golden Jubilee Award 2015, signed “Elizabeth R”',
      width: 1008, height: 1180, focal: '50% 50%',
    }],
  },
  {
    id: 'toi-green-drive-2015',
    category: 'awards',
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
    id: 'brampton-blood-donor-clinic-2012',
    category: 'awards',
    title: 'Best wishes on the 19th Blood Donor Clinic, Brampton',
    awardedBy: 'Mayor Susan Fennell, City of Brampton',
    year: '2012',
    note: 'To Sant Nirankari Mission Canada Inc., on behalf of the Members of Council of the City of Brampton: “Thank you for your dedication to this noble cause and our community.” — 27 October 2012.',
    photos: [{
      src: '/images/awards/brampton-blood-donor-clinic-2012.webp',
      alt: 'A framed letter from the Mayor of Brampton, with the mayor’s portrait and gold seal',
      width: 911, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'salvation-army-brampton-2011',
    category: 'awards',
    title: 'Certificate of Appreciation — the Brampton food bank',
    awardedBy: 'The Salvation Army, Canada and Bermuda Territory',
    year: '2011',
    note: 'Presented to His Holiness Baba Hardev Singh Ji Maharaj “in recognition of the partnership between The Salvation Army, Brampton and The Sant Nirankari Mission Canada and for the tremendous support given to our food bank” — 28 August 2011, at the Eastern Canada Convention.',
    photos: [{
      src: '/images/awards/salvation-army-brampton-2011.webp',
      alt: 'The Salvation Army’s Certificate of Appreciation presented to His Holiness Baba Hardev Singh Ji Maharaj',
      width: 960, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'namami-gange-project-amrit',
    category: 'tweets',
    title: 'Swachh Jal Swachh Mann — 1,100 water bodies',
    awardedBy: 'Namami Gange, National Mission for Clean Ganga',
    year: '',
    note: 'Its post, in Hindi: about 2 lakh people took part in the Mission’s Swachh Jal Swachh Mann drive under Project Amrit, cleaning 1,100 water bodies in some 700 cities of 27 states. The post shows no date.',
    photos: [{
      src: '/images/awards/namami-gange-project-amrit.webp',
      alt: 'Namami Gange’s post with the Project Amrit poster and photographs of volunteers cleaning a riverbank',
      width: 1153, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'amrit-mahotsav-project-amrit',
    category: 'tweets',
    title: 'Project Amrit, shared by Azadi Ka Amrit Mahotsav',
    awardedBy: 'Azadi Ka Amrit Mahotsav',
    year: '',
    note: 'The official account shared, under #ProjectAmrit, a clean-up video posted with the line, in Hindi, “If there is magic on this planet, it is contained in water.” The post shows no date.',
    photos: [{
      src: '/images/awards/amrit-mahotsav-project-amrit.webp',
      alt: 'The Amrit Mahotsav post: two volunteers in blue holding open a bag at a clean-up',
      width: 723, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'gautam-gambhir-project-amrit',
    category: 'tweets',
    title: 'Congratulations on Project Amrit',
    awardedBy: 'Shri Gautam Gambhir',
    year: '',
    note: 'His post, in Hindi, on Project Amrit, inspired by Baba Hardev Singh Ji, which cleaned 1,100+ water sources in 700+ cities of 27+ states: “This is especially praiseworthy work. That is why I congratulate you all.” The post shows no date.',
    photos: [{
      src: '/images/awards/gautam-gambhir-project-amrit.webp',
      alt: 'Shri Gautam Gambhir’s post with photographs of a sapling being planted, the Project Amrit stage, and volunteers along a riverbank',
      width: 897, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'youth4water-sambalpur',
    category: 'tweets',
    title: 'Project Amrit at Sambalpur',
    awardedBy: 'Youth4Water Plus',
    year: '',
    note: '“Youth4Water Plus with partnership with Sant Nirankari Charitable Foundation launched Project Amrit (Swachh Jal Swachh Mann) at Sambalpur on the occasion of 75th Amrit Mahotsav by Sant Nirankari Mission. Kudos to Youths of Sambalpur.” Its date is cut off in the copy.',
    photos: [{
      src: '/images/awards/youth4water-sambalpur.webp',
      alt: 'Youth4Water Plus’s post with photographs of volunteers clearing the steps and banks of a waterside at Sambalpur',
      width: 691, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'nasha-mukt-bharat-mou',
    category: 'tweets',
    title: 'MoU under the Nasha Mukt Bharat Abhiyan',
    awardedBy: 'Department of Social Justice & Empowerment, Government of India',
    year: '',
    note: 'The Ministry’s post: the Department signed an MoU with the Sant Nirankari Mandal under the Nasha Mukt Bharat Abhiyan, in the presence of Dr. Virendra Kumar, Union Minister of Social Justice & Empowerment. The post shows no date.',
    photos: [{
      src: '/images/awards/nasha-mukt-bharat-mou.webp',
      alt: 'The Ministry of Social Justice & Empowerment’s post announcing the MoU with the Sant Nirankari Mandal',
      width: 1200, height: 545, focal: '50% 50%',
    }],
  },
  {
    id: 'health-minister-memento',
    category: 'awards',
    title: 'A memento from the Union Health Minister',
    awardedBy: 'Dr. Mansukh Mandaviya, Union Minister of Health & Family Welfare',
    year: '',
    note: 'Presented on stage; the name plate on the dais reads “Dr. Mansukh Mandaviya”, Union Minister of Health & Family Welfare and of Chemicals & Fertilizers. The photograph shows no date or occasion.',
    photos: [{
      src: '/images/awards/health-minister-memento.webp',
      alt: 'A memento being presented on stage, the name plate of Dr. Mansukh Mandaviya on the dais behind',
      width: 915, height: 1200, focal: '50% 40%',
    }],
  },
  {
    id: 'red-cross-haryana-blood-donors',
    category: 'awards',
    title: 'Honoured by the Indian Red Cross Society, Haryana',
    awardedBy: 'Indian Red Cross Society, Haryana State Branch',
    year: '',
    note: 'A memento presented on stage at the Haryana State Branch’s function for World Blood Donor Day, as its banner, in Hindi, reads. The photograph shows no year.',
    photos: [{
      src: '/images/awards/red-cross-haryana-blood-donors.webp',
      alt: 'A memento presented on stage before the banner of the Indian Red Cross Society, Haryana',
      width: 1038, height: 1200, focal: '50% 40%',
    }],
  },
  {
    id: 'earth-day-network-india',
    category: 'awards',
    title: 'Commendation — Earth Day Network India',
    awardedBy: 'Earth Day Network India (EARTHDAY.ORG)',
    year: '',
    note: '“For extraordinary efforts to protect Earth’s natural resources and help keep it clean, green, and less polluted so that humans can continue to live on this planet.” Signed by Kathleen Rogers, President, and Karuna A Singh, Regional Director Asia. It gives no date.',
    photos: [{
      src: '/images/awards/earth-day-network-india.webp',
      alt: 'The framed Earth Day Network India commendation for the Sant Nirankari Charitable Foundation',
      width: 909, height: 1200, focal: '50% 50%',
    }],
  },
  {
    id: 'swachh-bharat-mission-memento',
    category: 'awards',
    title: 'Swachh Bharat Mission memento',
    awardedBy: 'Swachh Bharat Mission',
    year: '',
    note: 'The gilded spectacles of the Swachh Bharat emblem — “Ek kadam swachhata ki ore”. No year is recorded on the piece.',
    photos: [{
      src: '/images/awards/swachh-bharat-mission-memento.webp',
      alt: 'A gilded memento of the Swachh Bharat Mission spectacles on a plinth',
      width: 1200, height: 752, focal: '50% 50%',
    }],
  },
  {
    id: 'swachh-rail-bct',
    category: 'tweets',
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
