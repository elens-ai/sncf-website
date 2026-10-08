/** Tile symbols the site can draw for a programme; the CMS offers the same list. */
export const ACTIVITY_ICONS = [
  'droplets', 'droplet', 'stethoscope', 'eye', 'hospital', 'graduation-cap', 'award', 'book-open', 'laptop',
  'scissors', 'trees', 'sparkles', 'package-check', 'heart', 'hand-coins', 'waves', 'sprout', 'mountain', 'house',
  'heart-handshake', 'spine',
] as const;
export type ActivityIcon = typeof ACTIVITY_ICONS[number];
