import { getCMSCopy } from '../cms/runtime';
import type { Activity } from './activities';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProgrammeGroups.${key}`, fallback);

/** Programmes Core Values shows as one: the Nirankari Vocational Centre (NVC) holds the NIMA music and arts centres
    and the sewing and beautician centres. Each part keeps its own record (its figures, its photographs, its place in
    Stats and in links such as #skill-nima); the NVC's own figures are theirs added up, and its report opens on a tab
    for each part. */
export interface ProgrammeGroup { id: string; parts: string[] }
export const PROGRAMME_GROUPS: ProgrammeGroup[] = [{ id: 'nvc', parts: ['skill-nima', 'skill-trades'] }];

export const groupOf = (activityId: string) => PROGRAMME_GROUPS.find(group => group.parts.includes(activityId));
export const groupById = (id: string) => PROGRAMME_GROUPS.find(group => group.id === id);

/** A part's short name, for its tab. */
export const partLabel = (activityId: string, fallback: string) => ({
  'skill-nima': c('nvc-nima', 'NIMA'),
  'skill-trades': c('nvc-trades', 'Sewing & Beautician'),
} as Record<string, string>)[activityId] ?? fallback;

/** The NVC's own photographs: the centre itself, then its opening. */
export const NVC_PHOTOS = () => [
  { src: '/images/nvc/nvc-centre.webp', alt: c('nvc-photo-centre', 'A Nirankari Vocational Centre, its name over the door') },
  { src: '/images/nvc/nvc-opening.webp', alt: c('nvc-photo-opening', 'The ribbon cut at the opening of a Nirankari Vocational Centre') },
];
/** More of the sewing centres at work, beside the three the programme's own record carries. */
export const SEWING_PHOTOS = () => [
  { src: '/images/nvc/sewing-class.webp', alt: c('sewing-photo-class', 'A sewing class at work on its machines') },
  { src: '/images/nvc/sewing-hall.webp', alt: c('sewing-photo-hall', 'A full hall of learners at a sewing centre') },
  { src: '/images/nvc/sewing-learner.webp', alt: c('sewing-photo-learner', 'A learner stitching at her machine') },
  { src: '/images/nvc/sewing-practice.webp', alt: c('sewing-photo-practice', 'Practice at the machine, a teacher beside') },
  { src: '/images/nvc/sewing-group.webp', alt: c('sewing-photo-group', 'Learners sewing together on the floor of a centre') },
];

const amount = (value: string | undefined) => Number((value ?? '').replace(/[^\d.]/g, '')) || 0;
const figure = (n: number) => n.toLocaleString('en-US');
const pointOf = (activity: Activity | undefined, label: string) => amount(activity?.dataPoints.find(point => point.label === label)?.value);

/** The NVC as a programme of its own: its parts' centres and youth added up. */
function nvcProgramme(parts: Activity[]): Activity {
  const nima = parts.find(part => part.id === 'skill-nima');
  const trades = parts.find(part => part.id === 'skill-trades');
  const centres = pointOf(nima, 'NIMA centres') + pointOf(trades, 'Sewing centres') + pointOf(trades, 'Beautician centres');
  const youth = amount(nima?.headline.value) + amount(trades?.headline.value);
  const youthLabel = c('nvc-youth', 'Youth benefitted');
  return {
    id: 'nvc', pillarId: 'enrich', icon: 'sparkles',
    title: c('nvc-title', 'Nirankari Vocational Centre'), menuLabel: c('nvc-menu', 'Vocational Centre'),
    period: nima?.period ?? trades?.period ?? '',
    blurb: c('nvc-blurb', 'Music and the arts at NIMA, and livelihood trades in sewing and beautician centres.'),
    headline: { label: youthLabel, value: figure(youth) },
    dataPoints: [{ label: c('nvc-centres', 'Centres'), value: figure(centres) }, { label: youthLabel, value: figure(youth) }],
    images: [...NVC_PHOTOS(), ...(nima?.images ?? []).slice(0, 2), ...(trades?.images ?? []).slice(0, 2)],
  };
}

/** The UN goals a programme serves: a group's are all its parts' goals together. */
export const programmeGoals = (id: string, goalsOf: (id: string) => number[]) => {
  const group = groupById(id);
  return group ? [...new Set(group.parts.flatMap(goalsOf))] : goalsOf(id);
};

/** A cornerstone's programmes as Core Values lists them: each group in place of its parts, where the first stood. */
export function withGroups(activities: Activity[]): Activity[] {
  const listed: Activity[] = [];
  for (const activity of activities) {
    const group = groupOf(activity.id);
    if (!group) { listed.push(activity); continue; }
    if (listed.some(entry => entry.id === group.id)) continue;
    listed.push(nvcProgramme(activities.filter(entry => group.parts.includes(entry.id))));
  }
  return listed;
}
