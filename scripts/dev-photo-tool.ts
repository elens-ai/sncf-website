/**
 * TEMPORARY DEVELOPER TOOL: add, delete and de-duplicate photographs in a
 * programme's or project's carousel from the page itself, while running
 * `npm run dev`.
 *
 *  - Adding: the page posts the chosen file; it is written to
 *    public/images/added/ (as WebP, at most 1600px on its long edge, when the
 *    backend's `sharp` is installed; as the original file otherwise) and listed
 *    under the programme's id in src/data/addedPhotos.json, which the
 *    carousels read. A file that is the same picture as one already added to
 *    that carousel is refused rather than added twice.
 *  - Deleting: a photograph added here is taken off the list and its file
 *    deleted. Any other photograph is only hidden from that carousel — listed
 *    in src/data/hiddenPhotos.json and restorable — so nothing shared with
 *    the rest of the site is destroyed.
 *  - De-duplicating: removes added photographs that are the same picture as an
 *    earlier one (byte-identical, or visually identical after re-encoding).
 *  - Ordering: a photograph can be put at any place in its carousel ("make
 *    first", or a position typed in); the carousel's order as it then stands
 *    is saved in src/data/photoOrder.json. Photographs not in that order
 *    (added afterwards) follow it.
 *
 * Dev server only (`apply: 'serve'`): never part of a build, and the page
 * shows its controls only in development. Commit the JSON files and the
 * images to keep the result; delete this file and its two lines in
 * vite.config.ts when the CMS takes over.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const ROOT = path.resolve(__dirname, '..');
const LIST = path.join(ROOT, 'src/data/addedPhotos.json');
const HIDDEN = path.join(ROOT, 'src/data/hiddenPhotos.json');
const ORDER = path.join(ROOT, 'src/data/photoOrder.json');
const DIR = path.join(ROOT, 'public/images/added');
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 25 * 1024 * 1024;
/** Two pictures whose 64-bit difference hashes differ in this many bits or fewer are the same picture. */
const SAME_PICTURE = 4;

type Photo = { src: string; alt: string };
type List = Record<string, Photo[]>;
type Hidden = Record<string, string[]>;

const readJSON = async <T,>(file: string, empty: T): Promise<T> => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) as T; } catch { return empty; }
};
const writeJSON = (file: string, data: unknown) => fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
const readList = () => readJSON<List>(LIST, {});
const readHidden = () => readJSON<Hidden>(HIDDEN, {});
const readOrder = () => readJSON<Hidden>(ORDER, {});

/* the backend already installs sharp; borrowed if it is there, skipped if not */
type Sharp = (input: Buffer | string) => any;
const loadSharp = (): Sharp | null => {
  try { return createRequire(path.join(ROOT, 'backend/package.json'))('sharp'); } catch { return null; }
};

/** A picture's fingerprints: its bytes' SHA-1, and a difference hash of how it looks (null without sharp). */
async function fingerprint(sharp: Sharp | null, input: Buffer): Promise<{ sha: string; look: bigint | null }> {
  const sha = crypto.createHash('sha1').update(input).digest('hex');
  if (!sharp) return { sha, look: null };
  const pixels: Buffer = await sharp(input).rotate().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let look = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) look = (look << 1n) | (pixels[y * 9 + x] > pixels[y * 9 + x + 1] ? 1n : 0n);
  return { sha, look };
}
const distance = (a: bigint, b: bigint) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };
const samePicture = (a: { sha: string; look: bigint | null }, b: { sha: string; look: bigint | null }) =>
  a.sha === b.sha || (a.look !== null && b.look !== null && distance(a.look, b.look) <= SAME_PICTURE);

const fileOf = (src: string) => path.join(ROOT, 'public', src);

