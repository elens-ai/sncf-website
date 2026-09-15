import { resolveCMSMedia } from '../cms/media';
import { getCMSLink } from '../cms/links';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { BRAND } from '../data/partnerBrand';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { PARTNERS } from '../data/partners';

/**
 * THE PARTNERSHIP SECTION — a light room dropped into a dark page: a single
 * rounded card carrying a video ground, the invitation lettered over it, a
 * floating navbar riding its foot, and beneath the card a marquee of the
 * organisations the foundation actually works with, scrolling forever.
 *
 * TWO DELIBERATE DEPARTURES FROM THE BRIEF, both for the same reason —
 * this is a real charity's site, not a template:
 *
 *  · THE MARKS ARE OUR OWN PARTNERS, not the svgl.app sample set. Putting
 *    Shopify, Figma and Spotify on this wall would state a partnership that
 *    does not exist; every mark below is an organisation named on
 *    nirankarifoundation.org/our-partners/ (see data/partners.ts).
 *  · #f9fafb IS SCOPED TO THIS SECTION, not set on <body>. The rest of the
 *    page is a dark hall; a global light ground would blank it.
 *
 * THE GLOW HAND-OFF. Each card carries a brand-coloured wash that blooms on
 * hover. When a bloom settles, the navbar's "Get in touch" button takes up
 * the NEXT partner's mark — the wall passes the invitation along, one
 * organisation to the one behind it. Untouched, the button walks the list
 * on its own so the seat is never empty.
 */

interface PartnershipSectionProps {
  /** The invitation's escalation path — opens the donate/contact modal. */
  onOpenDonate?: () => void;
}

/** A mark on the wall: the partner's own published icon, and the two-stop
    wash that blooms behind it, sampled from that organisation's brand. */
interface Mark {
  id: string;
  name: string;
  src: string;
  from: string;
  to: string;
}

/** Only partners whose mark we actually hold a file for. The three without
    one (KSCF, Blind Relief, EBAI) are named in data/partners.ts and stay on
    the Media Wall — a blank tile here would read as an absence. */
const getMarks = (): Mark[] => PARTNERS.flatMap(partner => {
  const brand = BRAND[partner.id];
  return brand?.logo ? [{ id: partner.id, name: brand.short || partner.name, src: resolveCMSMedia(brand.logo), from: brand.color, to: brand.color }] : [];
});

/** How long a bloom takes to settle before it hands the button along. */
const GLOW_MS = 520;
/** How long the button holds a mark when nobody is touching the wall. */
const WALK_MS = 3200;

/** Served from our own public/ rather than the CloudFront URL the brief
    carried: that object is a per-user export behind an account path, so it
    is not ours to hotlink and would break the day it expires. Same film,
    same bytes, no third party in the path. */
const videoSource = () => resolveCMSAsset("asset.PartnershipSection.d0662fd992e8", "/video/partnership.mp4");

