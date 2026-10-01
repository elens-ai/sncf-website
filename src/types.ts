export type PillarId = 'heal' | 'enrich' | 'empower' | 'projects' | 'amrit' | 'oneness';

export interface PillarState {
  id: PillarId;
  label: string;
  accentA: string;
  accentB: string;
  headline: string;
  body: string;
  cardImageAlt: string;
  shortTagline: string;
  stats: { label: string; value: string }[];
  keyHighlights: string[];
  subText: string;
  /** Script line under the pillar's photo emblem, e.g. "Care, in every leaf." */
  emblemCaption?: string;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  lastX: number;
  velocity: number;
  lastTimestamp: number;
}
