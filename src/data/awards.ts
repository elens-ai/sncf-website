/**
 * Awards and recognitions.
 *
 * EMPTY ON PURPOSE. nirankarifoundation.org/honors-and-recognitions/ presents
 * its awards as photographs only — no titles, no awarding bodies, no years,
 * and no alt text — so there was nothing factual to carry across. Award names
 * attributed to a real foundation cannot be guessed at, so this waits for the
 * real list rather than shipping plausible-sounding ones.
 *
 * Fill it in and the section renders the mosaic; leave it empty and the
 * section shows the archival placeholder instead. Both are designed states.
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

export const AWARDS: Award[] = [
  // {
  //   id: 'example-honour',
  //   title: 'Award name as written on the certificate',
  //   awardedBy: 'Conferring body',
  //   year: '2024',
  //   note: 'One line of context, only if it needs any.',
  //   featured: true,
  //   photos: [
  //     {
  //       src: '/images/awards/example-ceremony.webp',
  //       alt: 'Foundation volunteers receiving the citation on stage',
  //       width: 1600,
  //       height: 1067,
  //       focal: '50% 35%',
  //       caption: 'The citation being conferred at the annual ceremony.',
  //     },
  //   ],
  // },
];
