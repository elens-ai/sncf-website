import { getCMSCopy } from '../cms/runtime';
/** Fabric and soft lighting share the hero's changing pillar palette. */
export function HeroCurtain() {
  return <div className="hero-curtain-set" aria-hidden="true">
    {['left', 'right'].map(side => <div key={side} className={`stage-curtain stage-curtain--${side}`}>
      <div className="curtain-cloth"><div className="curtain-woven-petals" /></div>
      <div className="curtain-uplight" />
      <div className="curtain-hem" />

    </div>)}
    <div className="curtain-opening-cue"><span />{getCMSCopy("copy.HeroCurtain.aa3be0db1ca9", "Scroll to open the curtain")}<span /></div>
  </div>;
}
