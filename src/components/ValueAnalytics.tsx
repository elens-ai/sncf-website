import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { insightsFor, type Insight } from '../data/insights';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, ArrowRight, ChevronDown, Droplet, Heart, TreePine, Users, Building2, Scissors, Laptop, School, GraduationCap, Sparkles, Ambulance, Package, ShieldCheck, Wind, Syringe, Landmark, HeartHandshake, type LucideIcon } from 'lucide-react';
import type { Activity } from '../data/activities';
import { OdometerStatCounter } from './OdometerStatCounter';
import { onArrival } from '../utils/arrival';
import './value-analytics.css';

/**
 * THE FIGURES, DRAWN OUT — a band of charts under each cornerstone.
 *
 * Every chart here is drawn from figures the foundation reports, read out
 * of the activity's own data points (so a CMS edit flows through), and each
 * card carries the activity's reporting date. Only the report's latest
 * figures are drawn (no earlier periods), and nothing is estimated:
 *
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

// The chart kit is also used on Projects; filtering only applies inside the
// Core Values programme story. Each programme keeps its original comparisons.
const ProgrammeCharts = createContext<string[] | null>(null);

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

export const Card: React.FC<{ title: string; note?: string; period: string; span: number; activityId?: string; explorerId?: string; onSelect?: (id: string) => void; photo?: string; children?: React.ReactNode }> =
  ({ title, note, period, span, activityId, explorerId, onSelect, photo, children }) => {
    const visible = useContext(ProgrammeCharts);
    if (visible && activityId && !visible.includes(activityId)) return null;
    return <article className="va-card" style={{ '--span': span } as React.CSSProperties}>
      <header className="va-card-head">
        {/* the programme the chart is about, by its own photograph */}
        {photo && <img className="va-card-photo" src={resolveCMSMedia(photo)} alt="" loading="lazy" decoding="async" />}
        <h4>{title}</h4>
        <span className="va-card-period">{period}</span>
      </header>
      {note && <p className="va-card-note">{note}</p>}
      <div className="va-card-body">{children}</div>
      {explorerId && activityId && <a className="va-card-link" href={`#${explorerId}`} onClick={() => onSelect?.(activityId)}>{getCMSCopy("copy.ValueAnalytics.programme", "See the programme")} <ArrowUpRight size={14} aria-hidden="true" /></a>}
    </article>;
  };

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
  const [selected, setSelected] = useState<string | null>(null);
  const total = segments.reduce((sum, s) => sum + num(s.value), 0) || 1;
  const C = 2 * Math.PI * 42;
  let offset = 0;
  const arcs = segments.map((s, i) => { const f = num(s.value) / total; const arc = { ...s, f, start: offset, i }; offset += f; return arc; });
  const current = arcs.find(arc => arc.label === selected);
  return (
    <div className="va-donut">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="va-donut-track" cx="50" cy="50" r="42" />
        {arcs.map(arc => (
          <circle key={arc.label} className="va-donut-arc" cx="50" cy="50" r="42"
            style={{ '--len': arc.f * C, '--gap': C, '--d': `${arc.i * 100}ms`, strokeDashoffset: -arc.start * C, opacity: current ? (current.label === arc.label ? 1 : .16) : 1 - arc.i * (0.55 / Math.max(1, arcs.length - 1)) } as React.CSSProperties} />
        ))}
      </svg>
      <div className="va-donut-centre" data-long={(current?.value ?? centre.value).replace(/\D/g, '').length > 6} aria-live="polite"><Figure value={current?.value ?? centre.value} size="lg" plain /><span className="va-donut-label">{current?.label ?? centre.label}</span></div>
      <ul className="va-legend">
        {arcs.map(arc => <li key={arc.label} style={{ '--o': 1 - arc.i * (0.55 / Math.max(1, arcs.length - 1)) } as React.CSSProperties}>
          <button type="button" aria-pressed={current?.label === arc.label} onClick={() => setSelected(current?.label === arc.label ? null : arc.label)}>
            <i /><span>{arc.label}</span><strong>{arc.value}</strong><small>{Math.round(arc.f * 100)}%</small>
          </button>
        </li>)}
      </ul>
    </div>
  );
};


