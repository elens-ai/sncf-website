import { getCMSCopy } from '../cms/runtime';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Droplet, Heart, TreePine, Users, Building2, Scissors, Laptop, School, GraduationCap, Sparkles, Ambulance, Package, ShieldCheck, Wind, Syringe, Landmark, HeartHandshake, type LucideIcon } from 'lucide-react';
import type { Activity } from '../data/activities';
import { OdometerStatCounter } from './OdometerStatCounter';
import { onArrival } from '../utils/arrival';
import './value-analytics.css';

/**
 * THE FIGURES, DRAWN OUT — a band of charts under each cornerstone.
 *
 * Every chart here is drawn from figures the foundation reports, read out
 * of the activity's own data points (so a CMS edit flows through), and each
 * card carries the activity's reporting date. Nothing is estimated:
 *
 *  - a GROWTH pair shows two figures the report gives for two dates, and the
 *    difference between them is either the report's own "added" figure or
 *    plain subtraction, labelled as such;
 *  - a DONUT only ever divides one measure at one date (facility types,
 *    youth by trade, volunteers by site) — never figures from different
 *    sheets;
 *  - a RING or share bar states which reported figure it is a share of;
 *  - a PICTOGRAM's legend says what one symbol stands for.
 *
 * Numbers roll in on the page's odometer, bars and arcs draw themselves on
 * arrival (one registration per band, see utils/arrival), and under reduced
 * motion everything simply appears finished.
 */
type Cornerstone = 'heal' | 'enrich' | 'empower';

export const point = (activities: Activity[], id: string, label: string) =>
  activities.find(a => a.id === id)?.dataPoints.find(p => p.label === label)?.value ?? '';
export const when = (activities: Activity[], id: string) => activities.find(a => a.id === id)?.period ?? '';
/** "₹4,82,19,252" → 48219252, "19,582,822 sq ft" → 19582822. Never used on prose values. */
export const num = (value: string) => Number(value.replace(/[^\d.]/g, '')) || 0;
export const group = (n: number) => n.toLocaleString('en-US');
export const pct = (part: string, whole: string) => (num(whole) ? Math.round((num(part) / num(whole)) * 1000) / 10 : 0);

export const Figure: React.FC<{ value: string; size?: 'xl' | 'lg' | 'md' | 'sm'; plain?: boolean }> = ({ value, size = 'md', plain }) => (
  <span className={`va-figure va-figure-${size}`}>{plain ? value : <OdometerStatCounter value={value} duration={1400} />}</span>
);

export const Card: React.FC<{ title: string; note?: string; period: string; span: number; activityId?: string; explorerId?: string; onSelect?: (id: string) => void; children?: React.ReactNode }> =
  ({ title, note, period, span, activityId, explorerId, onSelect, children }) => (
    <article className="va-card" style={{ '--span': span } as React.CSSProperties}>
      <header className="va-card-head">
        <h4>{title}</h4>
        <span className="va-card-period">{period}</span>
      </header>
      {note && <p className="va-card-note">{note}</p>}
      <div className="va-card-body">{children}</div>
      {explorerId && activityId && <a className="va-card-link" href={`#${explorerId}`} onClick={() => onSelect?.(activityId)}>{getCMSCopy("copy.ValueAnalytics.programme", "See the programme")} <ArrowUpRight size={14} aria-hidden="true" /></a>}
    </article>
  );

/* ----- the chart kit ----- */

/** Horizontal bars for figures that share a unit. */
export const Bars: React.FC<{ items: { label: string; value: string; note?: string }[]; equal?: boolean }> = ({ items, equal }) => {
  const max = Math.max(1, ...items.map(item => num(item.value)));
  return (
    <ul className="va-bars">
      {items.map((item, i) => (
        <li key={item.label} style={{ '--v': equal ? 1 : num(item.value) / max, '--d': `${i * 120}ms` } as React.CSSProperties}>
          <span className="va-bar-label">{item.label}{item.note && <small>{item.note}</small>}</span>
          <span className="va-bar-track"><span className="va-bar-fill" /></span>
          <Figure value={item.value} size="sm" />
        </li>
      ))}
    </ul>
  );
};

