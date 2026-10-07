import { getCMSCopy } from '../cms/runtime';
import type { Activity } from './activities';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProgrammePhotos.${key}`, fallback);
const own = (file: string, alt: string) => ({ src: `/images/programmes/${file}`, alt });

/* EVERY PHOTOGRAPH OF A PROGRAMME, for its report on Core Values: its own
   (the three its record carries), then the foundation's others of the same
   work held in the library (those the chapters blend in on hover, and a few
   more), each described. A photograph already among its own, or a second
   frame of one, is left out. Each description is editable in the CMS
   (ProgrammePhotos). */
const MORE = (): Record<string, { src: string; alt: string }[]> => ({
  'blood-donation': [
    own('blood-donation-donor.jpg', c('blood-donor', 'A donor giving blood, a volunteer at his side')),
    own('blood-donation-satguru.jpg', c('blood-satguru', 'Satguru Mata Sudiksha Ji Maharaj with a donor at a blood donation camp')),
    own('blood-donation-volunteers.png', c('blood-volunteers', 'A volunteer with the blood bags collected at a camp')),
  ],
  'health-checkup': [
    own('health-checkup-blood-pressure.jpg', c('checkup-pressure', 'A blood pressure check at a health camp')),
    own('health-checkup-snhc-team.jpg', c('checkup-snhc', 'The Sant Nirankari Health City team at a health checkup camp')),
    own('health-checkup-camp.jpg', c('checkup-camp', 'A patient examined at a health checkup camp')),
    own('health-checkup-sample-collection.jpg', c('checkup-samples', 'Samples collected at a health checkup camp')),
    own('health-checkup-blood-draw.jpg', c('checkup-blood-draw', 'A blood sample drawn for testing')),
  ],
  'eye-checkup': [
    own('eye-checkup-trial-lens.jpg', c('eye-trial-lens', 'An eye test with trial lenses')),
    own('eye-checkup-vision-test.jpg', c('eye-vision-test', 'A vision test at an eye camp')),
  ],
  'blood-bank': [
    own('blood-bank-processing.jpg', c('bank-processing', 'Technicians in the blood bank’s processing room')),
    own('blood-bank-storage.jpg', c('bank-storage', 'Blood kept in the blood bank’s refrigerators')),
    own('blood-bank-centrifuge.jpg', c('bank-centrifuge', 'A technician at the blood bank’s centrifuge')),
  ],
  'health-centre': [
    own('health-centre-dedication.jpg', c('centre-dedication', 'Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji at the dedication of Sant Nirankari Health City')),
  ],
});

export function programmePhotos(activity: Activity): { src: string; alt: string }[] {
  const all = [...(activity.images ?? []), ...(MORE()[activity.id] ?? [])];
  return all.filter((photo, i) => all.findIndex(other => other.src === photo.src) === i);
}
