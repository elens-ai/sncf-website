import React from 'react';
import { getCMSCopy } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import './sayings.css';
import { QuoteWords } from './QuoteWords';

const c = (key: string, fallback: string) => getCMSCopy(`copy.Sayings.${key}`, fallback);

/* WORDS OF THE MISSION'S SATGURUS, AND ITS OWN SLOGANS, BESIDE THE WORK THEY
   SPEAK TO. Each is given as it was said (in Hindi where it was said in
   Hindi, its meaning beneath) and as the foundation and the press record it:
     · Heal — the foundation's healthcare tagline;
     · Blood donation — Baba Hardev Singh Ji (All India Radio, Hindi;
       the foundation's blood donation reports, in English);
     · Enrich — Satguru Mata Sudiksha Ji Maharaj (the foundation's Project
       Amrit page); Project Amrit — its own slogan (the same page);
     · Empower, Oneness Vann — Satguru Mata Sudiksha Ji Maharaj (the
       foundation's Oneness Vann page);
     · Watershed — Baba Hardev Singh Ji (the same page);
     · Adopted Villages — the line on the Mission's camp banners;
     · Contribute — the line the foundation was founded to act on (its
       About page).
   Every line is editable in the CMS (Sayings). */
export const SAYINGS = () => ({
  heal: {
    hindi: c('heal-care-hindi', 'स्वास्थ्य–सेवा, संवेदना और सम्मान के साथ'),
    english: c('heal-care-english', 'Healthcare with compassion and dignity.'),
    by: '',
  },
  'blood-donation': {
    hindi: c('blood-donation-hindi', 'रक्त नाड़ियों में बहे, नालियों में नहीं।'),
    english: c('blood-donation-english', 'Blood should flow in veins, not in drains.'),
    by: c('blood-donation-by', 'Nirankari Baba Hardev Singh Ji Maharaj'),
  },
  enrich: {
    english: c('enrich-english', 'We need to inspire everyone to take action, not just with words, but with deeds.'),
    by: c('enrich-by', 'Satguru Mata Sudiksha Ji Maharaj'),
  },
  empower: {
    hindi: c('empower-hindi', 'वृद्ध का साया, वृक्ष की छाया।'),
    english: c('empower-english', 'The blessing of our elders is like the shade of a tree.'),
    by: c('empower-by', 'Satguru Mata Sudiksha Ji Maharaj'),
  },
  'project-amrit': {
    hindi: c('amrit-hindi', 'स्वच्छ जल, स्वच्छ मन।'),
    english: c('amrit-english', 'Clean water, clean mind.'),
    by: c('amrit-by', 'Project Amrit, Sant Nirankari Charitable Foundation'),
  },
  // Official Oneness Vann launch slogan, 21 August 2021:
  // https://nirankari.org/tour-and-samagams/onenessvann20210821/
  'oneness-vann': {
    hindi: c('vann-hindi', 'वृक्ष की छाया, वृद्ध का साया।'),
    english: c('vann-english', 'The shade of trees, the shelter of elders.'),
    by: c('vann-by', 'Satguru Mata Sudiksha Ji Maharaj'),
  },
  watershed: {
    english: c('watershed-english', 'Pollution, whether internal or external, is harmful.'),
    by: c('watershed-by', 'Nirankari Baba Hardev Singh Ji Maharaj'),
  },
  'adopted-villages': {
    hindi: c('villages-hindi', 'मानव को हो मानव प्यारा, एक दूजे का बने सहारा।'),
    english: c('villages-english', 'May every person hold every other dear, and each become the other’s support.'),
    by: c('villages-by', 'Sant Nirankari Mission'),
  },
  contribute: {
    english: c('contribute-english', 'Life gets a meaning, if it is lived for others.'),
    by: c('contribute-by', 'Nirankari Baba Hardev Singh Ji Maharaj'),
  },
  /* the Projects cover's own lines beneath its orbit, where it gives a project
     in other words than its chapter does (ProjectsPage): Oneness Vann's line,
     and the watershed's saying in Hindi */
  'oneness-vann-cover': {
    english: c('vann-cover', 'We Live, if Nature Lives'),
    by: '',
  },
  'watershed-cover': {
    hindi: c('watershed-cover-hindi', 'प्रदूषण अंदर हो या बाहर, दोनों ही हानिकारक हैं'),
    english: c('watershed-english', 'Pollution, whether internal or external, is harmful.'),
    by: c('watershed-by', 'Nirankari Baba Hardev Singh Ji Maharaj'),
  },
});
export type SayingId = keyof ReturnType<typeof SAYINGS>;
/** Whether a section (a cornerstone, a project's id) has a saying of its own. */
export const hasSaying = (id: string): id is SayingId => id in SAYINGS();

/** A saying set beside the work it speaks to: the words large (in Hindi where
    they were said in Hindi, set in Devanagari), their meaning beneath, and
    who said them. A place may leave out the meaning or who said it, start a
    new line where `breakBefore` falls in the words, and set the closing mark
    at the end of the words rather than at the far side (`closeInline`). */
export const Saying: React.FC<{ id: SayingId; className?: string; meaning?: boolean; byline?: boolean; breakBefore?: string; closeInline?: boolean }> = ({ id, className, meaning = true, byline = true, breakBefore, closeInline = false }) => {
  useCMSRevision();
  const saying: { hindi?: string; english: string; by: string } = SAYINGS()[id];
  const words = saying.hindi ?? saying.english;
  const at = breakBefore ? words.indexOf(breakBefore) : -1;
  return (
    <figure className={`saying${className ? ` ${className}` : ''}`} data-script={saying.hindi ? 'hindi' : 'english'}>
      <QuoteWords close={!closeInline}><blockquote lang={saying.hindi ? 'hi' : 'en'}>
        {at > 0 ? <>{words.slice(0, at).trimEnd()}<br />{words.slice(at)}</> : words}
        {closeInline && <span className="quote-mark-inline" aria-hidden="true">”</span>}
      </blockquote></QuoteWords>
      {saying.hindi && meaning && <p className="saying-meaning">{saying.english}</p>}
      {byline && saying.by && <figcaption>{saying.by}</figcaption>}
    </figure>
  );
};
