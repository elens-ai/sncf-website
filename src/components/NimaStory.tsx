import React, { Suspense, lazy } from 'react';
import { Brush, Palette } from 'lucide-react';
import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { NIMA_PHOTOS, nimaForms, nimaImpact, nimaPath, nimaStory } from '../data/nima';
import './nima-story.css';

/* the globe and its map data load only when this tab is opened */
const NimaJourney = lazy(() => import('./NimaJourney'));
const FORM_ART = { painting: Palette, 'fine-arts': Brush } as const;

/** NIMA, told in full in its tab of the Nirankari Vocational Centre's report: who it is (with the foundation's own
    photographs), how it began, the art forms it teaches and the way through each, the programme's own photographs
    from its centres (photos), its journey from Delhi across
    borders (NimaJourney), its impact in figures, and a closing word. Every word is the CMS's (Nima). */
export function NimaStory({ photos: moments = [] }: { photos?: { src: string; alt: string }[] }) {
  useCMSRevision();
  const words = nimaStory();
  const photos = NIMA_PHOTOS();
  return (
    <div className="nima-story">
      <section className="nima-hero">
        <div className="nima-hero-words">
          <p className="nima-kicker">{words.kicker}</p>
          <h4 className="nima-hero-name">{words.name}</h4>
          <p className="nima-hero-full">{words.fullName}</p>
          <p className="nima-hero-headline">{words.headline}</p>
          <p className="nima-hero-lede">{words.lede}</p>
        </div>
        <div className="nima-hero-collage">
          {photos.hero.map((photo, i) => <figure key={photo.src} data-slot={i}><img src={resolveCMSMedia(photo.src)} alt={photo.alt} loading="lazy" decoding="async" /></figure>)}
        </div>
      </section>

      <section className="nima-block nima-origin">
        <div className="nima-origin-words">
          <p className="nima-kicker">{words.storyKicker}</p>
          <h4 className="nima-title">{words.storyTitle}</h4>
          <p className="nima-body">{words.storyBody}</p>
          <p className="nima-origin-by">{words.storyBy}</p>
        </div>
        <div className="nima-origin-photos">
          {photos.story.map((photo, i) => <figure key={photo.src} data-slot={i}><img src={resolveCMSMedia(photo.src)} alt={photo.alt} loading="lazy" decoding="async" /></figure>)}
        </div>
      </section>

      <section className="nima-block nima-forms">
        <p className="nima-kicker">{words.formsKicker}</p>
        <h4 className="nima-title">{words.formsTitle}</h4>
        <ul className="nima-form-cards">
          {nimaForms().map(form => {
            const Art = FORM_ART[form.id as keyof typeof FORM_ART];
            return <li key={form.id} data-form={form.id}>
              {form.photo ? <img src={resolveCMSMedia(form.photo)} alt={form.alt} loading="lazy" decoding="async" /> : <span className="nima-form-art" aria-hidden="true">{Art && <Art size={42} strokeWidth={1.3} />}</span>}
              <strong>{form.name}</strong><small>{form.line}</small>
            </li>;
          })}
        </ul>
        <ol className="nima-path">{nimaPath().map(step => <li key={step}><span aria-hidden="true" />{step}</li>)}</ol>
      </section>

      {/* the programme's own photographs, from its centres */}
      {moments.length > 0 && <section className="nima-block nima-moments">
        <p className="nima-kicker">{words.momentsKicker}</p>
        <ul>{moments.map(photo => <li key={photo.src}><figure><img src={resolveCMSMedia(photo.src)} alt={photo.alt} loading="lazy" decoding="async" /><figcaption>{photo.alt}</figcaption></figure></li>)}</ul>
      </section>}

      <Suspense fallback={<div className="nima-journey-waiting" aria-hidden="true" />}><NimaJourney /></Suspense>

      <section className="nima-block nima-impact">
        <p className="nima-kicker">{words.impactKicker}</p>
        <h4 className="nima-title">{words.impactTitle}</h4>
        <dl className="nima-impact-figures">
          {nimaImpact().map(figure => <div key={figure.label}><dt>{figure.label}</dt><dd className="nima-impact-value">{figure.value}</dd><dd className="nima-impact-when">{figure.note}</dd></div>)}
        </dl>
        <p className="nima-impact-note">{words.impactNote}</p>
      </section>

      <section className="nima-closing" style={{ '--photo': `url("${resolveCMSMedia(photos.closing.src)}")` } as React.CSSProperties}>
        <p className="nima-closing-line">{words.closing}</p>
        <p className="nima-closing-script">{words.closingScript}</p>
      </section>
    </div>
  );
}