/** One measure at one date, divided. */
export const Donut: React.FC<{ segments: { label: string; value: string }[]; centre: { value: string; label: string } }> = ({ segments, centre }) => {
  const total = segments.reduce((sum, s) => sum + num(s.value), 0) || 1;
  const C = 2 * Math.PI * 42;
  let offset = 0;
  const arcs = segments.map((s, i) => { const f = num(s.value) / total; const arc = { ...s, f, start: offset, i }; offset += f; return arc; });
  return (
    <div className="va-donut">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="va-donut-track" cx="50" cy="50" r="42" />
        {arcs.map(arc => (
          <circle key={arc.label} className="va-donut-arc" cx="50" cy="50" r="42"
            style={{ '--len': arc.f * C, '--gap': C, '--d': `${arc.i * 140}ms`, strokeDashoffset: -arc.start * C, opacity: 1 - arc.i * (0.55 / Math.max(1, arcs.length - 1)) } as React.CSSProperties} />
        ))}
      </svg>
      <div className="va-donut-centre" data-long={centre.value.replace(/\D/g, '').length > 6}><Figure value={centre.value} size="lg" /><span className="va-donut-label">{centre.label}</span></div>
      <ul className="va-legend">
        {arcs.map(arc => <li key={arc.label} style={{ '--o': 1 - arc.i * (0.55 / Math.max(1, arcs.length - 1)) } as React.CSSProperties}><i /><span>{arc.label}</span><strong>{arc.value}</strong><small>{Math.round(arc.f * 100)}%</small></li>)}
      </ul>
    </div>
  );
};

/** Two figures the report gives for two dates. */
export const Growth: React.FC<{ label: string; before: { value: string; when: string }; after: { value: string; when: string }; added?: string; addedNote: string }> = ({ label, before, after, added, addedNote }) => {
  const max = Math.max(1, num(before.value), num(after.value));
  const delta = added ?? group(num(after.value) - num(before.value));
  return (
    <div className="va-growth">
      <p className="va-growth-label">{label}</p>
      <div className="va-growth-bars">
        {[before, after].map((step, i) => (
          <div key={step.when} className="va-growth-step" style={{ '--v': num(step.value) / max, '--d': `${i * 180}ms` } as React.CSSProperties}>
            <Figure value={step.value} size="sm" />
            <span className="va-growth-bar"><span /></span>
            <span className="va-growth-when">{step.when}</span>
          </div>
        ))}
      </div>
      <p className="va-growth-delta"><strong>+{delta}</strong><span>{addedNote}</span></p>
    </div>
  );
};

/** A grid of symbols, one per `unit`. */
export const Pictogram: React.FC<{ total: string; unit: number; icon?: LucideIcon; legend: string }> = ({ total, unit, icon: Icon, legend }) => {
  const count = Math.max(1, Math.round(num(total) / unit));
  return (
    <div className="va-pictogram">
      <div className="va-pictogram-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => Icon
          ? <Icon key={i} size={22} strokeWidth={1.6} style={{ '--i': i } as React.CSSProperties} />
          : <i key={i} style={{ '--i': i } as React.CSSProperties} />)}
      </div>
      <p className="va-pictogram-legend">{Icon ? <Icon size={13} strokeWidth={2} aria-hidden="true" /> : <i aria-hidden="true" />} {legend}</p>
    </div>
  );
};

