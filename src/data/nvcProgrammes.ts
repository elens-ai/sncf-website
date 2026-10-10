import { getCMSCopy } from '../cms/runtime';
import { ACTIVITIES } from './activities';
import { NVC_PART_IDS, SEWING_PHOTOS, partLabel } from './programmeGroups';
import { programmePhotos } from './programmePhotos';

const c = (key: string, fallback: string) => getCMSCopy(`copy.NvcProgrammes.${key}`, fallback);
export type NvcPartId = typeof NVC_PART_IDS[number];
export interface NvcProgramme {
  id: NvcPartId;
  title: string;
  line: string;
  description: string;
  photo?: { src: string; alt: string };
  features: { title: string; text: string }[];
  facts: { value: string; label: string; detail: string }[];
  footnote: string;
}

/** Each NVC programme's photographs, for its carousel: its own photograph, the sewing centres' for Beautician & Sewing,
    those its record carries (sewing and NIMA have records of their own), then any added with the developer photo tool
    (src/data/addedPhotos.json, under the programme's id), as arranged with that tool. */
export function nvcPartPhotos(programme: NvcProgramme) {
  const record = ACTIVITIES.find(item => item.id === programme.id);
  const given = [...(programme.photo ? [programme.photo] : []), ...(programme.id === 'skill-trades' ? SEWING_PHOTOS() : [])];
  return programmePhotos({ id: programme.id, images: [...given, ...(record?.images ?? [])] });
}

/** The report's existing CMS records stay authoritative. Library is qualitative:
 * there is no library count in the supplied September 2026 report.
 * Editorial sources: the Foundation's Thane NVC inauguration account (26 Jan 2019),
 * https://nirankarifoundation.org/youth-empowerment/ and the Mission's September
 * 2022 magazine, https://www.nirankari.org/wp-content/uploads/2022/09/snenglish_202209.pdf.
 * Counts come from docs/reports/sncf-september-2026-extracted.txt, page 3. */
export function nvcProgrammes(): NvcProgramme[] {
  const record = (id: string, label: string) => ACTIVITIES.find(item => item.id === id)?.dataPoints.find(point => point.label === label)?.value ?? '—';
  const reported = c('report-period', 'Cumulative programme figures through September 2026. Learner records may include repeat participation.');
  return [
    {
      id: 'nvc-library', title: partLabel('nvc-library', 'Library'),
      line: c('library-line', 'A place for curious minds.'),
      description: c('library-description', 'The Library gives reading a place within NVC’s wider learning programme. Books, curiosity and independent study complement the practical skills and creative disciplines offered through the centre, encouraging learners to keep discovering and developing their interests.'),
      features: [
        { title: c('library-read-title', 'Read'), text: c('library-read', 'Make room for books and the ideas they open up.') },
        { title: c('library-study-title', 'Study'), text: c('library-study', 'Build knowledge through reading and independent learning.') },
        { title: c('library-discover-title', 'Discover'), text: c('library-discover', 'Follow an interest and keep the habit of learning alive.') },
      ],
      facts: [
        { value: c('library-fact-one', 'Reading'), label: c('library-fact-one-label', 'At the heart of learning'), detail: c('library-fact-one-detail', 'A space for knowledge and curiosity') },
        { value: c('library-fact-two', 'Discovery'), label: c('library-fact-two-label', 'Part of the NVC family'), detail: c('library-fact-two-detail', 'Alongside coaching, skills and the arts') },
      ],
      footnote: c('library-footnote', 'Library facilities are part of NVC’s learning programme. The September 2026 report does not provide a separate library count.'),
    },
    {
      id: 'nvc-coaching', title: partLabel('nvc-coaching', 'Coaching Centre'),
      line: c('coaching-line', 'Support for the next step.'),
      description: c('coaching-description', 'Free coaching brings additional academic support into NVC’s learning programme. It extends the Foundation’s educational work beyond formal classrooms, helping students continue learning through a dedicated programme of support available without a coaching fee.'),
      features: [
        { title: c('coaching-learn-title', 'Learn'), text: c('coaching-learn', 'Continue learning with additional academic support.') },
        { title: c('coaching-practise-title', 'Practise'), text: c('coaching-practise', 'Give time to study, revision and building understanding.') },
        { title: c('coaching-progress-title', 'Progress'), text: c('coaching-progress', 'Develop knowledge and confidence for the next step.') },
      ],
      facts: [
        { value: record('free-schools', 'Free coaching centres'), label: c('coaching-centres', 'Free coaching centres'), detail: c('coaching-centres-detail', 'Dedicated academic support') },
        { value: record('free-schools', 'Free coaching students'), label: c('coaching-students', 'Student records'), detail: c('coaching-students-detail', 'Reported under Skill Development') },
      ], footnote: reported,
    },
    {
      id: 'skill-trades', title: partLabel('skill-trades', 'Beautician & Sewing'),
      line: c('trades-line', 'Practical skills. New possibilities.'),
      description: c('trades-description', 'Practical training in beauty care and sewing helps women and young people develop useful vocational skills. Through instruction and practice, learners build their abilities in these trades as part of NVC’s wider commitment to personal development and self-reliance.'),
      photo: { src: '/images/nvc/sewing-class.webp', alt: c('trades-photo', 'Learners practising at sewing machines in a Nirankari sewing centre') },
      features: [
        { title: c('trades-beauty-title', 'Beauty care'), text: c('trades-beauty', 'Develop practical abilities through beautician training.') },
        { title: c('trades-sewing-title', 'Sewing'), text: c('trades-sewing', 'Learn and practise the craft of working with fabric.') },
        { title: c('trades-confidence-title', 'Self-reliance'), text: c('trades-confidence', 'Build useful skills and confidence for everyday life.') },
      ],
      facts: [
        { value: record('skill-trades', 'Beautician youth benefitted'), label: c('trades-beauty-learners', 'Beautician learner records'), detail: `${record('skill-trades', 'Beautician centres')} ${c('trades-beauty-centre', 'beautician centre')}` },
        { value: record('skill-trades', 'Sewing youth benefitted'), label: c('trades-sewing-learners', 'Sewing learner records'), detail: `${record('skill-trades', 'Sewing centres')} ${c('trades-sewing-centres', 'sewing centres')}` },
      ], footnote: reported,
    },
    {
      id: 'skill-nima', title: partLabel('skill-nima', 'Nirankari Institute of Music & Arts'),
      line: c('nima-line', 'Find your creative expression.'),
      description: c('nima-description', 'NIMA offers affordable learning in singing, musical instruments and dance, guided by experienced teachers. Students develop their creative expression through practice and performance, with assessment and certification supported by its affiliation with Pracheen Kala Kendra.'),
      photo: { src: '/images/nima/nima-tabla-class.webp', alt: c('nima-photo', 'Students learning tabla at the Nirankari Institute of Music & Arts') },
      features: [
        { title: c('nima-music-title', 'Music'), text: c('nima-music', 'Explore singing and instrumental music through practice.') },
        { title: c('nima-dance-title', 'Dance & arts'), text: c('nima-dance', 'Make space for movement, imagination and expression.') },
        { title: c('nima-perform-title', 'Performance'), text: c('nima-perform', 'Share learning through artistic practice and performance.') },
      ],
      facts: [
        { value: record('skill-nima', 'NIMA centres'), label: c('nima-centres', 'NIMA centres'), detail: c('nima-centres-detail', 'Spaces for music and the arts') },
        { value: record('skill-nima', 'Youth benefitted'), label: c('nima-learners', 'Learner records'), detail: c('nima-learners-detail', 'Creative learning through NIMA') },
      ], footnote: reported,
    },
  ];
}
