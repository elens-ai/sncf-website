import type { LucideIcon } from 'lucide-react';
import {
  Ambulance, Award, BarChart3, BedDouble, BookOpen, Building2, CalendarCheck, CalendarHeart, Clock, Droplet, Eye, Glasses, GraduationCap,
  HandHeart, Heart, HeartPulse, Hospital, IndianRupee, Laptop, MapPin, Package, School, Scissors, ShieldCheck, Sparkles, Sprout, Stethoscope,
  Syringe, Tent, TrainFront, TreePine, Trophy, Users, Waves, Wind,
} from 'lucide-react';

/* A reported figure's symbol, read from what it counts. The order matters:
   the more particular reading comes first ("potentially saved lives" before
   "units", "volunteers" before "hospital", "sport" before "youth"). */
const READINGS: [RegExp, LucideIcon][] = [
  [/lives/i, HeartPulse], [/unit/i, Droplet], [/camp/i, Tent], [/patient/i, Stethoscope], [/opd/i, Stethoscope],
  [/cataract/i, Eye], [/spectacle/i, Glasses], [/ambulance/i, Ambulance],
  [/allopathic|homeopathic|physiotherapy|chiropractic|lab|pharmacy|x-ray|dental|eye centre/i, Hospital],
  [/sport|tournament/i, Trophy], [/college/i, GraduationCap], [/school/i, School], [/scholar/i, Award],
  [/disbursed|financial|relief|fund|₹/i, IndianRupee], [/coaching/i, BookOpen], [/nima/i, Laptop], [/sewing/i, Scissors],
  [/beautician/i, Sparkles], [/youth|student|children/i, Users],
  [/tree|plantation|sapling|plant|oneness vann/i, TreePine], [/drive/i, CalendarCheck], [/manhour/i, Clock],
  [/volunteer/i, HandHeart], [/railway|rly/i, TrainFront], [/hospital/i, Hospital], [/waterbod|water bod/i, Waves],
  [/food/i, Package], [/mask|ppe/i, ShieldCheck], [/oxygen/i, Wind], [/vaccin/i, Syringe], [/icu|bed/i, BedDouble],
  [/care centre/i, Building2], [/couple|marri/i, Heart], [/event/i, CalendarHeart],
  [/village|population|hamlet|panchayat|beneficiar|people/i, Users], [/cities|states/i, MapPin], [/area|acre|hectare|sq ft|green cover/i, Sprout],
];

export const iconFor = (label: string): LucideIcon => READINGS.find(([pattern]) => pattern.test(label))?.[1] ?? BarChart3;