/** A share of a stated whole. */
export const Ring: React.FC<{ part: { value: string; label: string }; whole: { value: string; label: string } }> = ({ part, whole }) => {
  const share = pct(part.value, whole.value);
  const C = 2 * Math.PI * 42;
  return (
    <div className="va-ring">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="va-donut-track" cx="50" cy="50" r="42" />
        <circle className="va-donut-arc" cx="50" cy="50" r="42" style={{ '--len': (share / 100) * C, '--gap': C, '--d': '0ms' } as React.CSSProperties} />
      </svg>
      <div className="va-ring-centre"><strong>{share}%</strong></div>
      <div className="va-ring-caption"><Figure value={part.value} size="sm" /> {part.label} · {getCMSCopy("copy.ValueAnalytics.of", "of")} {whole.value} {whole.label}</div>
    </div>
  );
};

/** Icon, figure, label — for a handful of counts. */
export const Tiles: React.FC<{ items: { icon: LucideIcon; value: string; label: string }[] }> = ({ items }) => (
  <ul className="va-tiles">
    {items.map(({ icon: Icon, value, label }, i) => (
      <li key={label} style={{ '--d': `${i * 90}ms` } as React.CSSProperties}><Icon size={20} strokeWidth={1.6} aria-hidden="true" /><Figure value={value} size="md" /><span className="va-tile-label">{label}</span></li>
    ))}
  </ul>
);

/* ----- the three bands ----- */

const HealAnalytics: React.FC<BandProps> = ({ activities, explorerId, onSelect }) => {
  const v = (id: string, label: string) => point(activities, id, label);
  const w = (id: string) => when(activities, id);
  const facilities = ['Allopathic', 'Homeopathic', 'Oneness labs', 'Dental centres', 'Eye centres', 'Physiotherapy', 'X-ray centres', 'Chiropractic', 'Oneness pharmacy']
    .map(label => ({ label, value: v('health-centre', label) })).filter(s => s.value);
  const listed = group(facilities.reduce((sum, s) => sum + num(s.value), 0));
  return <>
    <Card title={getCMSCopy("copy.ValueAnalytics.heal1", "Blood donation, April 2025 to March 2026")} period={w('blood-donation')} span={3} activityId="blood-donation" explorerId={explorerId} onSelect={onSelect}>
      <Growth label="Units collected" before={{ value: v('blood-donation', 'Units — April 2025'), when: 'April 2025' }} after={{ value: v('blood-donation', 'Units collected'), when: 'March 2026' }} addedNote={getCMSCopy("copy.ValueAnalytics.computed", "difference between the two reported figures")} />
      <Growth label="Camps organised" before={{ value: v('blood-donation', 'Camps — April 2025'), when: 'April 2025' }} after={{ value: v('blood-donation', 'Camps organised'), when: 'March 2026' }} addedNote={getCMSCopy("copy.ValueAnalytics.computed", "difference between the two reported figures")} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.heal2", "One unit, three lives")} note={getCMSCopy("copy.ValueAnalytics.heal2note", "The report's potentially saved lives, against the units collected.")} period={w('blood-donation')} span={3} activityId="blood-donation" explorerId={explorerId} onSelect={onSelect}>
      <div className="va-ratio">
        <div className="va-ratio-side"><Droplet size={30} strokeWidth={1.5} aria-hidden="true" /><Figure value={v('blood-donation', 'Units collected')} size="md" /><span>Units collected</span></div>
        <span className="va-ratio-times" aria-hidden="true">×3</span>
        <div className="va-ratio-side"><span className="va-ratio-hearts" aria-hidden="true"><Heart size={22} strokeWidth={1.5} /><Heart size={22} strokeWidth={1.5} /><Heart size={22} strokeWidth={1.5} /></span><Figure value={v('blood-donation', 'Potentially saved lives')} size="md" /><span>Potentially saved lives</span></div>
      </div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.heal3", "Eye care, of every OPD visit")} period={w('eye-checkup')} span={2} activityId="eye-checkup" explorerId={explorerId} onSelect={onSelect}>
      <Bars items={[{ label: 'OPD', value: v('eye-checkup', 'OPD') }, { label: 'Free spectacles', value: v('eye-checkup', 'Free spectacles'), note: `${pct(v('eye-checkup', 'Free spectacles'), v('eye-checkup', 'OPD'))}%` }, { label: 'Cataract surgeries', value: v('eye-checkup', 'Cataract surgeries'), note: `${pct(v('eye-checkup', 'Cataract surgeries'), v('eye-checkup', 'OPD'))}%` }]} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.heal4", "The health-centre network")} period={w('health-centre')} span={2} activityId="health-centre" explorerId={explorerId} onSelect={onSelect}>
      <Donut segments={facilities} centre={{ value: listed, label: getCMSCopy("copy.ValueAnalytics.listed", "facilities listed") }} />
      <div className="va-aside"><Ambulance size={16} strokeWidth={1.6} aria-hidden="true" /><Figure value={v('health-centre', 'Ambulances')} size="sm" /> Ambulances</div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.heal5", "Six months of checkups and the blood bank")} period={w('health-checkup')} span={2} activityId="health-checkup" explorerId={explorerId} onSelect={onSelect}>
      <Growth label="Patients treated" before={{ value: v('health-checkup', 'Patients — March 2025'), when: 'March 2025' }} after={{ value: v('health-checkup', 'Patients treated'), when: 'September 2025' }} added={v('health-checkup', 'Added Mar–Sep 2025')} addedNote={getCMSCopy("copy.ValueAnalytics.reported", "as reported")} />
      <Growth label="Blood bank units" before={{ value: v('blood-bank', 'Units — March 2025'), when: 'March 2025' }} after={{ value: v('blood-bank', 'Units'), when: 'September 2025' }} added={v('blood-bank', 'Added Mar–Sep 2025')} addedNote={getCMSCopy("copy.ValueAnalytics.reported", "as reported")} />
    </Card>
  </>;
};

