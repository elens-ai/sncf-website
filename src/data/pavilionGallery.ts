export const PAVILION_IDS = ['heal', 'enrich', 'empower', 'projects'] as const;
// User-approved illustrative images, not photographs of SNCF programmes.
const PHOTOS = [
  [
    ['1576091160399-112ba8d25d1d', 'Care begins with a connection', 'A healthcare professional holding a phone'],
    ['1579684385127-1ef15d508118', 'Working together for better health', 'A surgical team around an operating light'],
    ['1559757148-5c350d0d3c56', 'Knowledge that supports care', 'An anatomical teaching model of the brain'],
    ['1584516150909-c43483ee7932', 'The person at the heart of care', 'A doctor speaking with a patient'],
    ['1582750433449-648ed127bb54', 'Ready to serve', 'A healthcare professional wearing a mask'],
  ],
  [
    ['1503676260728-1c00da094a0b', 'Every beginning deserves a chance', 'Books and learning materials on a desk'],
    ['1509062522246-3755977927d7', 'Learning, together', 'Students learning in a classroom'],
    ['1513258496099-48168024aec0', 'Skills for a changing world', 'A learner studying with a laptop'],
    ['1523580494863-6f3031224c94', 'Ideas grow when we share them', 'An audience at an educational gathering'],
    ['1456513080510-7bf3a84b82f8', 'Opening doors through education', 'Open books and study notes'],
  ],
  [
    ['1464226184884-fa280b87c399', 'Growing a more sustainable future', 'A harvest of fresh vegetables'],
    ['1416879595882-3373a0480b5b', 'Change starts in our hands', 'Gardening tools and soil'],
    ['1466692476868-aef1dfb1e735', 'Small beginnings. Lasting growth.', 'Young seedlings growing in pots'],
    ['1542601906990-b4d3fb778b09', 'A shared responsibility', 'Hands holding a small plant and soil'],
    ['1441974231531-c6227db76b6e', 'Protecting what sustains us', 'Sunlight reaching a forest floor'],
  ],
  [
    ['1473448912268-2022ce9509d8', 'Water and woodland, connected', 'A river surrounded by forest'],
    ['1433086966358-54859d0ed716', 'Safeguarding our water', 'A waterfall in a green landscape'],
    ['1447752875215-b2761acb3c5d', 'Making room for nature', 'A walkway through a forest'],
    ['1500382017468-9049fed747ef', 'Resilient land. Stronger communities.', 'Farmland at sunset'],
    ['1518837695005-2083093ee35b', 'A future worth protecting', 'Open water and gentle waves'],
  ],
];
export const PAVILION_GALLERY = PAVILION_IDS.map((id, room) => PHOTOS[room].map(([photo, caption, alt], i) => ({
  id: `${id}-gallery-${i + 1}`, src: `/images/pavilion/${id}-${i + 1}.jpg`,
  caption, alt: `Illustrative photograph: ${alt}`, source: `https://images.unsplash.com/photo-${photo}`,
})));

/** The farewell passage uses 40% of a full chapter's scroll distance. */
export function pavilionProgress(scrollFraction: number) {
  const distance = Math.max(0, Math.min(1, scrollFraction)) * 4.4;
  return distance <= 4 ? distance : 4 + (distance - 4) / .4;
}

export function pavilionScrollFraction(progress: number) {
  return (progress <= 4 ? progress : 4 + (progress - 4) * .4) / 4.4;
}

/** Keep the exhibit's pose continuous even after the next gallery becomes active. */
export function pavilionExhibitReveal(progress: number, room: number) {
  const ease = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const local = progress - room;
  return ease((local - .76) / .16) * (1 - ease((local - 1.08) / .32));
}

/** Each passage gets most of the scroll distance; its exhibit then holds still. */
export function pavilionPhase(progress: number) {
  if (progress <= .03) return { room: 0, gallery: false, photo: 0, arrival: 0 };
  if (progress >= 4.8) return { room: 3, gallery: false, photo: 4, arrival: 1 };
  const room = Math.min(3, Math.floor(Math.max(0, progress - .001)));
  const part = Math.min(1, progress - room);
  return { room, gallery: part < .76, photo: Math.min(4, Math.floor(part / .76 * 5)), arrival: Math.max(0, Math.min(1, (part - .76) / .16)) };
}
