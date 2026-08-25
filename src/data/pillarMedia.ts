/**
 * THE EXHIBITION'S PLATES — which activities hang on each pillar's wall.
 *
 * This is the file to edit when photographs arrive. It is deliberately
 * SEPARATE from pillars.ts: that file is the foundation's content of record
 * (figures from the March 2026 activity report), and dropping image paths
 * into it would mix an asset manifest into a source of truth.
 *
 * The caption is NOT written here. Each plate points at an index in its
 * pillar's `keyHighlights`, so the words under a photograph are always the
 * report's own sentence and cannot drift from it — the same reason
 * PillarsSection looks its colours up from PILLARS by id rather than
 * repeating the hexes. Change a highlight and the caption follows.
 *
 * TO ADD A PHOTOGRAPH:
 *   1. put the file in /public/images (WebP, ~1600px on the long edge)
 *   2. set `image` to '/images/your-file.webp'
 *   3. write `alt` — describe what is happening, not "photo of X"
 *
 * A plate with `image: null` renders as an empty frame carrying its title.
 * That is intentional: the room still reads as a room while the wall is
 * being hung, rather than collapsing to a different layout and back again
 * once assets land.
 *
 * SIX PIECES A WALL. Four carry a `highlight` — the report sentence that
 * belongs to them — and two hang unlabelled. That is how a real wall works:
 * not every piece takes a wall label, and an unbroken row of captions reads
 * as a catalogue rather than as a hang.
 *
 * The FRAME and the SIZE are not set here. They come from that pillar's
 * wall in PillarsSection (WALLS), because they are a property of where a
 * piece hangs, not of what it shows — and the walls differ per pillar so no
 * two rooms are hung the same way. Supply a landscape photograph for a
 * landscape slot and a portrait for a portrait one; the slot's shape is in
 * its comment.
 */
export interface ActivityPlate {
  /** Wall-card title. Two or three words — it sits on the frame. */
  title: string;
  /** Index into this pillar's keyHighlights, or null to hang unlabelled. */
  highlight: number | null;
  /** Path under /public, or null until a photograph is supplied. */
  image: string | null;
  /** Required whenever `image` is set. Describe the activity. */
  alt: string;
}

/** Keyed by PillarState.id. Order matters — plate n hangs in slot n of that
    pillar's wall, so the shapes in WALLS are what each photograph must be. */
export const PILLAR_PLATES: Record<string, ActivityPlate[]> = {
  heal: [
    { title: 'Blood donation', highlight: 0, image: null, alt: '' },
    { title: 'Mobile dispensaries', highlight: 1, image: null, alt: '' },
    { title: 'Eye care', highlight: 2, image: null, alt: '' },
    { title: 'Disaster relief', highlight: 3, image: null, alt: '' },
    { title: 'Health checkups', highlight: null, image: null, alt: '' },
    { title: 'Spectacles', highlight: null, image: null, alt: '' },
  ],
  enrich: [
    { title: 'Vocational training', highlight: 0, image: null, alt: '' },
    { title: 'Scholarships', highlight: 1, image: null, alt: '' },
    { title: 'Digital classrooms', highlight: 2, image: null, alt: '' },
    { title: 'Self-help groups', highlight: 3, image: null, alt: '' },
    { title: 'STEM labs', highlight: null, image: null, alt: '' },
    { title: 'Artisan workshops', highlight: null, image: null, alt: '' },
  ],
  empower: [
    { title: 'Cleanliness drives', highlight: 0, image: null, alt: '' },
    {
      title: 'Tree plantation',
      highlight: 1,
      image: '/images/mataji-rajpita-planting.webp',
      alt: 'Satguru Mata Sudiksha Ji and Nirankari Rajpita Ramit Ji planting a sapling',
    },
    { title: 'Disaster response', highlight: 2, image: null, alt: '' },
    { title: 'Youth leadership', highlight: 3, image: null, alt: '' },
    { title: 'Riverbank cleanups', highlight: null, image: null, alt: '' },
    { title: 'Micro-forests', highlight: null, image: null, alt: '' },
  ],
  projects: [
    { title: 'Health City', highlight: 0, image: null, alt: '' },
    { title: 'Project Amrit', highlight: 1, image: null, alt: '' },
    {
      title: 'Oneness Vann',
      highlight: 2,
      image: '/images/volunteers-planning.webp',
      alt: 'Volunteers planning a project together',
    },
    { title: 'Watershed', highlight: 3, image: null, alt: '' },
    { title: 'Super-hospital', highlight: null, image: null, alt: '' },
    { title: 'Water bodies', highlight: null, image: null, alt: '' },
  ],
};