const EnrichAnalytics: React.FC<BandProps> = ({ activities, explorerId, onSelect }) => {
  const v = (id: string, label: string) => point(activities, id, label);
  const w = (id: string) => when(activities, id);
  const trades = [{ label: 'Sewing', value: v('skill-trades', 'Sewing youth benefitted') }, { label: 'NIMA', value: v('skill-nima', 'Youth benefitted') }, { label: 'Beautician', value: v('skill-trades', 'Beautician youth benefitted') }].filter(s => s.value);
  return <>
    <Card title={getCMSCopy("copy.ValueAnalytics.enrich1", "Where the learners are")} period={w('schools-colleges')} span={4} activityId="schools-colleges" explorerId={explorerId} onSelect={onSelect}>
      <Bars items={[
        { label: 'Students in schools & colleges', value: v('schools-colleges', 'Students benefitted') },
        { label: 'College students', value: v('schools-colleges', 'College students'), note: getCMSCopy("copy.ValueAnalytics.within", "within the total") },
        { label: 'Students in free schools', value: v('free-schools', 'Students in free schools') },
        { label: 'Scholarship students', value: v('scholarships', 'Scholarship students') },
      ]} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.enrich2", "Youth skilled, by trade")} period={w('skill-trades')} span={2} activityId="skill-trades" explorerId={explorerId} onSelect={onSelect}>
      <Donut segments={trades} centre={{ value: group(trades.reduce((sum, s) => sum + num(s.value), 0)), label: getCMSCopy("copy.ValueAnalytics.youth", "youth, all trades") }} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.enrich3", "Centres across the country")} period={w('skill-trades')} span={3} activityId="skill-nima" explorerId={explorerId} onSelect={onSelect}>
      <Tiles items={[
        { icon: Scissors, value: v('skill-trades', 'Sewing centres'), label: 'Sewing centres' },
        { icon: Laptop, value: v('skill-nima', 'NIMA centres'), label: 'NIMA centres' },
        { icon: School, value: v('schools-colleges', 'Schools'), label: 'Schools' },
        { icon: School, value: v('free-schools', 'Free schools'), label: 'Free schools' },
        { icon: Sparkles, value: v('skill-trades', 'Beautician centres'), label: 'Beautician centres' },
        { icon: GraduationCap, value: v('schools-colleges', 'Colleges'), label: 'Colleges' },
      ]} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.enrich4", "NIMA, six months on")} period={w('skill-nima')} span={3} activityId="skill-nima" explorerId={explorerId} onSelect={onSelect}>
      <Growth label="NIMA centres" before={{ value: v('skill-nima', 'Centres — March 2025'), when: 'March 2025' }} after={{ value: v('skill-nima', 'NIMA centres'), when: 'September 2025' }} addedNote={getCMSCopy("copy.ValueAnalytics.computed", "difference between the two reported figures")} />
      <div className="va-aside"><Users size={16} strokeWidth={1.6} aria-hidden="true" /><Figure value={v('skill-nima', 'Added Mar–Sep 2025')} size="sm" plain /> {getCMSCopy("copy.ValueAnalytics.addedYouth", "added in the same six months, as reported")}</div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.enrich5", "Scholarships")} period={w('scholarships')} span={6} activityId="scholarships" explorerId={explorerId} onSelect={onSelect}>
      <div className="va-money"><Figure value={v('scholarships', 'Disbursed')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.disbursedTo", "disbursed, to")} <Figure value={v('scholarships', 'Scholarship students')} size="md" /> {getCMSCopy("copy.ValueAnalytics.students", "scholarship students")}</span></div>
    </Card>
  </>;
};

const EmpowerAnalytics: React.FC<BandProps> = ({ activities, explorerId, onSelect }) => {
  const v = (id: string, label: string) => point(activities, id, label);
  const w = (id: string) => when(activities, id);
  const volunteers = [{ label: 'Waterbody volunteers', value: v('cleanliness', 'Waterbody volunteers') }, { label: 'Railway & hospital volunteers', value: v('cleanliness', 'Rly / hospital volunteers') }].filter(s => s.value);
  return <>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower1", "A forest, tree by tree")} period={w('tree-plantation')} span={4} activityId="tree-plantation" explorerId={explorerId} onSelect={onSelect}>
      <div className="va-money"><Figure value={v('tree-plantation', 'Trees planted')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.treesIn", "trees planted, in")} <Figure value={v('tree-plantation', 'Total drives')} size="md" /> {getCMSCopy("copy.ValueAnalytics.drives", "drives")}</span></div>
      <Pictogram total={v('tree-plantation', 'Trees planted')} unit={100000} icon={TreePine} legend={getCMSCopy("copy.ValueAnalytics.treeLegend", "Each tree stands for 100,000 trees planted")} />
      <Bars items={[{ label: 'Vann Mahotsav plantation', value: v('tree-plantation', 'Vann Mahotsav plantation'), note: `${v('tree-plantation', 'Vann Mahotsav drives')} drives` }, { label: 'World Environment Day plantation', value: v('tree-plantation', 'WED plantation'), note: `${v('tree-plantation', 'WED drives')} drives` }]} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower2", "Volunteers, by site")} period={w('cleanliness')} span={2} activityId="cleanliness" explorerId={explorerId} onSelect={onSelect}>
      <Donut segments={volunteers} centre={{ value: group(volunteers.reduce((sum, s) => sum + num(s.value), 0)), label: getCMSCopy("copy.ValueAnalytics.volunteers", "volunteers, both") }} />
      <div className="va-aside"><HeartHandshake size={16} strokeWidth={1.6} aria-hidden="true" /><Figure value={v('cleanliness', 'Total manhours')} size="sm" /> {getCMSCopy("copy.ValueAnalytics.manhours", "manhours in all")}</div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower3", "Sites cleaned")} period={w('cleanliness')} span={2} activityId="cleanliness" explorerId={explorerId} onSelect={onSelect}>
      <Bars items={[{ label: 'Waterbodies', value: v('cleanliness', 'Waterbodies') }, { label: 'Hospitals', value: v('cleanliness', 'Hospitals') }, { label: 'Railway stations', value: v('cleanliness', 'Railway stations') }]} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower4", "COVID-19 relief, 2022")} period={w('covid-relief')} span={4} activityId="covid-relief" explorerId={explorerId} onSelect={onSelect}>
      <div className="va-split">
        <Tiles items={[
          { icon: Package, value: v('covid-relief', 'Food packets'), label: 'Food packets' },
          { icon: ShieldCheck, value: v('covid-relief', 'Masks'), label: 'Masks' },
          { icon: ShieldCheck, value: v('covid-relief', 'PPE kits'), label: 'PPE kits' },
          { icon: Wind, value: v('covid-relief', 'Oxygen concentrators'), label: 'Oxygen concentrators' },
          { icon: Syringe, value: v('covid-relief', 'Vaccination centres'), label: 'Vaccination centres' },
          { icon: Building2, value: v('covid-relief', 'Care centres'), label: 'Care centres' },
        ]} />
        <Ring part={{ value: v('covid-relief', 'ICU beds'), label: 'ICU beds' }} whole={{ value: v('covid-relief', 'Total beds'), label: 'beds' }} />
      </div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower5", "Mass marriages since 1998")} period={w('mass-marriages')} span={3} activityId="mass-marriages" explorerId={explorerId} onSelect={onSelect}>
      <div className="va-money"><Figure value={v('mass-marriages', 'Couples married')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.couplesIn", "couples married, in")} <Figure value={v('mass-marriages', 'Events (1998–2025)')} size="md" /> {getCMSCopy("copy.ValueAnalytics.events", "events")}</span></div>
      <div className="va-timeline" aria-hidden="true"><span className="va-timeline-fill" /><span className="va-timeline-year">1998</span><span className="va-timeline-year">2025</span></div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower6", "Financial support")} period={w('financial-support')} span={3} activityId="financial-support" explorerId={explorerId} onSelect={onSelect}>
      <Bars items={[{ label: 'Financial help', value: v('financial-support', 'Financial help') }, { label: 'Disaster relief & fund', value: v('financial-support', 'Disaster relief & fund') }]} />
      <div className="va-aside"><Landmark size={16} strokeWidth={1.6} aria-hidden="true" /> {v('financial-support', 'Youth sport (NBGSMCT)')} · {getCMSCopy("copy.ValueAnalytics.sport", "youth sport (NBGSMCT)")}</div>
    </Card>
  </>;
};

interface BandProps { activities: Activity[]; explorerId: string; onSelect: (id: string) => void }
const BANDS: Record<Cornerstone, React.FC<BandProps>> = { heal: HealAnalytics, enrich: EnrichAnalytics, empower: EmpowerAnalytics };

/** The band: heading, grid and the one arrival registration that starts every chart in it. */
export const ChartBand: React.FC<{ id: string; className?: string; children?: React.ReactNode }> = ({ id, className, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; return onArrival(el, () => setArrived(true)); }, []);
  return (
    <div className={`value-analytics${className ? ` ${className}` : ''}`} ref={ref} data-arrived={arrived} id={id}>
      <div className="va-heading">
        <div>
          <p className="value-kicker">{getCMSCopy("copy.ValueAnalytics.kicker", "Analytics")}</p>
          <h3>{getCMSCopy("copy.ValueAnalytics.title", "The figures, drawn out")}</h3>
        </div>
        <p>{getCMSCopy("copy.ValueAnalytics.lead", "Every chart is drawn from the figures the foundation reports, each to its own date. Nothing here is estimated.")}</p>
      </div>
      <div className="va-grid">{children}</div>
    </div>
  );
};

export const ValueAnalytics: React.FC<{ pillarId: Cornerstone; activities: Activity[]; explorerId: string; onSelect: (id: string) => void }> = ({ pillarId, activities, explorerId, onSelect }) => {
  const Band = BANDS[pillarId];
  return <ChartBand id={`${pillarId}-analytics`}><Band activities={activities} explorerId={explorerId} onSelect={onSelect} /></ChartBand>;
};
