import { getCMSCopy } from '../cms/runtime';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProgrammeAbout.${key}`, fallback);

/* A FEW LINES ON EACH PROGRAMME, for its report on Core Values: what the work
   is and how it reaches people, drawn from the programme's own record (its
   line and what its figures count). The figures themselves stand beside it,
   so the words do not repeat them. Every one is editable in the CMS
   (ProgrammeAbout); a programme without one shows its line alone. */
const ABOUT = (): Record<string, string> => ({
  'blood-donation': c('blood-donation', 'Voluntary blood donation camps, held across the country on Manav Ekta Diwas and all through the year. The blood is given freely, to whoever needs it, and every unit can help save as many as three lives.'),
  'health-checkup': c('health-checkup', 'General health checkup camps that take doctors to communities with no care nearby, so that an illness is seen early and a patient knows where to turn next.'),
  'eye-checkup': c('eye-checkup', 'Eye camps that examine, treat and equip: an outpatient clinic for everyone who comes, free cataract operations for those who need them, and free spectacles to take home.'),
  chiropractic: c('chiropractic', 'Chiropractic care given by visiting doctors at the Mission’s International Samagams, at Delhi–Samalkha and in Maharashtra, where devotees from across the world gather.'),
  'blood-bank': c('blood-bank', 'The foundation’s own blood bank, run apart from the donation camps, so that the blood collected is stored, tested and ready when it is needed.'),
  'health-centre': c('health-centre', 'Standing facilities rather than camps: allopathic and homeopathic dispensaries, physiotherapy, dental and eye centres, X-ray, Oneness labs and a pharmacy, and ambulances on call.'),
  'schools-colleges': c('schools-colleges', 'Schools and a college run by the foundation, where students are taught to do well and to do good: from the first classes to college degrees.'),
  scholarships: c('scholarships', 'Merit-cum-means aid and higher-education scholarships, so that a student’s ability, not the family’s means, decides how far the studies go.'),
  'free-schools': c('free-schools', 'Education at no cost to families through the foundation’s free schools, alongside support for other community schools. Free coaching is presented within the Nirankari Vocational Centre programme.'),
  nvc: c('nvc', 'Nirankari Vocational Centre brings learning and skill development together. Its programmes create space to read, receive academic support, learn practical trades and explore music and the arts. Each offers a different way for learners to build knowledge, confidence and self-reliance.'),
  'skill-trades': c('skill-trades', 'Livelihood trades taught to women and youth in local centres: sewing at centres across the country, and beauty care at a beautician centre, each learner leaving with a skill that earns.'),
  'tree-plantation': c('tree-plantation', 'Plantation drives through the year, World Environment Day and Vann Mahotsav among them, with volunteers planting and caring for the saplings that grow into the Mission’s green cover.'),
  cleanliness: c('cleanliness', 'Mega cleanliness drives at railway stations, hospitals and riverbanks, where volunteers give their hours to the places a whole community shares.'),
  'covid-relief': c('covid-relief', 'Help through the pandemic: oxygen concentrators, food packets, PPE kits and masks; vaccination centres, care centres and beds, intensive care among them; and contributions to the national and state care funds.'),
  'mass-marriages': c('mass-marriages', 'Collective weddings held since 1998, at no cost to the families, so that no couple has to put off a marriage, or go into debt for one.'),
  'financial-support': c('financial-support', 'Direct financial help where it is needed most, relief when disaster strikes, and steady support for young sportspeople through the foundation’s tournaments.'),
});

export const programmeAbout = (id: string): string | undefined => ABOUT()[id];
