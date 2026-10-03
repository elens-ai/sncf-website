/** Idempotent bootstrap: creates missing entries only; never changes existing authored content.
 *  --refresh-labels also rewrites the "where it appears" metadata (page, section and label) of
 *  existing text and image slots from the seed. The text and images editors have set are never
 *  touched; a text slot's label quotes its current text, as the CMS itself does on save.
 *  --refresh-figures is for a new activity report: it sets each programme's period, description,
 *  headline and figures, each pillar's stats and highlights, and every live statistic (value,
 *  period, source) from the seed. Nothing else an editor set is touched, and the CMS's statistics
 *  history records each figure that changes.
 *  --refresh-photos brings in newly supplied photographs: a programme without photos of its own
 *  takes the seed's, and a gallery slot still showing the seed's file (or none) takes the seed's
 *  photo and words. A photo an editor chose or uploaded is never replaced. */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import {getPayload,type CollectionSlug} from 'payload'
import config from '../src/payload.config'
import {runCMSCommand} from './run-cms-command'
const fillMissingSettings=process.argv.includes('--fill-missing-settings')
const refreshLabels=process.argv.includes('--refresh-labels')
const refreshFigures=process.argv.includes('--refresh-figures')
const refreshPhotos=process.argv.includes('--refresh-photos')
const source=process.argv.slice(2).find(arg=>!arg.startsWith('--'))||process.env.CMS_SEED_FILE||path.resolve('seed/site-content.json')
const seed=JSON.parse(await fs.readFile(source,'utf8'))
const payload=await getPayload({config})
const collections={pillars:'pillars',activities:'activities',events:'events',partners:'partners',awards:'awards',gallery:'gallery-items',pages:'pages'}
let created=0,skipped=0,relabelled=0,refreshed=0
const excerpt=(value:unknown)=>{const text=String(value??'').replace(/\s+/g,' ').trim();return text.length>70?`${text.slice(0,69)}…`:text||'(blank)'}
// A local SQLite database may be briefly locked by the running CMS: retry. The lock can surface
// anywhere in the error's cause chain (the query builder wraps the driver's error).
const locked=(error:unknown)=>{for(let e=error as {code?:unknown,message?:unknown,cause?:unknown}|undefined;e;e=e.cause as typeof e)if(/BUSY|database is locked/.test(`${e.code??''} ${e.message??''}`))return true;return false}
async function update(slug:CollectionSlug,id:string|number,data:Record<string,unknown>){
  for(let attempt=1;;attempt++){
    try{await payload.update({collection:slug,id,overrideAccess:true,data});return}
    catch(error){if(attempt>=10||!locked(error))throw error;await new Promise(done=>setTimeout(done,300*attempt))}
  }
}
async function refreshWhere(slug:'content-slots'|'asset-slots',kind:'copy'|'assets'){
  const found=await payload.find({collection:slug,depth:0,pagination:false,overrideAccess:true})
  for(const doc of found.docs as unknown as Array<Record<string,any>>){
    const meta=seed.slots?.[kind]?.[doc.key];if(!meta)continue
    const label=kind==='copy'?`${meta.section} · ${String(doc.key).startsWith('copy.Link.')?'Link: ':''}${excerpt(doc.value)}`:meta.label
    if(doc.page===meta.page&&doc.section===meta.section&&doc.label===label)continue
    await update(slug,doc.id,{page:meta.page,section:meta.section,label})
    relabelled++
  }
}
async function refreshReportedFigures(){
  const rows=(items:unknown,fields:string[])=>(Array.isArray(items)?items:[]).map(item=>Object.fromEntries(fields.map(field=>[field,(item as Record<string,unknown>)?.[field]??null])))
  const figures:Array<[string,CollectionSlug,(doc:any)=>Record<string,unknown>]>=[
    ['activities','activities',doc=>({period:doc.period,blurb:doc.blurb,headline:{label:doc.headline?.label,value:doc.headline?.value},dataPoints:rows(doc.dataPoints,['label','value'])})],
    ['pillars','pillars',doc=>({stats:rows(doc.stats,['label','value']),keyHighlights:rows((doc.keyHighlights||[]).map((item:unknown)=>typeof item==='string'?{text:item}:item),['text'])})],
  ]
  for(const[field,slug,reported]of figures){
    const found=await payload.find({collection:slug,depth:0,pagination:false,overrideAccess:true})
    for(const doc of found.docs as unknown as Array<Record<string,any>>){
      const fresh=(seed[field]||[]).find((item:Record<string,any>)=>(item.id||item.key)===doc.key);if(!fresh)continue
      const want=reported(fresh)
      if(JSON.stringify(want)===JSON.stringify(reported(doc)))continue
      // Saved as published, so the CMS carries each changed figure into its live statistic.
      await update(slug,doc.id,{...want,_status:'published'});refreshed++
    }
  }
  const found=await payload.find({collection:'live-stats',depth:0,pagination:false,overrideAccess:true})
  for(const doc of found.docs as unknown as Array<Record<string,any>>){
    const fresh=seed.stats?.[doc.key];if(!fresh)continue
    const want={label:fresh.label,value:String(fresh.value),period:fresh.period??doc.period??null,source:fresh.source??doc.source??null}
    if(want.label===doc.label&&want.value===doc.value&&want.period===(doc.period??null)&&want.source===(doc.source??null))continue
    await update('live-stats',doc.id,{...want,_status:'published'});refreshed++
  }
}
async function refreshPhotographs(){
  const photo=(item:Record<string,any>|undefined)=>item?.media||item?.src
  const activities=await payload.find({collection:'activities',depth:0,pagination:false,overrideAccess:true})
  for(const doc of activities.docs as unknown as Array<Record<string,any>>){
    const fresh=(seed.activities||[]).find((item:Record<string,any>)=>item.id===doc.key);if(!fresh)continue
    const data:Record<string,unknown>={}
    if(!(doc.images||[]).some(photo)&&(fresh.images||[]).length)data.images=fresh.images
    if(!(doc.hoverPhotos||[]).some(photo)&&(fresh.hoverPhotos||[]).length)data.hoverPhotos=fresh.hoverPhotos
    if(!photo(doc.cardPhoto)&&fresh.cardPhoto?.src)data.cardPhoto=fresh.cardPhoto
    if(!Object.keys(data).length)continue
    await update('activities',doc.id,{...data,_status:'published'});refreshed++
  }
  const gallery=await payload.find({collection:'gallery-items',depth:0,pagination:false,overrideAccess:true})
  for(const doc of gallery.docs as unknown as Array<Record<string,any>>){
    const fresh=(seed.gallery||[]).find((item:Record<string,any>)=>(item.id||item.key)===doc.key);if(!fresh)continue
    // An editor's upload, or a file other than the seed's, is theirs to keep.
    if(doc.media||(doc.src&&doc.src!==fresh.src))continue
    const want={src:fresh.src??null,alt:fresh.alt??'',caption:fresh.caption??'',source:fresh.source??doc.source??null}
    if(want.src===doc.src&&want.alt===(doc.alt??'')&&want.caption===(doc.caption??'')&&want.source===(doc.source??null))continue
    await update('gallery-items',doc.id,{...want,_status:'published'});refreshed++
  }
}
const existingKeys=new Map<string,Set<string>>()
async function insert(slug:string,key:string,raw:Record<string,any>,order=0){
  // Fetch keys once per collection, including drafts, instead of issuing one
  // existence query for every seed item. Repeat runs remain read-only.
  if(!existingKeys.has(slug)){
    console.log(`Seeding ${slug}…`)
    const found=await payload.find({collection:slug as CollectionSlug,depth:0,pagination:false,select:{key:true},overrideAccess:true})
    existingKeys.set(slug,new Set(found.docs.map(doc=>(doc as unknown as {key:string}).key)))
  }
  const keys=existingKeys.get(slug)!
  if(keys.has(key)){skipped++;return}
  const {id,...data}=raw
  if(slug==='pillars'&&Array.isArray(data.keyHighlights))data.keyHighlights=data.keyHighlights.map((text:unknown)=>typeof text==='string'?{text}:text)
  await payload.create({collection:slug as CollectionSlug,overrideAccess:true,data:{...data,key,order,_status:'published'}})
  keys.add(key)
  created++
}
await runCMSCommand(async()=>{
  for(const [field,slug]of Object.entries(collections))for(const [order,doc]of(seed[field]||[]).entries())await insert(slug,doc.id||doc.key,doc,order)
  // Text and image slots carry the page and section they appear in, so editors can filter by page.
  const where=(kind:'copy'|'assets',key:string)=>seed.slots?.[kind]?.[key]??{label:key}
  for(const[key,value]of Object.entries(seed.copy||{}))await insert('content-slots',key,{value,...where('copy',key)})
  for(const[key,value]of Object.entries(seed.assets||{})){const {source:file}=(typeof value==='string'?{source:value}:value) as {source:string};await insert('asset-slots',key,{source:file,...where('assets',key)})}
  for(const[key,value]of Object.entries(seed.components||{})){const {label,enabled,order}=value as {label?:string,enabled?:boolean,order?:number};await insert('component-settings',key,{label,enabled},order??0)}
  for(const[key,value]of Object.entries(seed.stats||{}))await insert('live-stats',key,{...value as object})
  if(refreshLabels){console.log('Refreshing slot labels…');await refreshWhere('content-slots','copy');await refreshWhere('asset-slots','assets')}
  if(refreshFigures){console.log('Refreshing reported figures…');await refreshReportedFigures()}
  if(refreshPhotos){console.log('Refreshing photographs…');await refreshPhotographs()}
  for(const[slug,data]of[['site-settings',seed.site],['pavilion-settings',{settings:seed.pavilion}]] as const){
    const existing=await payload.findGlobal({slug:slug as 'site-settings',overrideAccess:true}) as any
    if(!existing.createdAt&&!existing.updatedAt&&data)await payload.updateGlobal({slug:slug as 'site-settings',overrideAccess:true,data:{...data,_status:'published'}})
    else if(fillMissingSettings&&data){
      const fill=(saved:any,defaults:any):any=>{
        if(saved===undefined||saved===null||(Array.isArray(saved)&&saved.length===0&&Array.isArray(defaults)))return defaults
        if(defaults&&typeof defaults==='object'&&!Array.isArray(defaults)&&saved&&typeof saved==='object'&&!Array.isArray(saved))return {...saved,...Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,fill(saved[key],value)]))}
        return saved
      }
      const merged=fill(existing,data)
      if(JSON.stringify(merged)!==JSON.stringify(existing))await payload.updateGlobal({slug:slug as 'site-settings',overrideAccess:true,data:merged})
    }
  }
  console.log(`CMS seed complete: ${created} created, ${skipped} existing entries preserved${refreshLabels?`, ${relabelled} slot labels refreshed`:''}${refreshFigures||refreshPhotos?`, ${refreshed} reported figures and photographs refreshed`:''}. No user account was created.`)
},async()=>{await payload.destroy()})
