import { toDataURL } from 'qrcode';
import { ResolvedEvent, MONTHS_LONG, inviteUrl } from './events';
import { PILLARS } from '../data/pillars';

/**
 * A PASS FOR EVERY MOMENT — the QR code and the poster it prints on.
 *
 * The QR encodes the event's invitation URL (?invite=<id>), the same landing
 * a scanned pass has always opened. The poster is drawn on a canvas, not
 * fetched: a 1080×1350 portrait (the size social feeds and A-series prints
 * both take) in the event's pillar colours, with the date at poster size,
 * the title and blurb, the code, and the foundation's signature — so an
 * organiser can share or print it the moment an event is published, with
 * no artwork pipeline behind it.
 */

export const eventQr = (eventId: string, dark = '#16182b') =>
  toDataURL(inviteUrl(eventId), { errorCorrectionLevel: 'M', margin: 1, width: 640, color: { dark, light: '#ffffff' } });

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

/** Greedy word wrap that respects the canvas's current font. */
const wrap = (ctx: CanvasRenderingContext2D, text: string, width: number) => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const probe = line ? `${line} ${word}` : word;
    if (ctx.measureText(probe).width > width && line) { lines.push(line); line = word; }
    else line = probe;
  }
  if (line) lines.push(line);
  return lines;
};

const rounded = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
};

/** The three pieces of artwork a moment can be taken away as. */
export type ArtworkKind = 'poster' | 'banner' | 'story';
export const ARTWORK: Record<ArtworkKind, { w: number; h: number }> = {
  poster: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
  banner: { w: 1600, h: 900 },
};

const ready = async (item: ResolvedEvent, W: number, H: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  /* The artwork's faces are the site's; wait for them or the fallback prints. */
  await Promise.all(['400 96px "Outfit Numbers"', '700 96px Outfit', '400 52px "Dancing Script"', '800 58px "SNCF Flared"'].map(f => document.fonts.load(f, '0123456789 SNCF').catch(() => undefined)));
  const [qr, logo] = await Promise.all([
    loadImage(await eventQr(item.event.id)),
    loadImage('/images/sncf-logo.webp').catch(() => null),
  ]);
  return { canvas, ctx, qr, logo };
};
const toBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('artwork failed'))), 'image/png'));

export const renderArtwork = (item: ResolvedEvent, kind: ArtworkKind) => kind === 'banner' ? renderBanner(item) : renderPortrait(item, ARTWORK[kind].w, ARTWORK[kind].h);
export const renderPoster = (item: ResolvedEvent) => renderPortrait(item, ARTWORK.poster.w, ARTWORK.poster.h);