const body = (req: import('node:http').IncomingMessage) => new Promise<string>((resolve, reject) => {
  let size = 0; const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => { size += chunk.length; if (size > MAX_BYTES * 1.4) { reject(new Error('too large')); req.destroy(); } else chunks.push(chunk); });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

/** Take duplicates out of one carousel's added photographs, keeping the first of each; returns what went. */
async function dedupe(sharp: Sharp | null, list: List, id: string): Promise<string[]> {
  const kept: { photo: Photo; print: { sha: string; look: bigint | null } }[] = [];
  const removed: string[] = [];
  for (const photo of list[id] ?? []) {
    let bytes: Buffer;
    try { bytes = await fs.readFile(fileOf(photo.src)); } catch { removed.push(photo.src); continue; }
    const print = await fingerprint(sharp, bytes);
    if (kept.some(other => samePicture(other.print, print))) {
      removed.push(photo.src);
      if (photo.src.startsWith('/images/added/')) await fs.rm(fileOf(photo.src), { force: true });
    } else kept.push({ photo, print });
  }
  if (kept.length) list[id] = kept.map(entry => entry.photo); else delete list[id];
  return removed;
}

/** Photographs gone from a carousel are dropped from its saved order too (a hidden one keeps its place, for its restoring). */
async function unorder(id: string, gone: string[]) {
  const order = await readOrder();
  if (!gone.length || !order[id]?.some(src => gone.includes(src))) return;
  const kept = order[id].filter(src => !gone.includes(src));
  if (kept.length) order[id] = kept; else delete order[id];
  await writeJSON(ORDER, order);
}

export function devPhotoTool(): Plugin {
  return {
    name: 'sncf-dev-photo-tool',
    apply: 'serve',
    /* the page follows these files live (src/utils/devPhotos.ts), so a change to them sends no hot update: one
       would re-run every carousel's module and reset the tool mid-use. A reload reads them afresh. */
    handleHotUpdate({ file }) {
      if ([LIST, HIDDEN, ORDER].some(own => path.resolve(file).toLowerCase() === own.toLowerCase())) return [];
    },
    configureServer(server) {
      server.middlewares.use('/__dev/photos', async (req, res) => {
        const send = (status: number, data: unknown) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
        try {
          if (req.method === 'GET') return send(200, { added: await readList(), hidden: await readHidden(), order: await readOrder() });
          if (!['POST', 'DELETE', 'PUT'].includes(req.method ?? '')) return send(405, { error: 'POST to add (or move, or dedupe), DELETE to delete or hide, PUT to restore' });
          const input = JSON.parse(await body(req)) as { id?: string; alt?: string; dataUrl?: string; src?: string; action?: string; position?: number; srcs?: unknown };
          const id = String(input.id ?? '');
          if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(id)) return send(400, { error: 'unknown programme id' });
          const list = await readList();
          const sharp = loadSharp();

          if (req.method === 'PUT') {
            /* a hidden photograph back in its carousel */
            const src = String(input.src ?? '');
            const hidden = await readHidden();
            const kept = (hidden[id] ?? []).filter(other => other !== src);
            if (kept.length) hidden[id] = kept; else delete hidden[id];
            await writeJSON(HIDDEN, hidden);
            return send(200, { restored: src });
          }

          if (req.method === 'DELETE') {
            const src = String(input.src ?? '');
            if (!src) return send(400, { error: 'which photograph?' });
            const kept = (list[id] ?? []).filter(photo => photo.src !== src);
            if (kept.length !== (list[id] ?? []).length) {
              /* one this tool added: off the list, and its file deleted (only ever files this tool wrote) */
              if (kept.length) list[id] = kept; else delete list[id];
              await writeJSON(LIST, list);
              if (src.startsWith('/images/added/')) await fs.rm(fileOf(src), { force: true });
              await unorder(id, [src]);
              return send(200, { removed: src });
            }
            /* any other: hidden from this carousel only, its file and its data left as they are */
            const hidden = await readHidden();
            hidden[id] = [...new Set([...(hidden[id] ?? []), src])];
            await writeJSON(HIDDEN, hidden);
            return send(200, { hidden: src });
          }

          if (input.action === 'position') {
            /* this photograph moved to a place in its carousel (1 = first), the others keeping their order around it;
               the page sends the carousel's photographs as it shows them, and that order is kept from then on */
            const src = String(input.src ?? '');
            const shown = Array.isArray(input.srcs) ? input.srcs.map(String).filter(Boolean).slice(0, 1000) : [];
            if (!src || !shown.includes(src)) return send(400, { error: 'which photograph, among which?' });
            const rest = shown.filter(other => other !== src);
            const at = Math.min(Math.max(Math.round(Number(input.position) || 1), 1), shown.length) - 1;
            const order = await readOrder();
            order[id] = [...rest.slice(0, at), src, ...rest.slice(at)];
            await writeJSON(ORDER, order);
            return send(200, { src, position: at + 1 });
          }

          if (input.action === 'dedupe') {
            const removed = await dedupe(sharp, list, id);
            await writeJSON(LIST, list);
            await unorder(id, removed);
            return send(200, { removed });
          }

          const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(input.dataUrl ?? ''));
          if (!match) return send(400, { error: 'a JPEG, PNG or WebP image is needed' });
          const bytes = Buffer.from(match[2], 'base64');
          if (bytes.length > MAX_BYTES) return send(413, { error: 'images up to 25 MB' });
          const out: Buffer = sharp
            ? await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
            : bytes;
          /* the same picture twice in one carousel is refused */
          const print = await fingerprint(sharp, out);
          for (const photo of list[id] ?? []) {
            try {
              if (samePicture(print, await fingerprint(sharp, await fs.readFile(fileOf(photo.src))))) return send(409, { error: 'already in this carousel', duplicate: photo.src });
            } catch { /* a missing file cannot be a duplicate */ }
          }
          await fs.mkdir(DIR, { recursive: true });
          const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
          const name = `${id}-${stamp}-${Math.random().toString(36).slice(2, 6)}.${sharp ? 'webp' : TYPES[match[1]]}`;
          await fs.writeFile(path.join(DIR, name), out);
          const photo = { src: `/images/added/${name}`, alt: String(input.alt ?? '').trim().slice(0, 300) };
          list[id] = [...(list[id] ?? []), photo];
          await writeJSON(LIST, list);
          return send(200, photo);
        } catch (error) {
          return send(500, { error: String(error instanceof Error ? error.message : error) });
        }
      });
    },
  };
}
