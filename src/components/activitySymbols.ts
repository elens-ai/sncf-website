import {
  Award, BookOpen, Droplet, Droplets, Eye, GraduationCap, HandCoins, Heart, HeartHandshake, Hospital, House,
  Laptop, Mountain, PackageCheck, Scissors, Sparkles, Sprout, Stethoscope, Trees, Waves, type LucideIcon,
} from 'lucide-react';
import type { ActivityIcon } from '../data/activityIcons';

/** The symbol drawn for each programme icon the CMS offers: on the home
    page's constellation tiles and in the navigation's menus alike. */
export const ACTIVITY_SYMBOLS: Record<ActivityIcon, LucideIcon> = {
  droplets: Droplets, droplet: Droplet, stethoscope: Stethoscope, eye: Eye, hospital: Hospital,
  'graduation-cap': GraduationCap, award: Award, 'book-open': BookOpen, laptop: Laptop, scissors: Scissors,
  trees: Trees, sparkles: Sparkles, 'package-check': PackageCheck, heart: Heart, 'hand-coins': HandCoins,
  waves: Waves, sprout: Sprout, mountain: Mountain, house: House, 'heart-handshake': HeartHandshake,
};
