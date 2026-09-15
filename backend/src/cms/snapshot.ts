import { createHash } from 'node:crypto'
import type { Payload, PayloadRequest, CollectionSlug } from 'payload'
import { cached } from './cache'
import {mergePreviewStats} from './previewStats'
type Doc=Record<string,any>
export type Snapshot={version:string,pillars:Doc[],activities:Doc[],events:Doc[],partners:Doc[],awards:Doc[],gallery:Doc[],pages:Doc[],copy:Record<string,string>,assets:Record<string,string>,components:Record<string,Doc>,site:Doc,pavilion:Doc,stats:Record<string,Doc>}
const mapping={pillars:'pillars',activities:'activities',events:'events',partners:'partners',awards:'awards',gallery:'gallery-items',pages:'pages',copy:'content-slots',assets:'asset-slots',components:'component-settings',stats:'live-stats'} as const
function asset(media:unknown,fallback:unknown):string|undefined {
  const url=media&&typeof media==='object'&&(media as Doc).url
  const source=typeof url==='string'?url:typeof fallback==='string'?fallback:undefined
  return source?.startsWith('/api/media/')?`${process.env.PAYLOAD_PUBLIC_SERVER_URL||'http://localhost:3001'}${source}`:source
}
function clean(value:any):any {
  if(Array.isArray(value))return value.map(clean)
  if(!value||typeof value!=='object')return value
  const {createdAt,_status,_verified,record,media,posterMedia,logoMedia,...fields}=value
  const doc:Doc={...(record&&typeof record==='object'?record:{}),...fields}
  if(value.key){doc.id=value.key;delete doc.key}
  if(media)doc.src=asset(media,doc.src)
  if(posterMedia)doc.poster=asset(posterMedia,doc.poster)
  if(logoMedia)doc.logo=asset(logoMedia,doc.logo)
  for(const key of Object.keys(doc)){if(doc[key]===null&&key!=='src')delete doc[key];else doc[key]=clean(doc[key])}
  return doc
}
async function load(payload:Payload,preview:boolean,req?:PayloadRequest):Promise<Snapshot>{
  const pairs=await Promise.all(Object.entries(mapping).map(async([key,slug])=>{
    const result=await payload.find({collection:slug as CollectionSlug,depth:1,limit:0,pagination:false,sort:['order','key'],draft:preview,where:preview?undefined:{_status:{equals:'published'}},overrideAccess:!preview,req})
    return[key,result.docs as Doc[]] as const
  }))
  const docs=Object.fromEntries(pairs)
  const globals=await Promise.all(['site-settings','pavilion-settings'].map(async slug=>{
    const result=await payload.findGlobal({slug:slug as 'site-settings',depth:0,draft:preview,overrideAccess:true,req}) as Doc
    return result._status==='published'||preview?clean(result):{}
  }))
  const site={...globals[0].options,...globals[0]};delete site.options
  const result:Snapshot={version:'',pillars:docs.pillars.map(clean),activities:docs.activities.map(clean),events:docs.events.map(clean),partners:docs.partners.map(clean),awards:docs.awards.map(clean),gallery:docs.gallery.map(clean),pages:docs.pages.map(clean),
    copy:Object.fromEntries(docs.copy.map(d=>[d.key,d.value])),assets:Object.fromEntries(docs.assets.map(d=>[d.key,asset(d.media,d.source)]).filter(([,v])=>v)),
    components:Object.fromEntries(docs.components.map(d=>[d.key,{enabled:d.enabled!==false,order:d.order??0,options:d.options??{}}])),site,pavilion:globals[1].settings??{},stats:Object.fromEntries(docs.stats.map(d=>[d.key,clean(d)])),
  }
  if(preview){
    const published=await Promise.all(['activities','pillars'].map(collection=>payload.find({collection:collection as CollectionSlug,depth:0,limit:0,pagination:false,draft:false,where:{_status:{equals:'published'}},overrideAccess:true,req})))
    mergePreviewStats(result.stats,docs.activities,published[0].docs as Doc[],'activity',docs.stats)
    mergePreviewStats(result.stats,docs.pillars,published[1].docs as Doc[],'pillar',docs.stats)
  }
  result.pillars=result.pillars.map(p=>({...p,keyHighlights:(p.keyHighlights??[]).map((v:any)=>typeof v==='string'?v:v.text)}))
  result.version=createHash('sha256').update(JSON.stringify(result)).digest('hex').slice(0,24)
  return result
}
export async function getSnapshot(payload:Payload,{preview=false,req}:{preview?:boolean,req?:PayloadRequest}={}):Promise<Snapshot>{
  if(preview&&!req?.user)throw new Error('Preview requires an authenticated user.')
  return preview?load(payload,true,req):cached('published',()=>load(payload,false))
}
