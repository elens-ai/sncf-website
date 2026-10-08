import React, { useEffect, useRef, useState } from 'react';

export interface SubsectionLink {
  /** The id of the <section> this points at. */
  id: string;
  label: string;
  /** Optional ink for the active state — usually the pillar/project colour. */
  ink?: string;
}

interface SubsectionNavProps {
  links: SubsectionLink[];
  /** Small caps line at the head of the rail. */
  label?: string;
  /** 'rail' (the default): the label at the head, the chips after it.
      'tabs': the chips alone, centred as one segmented control, a lit pill
      sliding to the section in view; the label still names the control for
      screen readers. */
  variant?: 'rail' | 'tabs';
  /** 'segmented' (with the 'tabs' variant): a quiet grey track, the section in view raised as a white slip, the
      names alone in Geist, no colour (the Projects page). */
  look?: 'segmented';
  /** The rail takes the ground of the section in view: it is marked with that
      section's id (data-ground), and the page gives each id its colours
      (--backdrop-dark, -mid, -light and -pale), which it fades between. */
  tinted?: boolean;
}

/**
 * THE SUBSECTION RAIL — a page's own table of contents, which follows the
 * reader down the page and says where they are.
 *
 * Position is worked out by MEASUREMENT on scroll, not by IntersectionObserver.
 * That is the codebase's standing rule: IO rides the render pipeline, and a
 * throttled or backgrounded tab can hold its callbacks indefinitely — which is
 * how an earlier entrance animation in this repo ended up never firing. A
 * rAF-throttled scroll read is boring and always correct.
 *
 * "Where you are" is the LAST section whose top has passed the reading line
 * (a third of the way down the viewport). Nearest-to-centre reads worse: a
 * short section sandwiched between long ones flickers as you scroll past it.
 * The final section gets a floor at the very bottom of the document, or a
 * short last section can never win on a page that cannot scroll any further.
 */
