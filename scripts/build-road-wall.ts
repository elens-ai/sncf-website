/**
 * Builds the photo wall of the Who We Are page's road so far (RoadWall).
 *
 *   npm run images:road-wall   writes public/images/road-wall.webp, road-wall/*.webp and src/components/roadWallTiles.ts
 *
 * The wall is the foundation's photographs, nine a year from 2010 (and nine
 * more with the last, filling the wall's last block): each
 * year's own (its events and dated honours, roadYears.ts) and, to make up its
 * nine, the foundation's photographs of its work shared out among the years.
 * They are cut square, in colour, twice: small onto ONE sprite, a megabyte or
 * so for the whole wall seen at once; and larger each on its own, for the
 * close view of its year, fetched only as that year comes. Each year's first
 * photograph of its own carries its year. Run it again when the photographs
 * change. Sharp is the backend's (the site has none).
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_ACTIVITIES } from '../src/data/activities';
import { programmePhotos } from '../src/data/programmePhotos';
import { ROAD_FIRST, ROAD_LAST, roadYears } from '../src/data/roadYears';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(import.meta.url)(join(root, 'backend/node_modules/sharp'));

const TILE = 220, SHARP = 600, PER_YEAR = 9;
const SPRITE_COLS = 12;
/* the wall's grid: the year blocks, three cells by three, six across and three down, edge to edge */
const GRID = { cols: 18, rows: 9 };
const PHOTO_FOLDERS = ['programmes', 'nima', 'nvc', 'projects', 'projects/health-city', 'pavilion', 'heal-emblem', 'awards'];
const MORE_PHOTOS = ['/images/welcome-volunteers.jpg', '/images/heal-collage.jpg'];

const local = (src: string) => src.startsWith('/images/') && /\.(webp|jpe?g|png)$/i.test(src);
const years = Array.from({ length: ROAD_LAST - ROAD_FIRST + 1 }, (_, i) => ROAD_FIRST + i);
const records = roadYears();
const seen = new Set<string>();
/* a year's own, nine at most: where it has more, a second picture of the same honour (its plaque) gives way first */
const own = new Map(years.map(year => {
  const list = (records.find(r => r.year === year)?.photos ?? []).map(photo => photo.src).filter(src => local(src) && !seen.has(src));
  while (list.length > PER_YEAR) { const plaque = list.findIndex(src => src.includes('plaque')); list.splice(plaque >= 0 ? plaque : list.length - 1, 1); }
  list.forEach(src => seen.add(src));
  return [year, list];
}));
/* the programme photographs, taken a programme at a time in turn so neighbouring years differ */
const byProgramme = DEFAULT_ACTIVITIES.map(activity => programmePhotos(activity).map(photo => photo.src).filter(src => local(src) && !seen.has(src)));
const shared: string[] = [];
for (let round = 0; byProgramme.some(list => list[round]); round++)
  for (const list of byProgramme) if (list[round] && !seen.has(list[round])) { seen.add(list[round]); shared.push(list[round]); }
/* and the rest of the site's own photographs of the work: the programmes', NIMA's and the vocational centre's, the
   projects', the pavilion's, the Heal emblem's and the honours' undated, a folder at a time in turn */
const folders = PHOTO_FOLDERS.map(folder => readdirSync(join(root, 'public/images', folder))
  .filter(name => /\.(webp|jpe?g)$/i.test(name) && (folder !== 'heal-emblem' || name.startsWith('photo-')))
  .map(name => `/images/${folder}/${name}`).filter(src => !seen.has(src)));
for (let round = 0; folders.some(list => list[round]); round++)
  for (const list of folders) if (list[round] && !seen.has(list[round])) { seen.add(list[round]); shared.push(list[round]); }
for (const src of MORE_PHOTOS) if (!seen.has(src)) { seen.add(src); shared.push(src); }

/* every year its nine: its own first, then the shared ones in turn (round again from the first, should they run out);
   and the last year nine more, the wall's last block beside its own, the work going on */
let next = 0;
const batches = new Map(years.map(year => {
  const list = [...own.get(year)!];
  while (list.length < PER_YEAR * (year === ROAD_LAST ? 2 : 1)) list.push(shared[next++ % shared.length]);
  return [year, list];
}));
if (next > shared.length) console.warn(`only ${shared.length} shared photographs for ${next} places: ${next - shared.length} shown twice`);

const tiles = years.flatMap(year => batches.get(year)!.map((src, i) => ({ src, year, label: i === 0 })));
const spriteRows = Math.ceil(tiles.length / SPRITE_COLS);
const cut = await Promise.all(tiles.map(({ src }) =>
  sharp(join(root, 'public', src)).rotate().resize(TILE, TILE, { fit: 'cover', position: 'attention' }).toBuffer()));
await sharp({ create: { width: SPRITE_COLS * TILE, height: spriteRows * TILE, channels: 3, background: '#20304a' } })
  .composite(cut.map((input, i) => ({ input, left: (i % SPRITE_COLS) * TILE, top: Math.floor(i / SPRITE_COLS) * TILE })))
  .webp({ quality: 74, effort: 6 }).toFile(join(root, 'public/images/road-wall.webp'));
const sharpDir = join(root, 'public/images/road-wall');
rmSync(sharpDir, { recursive: true, force: true });
mkdirSync(sharpDir);
await Promise.all(tiles.map(({ src }, i) => sharp(join(root, 'public', src)).rotate().resize(SHARP, SHARP, { fit: 'cover', position: 'attention' })
  .flatten({ background: '#20304a' }).webp({ quality: 64, effort: 6 }).toFile(join(sharpDir, `${String(i).padStart(3, '0')}.webp`))));

writeFileSync(join(root, 'src/components/roadWallTiles.ts'), `/* Generated by scripts/build-road-wall.ts — do not edit; run npm run images:road-wall. */
export const ROAD_WALL = {
  src: '/images/road-wall.webp',
  /** the folder of each tile on its own, larger, for the close view: 000.webp, 001.webp, … in the sprite's order */
  sharp: '/images/road-wall',
  cols: ${SPRITE_COLS},
  rows: ${spriteRows},
  /** each tile's year, nine a year (eighteen the last) in the sprite's order; the first of a year's carries the year */
  tiles: ${JSON.stringify(tiles.map(({ year, label }) => (label ? { year, label } : { year })))},
  /** the wall's grid, in cells: its year blocks edge to edge */
  grid: ${JSON.stringify(GRID)},
};
`);
console.log(`${tiles.length} tiles (${[...own.values()].reduce((n, l) => n + l.length, 0)} dated, ${Math.min(next, shared.length)} of ${shared.length} shared, ${PER_YEAR} a year) on a ${SPRITE_COLS}×${spriteRows} sprite`);
