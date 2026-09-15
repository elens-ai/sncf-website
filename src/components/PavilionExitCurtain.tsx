import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
export function PavilionExitCurtain(){
  return <div className="pavilion-exit-curtain" aria-label={getCMSCopy("copy.PavilionExitCurtain.1694e6fe9cb5", "Sant Nirankari Charitable Foundation. Thank you for visiting.")}>
    {['left','right'].map(side=><div key={side} className={`stage-curtain stage-curtain--${side}`} aria-hidden="true">
      <div className="curtain-cloth"/><div className="curtain-uplight"/><div className="curtain-hem"/>
      <div className="pavilion-exit-print"><img src={resolveCMSAsset("asset.PavilionExitCurtain.25aa35189463", "https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp")} alt=""/><p>{getCMSCopy("copy.PavilionExitCurtain.75a7badb6b66", "Thank you for visiting")}</p><span>{getCMSCopy("copy.PavilionExitCurtain.4fb4c68e0de2", "Service with humility. Always.")}</span></div>
    </div>)}
  </div>;
}
