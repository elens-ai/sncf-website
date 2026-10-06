import {
  Award, BookOpen, Droplet, Droplets, Eye, GraduationCap, HandCoins, Heart, HeartHandshake, Hospital, House,
  Laptop, Mountain, PackageCheck, Scissors, Sparkles, Sprout, Stethoscope, Trees, Waves, createLucideIcon, type LucideIcon,
} from 'lucide-react';
import type { ActivityIcon } from '../data/activityIcons';

/** The symbol drawn for each programme icon the CMS offers: on the home
    page's constellation tiles and in the navigation's menus alike. */
/* lucide has no spine: one in its own manner, four vertebrae with their side processes, for chiropractic */
const Spine = createLucideIcon('Spine', [
  ['rect', { x: '9', y: '2', width: '6', height: '3.5', rx: '1.5', key: 'v1' }],
  ['rect', { x: '8.5', y: '7.5', width: '7', height: '3.5', rx: '1.5', key: 'v2' }],
  ['rect', { x: '8', y: '13', width: '8', height: '3.5', rx: '1.5', key: 'v3' }],
  ['rect', { x: '8.5', y: '18.5', width: '7', height: '3.5', rx: '1.5', key: 'v4' }],
  ['path', { d: 'M5.5 9.25h3', key: 'p1' }], ['path', { d: 'M15.5 9.25h3', key: 'p2' }],
  ['path', { d: 'M5 14.75h3', key: 'p3' }], ['path', { d: 'M16 14.75h3', key: 'p4' }],
]);

export const ACTIVITY_SYMBOLS: Record<ActivityIcon, LucideIcon> = {
  droplets: Droplets, droplet: Droplet, stethoscope: Stethoscope, eye: Eye, hospital: Hospital,
  'graduation-cap': GraduationCap, award: Award, 'book-open': BookOpen, laptop: Laptop, scissors: Scissors,
  trees: Trees, sparkles: Sparkles, 'package-check': PackageCheck, heart: Heart, 'hand-coins': HandCoins,
  waves: Waves, sprout: Sprout, mountain: Mountain, house: House, 'heart-handshake': HeartHandshake, spine: Spine,
};
