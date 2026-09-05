import React, { useEffect, useRef, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { ChapterAmbience } from '../components/ChapterAmbience';
import { MediaGallery } from '../components/MediaGallery';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';

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
    let started = false;
    const suffix = value.replace(/^[\d,.]+/, '');
    const run = () => {
      if (started) return;
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) return;
      started = true;
      window.removeEventListener('scroll', run);
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1100);
        /* easeOutfor the last stretch: the number decelerates into place */
        const e = 1 - Math.pow(1 - k, 3);
        setShown(Math.round(target * e).toLocaleString('en-US') + suffix);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    run();
    window.addEventListener('scroll', run, { passive: true });
    return () => {
      window.removeEventListener('scroll', run);
      cancelAnimationFrame(raf);
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
        /* the tallest headline figure in THIS vertical sets its own scale */
        const peak = Math.max(...acts.map((a) => toNumber(a.headline.value)), 1);

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

              {/* THE SCALE — activities ranked within this vertical */}
              <div className="cv-scale">
                <h3 className="cv-sub font-artistic-display">Scale, within this cornerstone</h3>
                <ul>
                  {[...acts]
                    .sort((a, b) => toNumber(b.headline.value) - toNumber(a.headline.value))
                    .map((a) => {
                      const pct = Math.max(3, (toNumber(a.headline.value) / peak) * 100);
                      return (
                        <li key={a.id}>
                          <span className="cv-bar-name">{a.title}</span>
                          <span className="cv-bar-track">
                            <span className="cv-bar-fill" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="cv-bar-value font-artistic-heading">
                            {a.headline.value}
                          </span>
                        </li>
                      );
                    })}
                </ul>
                <p className="cv-scale-note">
                  Bars compare activities inside this cornerstone only — the
                  quantities differ in kind, so they are never scaled against
                  another cornerstone's.
                </p>
              </div>
            </div>

            {/* THE RECORD — every figure, opened in place */}
            <h3 className="cv-sub cv-sub-wide font-artistic-display">The record</h3>
            <ul className="cv-records">
              {acts.map((a) => {
                const open = openId === a.id;
                return (
                  <li key={a.id} className="cv-record" data-open={open}>
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