/** A grid of symbols, one per `unit`; what is left over fills the last one in part, so the grid is the figure, not a rounding of it. */
export const Pictogram: React.FC<{ total: string; unit: number; icon?: LucideIcon; legend: string }> = ({ total, unit, icon: Icon, legend }) => {
  const exact = num(total) / unit;
  const count = Math.max(1, Math.floor(exact));
  const rest = exact >= 1 ? exact - count : 0;
  return (
    <div className="va-pictogram">
      <div className="va-pictogram-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => Icon
          ? <Icon key={i} size={22} strokeWidth={1.6} style={{ '--i': i } as React.CSSProperties} />
          : <i key={i} style={{ '--i': i } as React.CSSProperties} />)}
        {Icon && rest >= 0.05 && (
          <span className="va-pictogram-part" style={{ '--i': count, '--part': rest } as React.CSSProperties}>
            <Icon size={22} strokeWidth={1.6} /><span><Icon size={22} strokeWidth={1.6} /></span>
          </span>
        )}
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

/** Of every hundred: a 10 × 10 grid, a part's share of a stated whole filled in. One grid per
    share, so two shares of the same whole are never drawn as if they could not overlap. */
export const Waffle: React.FC<{ part: { value: string; label: string }; whole: { label: string }; wholeValue: string; tone?: 'deep' }> = ({ part, whole, wholeValue, tone }) => {
  const share = pct(part.value, wholeValue);
  const on = Math.round(share);
  return (
    <div className="va-waffle" data-tone={tone}>
      <div className="va-waffle-grid" aria-hidden="true">{Array.from({ length: 100 }, (_, i) => <i key={i} data-on={i < on} style={{ '--i': i } as React.CSSProperties} />)}</div>
      <div className="va-waffle-caption"><strong>{share}%</strong> <span>{part.label}</span><small><Figure value={part.value} size="sm" /> {getCMSCopy("copy.ValueAnalytics.ofEvery", "of")} {wholeValue} {whole.label}</small></div>
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

/* a programme's first photograph, for its cards */
const photoOf = (activities: Activity[], id: string) => activities.find(a => a.id === id)?.images?.[0]?.src;

const HealAnalytics: React.FC<BandProps> = ({ activities, explorerId, onSelect }) => {
  const v = (id: string, label: string) => point(activities, id, label);
  const w = (id: string) => when(activities, id);
  const pic = (id: string) => photoOf(activities, id);
  const facilities = ['Allopathic', 'Homeopathic', 'Oneness labs', 'Dental centres', 'Eye centres', 'Physiotherapy', 'X-ray centres', 'Chiropractic', 'Oneness pharmacy']
    .map(label => ({ label, value: v('health-centre', label) })).filter(s => s.value);
  const listed = group(facilities.reduce((sum, s) => sum + num(s.value), 0));
  return <>
    <Card title={getCMSCopy("copy.ValueAnalytics.healDonation", "Blood donation camps")} period={w('blood-donation')} span={3} activityId="blood-donation" explorerId={explorerId} onSelect={onSelect} photo={pic('blood-donation')}>
      <div className="va-money"><Figure value={v('blood-donation', 'Units collected')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.unitsIn", "units collected, in")} <Figure value={v('blood-donation', 'Camps organised')} size="md" /> {getCMSCopy("copy.ValueAnalytics.camps", "camps")}</span></div>
      <Pictogram total={v('blood-donation', 'Units collected')} unit={100000} icon={Droplet} legend={getCMSCopy("copy.ValueAnalytics.unitLegend", "Each drop stands for 100,000 units collected")} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.heal2", "One unit, three lives")} note={getCMSCopy("copy.ValueAnalytics.heal2note", "The report's potentially saved lives, against the units collected.")} period={w('blood-donation')} span={3} activityId="blood-donation" explorerId={explorerId} onSelect={onSelect}>
      <div className="va-ratio">
        <div className="va-ratio-side"><Droplet size={30} strokeWidth={1.5} aria-hidden="true" /><Figure value={v('blood-donation', 'Units collected')} size="md" /><span>Units collected</span></div>
        <span className="va-ratio-times" aria-hidden="true">×3</span>
        <div className="va-ratio-side"><span className="va-ratio-hearts" aria-hidden="true"><Heart size={22} strokeWidth={1.5} /><Heart size={22} strokeWidth={1.5} /><Heart size={22} strokeWidth={1.5} /></span><Figure value={v('blood-donation', 'Potentially saved lives')} size="md" /><span>Potentially saved lives</span></div>
      </div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.heal3", "Eye care, of every OPD visit")} period={w('eye-checkup')} span={2} activityId="eye-checkup" explorerId={explorerId} onSelect={onSelect} photo={pic('eye-checkup')}>
      <div className="va-money"><Figure value={v('eye-checkup', 'OPD')} size="lg" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.opdIn", "OPD visits, in")} <Figure value={v('eye-checkup', 'Camps')} size="md" /> {getCMSCopy("copy.ValueAnalytics.camps", "camps")}</span></div>
      <div className="va-waffles">
        <Waffle part={{ value: v('eye-checkup', 'Free spectacles'), label: getCMSCopy("copy.ValueAnalytics.eyeSpectacles", "received free spectacles") }} wholeValue={v('eye-checkup', 'OPD')} whole={{ label: getCMSCopy("copy.ValueAnalytics.opdVisits", "OPD visits") }} />
        <Waffle part={{ value: v('eye-checkup', 'Cataract surgeries'), label: getCMSCopy("copy.ValueAnalytics.eyeCataract", "led to cataract surgery") }} wholeValue={v('eye-checkup', 'OPD')} whole={{ label: getCMSCopy("copy.ValueAnalytics.opdVisits", "OPD visits") }} tone="deep" />
      </div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.heal4", "The health-centre network")} period={w('health-centre')} span={2} activityId="health-centre" explorerId={explorerId} onSelect={onSelect} photo={pic('health-centre')}>
      <Donut segments={facilities} centre={{ value: listed, label: getCMSCopy("copy.ValueAnalytics.listed", "facilities listed") }} />
      <div className="va-aside"><Ambulance size={16} strokeWidth={1.6} aria-hidden="true" /><Figure value={v('health-centre', 'Ambulances')} size="sm" /> Ambulances</div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.healCheckups", "Health checkup camps")} period={w('health-checkup')} span={2} activityId="health-checkup" explorerId={explorerId} onSelect={onSelect} photo={pic('health-checkup')}>
      <div className="va-money"><Figure value={v('health-checkup', 'Patients treated')} size="lg" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.patientsIn", "patients treated, in")} <Figure value={v('health-checkup', 'Camps organised')} size="md" /> {getCMSCopy("copy.ValueAnalytics.camps", "camps")}</span></div>
      <Pictogram total={v('health-checkup', 'Patients treated')} unit={25000} icon={Users} legend={getCMSCopy("copy.ValueAnalytics.patientLegend", "Each figure stands for 25,000 patients")} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.healBloodBank", "The blood bank")} period={w('blood-bank')} span={6} activityId="blood-bank" explorerId={explorerId} onSelect={onSelect} photo={pic('blood-bank')}>
      <div className="va-money"><Figure value={v('blood-bank', 'Units')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.bloodBankUnits", "units collected by the foundation’s own blood bank, in")} <Figure value={v('blood-bank', 'Camps')} size="md" /> {getCMSCopy("copy.ValueAnalytics.camps", "camps")}</span></div>
      <Pictogram total={v('blood-bank', 'Units')} unit={2500} icon={Droplet} legend={getCMSCopy("copy.ValueAnalytics.bankLegend", "Each drop stands for 2,500 units")} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.healChiro", "Chiropractic camps")} note={getCMSCopy("copy.ValueAnalytics.healChiroNote", "At the International Samagams in Delhi–Samalkha and Maharashtra.")} period={w('chiropractic')} span={6} activityId="chiropractic" explorerId={explorerId} onSelect={onSelect} photo={pic('chiropractic')}>
      <div className="va-money"><Figure value={v('chiropractic', 'Patients treated')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.patientsIn", "patients treated, in")} <Figure value={v('chiropractic', 'Camps organised')} size="md" /> {getCMSCopy("copy.ValueAnalytics.camps", "camps")}</span></div>
      <Pictogram total={v('chiropractic', 'Patients treated')} unit={2500} icon={Users} legend={getCMSCopy("copy.ValueAnalytics.chiroLegend", "Each figure stands for 2,500 patients")} />
    </Card>
  </>;
};

const EnrichAnalytics: React.FC<BandProps> = ({ activities, explorerId, onSelect }) => {
  const v = (id: string, label: string) => point(activities, id, label);
  const w = (id: string) => when(activities, id);
  const pic = (id: string) => photoOf(activities, id);
  const trades = [{ label: 'Sewing', value: v('skill-trades', 'Sewing youth benefitted') }, { label: 'NIMA', value: v('skill-nima', 'Youth benefitted') }, { label: 'Beautician', value: v('skill-trades', 'Beautician youth benefitted') }].filter(s => s.value);
  return <>
    <Card title={getCMSCopy("copy.ValueAnalytics.enrich1", "Where the learners are")} period={w('schools-colleges')} span={4} activityId="schools-colleges" explorerId={explorerId} onSelect={onSelect} photo={pic('schools-colleges')}>
      <Bars items={[
        { label: 'Students in schools & colleges', value: v('schools-colleges', 'Students benefitted') },
        { label: 'College students', value: v('schools-colleges', 'College students'), note: getCMSCopy("copy.ValueAnalytics.within", "within the total") },
        { label: 'Students in free schools', value: v('free-schools', 'Students in free schools') },
        { label: 'Scholarship students', value: v('scholarships', 'Scholarship students') },
      ]} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.enrich2", "Youth skilled, by trade")} period={w('skill-trades')} span={2} activityId="skill-trades" explorerId={explorerId} onSelect={onSelect} photo={pic('skill-trades')}>
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
    <Card title={getCMSCopy("copy.ValueAnalytics.enrichNima", "NIMA skill centres")} period={w('skill-nima')} span={3} activityId="skill-nima" explorerId={explorerId} onSelect={onSelect} photo={pic('skill-nima')}>
      <div className="va-money"><Figure value={v('skill-nima', 'Youth benefitted')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.youthIn", "youth benefitted, in")} <Figure value={v('skill-nima', 'NIMA centres')} size="md" /> {getCMSCopy("copy.ValueAnalytics.centres", "centres")}</span></div>
      <Pictogram total={v('skill-nima', 'Youth benefitted')} unit={250} icon={Users} legend={getCMSCopy("copy.ValueAnalytics.youthLegend", "Each figure stands for 250 youth")} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.enrich5", "Scholarships")} period={w('scholarships')} span={6} activityId="scholarships" explorerId={explorerId} onSelect={onSelect} photo={pic('scholarships')}>
      <div className="va-money"><Figure value={v('scholarships', 'Disbursed')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.disbursedTo", "disbursed, to")} <Figure value={v('scholarships', 'Scholarship students')} size="md" /> {getCMSCopy("copy.ValueAnalytics.students", "scholarship students")}</span></div>
    </Card>
  </>;
};

const EmpowerAnalytics: React.FC<BandProps> = ({ activities, explorerId, onSelect }) => {
  const v = (id: string, label: string) => point(activities, id, label);
  const w = (id: string) => when(activities, id);
  const pic = (id: string) => photoOf(activities, id);
  const volunteers = [{ label: 'Waterbody volunteers', value: v('cleanliness', 'Waterbody volunteers') }, { label: 'Railway & hospital volunteers', value: v('cleanliness', 'Rly / hospital volunteers') }].filter(s => s.value);
  return <>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower1", "A forest, tree by tree")} period={w('tree-plantation')} span={4} activityId="tree-plantation" explorerId={explorerId} onSelect={onSelect} photo={pic('tree-plantation')}>
      <div className="va-money"><Figure value={v('tree-plantation', 'Trees planted')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.treesIn", "trees planted, in")} <Figure value={v('tree-plantation', 'Total drives')} size="md" /> {getCMSCopy("copy.ValueAnalytics.drives", "drives")}</span></div>
      <Pictogram total={v('tree-plantation', 'Trees planted')} unit={100000} icon={TreePine} legend={getCMSCopy("copy.ValueAnalytics.treeLegend", "Each tree stands for 100,000 trees planted")} />
      <Bars items={[{ label: 'Vann Mahotsav plantation', value: v('tree-plantation', 'Vann Mahotsav plantation'), note: `${v('tree-plantation', 'Vann Mahotsav drives')} drives` }, { label: 'World Environment Day plantation', value: v('tree-plantation', 'WED plantation'), note: `${v('tree-plantation', 'WED drives')} drives` }]} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower2", "Volunteers, by site")} period={w('cleanliness')} span={2} activityId="cleanliness" explorerId={explorerId} onSelect={onSelect} photo={pic('cleanliness')}>
      <Donut segments={volunteers} centre={{ value: group(volunteers.reduce((sum, s) => sum + num(s.value), 0)), label: getCMSCopy("copy.ValueAnalytics.volunteers", "volunteers, both") }} />
      <div className="va-aside"><HeartHandshake size={16} strokeWidth={1.6} aria-hidden="true" /><Figure value={v('cleanliness', 'Total manhours')} size="sm" /> {getCMSCopy("copy.ValueAnalytics.manhours", "manhours in all")}</div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower3", "Sites cleaned")} period={w('cleanliness')} span={2} activityId="cleanliness" explorerId={explorerId} onSelect={onSelect}>
      <Bars items={[{ label: 'Waterbodies', value: v('cleanliness', 'Waterbodies') }, { label: 'Hospitals', value: v('cleanliness', 'Hospitals') }, { label: 'Railway stations', value: v('cleanliness', 'Railway stations') }]} />
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empowerCovid", "COVID-19 relief")} period={w('covid-relief')} span={4} activityId="covid-relief" explorerId={explorerId} onSelect={onSelect}>
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
    <Card title={getCMSCopy("copy.ValueAnalytics.empower5", "Mass marriages since 1998")} period={w('mass-marriages')} span={3} activityId="mass-marriages" explorerId={explorerId} onSelect={onSelect} photo={pic('mass-marriages')}>
      <div className="va-money"><Figure value={v('mass-marriages', 'Couples married')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ValueAnalytics.couplesIn", "couples married, in")} <Figure value={v('mass-marriages', 'Events held')} size="md" /> {getCMSCopy("copy.ValueAnalytics.events", "events")}</span></div>
      <div className="va-timeline" aria-hidden="true"><span className="va-timeline-fill" /><span className="va-timeline-year">1998</span><span className="va-timeline-year">{w('mass-marriages').match(/\d{4}/)?.[0]}</span></div>
    </Card>
    <Card title={getCMSCopy("copy.ValueAnalytics.empower6", "Financial support")} period={w('financial-support')} span={3} activityId="financial-support" explorerId={explorerId} onSelect={onSelect} photo={pic('financial-support')}>
      <Bars items={[{ label: 'Financial help', value: v('financial-support', 'Financial help') }, { label: 'Disaster relief & fund', value: v('financial-support', 'Disaster relief & fund') }]} />
      <div className="va-aside"><Landmark size={16} strokeWidth={1.6} aria-hidden="true" /> {v('financial-support', 'Youth sport (NBGSMCT)')} · {getCMSCopy("copy.ValueAnalytics.sport", "youth sport (NBGSMCT)")}</div>
    </Card>
  </>;
};

interface BandProps { activities: Activity[]; explorerId: string; onSelect: (id: string) => void }
const BANDS: Record<Cornerstone, React.FC<BandProps>> = { heal: HealAnalytics, enrich: EnrichAnalytics, empower: EmpowerAnalytics };

/** The band: heading, grid and the one arrival registration that starts every chart in it. */
export const ChartBand: React.FC<{ id: string; className?: string; lead?: React.ReactNode; children?: React.ReactNode }> = ({ id, className, lead, children }) => {
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
      {lead}
      <div className="va-grid">{children}</div>
    </div>
  );
};

/** Figures read together (worked out from reported figures, see data/insights): each with its
    icon, its value rolling in and what it divides; a caption names whose figures they are, and an
    entry with somewhere to go opens it. */
export const InsightRibbon: React.FC<{ entries: { key: string; insight: Insight; caption?: string; href?: string; onPick?: () => void }[] }> = ({ entries }) => {
  if (!entries.length) return null;
  return (
    <div className="va-insights">
      <p className="va-insights-note"><Sparkles size={12} aria-hidden="true" />{getCMSCopy("copy.ValueAnalytics.insights", "Read together · worked out from the reported figures, nothing estimated")}</p>
      <ul>
        {entries.map(({ key, insight, caption, href, onPick }, i) => {
          const Icon = insight.icon;
          const body = <>
            <span className="va-insight-icon" aria-hidden="true"><Icon size={17} strokeWidth={1.8} /></span>
            <Figure value={insight.value} size="md" />
            <span className="va-insight-label">{insight.label}</span>
            {caption && <small>{caption}</small>}
          </>;
          return <li key={key} style={{ '--d': `${i * 90}ms` } as React.CSSProperties}>{href ? <a href={href} onClick={onPick}>{body}</a> : <div className="va-insight">{body}</div>}</li>;
        })}
      </ul>
    </div>
  );
};

/** Programme-led statistics, with one story open at a time. The numbers and
 * chart comparisons remain attached to their own units and reporting dates. */
export const ValueAnalytics: React.FC<{ pillarId: Cornerstone; activities: Activity[]; explorerId: string; onSelect: (id: string) => void }> = ({ pillarId, activities, explorerId, onSelect }) => {
  const [selectedId, setSelectedId] = useState(activities[0]?.id ?? '');
  const [insightIndex, setInsightIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const el = root.current; if (el) return onArrival(el, () => setArrived(true)); }, []);
  const selected = activities.find(activity => activity.id === selectedId) ?? activities[0];
  const selectedIndex = activities.findIndex(activity => activity.id === selected?.id);
  const insights = selected ? insightsFor(selected) : [];
  const insight = insights[insightIndex % Math.max(insights.length, 1)];
  const InsightIcon = insight?.icon ?? Sparkles;
  const photo = selected?.images?.[0] ?? selected?.cardPhoto;
  const Band = BANDS[pillarId];
  const choose = (id: string) => {
    setSelectedId(id);
    setInsightIndex(0);
    const row = picker.current;
    const button = row?.querySelector<HTMLButtonElement>(`[id="${pillarId}-stat-tab-${id}"]`);
    if (row && button) {
      const offset = button.getBoundingClientRect().left - row.getBoundingClientRect().left;
      if (offset < 0 || offset + button.offsetWidth > row.clientWidth) row.scrollBy({ left: offset - (row.clientWidth - button.offsetWidth) / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  };
  const step = (direction: number) => choose(activities[(selectedIndex + direction + activities.length) % activities.length].id);
  const changeByKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % activities.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + activities.length) % activities.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = activities.length - 1;
    else return;
    event.preventDefault();
    choose(activities[next].id);
    picker.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };
  if (!selected) return null;
  // Free-school figures share the existing education comparison. NIMA and
  // livelihood training retain the cross-trade and centre-count comparisons.
  const chartIds = selected.id === 'free-schools' ? ['schools-colleges']
    : ['skill-nima', 'skill-trades'].includes(selected.id) ? ['skill-nima', 'skill-trades']
    : [selected.id];
  const heading = pillarId === 'heal'
    ? getCMSCopy('copy.ValueAnalytics.stories.heal-title', 'Care that reaches further.')
    : pillarId === 'enrich'
      ? getCMSCopy('copy.ValueAnalytics.stories.enrich-title', 'Room to learn. Space to grow.')
      : getCMSCopy('copy.ValueAnalytics.stories.empower-title', 'Small actions. Shared futures.');
  return <div className="value-analytics va-stories" ref={root} id={`${pillarId}-analytics`} data-arrived={arrived} data-pillar={pillarId}>
    <header className="va-story-heading">
      <div>
        <p className="va-story-eyebrow"><span />{getCMSCopy('copy.ValueAnalytics.stories.kicker', 'Our impact, in perspective')}</p>
        <h3>{heading}</h3>
      </div>
      <p>{getCMSCopy('copy.ValueAnalytics.stories.lead', 'Explore the work behind the numbers. Every figure belongs to a programme, a purpose and a moment in our journey.')}</p>
    </header>

    <div className="va-story-picker" role="tablist" aria-label={getCMSCopy('copy.ValueAnalytics.stories.picker-label', '{pillar} programme statistics').replace('{pillar}', pillarId)} ref={picker}>
      {activities.map((activity, index) => <button type="button" role="tab" key={activity.id} id={`${pillarId}-stat-tab-${activity.id}`} aria-selected={selected.id === activity.id} aria-controls={`${pillarId}-stat-story`} tabIndex={selected.id === activity.id ? 0 : -1} onClick={() => choose(activity.id)} onKeyDown={event => changeByKey(event, index)}>
        <span className="va-story-tab-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span>{activity.menuLabel ?? activity.title}</span>
      </button>)}
    </div>

    <section className="va-story-panel" id={`${pillarId}-stat-story`} role="tabpanel" tabIndex={0} aria-labelledby={`${pillarId}-stat-tab-${selected.id}`}>
      <p className="sr-only" role="status" aria-live="polite">{selected.title}</p>
      <div className="va-story-feature">
        <figure className="va-story-image" data-has-photo={Boolean(photo?.src)}>
          {photo?.src ? <img src={resolveCMSMedia(photo.src)} alt={photo.alt ?? ''} loading="lazy" decoding="async" /> : <div className="va-story-illustration" aria-hidden="true"><HeartHandshake strokeWidth={.8} /><span /><span /><span /></div>}
          <div className="va-story-image-shade" />
          <figcaption><span>{String(selectedIndex + 1).padStart(2, '0')} <i>/ {String(activities.length).padStart(2, '0')}</i></span><span>{getCMSCopy('copy.ValueAnalytics.stories.photo-caption', 'Service with Humility')}</span></figcaption>
        </figure>
        <div className="va-story-copy">
          <p className="va-story-period">{selected.period}</p>
          <h4>{selected.title}</h4>
          <p className="va-story-description">{selected.blurb}</p>
          <div className="va-story-main-number" data-long={selected.headline.value.length > 10}>
            <Figure value={selected.headline.value} size="xl" /><span>{selected.headline.label}</span>
          </div>
          {insight && <div className="va-story-insight">
            <div className="va-story-insight-top"><span><InsightIcon size={15} aria-hidden="true" />{getCMSCopy('copy.ValueAnalytics.stories.insight-label', 'A closer perspective')}</span>{insights.length > 1 && <button type="button" onClick={() => setInsightIndex(index => (index + 1) % insights.length)} aria-label={getCMSCopy('copy.ValueAnalytics.stories.next-insight', 'Show the next programme insight')}><span>{insightIndex % insights.length + 1}/{insights.length}</span><ArrowRight size={16} aria-hidden="true" /></button>}</div>
            <p key={insight.label} aria-live="polite" aria-atomic="true"><strong>{insight.value}</strong><span>{insight.label}</span></p>
            <small>{getCMSCopy('copy.ValueAnalytics.stories.insight-note', 'Calculated from this programme’s reported figures.')}</small>
          </div>}
          <div className="va-story-actions">
            <a href={`#${explorerId}`} onClick={() => onSelect(selected.id)}>{getCMSCopy('copy.ValueAnalytics.programme', 'See the programme')}<ArrowUpRight size={17} aria-hidden="true" /></a>
            <div className="va-story-arrows"><button type="button" aria-label={getCMSCopy('copy.ValueAnalytics.stories.previous-programme', 'Previous programme statistics')} onClick={() => step(-1)}><ArrowLeft size={18} aria-hidden="true" /></button><button type="button" aria-label={getCMSCopy('copy.ValueAnalytics.stories.next-programme', 'Next programme statistics')} onClick={() => step(1)}><ArrowRight size={18} aria-hidden="true" /></button></div>
          </div>
        </div>
      </div>
      <div className="va-story-details" key={`detail-${selected.id}`}>
        <div className="va-story-detail-heading"><span>{getCMSCopy('copy.ValueAnalytics.stories.detail-heading', 'Look a little closer')}</span><span className="va-story-detail-rule" /><Sparkles size={18} aria-hidden="true" /></div>
        <ProgrammeCharts.Provider value={chartIds}><div className="va-grid"><Band activities={activities} explorerId={explorerId} onSelect={onSelect} /></div></ProgrammeCharts.Provider>
        <details className="va-story-record">
          <summary><span>{getCMSCopy('copy.ValueAnalytics.stories.record', 'Every reported figure')}<small>{selected.period}</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
          <dl>{selected.dataPoints.map(entry => <div key={entry.label}><dt>{entry.label}</dt><dd data-prose={/[a-z]/i.test(entry.value)}>{entry.value}</dd></div>)}</dl>
        </details>
      </div>
    </section>
    <p className="va-story-source">{getCMSCopy('copy.ValueAnalytics.stories.source', 'Source: SNCF programme records · Figures retain their reported units and period. Programme reach is not a count of unique individuals.')}</p>
  </div>;
};
