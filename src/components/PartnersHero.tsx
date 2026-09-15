import { resolveCMSMedia } from '../cms/media';
import { bindCMSValue, resolveCMSAsset, getCMSCopy } from '../cms/runtime';
import { getCMSLink } from '../cms/links';
import React, { useEffect, useRef, useState } from 'react';
import { PARTNERS } from '../data/partners';

/**
 * THE PARTNERS PAGE — built to the supplied Marketeam brief: a full-viewport
 * hero with a header, a typed headline that changes colour mid-sentence, four
 * concentric orbits carrying the network, and an infinite logo ticker at the
 * foot. Every mechanic in the brief is here — the rotating conic-gradient
 * border, the mask-technique orbit rings, the count-up, the staggered fly-in,
 * the ticker's edge fades.
 *
 * WHAT IS NOT HERE, AND WHY. The brief's assets all live on hosts this build
 * cannot reach (figma.site, images.higgs.ai, CloudFront — every one refused),
 * and its copy belongs to a marketing agency, not to a charitable foundation.
 * So the LAYOUT is the brief's and the CONTENT is ours:
 *
 *   · the ticker carries the foundation's own partner marks, as asked;
 *   · the orbits carry those marks and the programme photographs;
 *   · the count is the real number of organisations on the partners page —
 *     12, from data/partners.ts, not an invented "20k+ specialists";
 *   · the background is a painted gradient in the brief's palette rather
 *     than an image that would 404.
 */

interface PartnersHeroProps {
  /** "Partner with us" / "Become a partner" — opens the donate/contact modal. */
  onOpenDonate?: () => void;
}

/* ── THE HEADLINE ──────────────────────────────────────────────────────────
   Typed one character at a time. The brief colours the opening clause dark
   and the remainder white, against a ground that runs light-to-dark the same
   way — so SPLIT is a character index, not a word count, and must land on
   the em dash for the switch to read as intentional. */
const HEADLINE =
  'Great work is never done alone. Twelve organisations already stand with this Mission.';
/* The switch lands on the full stop, so the pale half begins a sentence
   rather than a fragment — the colour change reads as a second voice, not a
   glitch mid-clause. */
const SPLIT = HEADLINE.indexOf('.') + 1;
const TYPE_MS = 35;
const TYPE_DELAY = 400;

const TypewriterHeading: React.FC<{ calm: boolean }> = ({ calm }) => {
  const [n, setN] = useState(calm ? HEADLINE.length : 0);

  useEffect(() => {
    if (calm) return;
    let i = 0;
    let tick: number | undefined;
    const start = window.setTimeout(() => {
      tick = window.setInterval(() => {
        i += 1;
        setN(i);
        if (i >= HEADLINE.length) window.clearInterval(tick);
      }, TYPE_MS);
    }, TYPE_DELAY);
    return () => {
      window.clearTimeout(start);
      if (tick) window.clearInterval(tick);
    };
  }, [calm]);

  const done = n >= HEADLINE.length;
  return (
    <h2 className="mt-hero-title">
      <span className="mt-ink">{HEADLINE.slice(0, Math.min(n, SPLIT))}</span>
      <span className="mt-pale">{n > SPLIT ? HEADLINE.slice(SPLIT, n) : ''}</span>
      {!done && <span className="mt-caret" aria-hidden="true" />}
      {/* The heading is typed, so assistive tech would otherwise hear it
          letter by letter. It is announced once, whole. */}
      <span className="sr-only">{HEADLINE}</span>
    </h2>
  );
};

/* ── THE COUNT ─────────────────────────────────────────────────────────────
   0 → the real number of partners, eased out over two seconds. */
