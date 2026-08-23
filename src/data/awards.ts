/**
 * Awards and recognitions.
 *
 * EMPTY ON PURPOSE. nirankarifoundation.org/honors-and-recognitions/ presents
 * its awards as photographs only — no titles, no awarding bodies, no years,
 * and no alt text — so there was nothing factual to carry across. Award names
 * attributed to a real foundation cannot be guessed at, so this waits for the
 * real list rather than shipping plausible-sounding ones.
 *
 * Fill it in and the section renders; leave it empty and the section shows an
 * honest placeholder instead.
 */

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
}

export const AWARDS: Award[] = [
  // {
  //   id: 'example',
  //   title: 'Award name as written on the certificate',
  //   awardedBy: 'Conferring body',
  //   year: '2024',
  // },
];
