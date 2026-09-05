import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { ChapterAmbience } from '../components/ChapterAmbience';
import { MediaGallery } from '../components/MediaGallery';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import { onArrival } from '../utils/arrival';

/**
 * CORE VALUES — the three cornerstones, written down.
 *
 * The hall on the home page shows Heal, Enrich and Empower in motion; a
 * visitor walks through it and comes away with an impression. This page is
 * the other half of that: every figure the March 2026 activity report gives,
 * arranged so the scale of each vertical can actually be compared.
 *
 * Three devices carry it:
 *
 *  · the LEDGER — each vertical's four headline figures, counted up on
 *    arrival so the numbers land rather than simply appear;
 *  · the SCALE — a ranked bar for every activity in the vertical, drawn from
 *    that activity's own headline figure. The bars are proportional within a
 *    vertical, never across two: blood units and cataract surgeries are not
 *    the same kind of quantity, and a shared axis would lie about that;
 *  · the RECORD — every data point the report publishes per activity, opened
 *    in place rather than behind a modal.
 *
 * Officially the foundation places environmental work under Heal. Our
 * exhibition puts trees and cleanliness under Empower, and this page follows
 * the exhibition so the two halves of the site agree with each other.
 */

/** The three official cornerstones, in the foundation's own order. */
const CORNERSTONES = ['heal', 'enrich', 'empower'] as const;

/** '1,500,230' -> 1500230; '19,582,822 sq ft' -> 19582822; '449' -> 449. */
const toNumber = (v: string): number => {
  const m = v.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

/**
 * A SUM OF MONEY, not a count of things — '₹4,82,19,252' beside '209,038'.
 * The ranked scale must never put these on one axis: rupees parse to a far
 * larger number than any headcount next to them, so one amount becomes the
 * peak and every real quantity in the room collapses against it.
 */
const isAmount = (v: string) => /^[₹$]/.test(v.trim());

/**
 * ONE MARK STANDS FOR HOW MANY?
 *
 * The tally draws a row of marks per activity, and each row declares its own
 * worth — "each ● = 100,000 units collected". That declaration is what makes
 * the presentation honest: a bar chart forces one axis onto quantities that
 * do not share one, so 47 hospitals sat three pixels long beside 1.5 million
 * bags of blood and read as negligible. Counting symbols carry magnitude
 * without ever implying that a hospital and a blood bag are the same thing.
 *
 * The step is chosen so every row lands between 8 and 20 marks — enough to
 * feel a quantity, few enough to take in without counting.
 */
const markStep = (v: number): number => {
  if (v <= 20) return 1;
  /* WHOLE STEPS ONLY. A 2.5 in this list gave the Health Centre a step of
     2.5 centres, which the key then printed as "≈ 3" — a caption that
     misstates its own scale, in the one section whose whole purpose is not
     to mislead. Integers only, so what is printed is what is drawn. */
  const mag = Math.pow(10, Math.floor(Math.log10(v / 14)));
  for (const m of [1, 2, 5]) {
    const step = Math.max(1, Math.round(m * mag));
    if (v / step <= 20) return step;
  }
  return Math.max(1, Math.round(mag * 10));
};

/** '100000' -> '100,000'; 2500 -> '2,500' */
const groupNum = (n: number) =>
  n >= 1 ? Math.round(n).toLocaleString('en-US') : String(n);

/**
 * Only whole, plainly-written counts may be tallied: '9,174+' yes, '1.5M+'
 * no. An abbreviated figure carries its magnitude in a letter, so counting
 * its mantissa rounds 1.5M to "2M" — a quarter of a million units of blood
 * invented by a rounding step. Those are printed exactly as reported.
 */
const isTallyable = (v: string) => /^[\d,]+\+?$/.test(v.trim());

/** Counts a figure up once, when it first comes into view. */
const Tally: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = toNumber(value);
    if (
      !target ||
      !isTallyable(value) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let raf = 0;
    const suffix = value.replace(/^[\d,.]+/, '');
    /* One shared, rAF-throttled driver decides when this has arrived. Each
       figure used to mount its own unthrottled scroll listener and measure on
       every event — nine layout reads per scroll with twelve figures up. */
    let settle = 0;
    const stop = onArrival(el, () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1100);
        /* easeOut for the last stretch: the number decelerates into place */
        const e = 1 - Math.pow(1 - k, 3);
        setShown(Math.round(target * e).toLocaleString('en-US') + suffix);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      /* THE FIGURE MUST END UP TRUE, whatever happens to the animation.
         A count-up walks through numbers that are all WRONG until the last
         frame, and requestAnimationFrame is suspended whenever the tab is
         backgrounded or throttled — so an interrupted tally leaves a false
         figure standing indefinitely. Seen in testing: "268 couples married"
         where the record says 5,317. A timer, which keeps running when frames
         do not, guarantees the true value is what remains. */
      settle = window.setTimeout(() => {
        cancelAnimationFrame(raf);
        setShown(value);
      }, 1500);
    });

    return () => {
      stop();
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
};

