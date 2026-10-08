import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import './service-story.css';
const c = (key: string, fallback: string) => getCMSCopy(`copy.ServiceStory.${key}`, fallback);

/** Three open, numbered steps; the visitor chooses the detail they want to read. */
export function ServiceStory({ headingLevel = 2 }: { headingLevel?: 2 | 3 | 4 }) {
  const Title = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const [step, setStep] = useState(0);
  const id = useId();
  const moments = [
    { label: c('listen', 'Listen'), title: c('listenTitle', 'Start with a person.'), body: c('listenBody', 'A need is more than a number. Care begins with listening, understanding and seeing each other as one.'), color: '#208765' },
    { label: c('together', 'Come together'), title: c('togetherTitle', 'Many hands. One purpose.'), body: c('togetherBody', 'Time, skills and compassion come together to turn an intention into thoughtful action.'), color: '#237e94' },
    { label: c('serve', 'Serve'), title: c('serveTitle', 'Let kindness take shape.'), body: c('serveBody', 'In a classroom, a health camp or a greener neighbourhood, service becomes something we can share.'), color: '#b6205b' },
  ];
  return <ol className="service-sequence" aria-label={c('choose', 'Explore how service takes shape')}>
    {moments.map((moment, i) => <li key={i} className="service-sequence-step" data-open={step === i} style={{ '--step-ink': moment.color } as React.CSSProperties}>
      <button type="button" id={`${id}-button-${i}`} aria-expanded={step === i} aria-controls={`${id}-detail-${i}`} onClick={() => setStep(step === i ? -1 : i)}>
        <span className="service-sequence-number" aria-hidden="true">0{i + 1}</span>
        <span>{moment.label}</span><ChevronDown size={18} strokeWidth={1.4} aria-hidden="true" />
      </button>
      <div id={`${id}-detail-${i}`} className="service-sequence-detail" role="region" aria-labelledby={`${id}-button-${i}`} hidden={step !== i}>
        <Title>{moment.title}</Title><p>{moment.body}</p>
      </div>
    </li>)}
  </ol>;
}
