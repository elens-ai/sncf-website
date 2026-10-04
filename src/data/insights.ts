import type { LucideIcon } from 'lucide-react';
import { Clock, Droplet, Eye, Glasses, GraduationCap, HandCoins, HandHeart, Heart, HeartPulse, Hospital, IndianRupee, Laptop, Scissors, School, Stethoscope, TreePine, Trees, BedDouble } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import type { Activity } from './activities';

/**
 * INSIGHTS — a programme's reported figures, read against each other.
 *
 * Every insight is worked out from figures the report gives for the SAME
 * programme at the SAME date: a ratio of two of them (units per camp), a
 * share of one in another it belongs to (spectacles of OPD visits), or a sum
 * of like figures (two sums of money). None is estimated, projected or
 * brought in from outside, and each says plainly what it divides. A figure
 * missing from the report (or edited away in the CMS) drops its insight.
 */
export interface Insight { value: string; label: string; icon: LucideIcon }

const c = (key: string, fallback: string) => getCMSCopy(`copy.Insights.${key}`, fallback);
const n = (activity: Activity, label: string) => Number((activity.dataPoints.find(point => point.label === label)?.value ?? '').replace(/[^\d.]/g, '')) || 0;
const grouped = (x: number) => Math.round(x).toLocaleString('en-US');
const rupees = (x: number) => `₹${Math.round(x).toLocaleString('en-IN')}`;
/* a ratio: the whole number when it comes out whole, otherwise about the nearest one */
const about = (x: number) => (Math.abs(x - Math.round(x)) < 0.01 ? grouped(x) : `≈ ${grouped(x)}`);
const percent = (part: number, whole: number) => { const p = (part / whole) * 100; return `${p < 10 ? p.toFixed(1) : Math.round(p)}%`; };

const per = (a: number, b: number, label: string, icon: LucideIcon): Insight | null => (a && b ? { value: about(a / b), label, icon } : null);
const share = (part: number, whole: number, label: string, icon: LucideIcon): Insight | null => (part && whole && part <= whole ? { value: percent(part, whole), label, icon } : null);

const FACILITIES = ['Allopathic', 'Homeopathic', 'Oneness labs', 'Dental centres', 'Eye centres', 'Physiotherapy', 'X-ray centres', 'Chiropractic', 'Oneness pharmacy'];

const RULES: Record<string, (a: Activity) => (Insight | null)[]> = {
  'blood-donation': a => [
    per(n(a, 'Units collected'), n(a, 'Camps organised'), c('blood-per-camp', 'units collected per camp'), Droplet),
    per(n(a, 'Potentially saved lives'), n(a, 'Units collected'), c('blood-lives', 'lives potentially saved by each unit'), HeartPulse),
  ],
  'health-checkup': a => [
    per(n(a, 'Patients treated'), n(a, 'Camps organised'), c('checkup-per-camp', 'patients treated per camp'), Stethoscope),
  ],
  'eye-checkup': a => [
    share(n(a, 'Free spectacles'), n(a, 'OPD'), c('eye-spectacles', 'of OPD visits received free spectacles'), Glasses),
    share(n(a, 'Cataract surgeries'), n(a, 'OPD'), c('eye-cataract', 'of OPD visits led to cataract surgery'), Eye),
    per(n(a, 'OPD'), n(a, 'Camps'), c('eye-per-camp', 'OPD visits per camp'), Stethoscope),
  ],
  'health-centre': a => {
    const kinds = FACILITIES.filter(label => n(a, label));
    const total = kinds.reduce((sum, label) => sum + n(a, label), 0);
    return [total ? { value: grouped(total), label: c('centre-network', 'facilities in the network, of {kinds} kinds').replace('{kinds}', String(kinds.length)), icon: Hospital } : null];
  },
  'blood-bank': a => [
    per(n(a, 'Units'), n(a, 'Camps'), c('bank-per-camp', 'units collected per camp'), Droplet),
  ],
  'schools-colleges': a => [
    share(n(a, 'College students'), n(a, 'Students benefitted'), c('college-share', 'of the students are in college'), GraduationCap),
  ],
  scholarships: a => [
    n(a, 'Disbursed') && n(a, 'Scholarship students') ? { value: rupees(n(a, 'Disbursed') / n(a, 'Scholarship students')), label: c('scholar-average', 'disbursed per scholarship student, on average'), icon: IndianRupee } : null,
  ],
  'free-schools': a => [
    per(n(a, 'Students in free schools'), n(a, 'Free schools'), c('free-per-school', 'students per free school, on average'), School),
  ],
  'skill-nima': a => [
    per(n(a, 'Youth benefitted'), n(a, 'NIMA centres'), c('nima-per-centre', 'youth trained per NIMA centre'), Laptop),
  ],
  'skill-trades': a => [
    share(n(a, 'Sewing youth benefitted'), n(a, 'Sewing youth benefitted') + n(a, 'Beautician youth benefitted'), c('trades-sewing', 'of the youth trained in sewing'), Scissors),
    per(n(a, 'Sewing youth benefitted'), n(a, 'Sewing centres'), c('trades-per-centre', 'youth per sewing centre'), Scissors),
  ],
  'tree-plantation': a => [
    per(n(a, 'Trees planted'), n(a, 'Total drives'), c('trees-per-drive', 'trees planted per drive'), TreePine),
    share(n(a, 'Trees planted') - n(a, 'Excluding Oneness Vann'), n(a, 'Trees planted'), c('trees-vann', 'of them in Oneness Vann forests'), Trees),
  ],
  cleanliness: a => [
    per(n(a, 'Total manhours'), n(a, 'Waterbody volunteers') + n(a, 'Rly / hospital volunteers'), c('clean-hours', 'hours given by each volunteer'), HandHeart),
    per(n(a, 'Total manhours'), n(a, 'Total drives'), c('clean-per-drive', 'manhours per drive'), Clock),
  ],
  'covid-relief': a => [
    share(n(a, 'ICU beds'), n(a, 'Total beds'), c('covid-icu', 'of the care-centre beds were ICU beds'), BedDouble),
  ],
  'mass-marriages': a => [
    per(n(a, 'Couples married'), n(a, 'Events held'), c('marriages-per-event', 'couples married per event'), Heart),
  ],
  'financial-support': a => [
    n(a, 'Financial help') && n(a, 'Disaster relief & fund') ? { value: rupees(n(a, 'Financial help') + n(a, 'Disaster relief & fund')), label: c('support-total', 'given in financial help and disaster relief together'), icon: HandCoins } : null,
  ],
};

/** The programme's insights, the most telling first; none for a programme with no rule. */
export const insightsFor = (activity: Activity): Insight[] => (RULES[activity.id]?.(activity) ?? []).filter((insight): insight is Insight => insight !== null);