export const CoreValuesPage: React.FC = () => {
  /* which activity has its full record open, by id */
  const [openId, setOpenId] = useState<string | null>(null);
  const { hash } = useLocation();

  /* A link into a single activity — '/core-values#blood-donation' from the
     navigation — should not merely land near the row, it should OPEN it.
     Otherwise the menu promises an activity and delivers a list.

     Timers rather than requestAnimationFrame: rAF is suspended in a
     backgrounded tab, and a deep link that silently does nothing when the
     tab was not focused is a bug this codebase has already had once. */
  useEffect(() => {
    const jump = () => {
      const id = hash.slice(1);
      if (!id) return;
      if (!ACTIVITIES.some((a) => a.id === id)) return;
      setOpenId(id);
      /* `block: 'start'` and not 'center', so this agrees with ScrollToTop,
         which also honours the hash on a route change. Two handlers landing
         on the same offset is invisible; two landing on different offsets is
         a jump. The retry re-settles after the record has opened, since
         opening it changes the height of everything below. */
      let tries = 0;
      const settle = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'start' });
        if (++tries < 3) window.setTimeout(settle, 200);
      };
      window.setTimeout(settle, 60);
    };
    jump();
    /* Keyed on the ROUTER's hash, not the `hashchange` event. React Router
       navigates with history.pushState, which does not fire hashchange — so
       an activity link clicked from the menu while already on this page
       changed the address and opened nothing. */
  }, [hash]);

  return (
    <PageShell
      accentPillarId="heal"
      eyebrow="Core Values · Heal · Enrich · Empower"
      title="The three cornerstones"
      standfirst="Everything the foundation does stands on three of them. What follows is
        not a summary — it is the record: every activity, every figure it
        reports, and the scale of one against another."
      rail={
        <SubsectionNav
          label="The cornerstones"
          links={CORNERSTONES.map((id) => {
            const p = PILLARS.find((x) => x.id === id)!;
            return { id, label: p.label, ink: p.accentB };
          })}
        />
      }
    >
      {/* The room answers: the paper's light crosses to the next
          cornerstone's ink as you approach it. */}
      <ChapterAmbience
        chapters={CORNERSTONES.map((id) => ({
          id,
          ink: PILLARS.find((x) => x.id === id)!.accentA,
        }))}
      />

      {/* THE CHAPTERS */}
      {CORNERSTONES.map((id, chapterIndex) => {
        const pillar = PILLARS.find((x) => x.id === id)!;
        const acts = ACTIVITIES.filter((a) => a.pillarId === id);
        /* AMOUNTS ARE STATED, NOT RANKED. The page already refuses to scale
           one cornerstone against another because the quantities differ in
           kind; this is the same principle one level down. Enrich's peak was
           ₹4,82,19,252 — parsed as 48,219,252 — which rendered 209,038
           students at 0.4% of a bar, a chart comparing rupees to people. */
        const ranked = acts.filter((a) => !isAmount(a.headline.value));
        const amounts = acts.filter((a) => isAmount(a.headline.value));
        /* the tallest COUNT in this vertical sets its own scale */
        const peak = Math.max(...ranked.map((a) => toNumber(a.headline.value)), 1);

        return (
          <section
            key={id}
            id={id}
            className="cv-room"
            style={
              {
                '--ink-a': pillar.accentA,
                '--ink-b': pillar.accentB,
              } as React.CSSProperties
            }
            aria-labelledby={`${id}-title`}
          >
            {/* the room's activities, printed small down both margins */}
            <div className="cv-margin-print" data-room={id} aria-hidden="true" />

            {/* THE THRESHOLD. The card stack stops here: a full-bleed band of
                paper with the cornerstone's number, name and petal on it. It
                is a leaf you turn rather than a heading you scroll past — the
                daylit answer to the hall's camera turning into a new room. */}
            <header className="cv-threshold">
              <span className="cv-threshold-num font-artistic-heading" aria-hidden="true">
                {String(chapterIndex + 1).padStart(2, '0')}
              </span>
              <img
                className="cv-threshold-emblem"
                src={`/images/vertical-${id}.webp`}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
              <p className="cv-threshold-label font-artistic-display">{pillar.label}</p>
              <h2 id={`${id}-title`} className="cv-threshold-title font-artistic-heading">
                {pillar.headline}
              </h2>
              <p className="cv-threshold-body font-artistic-serif">{pillar.body}</p>
            </header>

            <div className="cv-chapter">

            {/* THE LEDGER — the vertical's four headline figures */}
            <ul className="cv-ledger" aria-label={`${pillar.label} headline figures`}>
              {pillar.stats.map((s) => (
                <li key={s.label}>
                  <Tally value={s.value} className="cv-ledger-value font-artistic-heading" />
                  <span className="cv-ledger-label">{s.label}</span>
                </li>
              ))}
            </ul>

            <p className="cv-subtext font-artistic-serif">{pillar.subText}</p>

            <div className="cv-columns">
              {/* WHAT IT MEANS — the vertical's own highlights */}
              <div className="cv-highlights">
                <h3 className="cv-sub font-artistic-display">What this looks like</h3>
                <ul>
                  {pillar.keyHighlights.map((h) => (
                    <li key={h} className="font-artistic-serif">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* THE TALLY — each activity counted in its own unit */}
              <div className="cv-tally">
                <h3 className="cv-sub font-artistic-display">What it adds up to</h3>
                <ul className="cv-tally-list">
                  {[...ranked]
                    .sort((a, b) => toNumber(b.headline.value) - toNumber(a.headline.value))
                    .map((a) => {
                      const v = toNumber(a.headline.value);
                      const step = markStep(v);
                      const marks = Math.max(1, Math.min(20, Math.round(v / step)));
                      return (
                        <li key={a.id} className="cv-tally-row">
                          <p className="cv-tally-head">
                            <span className="cv-tally-name font-artistic-heading">
                              {a.title}
                            </span>
                            <span className="cv-tally-figure font-artistic-heading">
                              {a.headline.value}
                              <span className="cv-tally-unit">{a.headline.label}</span>
                            </span>
                          </p>
                          <p className="cv-tally-marks" data-for={a.id} aria-hidden="true">
                            {Array.from({ length: marks }, (_, i) => (
                              <span key={i} style={{ '--n': i } as React.CSSProperties} />
                            ))}
                          </p>
                          <p className="cv-tally-key">
                            <span>
                              each mark ≈ {groupNum(step)}{' '}
                              {a.headline.label.toLowerCase()}
                            </span>
                            <span className="cv-tally-period">{a.period}</span>
                          </p>
                        </li>
                      );
                    })}
                </ul>

                {amounts.length > 0 && (
                  <ul className="cv-amounts">
                    {amounts.map((a) => (
                      <li key={a.id}>
                        <span className="cv-amount-name">{a.title}</span>
                        <span className="cv-amount-value font-artistic-heading">
                          {a.headline.value}
                        </span>
                        <span className="cv-amount-unit">{a.headline.label}</span>
                        <span className="cv-tally-period">{a.period}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="cv-scale-note">
                  Each row is counted in its own unit and says what one mark is
                  worth. Nothing here is ranked against anything else — a
                  hospital and a bag of blood are not the same quantity, and a
                  shared axis would pretend they were. Each row also carries the
                  date it is counted to, because those dates are not the same.
                </p>
              </div>
            </div>

            {/* THE RECORD — every figure, opened in place */}
            <h3 className="cv-sub cv-sub-wide font-artistic-display">The record</h3>
            <ul className="cv-records">
              {acts.map((a) => {
                const open = openId === a.id;
                return (
                  <li key={a.id} id={a.id} className="cv-record" data-open={open}>
                    <button
                      type="button"
                      className="cv-record-head"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : a.id)}
                    >
                      <span className="min-w-0">
                        <span className="cv-record-title font-artistic-heading">{a.title}</span>
                        <span className="cv-record-blurb font-artistic-serif">{a.blurb}</span>
                      </span>
                      <span className="cv-record-figure">
                        <span className="cv-record-value font-artistic-heading">
                          {a.headline.value}
                        </span>
                        <span className="cv-record-unit">{a.headline.label}</span>
                      </span>
                      <span className="cv-record-chev" aria-hidden="true">
                        {open ? '−' : '+'}
                      </span>
                    </button>
                    <div className="cv-record-body">
                      <div className="cv-record-inner">
                        <dl className="cv-points">
                          {a.dataPoints.map((d) => (
                            <div key={d.label}>
                              <dt>{d.label}</dt>
                              <dd className="font-artistic-heading">{d.value}</dd>
                            </div>
                          ))}
                        </dl>
                        <p className="cv-period">{a.period}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* THE PLATES — this cornerstone's photographs and films */}
            <MediaGallery section={id} title={`${pillar.label} — photographs & films`} />
            </div>
          </section>
        );
      })}

      <p className="cv-footnote font-artistic-serif">
        Figures as published in the foundation's activity report. Where an
        activity reports a different period, it is noted against that record.
      </p>
    </PageShell>
  );
};