const useCountUp = (to: number, ms: number, delay: number, calm: boolean) => {
  const [v, setV] = useState(calm ? to : 0);
  useEffect(() => {
    if (calm) return;
    let raf = 0;
    const start = window.setTimeout(() => {
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [to, ms, delay, calm]);
  return v;
};

/* ── THE ORBITS ────────────────────────────────────────────────────────────
   A node is placed by the brief's formula: rotate to its angle, push out by
   the orbit radius, then rotate back so the picture itself stays upright.
   Orbits 2 and 4 turn one way, 1 and 3 the other, so the network never reads
   as a single rigid wheel. */
interface Node {
  src: string;
  alt: string;
  orbit: 1 | 2 | 3 | 4;
  angle: number;
  size: number;
  round: boolean;
  glow: string;
  delay: number;
}

const ACCENT = '#A068FF';
/* Written out in full, never assembled from a prefix. The preview bundler
   inlines an asset by finding its path as a literal string in the built
   JS, and '/images/partners/un.png' leaves no such string behind — every mark on this
   screen silently 404'd inside the artifact. */
let NODES: Node[] = bindCMSValue(() => ([
  { src: resolveCMSAsset("asset.PartnersHero.836c7e928538", "/images/partners/un.png"), alt: getCMSCopy("copy.PartnersHero.c3c27cfe4426", "United Nations"), orbit: 1, angle: 270, size: 74, round: false, glow: '#009edb', delay: 0.6 },
  { src: resolveCMSAsset("asset.PartnersHero.7144da391fb1", "/images/vertical-heal.webp"), alt: getCMSCopy("copy.PartnersHero.3007e1e3446d", "A health camp"), orbit: 2, angle: 60, size: 58, round: true, glow: '#f2c14e', delay: 0.8 },
  { src: resolveCMSAsset("asset.PartnersHero.46bbc9f2d591", "/images/partners/red-cross.png"), alt: getCMSCopy("copy.PartnersHero.4cc0b4376458", "Indian Red Cross Society"), orbit: 2, angle: 180, size: 78, round: true, glow: '#ed1b2e', delay: 1.0 },
  { src: resolveCMSAsset("asset.PartnersHero.848a29a67689", "/images/partners/railways.png"), alt: getCMSCopy("copy.PartnersHero.9e351718fa06", "Ministry of Indian Railways"), orbit: 2, angle: 300, size: 58, round: false, glow: '#0077c8', delay: 1.2 },
  { src: resolveCMSAsset("asset.PartnersHero.486823e29a83", "/images/vertical-enrich.webp"), alt: getCMSCopy("copy.PartnersHero.5f84470d9613", "A classroom"), orbit: 3, angle: 130, size: 88, round: true, glow: '#e86ba0', delay: 1.4 },
  { src: resolveCMSAsset("asset.PartnersHero.81c0e1df48f3", "/images/partners/toi.png"), alt: getCMSCopy("copy.PartnersHero.98d12a4fc755", "Times of India"), orbit: 4, angle: 30, size: 58, round: false, glow: ACCENT, delay: 1.6 },
  { src: resolveCMSAsset("asset.PartnersHero.76f684891a21", "/images/volunteers-planning.webp"), alt: getCMSCopy("copy.PartnersHero.2a5a44b61ff2", "Volunteers planning a drive"), orbit: 4, angle: 95, size: 88, round: false, glow: '#f08a3c', delay: 1.8 },
  { src: resolveCMSAsset("asset.PartnersHero.7e886446b163", "/images/vertical-empower.webp"), alt: getCMSCopy("copy.PartnersHero.ae869749ce31", "A plantation drive"), orbit: 4, angle: 220, size: 88, round: false, glow: '#e86ba0', delay: 2.0 },
  { src: resolveCMSAsset("asset.PartnersHero.e4d851213c84", "/images/partners/niit.png"), alt: getCMSCopy("copy.PartnersHero.08b3dd67f846", "NIIT"), orbit: 4, angle: 320, size: 58, round: false, glow: ACCENT, delay: 2.3 },
]), value => { NODES = value; });

const RADIUS: Record<number, number> = { 1: 177, 2: 251, 3: 325, 4: 399 };

/* ── THE TICKER ────────────────────────────────────────────────────────────
   Every mark we hold a file for, laid out four times so the strip is always
   wider than any viewport and the loop has nothing to catch on. */
let MARKS = bindCMSValue(() => ([
  { src: resolveCMSAsset("asset.PartnersHero.836c7e928538", "/images/partners/un.png"), alt: getCMSCopy("copy.PartnersHero.c3c27cfe4426", "United Nations") },
  { src: resolveCMSAsset("asset.PartnersHero.848a29a67689", "/images/partners/railways.png"), alt: getCMSCopy("copy.PartnersHero.9e351718fa06", "Ministry of Indian Railways") },
  { src: resolveCMSAsset("asset.PartnersHero.46bbc9f2d591", "/images/partners/red-cross.png"), alt: getCMSCopy("copy.PartnersHero.4cc0b4376458", "Indian Red Cross Society") },
  { src: resolveCMSAsset("asset.PartnersHero.39811b65f44a", "/images/partners/life-west.svg"), alt: getCMSCopy("copy.PartnersHero.9a314cf92be3", "The Life Chiropractic College West") },
  { src: resolveCMSAsset("asset.PartnersHero.9f2bded92dc1", "/images/partners/urban-development.png"), alt: getCMSCopy("copy.PartnersHero.7b8eb828684b", "Ministry of Urban Development") },
  { src: resolveCMSAsset("asset.PartnersHero.752cd88f3494", "/images/partners/ndtv.png"), alt: getCMSCopy("copy.PartnersHero.180b26bb6065", "NDTV") },
  { src: resolveCMSAsset("asset.PartnersHero.81c0e1df48f3", "/images/partners/toi.png"), alt: getCMSCopy("copy.PartnersHero.98d12a4fc755", "Times of India") },
  { src: resolveCMSAsset("asset.PartnersHero.e4d851213c84", "/images/partners/niit.png"), alt: getCMSCopy("copy.PartnersHero.08b3dd67f846", "NIIT") },
  { src: resolveCMSAsset("asset.PartnersHero.7985ebc52923", "/images/partners/singer.png"), alt: getCMSCopy("copy.PartnersHero.a6c36a338c46", "Singer India Ltd.") },
]), value => { MARKS = value; });

export const PartnersHero: React.FC<PartnersHeroProps> = ({ onOpenDonate }) => {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    setCalm(q.matches);
    const on = () => setCalm(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);

  const count = useCountUp(PARTNERS.length, 2000, 1200, calm);
  const strip = useRef<HTMLDivElement>(null);

  return (
    <section className="mt-app" aria-labelledby="partners-heading">
      {/* THE ACTIONS. The brief's header row, minus the logo and nav: this
          screen is a section of a one-page site that already carries both in
          its own fixed header, and a second lockup and menu directly beneath
          the first is two headers, not a design. What the row keeps is the
          part the brief actually invents — the pill with the turning border. */}
      <div className="mt-actions">
        <a
          className="mt-login"
          href={getCMSLink("copy.Link.PartnersHero.4d589e9db012", "https://nirankarifoundation.org/our-partners/")}
          target="_blank"
          rel="noopener noreferrer"
        >{getCMSCopy("copy.PartnersHero.f1beb9d2a979", "All partners")}</a>
        <div className="btn-border-wrap">
          <button type="button" className="mt-join" onClick={onOpenDonate}>{getCMSCopy("copy.PartnersHero.be3dde060bae", "Partner With Us")}</button>
        </div>
      </div>

      {/* LEFT */}
      <div className="mt-body">
        <div className="mt-left">
          <p className="mt-eyebrow" id="partners-heading">{getCMSCopy("copy.PartnersHero.7e9dc538a648", "Our partners")}</p>

          <TypewriterHeading calm={calm} />

          <div className="btn-border-wrap mt-start-wrap">
            <button type="button" className="mt-start" onClick={onOpenDonate}>{getCMSCopy("copy.PartnersHero.66a18f4d2672", "Become a partner")}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT — THE ORBITS */}
        <div className="mt-right">
          <div className="mt-circles" role="img" aria-label={`${PARTNERS.length} partner organisations`}>
            {/* THE NODES RIDE THEIR RING. They have to be CHILDREN of the
                orbit, not siblings of it: laid alongside, they inherit none
                of its turn and simply hang in place while an almost
                invisible circle rotates behind them — which reads, exactly,
                as nothing moving at all. Inside each one a span counter-turns
                at that ring's own rate, so the picture stays upright while
                the ring carries it round. */}
            {([1, 2, 3, 4] as const).map((o) => (
              <div key={o} className={`mt-orbit mt-orbit-${o}`}>
                {o === 1 && (
                  <div className="mt-core">
                    <span className="mt-core-num">{count}</span>
                    <span className="mt-core-label">{getCMSCopy("copy.PartnersHero.5dab502bfba3", "Partners")}</span>
                  </div>
                )}

                {NODES.filter((n) => n.orbit === o).map((n) => (
                  <div
                    key={`${n.src}-${n.angle}`}
                    className="mt-node"
                    style={{
                      ['--a' as string]: `${n.angle}deg`,
                      ['--r' as string]: `${RADIUS[o]}px`,
                      ['--s' as string]: `${n.size}px`,
                      ['--glow' as string]: n.glow,
                      animationDelay: calm ? '0s' : `${n.delay}s`,
                    }}
                  >
                    <span className={`mt-node-spin mt-node-spin-o${o}`}>
                      <img
                        className={n.round ? 'mt-node-img mt-node-round' : 'mt-node-img'}
                        src={resolveCMSMedia(n.src)}
                        alt={n.alt}
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TICKER */}
      <div className="mt-ticker" ref={strip}>
        <div className="mt-ticker-track">
          {[0, 1, 2, 3].map((copy) =>
            MARKS.map((m) => (
              <img
                key={`${copy}-${m.src}`}
                className="mt-ticker-logo"
                src={resolveCMSMedia(m.src)}
                alt={copy === 0 ? m.alt : ''}
                aria-hidden={copy !== 0}
                loading="lazy"
                decoding="async"
              />
            )),
          )}
        </div>
      </div>
    </section>
  );
};

export default PartnersHero;
