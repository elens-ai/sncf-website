import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, Pause, Play } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import './service-story.css';
const c = (key: string, fallback: string) => getCMSCopy(`copy.ServiceStory.${key}`, fallback);

/** Three steps rotate every three seconds, with manual selection and pause. */
export function ServiceStory({ headingLevel = 2 }: { headingLevel?: 2 | 3 | 4 }) {
  const Title = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const sequence = useRef<HTMLOListElement>(null);
  const [layout, setLayout] = useState({ detail: 0, sequence: 0 });
  const id = useId();
  const moments = [
    { label: c('listen', 'Listen'), title: c('listenTitle', 'Start with a person.'), body: c('listenBody', 'A need is more than a number. Care begins with listening, understanding and seeing each other as one.'), color: '#208765' },
    { label: c('together', 'Come together'), title: c('togetherTitle', 'Many hands. One purpose.'), body: c('togetherBody', 'Time, skills and compassion come together to turn an intention into thoughtful action.'), color: '#237e94' },
    { label: c('serve', 'Serve'), title: c('serveTitle', 'Let kindness take shape.'), body: c('serveBody', 'In a classroom, a health camp or a greener neighbourhood, service becomes something we can share.'), color: '#b6205b' },
  ];
  useLayoutEffect(() => {
    const list = sequence.current;
    if (!list) return;
    const contents = [...list.querySelectorAll<HTMLElement>('.service-sequence-detail-content')];
    const buttons = [...list.querySelectorAll<HTMLElement>('.service-sequence-step > button')];
    const borders = [list, ...list.querySelectorAll<HTMLElement>('.service-sequence-step')];
    const measure = () => {
      const detail = Math.ceil(Math.max(0, ...contents.map(content => content.getBoundingClientRect().height)));
      const borderHeight = borders.reduce((total, element) => {
        const style = getComputedStyle(element);
        return total + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      }, 0);
      const height = Math.ceil(detail + borderHeight + buttons.reduce((total, button) => total + button.getBoundingClientRect().height, 0));
      setLayout(previous => previous.detail === detail && previous.sequence === height ? previous : { detail, sequence: height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    [...contents, ...buttons].forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setStep(current => (current + 1) % moments.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [paused, step, moments.length]);
  return <div className="service-story">
    <ol ref={sequence} className="service-sequence" aria-label={c('choose', 'Explore how service takes shape')}
      style={{ '--service-detail-height': `${layout.detail}px`, '--service-sequence-height': `${layout.sequence}px` } as React.CSSProperties}>
    {moments.map((moment, i) => <li key={i} className="service-sequence-step" data-open={step === i} style={{ '--step-ink': moment.color } as React.CSSProperties}>
      <button type="button" id={`${id}-button-${i}`} aria-expanded={step === i} aria-controls={`${id}-detail-${i}`} onClick={() => setStep(step === i ? -1 : i)}>
        <span className="service-sequence-number" aria-hidden="true">0{i + 1}</span>
        <span>{moment.label}</span><ChevronDown size={18} strokeWidth={1.4} aria-hidden="true" />
      </button>
      <div id={`${id}-detail-${i}`} className="service-sequence-detail" role="region" aria-labelledby={`${id}-button-${i}`}
        aria-hidden={step !== i} inert={step !== i}>
        <div className="service-sequence-detail-content"><Title>{moment.title}</Title><p>{moment.body}</p></div>
      </div>
    </li>)}
    </ol>
    <div className="service-sequence-controls">
      <button type="button" onClick={() => setPaused(value => !value)}
        aria-label={paused ? c('resume-label', 'Resume automatic steps') : c('pause-label', 'Pause automatic steps')}>
        {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
        {paused ? c('resume', 'Resume') : c('pause', 'Pause')}
      </button>
    </div>
  </div>;
}
