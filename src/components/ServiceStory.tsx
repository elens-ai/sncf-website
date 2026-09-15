import React, { useState } from 'react';
import { Ear, Users, HeartHandshake, ArrowUpRight } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import './service-story.css';
const c = (key:string, fallback:string) => getCMSCopy(`copy.ServiceStory.${key}`,fallback);
export function ServiceStory() {
  const [step,setStep] = useState(0);
  const moments = [
    { label:c('listen','Listen'), title:c('listenTitle','Start with a person.'), body:c('listenBody','A need is more than a number. Care begins with listening, understanding and seeing each other as one.'), icon:Ear, color:'#208765', tint:'#cde7d7' },
    { label:c('together','Come together'), title:c('togetherTitle','Many hands. One purpose.'), body:c('togetherBody','Time, skills and compassion come together to turn an intention into thoughtful action.'), icon:Users, color:'#2dacc3', tint:'#cdeaf0' },
    { label:c('serve','Serve'), title:c('serveTitle','Let kindness take shape.'), body:c('serveBody','In a classroom, a health camp or a greener neighbourhood, service becomes something we can share.'), icon:HeartHandshake, color:'#cd1760', tint:'#f1d6e1' },
  ];
  const current=moments[step]; const Icon=current.icon;
  return <div className="service-story" style={{'--story-color':current.color,'--story-tint':current.tint} as React.CSSProperties}>
    <div className="service-story-sculpture" aria-hidden="true"><div className="service-story-light"/><div className="service-story-petals">{[0,1,2].map(i=><i key={i} data-selected={step===i} style={{'--leaf-angle':`${i*120}deg`} as React.CSSProperties}/>)}</div><div className="service-story-medallion" key={step}><Icon strokeWidth={1.1}/></div><span className="service-story-motto">{c('motto','Service with humility')}</span></div>
    <div className="service-story-steps" aria-label={c('choose','Explore how service takes shape')}>{moments.map((moment,i)=><button key={i} aria-pressed={step===i} onClick={()=>setStep(i)}><span>0{i+1}</span>{moment.label}</button>)}</div>
    <div className="service-story-copy" key={`copy-${step}`} aria-live="polite"><h2>{current.title}</h2><p>{current.body}</p><button onClick={()=>setStep((step+1)%3)} aria-label={c('next','Explore the next moment')}><ArrowUpRight size={20}/></button></div>
  </div>;
}
