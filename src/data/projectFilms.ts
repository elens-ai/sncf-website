import { getCMSLink } from '../cms/links';
import { resolveCMSAsset } from '../cms/runtime';

/** Local background films avoid embed overhead; the remaining projects retain their existing sources. */
export function projectFilmSource(id: string): string {
  switch (id) {
    case 'project-amrit': return resolveCMSAsset('asset.ProjectFilms.amritVideo', '/videos/projects/project-amrit.mp4');
    case 'oneness-vann': return resolveCMSAsset('asset.ProjectFilms.onenessVideo', '/videos/projects/oneness-vann.mp4');
    case 'watershed': return resolveCMSAsset('asset.ProjectFilms.watershedVideo', '/videos/projects/watershed-saiwan.mp4');
    case 'adopted-villages': return getCMSLink('copy.Link.ProjectFilms.adoptedVillages', '');
    case 'health-city': return getCMSLink('copy.Link.ProjectFilms.healthCity', 'https://youtu.be/xfBAkNp1ZXQ');
    default: return '';
  }
}