/** The poster and the story: one portrait composition, its rows spaced to the height. */
async function renderPortrait(item: ResolvedEvent, W: number, H: number): Promise<Blob> {
  const { event, date, accentA, accentB } = item;
  const { canvas, ctx, qr, logo } = await ready(item, W, H);
  const sy = H / 1350;

  const ground = ctx.createLinearGradient(0, 0, W, H);
  ground.addColorStop(0, accentA); ground.addColorStop(1, accentB);
  ctx.fillStyle = ground; ctx.fillRect(0, 0, W, H);
  /* a soft wash, the site's petal, low and to the right */
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.beginPath(); ctx.ellipse(W * .8, H * .78, 520, 360, -.5, 0, Math.PI * 2); ctx.fill();

  ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
  if (logo) { ctx.save(); ctx.beginPath(); ctx.arc(W / 2, 150 * sy, 64, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip(); ctx.drawImage(logo, W / 2 - 60, 150 * sy - 60, 120, 120); ctx.restore(); }
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 22px "Outfit Numbers", Outfit, sans-serif';
  ctx.fillText('S A N T   N I R A N K A R I   C H A R I T A B L E   F O U N D A T I O N', W / 2, 262 * sy);
  const pillar = PILLARS.find(p => p.id === event.pillarId);
  ctx.font = '700 20px "Outfit Numbers", Outfit, sans-serif';
  const label = (pillar?.label ?? event.pillarId).toUpperCase().split('').join(' ');
  const lw = ctx.measureText(label).width + 56;
  rounded(ctx, W / 2 - lw / 2, 292 * sy, lw, 48, 24); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill();
  ctx.fillStyle = '#16182b'; ctx.fillText(label, W / 2, 292 * sy + 32);

  ctx.fillStyle = '#ffffff'; ctx.font = '400 60px "Outfit Numbers", "Dancing Script", cursive';
  ctx.fillText('You are warmly invited', W / 2, 430 * sy);
  if (date) {
    ctx.font = '700 26px "Outfit Numbers", Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase().split('').join(' '), W / 2, 500 * sy);
    ctx.font = '800 250px "Outfit Numbers", "SNCF Flared", Outfit, sans-serif'; ctx.fillStyle = '#ffffff';
    ctx.fillText(String(date.getDate()), W / 2, 740 * sy);
    ctx.font = '700 34px "Outfit Numbers", Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fillText(`${MONTHS_LONG[date.getMonth()].toUpperCase()}  ${date.getFullYear()}`, W / 2, 800 * sy);
  } else {
    ctx.font = '700 72px "Outfit Numbers", Outfit, sans-serif'; ctx.fillText('Year round', W / 2, 700 * sy);
  }
  ctx.font = '800 54px "Outfit Numbers", "SNCF Flared", Outfit, sans-serif'; ctx.fillStyle = '#ffffff';
  let y = 900 * sy;
  for (const line of wrap(ctx, event.title, 900)) { ctx.fillText(line, W / 2, y); y += 68; }
  ctx.font = '400 28px "Outfit Numbers", Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.88)';
  y += 12;
  for (const line of wrap(ctx, event.blurb, 860).slice(0, 3)) { ctx.fillText(line, W / 2, y); y += 40; }

  /* the pass: code on white, the instruction beside it */
  const qx = 90, qy = H - 330, qs = 220;
  rounded(ctx, qx - 16, qy - 16, qs + 32, qs + 32, 24); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.drawImage(qr, qx, qy, qs, qs);
  ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px "Outfit Numbers", Outfit, sans-serif'; ctx.fillText('Scan for your invitation', qx + qs + 56, qy + 70);
  ctx.font = '400 22px "Outfit Numbers", Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.fillText('Add the date to your calendar and', qx + qs + 56, qy + 112);
  ctx.fillText('find a venue near you: 011-47660380', qx + qs + 56, qy + 146);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = '400 52px "Outfit Numbers", "Dancing Script", cursive';
  ctx.fillText('Service with Humility', W / 2, H - 46);

  return toBlob(canvas);
}

/** The banner: the same moment laid wide — date to the left, words to the right, the pass in the corner. */
async function renderBanner(item: ResolvedEvent): Promise<Blob> {
  const { event, date, accentA, accentB } = item;
  const W = ARTWORK.banner.w, H = ARTWORK.banner.h;
  const { canvas, ctx, qr, logo } = await ready(item, W, H);
  const ground = ctx.createLinearGradient(0, 0, W, H);
  ground.addColorStop(0, accentA); ground.addColorStop(1, accentB);
  ctx.fillStyle = ground; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.beginPath(); ctx.ellipse(W * .78, H * .72, 620, 380, -.4, 0, Math.PI * 2); ctx.fill();

  const left = 110;
  ctx.textAlign = 'left';
  if (logo) { ctx.save(); ctx.beginPath(); ctx.arc(left + 50, 130, 50, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip(); ctx.drawImage(logo, left + 4, 84, 92, 92); ctx.restore(); }
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 18px "Outfit Numbers", Outfit, sans-serif';
  ctx.fillText('S A N T   N I R A N K A R I   C H A R I T A B L E   F O U N D A T I O N', left + 124, 122);
  const pillar = PILLARS.find(p => p.id === event.pillarId);
  ctx.font = '700 18px "Outfit Numbers", Outfit, sans-serif';
  const label = (pillar?.label ?? event.pillarId).toUpperCase().split('').join(' ');
  const lw = ctx.measureText(label).width + 48;
  rounded(ctx, left + 124, 140, lw, 42, 21); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill();
  ctx.fillStyle = '#16182b'; ctx.fillText(label, left + 148, 168);

  ctx.fillStyle = '#ffffff'; ctx.font = '400 54px "Outfit Numbers", "Dancing Script", cursive';
  ctx.fillText('You are warmly invited', left, 300);
  if (date) {
    ctx.font = '700 24px "Outfit Numbers", Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase().split('').join(' '), left, 360);
    ctx.font = '800 290px "Outfit Numbers", "SNCF Flared", Outfit, sans-serif'; ctx.fillStyle = '#ffffff';
    ctx.fillText(String(date.getDate()), left - 8, 640);
    ctx.font = '700 32px "Outfit Numbers", Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fillText(`${MONTHS_LONG[date.getMonth()].toUpperCase()}  ${date.getFullYear()}`, left, 700);
  } else {
    ctx.font = '700 96px "Outfit Numbers", Outfit, sans-serif'; ctx.fillText('Year round', left, 560);
  }
  ctx.font = '400 44px "Outfit Numbers", "Dancing Script", cursive'; ctx.fillStyle = '#ffffff';
  ctx.fillText('Service with Humility', left, H - 60);

  const right = 800, width = 700;
  ctx.font = '800 52px "Outfit Numbers", "SNCF Flared", Outfit, sans-serif'; ctx.fillStyle = '#ffffff';
  let y = 330;
  for (const line of wrap(ctx, event.title, width)) { ctx.fillText(line, right, y); y += 66; }
  ctx.font = '400 26px "Outfit Numbers", Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.88)';
  y += 10;
  for (const line of wrap(ctx, event.blurb, width).slice(0, 4)) { ctx.fillText(line, right, y); y += 38; }

  const qs = 190, qx = W - 100 - qs, qy = H - 100 - qs;
  rounded(ctx, qx - 14, qy - 14, qs + 28, qs + 28, 22); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.drawImage(qr, qx, qy, qs, qs);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px "Outfit Numbers", Outfit, sans-serif'; ctx.fillText('Scan for your invitation', qx - 40, qy + 74);
  ctx.font = '400 20px "Outfit Numbers", Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.fillText('Add the date to your calendar and', qx - 40, qy + 112);
  ctx.fillText('find a venue near you: 011-47660380', qx - 40, qy + 142);

  return toBlob(canvas);
}

export const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
