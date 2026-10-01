/** Idempotent bootstrap: creates missing entries only; never changes existing authored content. */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import {getPayload,type CollectionSlug} from 'payload'
import config from '../src/payload.config'
import {runCMSCommand} from './run-cms-command'
const fillMissingSettings=process.argv.includes('--fill-missing-settings')
const source=process.argv.slice(2).find(arg=>!arg.startsWith('--'))||process.env.CMS_SEED_FILE||path.resolve('seed/site-content.json')
const seed=JSON.parse(await fs.readFile(source,'utf8'))
const payload=await getPayload({config})
const collections={pillars:'pillars',activities:'activities',events:'events',partners:'partners',awards:'awards',gallery:'gallery-items',pages:'pages'}
let created=0,skipped=0
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
  console.log(`CMS seed complete: ${created} created, ${skipped} existing entries preserved. No user account was created.`)
},async()=>{await payload.destroy()})