const calm = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const SubsectionNav: React.FC<SubsectionNavProps> = ({
  links,
  label = 'On this page',
  variant = 'rail',
  look,
  tinted = false,
}) => {
  const [active, setActive] = useState(links[0]?.id ?? '');
  const railRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  /* While a click's own scroll is animating, the reader has already told us
     where they are going. Without this the spy narrates every section the
     page flies past and the rail strobes through the whole list. */
  const claimedRef = useRef<string | null>(null);
  const claimTimer = useRef<number | null>(null);
  const claimWatch = useRef<(() => void) | null>(null);

  /* Callers build their links inline, so the array is a new object on every
     render — and CoreValuesPage re-renders whenever a record is opened. Keyed
     on the ids instead, the measurement effect binds its listeners once. */
  const key = links.map((l) => l.id).join('|');

  useEffect(() => {
    let raf = 0;
    const ids = key ? key.split('|') : [];
    const read = () => {
      raf = 0;
      /* The reading line must sit BELOW the chrome a click scrolls to
         (72px header + the rail): a section parked at scroll-margin-top
         132px would otherwise never cross a line drawn at innerHeight/3 on
         a short viewport, and the chip you just clicked would stay dark. */
      const line = Math.max(window.innerHeight / 3, 150);
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
      }
      /* At the very bottom nothing further can come into view, so the last
         section owns the rail however short it is — but only on a page that
         actually scrolls, or a short page would open on its last chip. */
      const scrollable =
        document.documentElement.scrollHeight > window.innerHeight + 4;
      const atEnd =
        scrollable &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
      if (atEnd && ids.length) current = ids[ids.length - 1];

      /* a claim from a click outranks measurement until the scroll settles */
      if (claimedRef.current && claimedRef.current !== current) return;
      if (claimedRef.current === current) claimedRef.current = null;
      setActive((cur) => (cur === current ? cur : current));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key]);

  useEffect(
    () => () => {
      if (claimTimer.current) window.clearTimeout(claimTimer.current);
      if (claimWatch.current) window.removeEventListener('scroll', claimWatch.current);
    },
    [],
  );

  /* keep the active chip in view on the horizontal (mobile) rail */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const chip = rail.querySelector<HTMLElement>(`[data-for="${active}"]`);
    if (!chip) return;
    /* only scroll the rail itself — never the page; measured from the
       boxes, as the tabs' track is the chips' offset parent */
    const r = chip.getBoundingClientRect();
    const rr = rail.getBoundingClientRect();
    if (r.left < rr.left || r.right > rr.right) {
      rail.scrollTo({
        left: rail.scrollLeft + r.left - rr.left - rail.clientWidth / 2 + r.width / 2,
        behavior: calm() ? 'auto' : 'smooth',
      });
    }
  }, [active]);

  /* The tabs' lit pill sits under the active chip, measured from the boxes
     (again on resize, and once the fonts have set the chips' widths). It
     first appears in place; only later moves slide (data-lit). */
  useEffect(() => {
    const track = trackRef.current;
    if (variant !== 'tabs' || !track) return;
    let frame = 0;
    const place = () => {
      const chip = track.querySelector<HTMLElement>(`[data-for="${active}"]`);
      if (!chip) return;
      const t = track.getBoundingClientRect();
      const c = chip.getBoundingClientRect();
      track.style.setProperty('--lit-x', `${c.left - t.left}px`);
      track.style.setProperty('--lit-w', `${c.width}px`);
      if (!track.dataset.lit) frame = requestAnimationFrame(() => { track.dataset.lit = 'true'; });
    };
    place();
    let live = true;
    document.fonts?.ready.then(() => { if (live) place(); });
    window.addEventListener('resize', place, { passive: true });
    return () => {
      live = false;
      window.removeEventListener('resize', place);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [active, variant]);

  if (links.length < 2) return null;

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    /* light the chip immediately: the reader chose it, and the measurement
       will not agree until the scroll finishes */
    setActive(id);
    claimedRef.current = id;
    /* The claim lasts until the measurement agrees (the page has arrived) or
       the page comes to rest, whichever is first: then the spy resumes, even
       if the section never reaches the reading line. A fixed timeout ran out
       mid-flight on a long jump down a phone's page, and the rail lit the
       sections it was still passing. */
    if (claimTimer.current) window.clearTimeout(claimTimer.current);
    if (claimWatch.current) window.removeEventListener('scroll', claimWatch.current);
    const watch = () => {
      if (claimTimer.current) window.clearTimeout(claimTimer.current);
      claimTimer.current = window.setTimeout(() => {
        window.removeEventListener('scroll', watch);
        claimWatch.current = null;
        claimedRef.current = null;
        window.dispatchEvent(new Event('scroll'));
      }, 250);
    };
    claimWatch.current = watch;
    window.addEventListener('scroll', watch, { passive: true });
    watch();

    /* scroll-margin-top on the section clears the header and the rail */
    el.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });

    /* Move the keyboard caret to the destination, not just the viewport.
       tabindex is added only for this focus and removed on blur: these
       targets are sometimes plain layout containers, and leaving -1 on them
       permanently makes them programmatic focus targets forever. */
    const hadTabIndex = el.hasAttribute('tabindex');
    if (!hadTabIndex) {
      el.setAttribute('tabindex', '-1');
      el.addEventListener(
        'blur',
        () => el.removeAttribute('tabindex'),
        { once: true },
      );
    }
    el.focus({ preventScroll: true });
  };

  const list = (
    <ul className="subnav-list">
      {links.map((l) => (
        <li key={l.id}>
          <button
            type="button"
            data-for={l.id}
            className="subnav-chip"
            data-on={active === l.id}
            aria-current={active === l.id ? 'true' : undefined}
            style={l.ink ? ({ '--chip-ink': l.ink } as React.CSSProperties) : undefined}
            onClick={() => go(l.id)}
          >
            {l.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <nav className="subnav" aria-label={label} ref={railRef} data-variant={variant} data-look={look}
      data-tinted={tinted || undefined} data-ground={tinted ? active : undefined}>
      {variant === 'tabs' ? (
        <div className="subnav-track" ref={trackRef}>
          <span className="subnav-lit" aria-hidden="true" />
          {list}
        </div>
      ) : (
        <>
          <span className="subnav-label font-artistic-display">{label}</span>
          {list}
        </>
      )}
    </nav>
  );
};
