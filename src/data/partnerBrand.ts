import { bindCMSData } from '../cms/data';
import { isRecord, safeCMSURL } from '../cms/runtime';

/**
 * HOW EACH COMPANION IS SHOWN — wall wordmark, brand ink, logo file,
 * monogram fallback.
 *
 * Lived inside PartnersSection until the Who We Are page needed the same
 * logo files and monograms. Two copies of a map keyed by partner id is two
 * places for a logo path to rot, so it is data now.
 *
 * UNEP's, Life West's, EBAI's, KSCF's and the Blind Relief Association's
 * marks are cut from the foundation's own "Our Partners" panel (UNEP's, in a
 * single ink, set in the UN's blue so it reads on a white badge). AIIMS,
 * Pracheen Kala Kendra, Nasha Mukt Bharat, Delhi Athletics and the Divyang
 * Para Sports Association have no file yet and get a monogram, which is why
 * every consumer must handle the missing case rather than assuming a file.
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

export const DEFAULT_BRAND: Record<string, PartnerBrand> = {
  unep: { short: 'UNEP', color: '#009edb', logo: '/images/partners/unep.png', initials: 'UNEP' },
  aiims: { short: 'AIIMS', color: '#1d4f91', initials: 'AIIMS' },
  'red-cross': { short: 'Indian Red Cross', color: '#ed1b2e', logo: '/images/partners/red-cross.png', initials: 'RC' },
  'life-west': { short: 'Life West', color: '#0077c8', logo: '/images/partners/life-west.png', initials: 'LW' },
  ebai: { short: 'Eye Bank Assn.', color: '#1273b8', logo: '/images/partners/ebai.png', initials: 'EB' },
  niit: { short: 'NIIT', color: '#ed1c24', logo: '/images/partners/niit.png', initials: 'NT' },
  singer: { short: 'Singer India', color: '#d21f2f', logo: '/images/partners/singer.png', initials: 'SI' },
  'blind-relief': { short: 'Blind Relief Assn.', color: '#1b7a5a', logo: '/images/partners/blind-relief.png', initials: 'BR' },
  railways: { short: 'Indian Railways', color: '#c8102e', logo: '/images/partners/railways.png', initials: 'IR' },
  culture: { short: 'Ministry of Culture', color: '#2e3092', logo: '/images/partners/ministry-of-culture.png', initials: 'MC' },
  ksct: { short: 'KSCF', color: '#ee7623', logo: '/images/partners/kscf.png', initials: 'KS' },
  ndtv: { short: 'NDTV', color: '#e4002b', logo: '/images/partners/ndtv.png', initials: 'ND' },
  toi: { short: 'Times of India', color: '#bb0000', logo: '/images/partners/toi.png', initials: 'TOI' },
  'pracheen-kala-kendra': { short: 'Pracheen Kala Kendra', color: '#8a3b12', initials: 'PKK' },
  nmba: { short: 'Nasha Mukt Bharat', color: '#0b6e4f', initials: 'NMBA' },
  'delhi-athletics': { short: 'Delhi Athletics', color: '#1f4e9c', initials: 'DA' },
  'divyang-para-sports': { short: 'Divyang Para Sports', color: '#b3261e', initials: 'DPSA' },
};

export let BRAND: Record<string, PartnerBrand> = bindCMSData(DEFAULT_BRAND, (publication, fallback) => {
  const result = { ...fallback };
  for (const partner of publication.partners ?? []) {
    if (!isRecord(partner) || typeof partner.id !== 'string' || typeof partner.name !== 'string') continue;
    result[partner.id] ??= { short: partner.name, color: '#287c6a', initials: partner.name.split(/\s+/).map(word => word[0]).slice(0, 3).join('') };
    /* Branding authored on the partner's own CMS record wins. */
    const own = { ...result[partner.id] };
    if (typeof partner.short === 'string' && partner.short.trim()) own.short = partner.short;
    if (typeof partner.initials === 'string' && partner.initials.trim()) own.initials = partner.initials;
    if (typeof partner.color === 'string' && /^#[0-9a-f]{6}$/i.test(partner.color)) own.color = partner.color;
    if (safeCMSURL(partner.logo)) own.logo = partner.logo;
    result[partner.id] = own;
  }
  return result;
}, value => { BRAND = value; });