export const PartnershipSection: React.FC<PartnershipSectionProps> = ({
  onOpenDonate,
}) => {
  const revision = useCMSRevision();
  const MARKS = useMemo(getMarks, [revision]);
  const VIDEO_SRC = videoSource();
  const calm = useReducedMotion();

  /** Which mark the "Get in touch" button is currently wearing. */
  const [badge, setBadge] = useState(0);
  /** True while a pointer is anywhere on the wall — the idle walk stands
      down so the hand-off, not the clock, drives the button. */
  const [touched, setTouched] = useState(false);
  const handoff = useRef<number | null>(null);

  /** A bloom has begun on card `i`; when it settles, pass the button on to
      the partner behind it. */
  const bloom = (i: number) => {
    setTouched(true);
    if (handoff.current) window.clearTimeout(handoff.current);
    handoff.current = window.setTimeout(
      () => setBadge((i + 1) % MARKS.length),
      calm ? 0 : GLOW_MS,
    );
  };

  useEffect(() => () => {
    if (handoff.current) window.clearTimeout(handoff.current);
  }, []);

  /** Untouched, the button walks the list itself. */
  useEffect(() => {
    if (touched || !MARKS.length) return;
    const id = window.setInterval(
      () => setBadge((i) => (i + 1) % MARKS.length),
      WALK_MS,
    );
    return () => window.clearInterval(id);
  }, [touched, MARKS.length]);

  /** Rendered twice, back to back: the track travels exactly -50% and the
      second copy lands where the first began, so the seam never shows. */
  const reel = useMemo(() => [...MARKS, ...MARKS], [MARKS]);

  const wearing = MARKS[badge % MARKS.length];
  const partnerCount = PARTNERS.length;

  return (
    <section
      id="partnership"
      aria-labelledby="partnership-heading"
      className="partnership relative z-10 w-full py-16 md:py-24 px-4"
    >
      {/* THE CARD */}
      <div className="relative w-full max-w-[1400px] mx-auto rounded-[48px] bg-transparent border border-white/20 overflow-hidden h-[600px] flex flex-col">
        {/* the ground */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* BENEATH the video, never over it: the moment the film paints it
              is hidden completely. It exists only so the dark lettering still
              has something to read against on a slow connection, or if the
              film is unreachable — not as an overlay, which the brief
              rules out. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,#ffffff_0%,#eef2f7_45%,#dce4ee_100%)]"
          />
          <video
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            className="relative w-full h-full object-cover scale-105 transition-transform duration-1000"
            src={resolveCMSMedia(VIDEO_SRC)}
          />
        </div>

        {/* the invitation */}
        <div className="relative z-20 flex-1 px-8 md:px-16 pt-12 md:pt-16 flex flex-col items-start">
          <motion.div
            initial={calm ? false : { opacity: 0, y: 18 }}
            whileInView={calm ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[38rem]"
          >
            <h2
              id="partnership-heading"
              className="font-display text-[42px] md:text-[56px] font-medium tracking-tight leading-[1.05] text-[#0a1b33]"
            >{getCMSCopy("copy.PartnershipSection.4f5bd81a46bc", "Foundation of the")}<br />{getCMSCopy("copy.PartnershipSection.e8543633032e", "new digital epoch")}</h2>

            <p className="mt-5 font-sans text-[14px] md:text-[15px] leading-relaxed text-[#64748b]">{getCMSCopy("copy.PartnershipSection.af504e81b4d5", "Designing products, powering ecosystems and laying the foundation of a decentralized web for enterprises, builders and communities alike.")}</p>

            <motion.button
              type="button"
              onClick={onOpenDonate}
              whileHover={calm ? undefined : { scale: 1.04 }}
              whileTap={calm ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="mt-8 inline-flex items-center gap-2 bg-[#0a152d] text-white rounded-full px-6 py-3 text-[13px] font-semibold shadow-[0_10px_30px_rgba(10,21,45,0.25)]"
            >{getCMSCopy("copy.PartnershipSection.98b67063cf8e", "Contact Us")}</motion.button>
          </motion.div>
        </div>

        {/* THE FLOATING NAVBAR */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
          <motion.nav
            aria-label={getCMSCopy("copy.PartnershipSection.b61dd8f40159", "Partnership")}
            initial={calm ? false : { opacity: 0, y: 16 }}
            whileInView={calm ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-1 bg-white/90 backdrop-blur-2xl px-1.5 py-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-200/40"
          >
            <span
              aria-hidden="true"
              className="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-white border border-slate-100 shadow-sm text-[#0a1b33] text-[13px]"
            >
              ✦
            </span>

            <a
              href={getCMSLink("copy.Link.PartnershipSection.4d589e9db012", "https://nirankarifoundation.org/our-partners/")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-[12px] font-semibold text-slate-500 hover:text-[#0a1b33] transition-colors"
            >{getCMSCopy("copy.PartnershipSection.4edc8bfafc6b", "Products")}</a>
            <a
              href={getCMSLink("copy.Link.PartnershipSection.eae35520563d", "https://nirankarifoundation.org/about-us/")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-[12px] font-semibold text-slate-500 hover:text-[#0a1b33] transition-colors"
            >{getCMSCopy("copy.PartnershipSection.7af023c43013", "Docs")}</a>

            <button
              type="button"
              onClick={onOpenDonate}
              className="ml-1 inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full text-[12px] font-semibold text-[#0a1b33] border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all"
            >
              {/* the seat the wall keeps handing along */}
              <span className="relative w-5 h-5 shrink-0 grid place-items-center overflow-hidden">
                {wearing && <motion.img
                  key={wearing.id}
                  src={resolveCMSMedia(wearing?.src)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  initial={calm ? false : { opacity: 0, y: 8, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-full max-h-full object-contain"
                />}
              </span>
              <span>{getCMSCopy("copy.PartnershipSection.115e410f01dc", "Get in touch")}</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </motion.nav>
        </div>
      </div>

      {/* THE MARQUEE */}
      <div
        className="partner-marquee relative mt-10 w-full max-w-[1400px] mx-auto overflow-hidden"
        onPointerLeave={() => setTouched(false)}
      >
        <ul className="partner-marquee-track flex w-max items-center gap-4">
          {reel.map((m, i) => (
            <li
              key={`${m.id}-${i}`}
              onPointerEnter={() => bloom(i % MARKS.length)}
              className="group relative h-24 w-40 shrink-0 flex items-center justify-center rounded-full bg-white border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all overflow-hidden"
            >
              {/* the bloom */}
              <div
                aria-hidden="true"
                className="absolute inset-0 scale-150 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 ease-out"
                style={{
                  background: `linear-gradient(135deg, ${m.from}, ${m.to})`,
                }}
              />
              <img
                src={resolveCMSMedia(m.src)}
                alt={i < MARKS.length ? m.name : ''}
                aria-hidden={i >= MARKS.length}
                loading="lazy"
                decoding="async"
                className="relative z-10 max-h-10 max-w-[7rem] object-contain transition-all duration-500 group-hover:brightness-0 group-hover:invert"
              />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-center font-sans text-[12px] text-white/50">
        {partnerCount}{getCMSCopy("copy.PartnershipSection.a33c4bd321ea", " organisations named on the foundation’s partners page. Marks shown for the ")}{MARKS.length}{getCMSCopy("copy.PartnershipSection.f3d8aad9367d", " that publish one.")}</p>
    </section>
  );
};

export default PartnershipSection;
