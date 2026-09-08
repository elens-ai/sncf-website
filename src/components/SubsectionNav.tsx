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
}) => {
  const [active, setActive] = useState(links[0]?.id ?? '');
  const railRef = useRef<HTMLElement | null>(null);
  /* While a click's own scroll is animating, the reader has already told us
     where they are going. Without this the spy narrates every section the
     page flies past and the rail strobes through the whole list. */
  const claimedRef = useRef<string | null>(null);
  const claimTimer = useRef<number | null>(null);

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
    },
    [],
  );

  /* keep the active chip in view on the horizontal (mobile) rail */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const chip = rail.querySelector<HTMLElement>(`[data-for="${active}"]`);
    if (!chip) return;
    /* only scroll the rail itself — never the page */
    const r = chip.getBoundingClientRect();
    const rr = rail.getBoundingClientRect();
    if (r.left < rr.left || r.right > rr.right) {
      rail.scrollTo({
        left: chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2,
        behavior: calm() ? 'auto' : 'smooth',
      });
    }
  }, [active]);

  if (links.length < 2) return null;

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    /* light the chip immediately: the reader chose it, and the measurement
       will not agree until the scroll finishes */
    setActive(id);
    claimedRef.current = id;
    if (claimTimer.current) window.clearTimeout(claimTimer.current);
    /* a smooth scroll has no completion event — release the claim after the
       longest it can plausibly take, so the spy resumes if it never lands */
    claimTimer.current = window.setTimeout(() => {
      claimedRef.current = null;
    }, 1200);

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

  return (
    <nav className="subnav" aria-label={label} ref={railRef}>
      <span className="subnav-label font-artistic-display">{label}</span>
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
    </nav>
  );
};
