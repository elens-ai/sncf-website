/**
 * HOW EACH COMPANION IS SHOWN — wall wordmark, brand ink, logo file,
 * monogram fallback.
 *
 * Lived inside PartnersSection until the Who We Are page needed the same
 * nine logo files and the same three monograms. Two copies of a map keyed by
 * partner id is two places for a logo path to rot, so it is data now.
 *
 * The three without a `logo` publish no usable icon: two served a CMS
 * default and one's site is gone. They get a monogram, which is why every
 * consumer must handle the missing case rather than assuming a file.
 */
export interface PartnerBrand {
  /** Short enough to set on a wall tile. */
  short: string;
  /** The organisation's own ink. NEVER paint type in it raw — several are
      under 3:1 on white (KSCF's #ee7623 measures 2.90:1); cut it toward the
      page ink first. */
  color: string;
  logo?: string;
  initials: string;
}

export const BRAND: Record<string, PartnerBrand> = {
  un: { short: 'United Nations', color: '#009edb', logo: '/images/partners/un.png', initials: 'UN' },
  railways: { short: 'Indian Railways', color: '#c8102e', logo: '/images/partners/railways.png', initials: 'IR' },
  'red-cross': { short: 'Indian Red Cross', color: '#ed1b2e', logo: '/images/partners/red-cross.png', initials: 'RC' },
  'life-west': { short: 'Life West', color: '#0077c8', logo: '/images/partners/life-west.svg', initials: 'LW' },
  'urban-development': { short: 'Urban Development', color: '#2e3092', logo: '/images/partners/urban-development.png', initials: 'UD' },
  ksct: { short: 'KSCF', color: '#ee7623', initials: 'KS' },
  ndtv: { short: 'NDTV', color: '#e4002b', logo: '/images/partners/ndtv.png', initials: 'ND' },
  toi: { short: 'Times of India', color: '#bb0000', logo: '/images/partners/toi.png', initials: 'TOI' },
  niit: { short: 'NIIT', color: '#ed1c24', logo: '/images/partners/niit.png', initials: 'NT' },
  singer: { short: 'Singer India', color: '#d21f2f', logo: '/images/partners/singer.png', initials: 'SI' },
  'blind-relief': { short: 'Blind Relief Assn.', color: '#1b7a5a', initials: 'BR' },
  ebai: { short: 'Eye Bank Assn.', color: '#1273b8', initials: 'EB' },
};
