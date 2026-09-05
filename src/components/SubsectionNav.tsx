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
export const SubsectionNav: React.FC<SubsectionNavProps> = ({
  links,
  label = 'On this page',
}) => {
  const [active, setActive] = useState(links[0]?.id ?? '');
  const railRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const line = window.innerHeight / 3;
      let current = links[0]?.id ?? '';
      for (const l of links) {
        const el = document.getElementById(l.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = l.id;
      }
      /* at the very bottom nothing further can come into view, so the last
         section owns the rail however short it is */
      const atEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atEnd && links.length) current = links[links.length - 1].id;
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
  }, [links]);

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
        behavior: 'smooth',
      });
    }
  }, [active]);

  if (links.length < 2) return null;

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    /* scroll-margin-top on the section clears the fixed header */
    el.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    });
    /* move the keyboard caret to the destination, not just the viewport */
    el.setAttribute('tabindex', '-1');
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
