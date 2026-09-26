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

export async function renderPoster(item: ResolvedEvent): Promise<Blob> {
  const { event, date, accentA, accentB } = item;
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  /* The poster's faces are the site's; wait for them or the fallback prints. */
  await Promise.all(['700 96px Outfit', '400 52px "Dancing Script"', '600 26px Inter'].map(f => document.fonts.load(f).catch(() => undefined)));
  const [qr, logo] = await Promise.all([
    loadImage(await eventQr(event.id)),
    loadImage('/images/sncf-logo.webp').catch(() => null),
  ]);

  const ground = ctx.createLinearGradient(0, 0, W, H);
  ground.addColorStop(0, accentA); ground.addColorStop(1, accentB);
  ctx.fillStyle = ground; ctx.fillRect(0, 0, W, H);
  /* a soft wash, the site's petal, low and to the right */
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.beginPath(); ctx.ellipse(W * .8, H * .78, 520, 360, -.5, 0, Math.PI * 2); ctx.fill();

  ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
  if (logo) { ctx.save(); ctx.beginPath(); ctx.arc(W / 2, 150, 64, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip(); ctx.drawImage(logo, W / 2 - 60, 90, 120, 120); ctx.restore(); }
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText('S A N T   N I R A N K A R I   C H A R I T A B L E   F O U N D A T I O N', W / 2, 262);
  const pillar = PILLARS.find(p => p.id === event.pillarId);
  ctx.font = '700 20px Inter, sans-serif';
  const label = (pillar?.label ?? event.pillarId).toUpperCase().split('').join(' ');
  const lw = ctx.measureText(label).width + 56;
  rounded(ctx, W / 2 - lw / 2, 292, lw, 48, 24); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill();
  ctx.fillStyle = '#16182b'; ctx.fillText(label, W / 2, 324);

  ctx.fillStyle = '#ffffff'; ctx.font = '400 60px "Dancing Script", cursive';
  ctx.fillText('You are warmly invited', W / 2, 430);
  if (date) {
    ctx.font = '700 26px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase().split('').join(' '), W / 2, 500);
    ctx.font = '700 260px Outfit, sans-serif'; ctx.fillStyle = '#ffffff';
    ctx.fillText(String(date.getDate()), W / 2, 740);
    ctx.font = '700 34px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fillText(`${MONTHS_LONG[date.getMonth()].toUpperCase()}  ${date.getFullYear()}`, W / 2, 800);
  } else {
    ctx.font = '700 72px Outfit, sans-serif'; ctx.fillText('Year round', W / 2, 700);
  }
  ctx.font = '600 58px Outfit, sans-serif'; ctx.fillStyle = '#ffffff';
  let y = 900;
  for (const line of wrap(ctx, event.title, 900)) { ctx.fillText(line, W / 2, y); y += 68; }
  ctx.font = '400 28px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.88)';
  y += 12;
  for (const line of wrap(ctx, event.blurb, 860).slice(0, 3)) { ctx.fillText(line, W / 2, y); y += 40; }

  /* the pass: code on white, the instruction beside it */
  const qx = 90, qy = H - 330, qs = 220;
  rounded(ctx, qx - 16, qy - 16, qs + 32, qs + 32, 24); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.drawImage(qr, qx, qy, qs, qs);
  ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px Inter, sans-serif'; ctx.fillText('Scan for your invitation', qx + qs + 56, qy + 70);
  ctx.font = '400 22px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.fillText('Add the date to your calendar and', qx + qs + 56, qy + 112);
  ctx.fillText('find a venue near you: 011-47660380', qx + qs + 56, qy + 146);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = '400 52px "Dancing Script", cursive';
  ctx.fillText('Service with Humility', W / 2, H - 46);

  return new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('poster failed'))), 'image/png'));
}

export const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
