/** Selected cumulative measures from the September 2026 report's detail tables.
 * They describe programme records, not unique individuals or a combined lives total.
 * Keep the components so the number's meaning and source can be inspected. */
export const PROGRAMME_REACH = [
  {
    id: 'heal', photoActivity: 'health-checkup', page: 2,
    components: [
      { programme: 'Health Checkup Camps', metric: 'Patients treated', label: 'Health checkup patients', value: 483439 },
      { programme: 'Eye Checkup Camp', metric: 'OPD', label: 'Eye-care OPD records', value: 165122 },
    ],
  },
  {
    id: 'enrich', photoActivity: 'schools-colleges', page: 3,
    components: [
      { programme: 'Schools / Colleges', metric: 'Students benefitted', label: 'School and college students', value: 217723 },
      { programme: 'Schools / Colleges', metric: 'Scholarship students', label: 'Scholarship students', value: 1829 },
      { programme: 'Schools / Colleges', metric: 'Students in free schools', label: 'Free-school students', value: 9696 },
      { programme: 'Skill Development', metric: 'NIMA youth benefitted', label: 'Music and art learners', value: 4114 },
      { programme: 'Skill Development', metric: 'Sewing youth benefitted', label: 'Sewing learners', value: 16500 },
      { programme: 'Skill Development', metric: 'Beautician youth benefitted', label: 'Beautician learners', value: 631 },
      { programme: 'Skill Development', metric: 'Free coaching students', label: 'Free-coaching students', value: 1370 },
    ],
  },
  {
    id: 'empower', photoActivity: 'cleanliness', page: 4,
    components: [
      { programme: 'Cleanliness Drives', metric: 'Railway / hospital volunteers', label: 'Railway and hospital volunteers', value: 420788 },
      { programme: 'Cleanliness Drives', metric: 'Waterbody volunteers', label: 'Waterbody volunteers', value: 5449767 },
    ],
  },
] as const;

export const programmeReachTotal = (entry: typeof PROGRAMME_REACH[number]) =>
  entry.components.reduce((total, component) => total + component.value, 0);
