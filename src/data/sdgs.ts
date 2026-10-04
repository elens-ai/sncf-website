/**
 * THE UN SUSTAINABLE DEVELOPMENT GOALS the foundation's work advances.
 *
 * The goals' numbers, names and colours are the UN's own (sdgs.un.org). The
 * pairing of each cornerstone and programme with its goals is the
 * foundation's reading of its own work, made here: a programme lists the
 * goals it serves directly, its cornerstone the goals its programmes share.
 * Review it with the foundation before relying on it in a report.
 */
export interface Sdg { goal: number; name: string; color: string }

export const SDGS: Record<number, Sdg> = Object.fromEntries(([
  [1, 'No poverty', '#e5243b'],
  [2, 'Zero hunger', '#dda63a'],
  [3, 'Good health and well-being', '#4c9f38'],
  [4, 'Quality education', '#c5192d'],
  [5, 'Gender equality', '#ff3a21'],
  [6, 'Clean water and sanitation', '#26bde2'],
  [7, 'Affordable and clean energy', '#fcc30b'],
  [8, 'Decent work and economic growth', '#a21942'],
  [9, 'Industry, innovation and infrastructure', '#fd6925'],
  [10, 'Reduced inequalities', '#dd1367'],
  [11, 'Sustainable cities and communities', '#fd9d24'],
  [12, 'Responsible consumption and production', '#bf8b2e'],
  [13, 'Climate action', '#3f7e44'],
  [14, 'Life below water', '#0a97d9'],
  [15, 'Life on land', '#56c02b'],
  [16, 'Peace, justice and strong institutions', '#00689d'],
  [17, 'Partnerships for the goals', '#19486a'],
] as const).map(([goal, name, color]) => [goal, { goal, name, color }]));

/** The goals each programme serves directly, by activity id. */
export const PROGRAMME_SDGS: Record<string, number[]> = {
  /* heal */
  'blood-donation': [3],
  'health-checkup': [3],
  'eye-checkup': [3],
  'health-centre': [3],
  'blood-bank': [3],
  /* enrich */
  'schools-colleges': [4],
  scholarships: [4, 10],
  'free-schools': [4, 10],
  'skill-nima': [4, 8],
  'skill-trades': [8, 5],
  /* empower */
  'tree-plantation': [13, 15],
  cleanliness: [11, 12],
  'covid-relief': [3, 2],
  'mass-marriages': [1, 10],
  'financial-support': [1, 10],
  /* projects */
  'project-amrit': [6, 14],
  'oneness-vann': [15, 13],
  watershed: [6, 15],
  'adopted-villages': [1, 3, 11],
};

/** The goals a cornerstone's programmes advance, most shared first. */
export const goalsOf = (activityIds: string[]): number[] => {
  const count = new Map<number, number>();
  for (const id of activityIds) for (const goal of PROGRAMME_SDGS[id] ?? []) count.set(goal, (count.get(goal) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([goal]) => goal);
};
