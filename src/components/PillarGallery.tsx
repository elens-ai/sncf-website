import React, { useState } from 'react';
import { getCMSCopy } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import type { Activity } from '../data/activities';
import type { MediaItem } from '../data/media';
import { EmblemBloom } from './EmblemBloom';
import { MediaGallery } from './MediaGallery';

/** A Gallery tab. A project's opens on the Projects emblem in bloom with its
    photographs, over its own gallery of photographs and films. A
    cornerstone's (whose emblem already moves in its masthead) is every
    programme's photograph in a carousel, narrowed to one programme by the
    buttons above it, the photograph in view opening into the viewer. */
export const PillarGallery: React.FC<{
  activities: Activity[];
  title: string;
  /** For a project: the bloom's credit line and label, and its gallery in the media library. */
  project?: { caption: string; label: string; mediaSection: string };
}> = ({ activities, title, project }) => {
  useCMSRevision();
  const [programme, setProgramme] = useState('all');
  if (project) {
    return (
      <div className="pillar-gallery">
        <div className="pillar-gallery-stage"><EmblemBloom emblem="projects" activities={activities} caption={project.caption} label={project.label} /></div>
        <MediaGallery section={project.mediaSection} title={title} />
      </div>
    );
  }
  const pictured = activities.filter(activity => (activity.images ?? []).length);
  const photos: MediaItem[] = pictured
    .filter(activity => programme === 'all' || activity.id === programme)
    .flatMap(activity => activity.images.map((image, i) => ({
      id: `${activity.id}-${i}`, kind: 'photo' as const, src: image.src, alt: image.alt, caption: activity.menuLabel ?? activity.title,
    })));
  const options = [
    { id: 'all', name: getCMSCopy("copy.PillarGallery.all", "Every programme"), count: pictured.reduce((sum, activity) => sum + activity.images.length, 0) },
    ...pictured.map(activity => ({ id: activity.id, name: activity.menuLabel ?? activity.title, count: activity.images.length })),
  ];
  return (
    <div className="pillar-gallery" data-layout="slides">
      <div className="pillar-gallery-filter" role="group" aria-label={getCMSCopy("copy.PillarGallery.filter", "Show the photographs of")}>
        {options.map(option => (
          <button key={option.id} type="button" aria-pressed={programme === option.id} onClick={() => setProgramme(option.id)}>
            {option.name}<span>{option.count}</span>
          </button>
        ))}
      </div>
      {/* keyed by the choice, so a viewer left open never shows a photograph no longer in the grid */}
      <MediaGallery key={programme} section="pillar-photographs" items={photos} title={title} layout="slides" />
    </div>
  );
};
