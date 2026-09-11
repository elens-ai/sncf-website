import { Fragment, type ReactNode } from 'react';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSSnapshot } from '../cms/runtime';

/** Reorder actual components without adding a containing block around sticky scenes. */
export function CMSLayout({ sections }: { sections: { id: string; node: ReactNode }[] }) {
  useCMSRevision();
  const settings = getCMSSnapshot().components || {};
  return <>{sections.map((section,index)=>({...section,index}))
    .filter(section=>settings[section.id]?.enabled!==false)
    .sort((a,b)=>{
      const order=(id:string,index:number)=>{const value=settings[id]?.order;return typeof value==='number'&&Number.isFinite(value)?value:index;};
      return order(a.id,a.index)-order(b.id,b.index)||a.index-b.index;
    }).map(section=><Fragment key={section.id}>{section.node}</Fragment>)}</>;
}
