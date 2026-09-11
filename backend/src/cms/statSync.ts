import type { CollectionAfterChangeHook } from 'payload'
/** Editing a metric in its activity form updates its canonical live figure; unrelated edits do not. */
export const syncPublishedStats:CollectionAfterChangeHook=async({doc,previousDoc,req,collection})=>{
  if(doc._status!=='published'||!previousDoc)return doc
  const slug=(label:string)=>label.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  const updates:{key:string,label:string,value:string,previous?:string}[]=[]
  if(collection.slug==='activities'){
    if(doc.headline){
      updates.push({key:`activity:${doc.key}:headline`,...doc.headline,previous:previousDoc.headline?.value})
      updates.push({key:`activity:${doc.key}:metric:${slug(doc.headline.label)}`,...doc.headline,previous:previousDoc.headline?.value})
    }
    for(const metric of doc.dataPoints||[])updates.push({key:`activity:${doc.key}:metric:${slug(metric.label)}`,...metric,previous:previousDoc.dataPoints?.find((p:any)=>p.label===metric.label)?.value})
  }else for(const metric of doc.stats||[])updates.push({key:`pillar:${doc.key}:stat:${slug(metric.label)}`,...metric,previous:previousDoc.stats?.find((p:any)=>p.label===metric.label)?.value})
  const periodChanged=collection.slug==='activities'&&doc.period!==previousDoc.period
  for(const metric of updates){
    const valueChanged=metric.value!==metric.previous
    if(!valueChanged&&!periodChanged)continue
    const found=await req.payload.find({collection:'live-stats',where:{key:{equals:metric.key}},depth:0,limit:1,overrideAccess:true,req})
    if(found.docs[0])await req.payload.update({collection:'live-stats',id:found.docs[0].id,overrideAccess:true,req,data:{...(valueChanged?{label:metric.label,value:metric.value}:{}),...(periodChanged||valueChanged&&doc.period?{period:doc.period}:{}),_status:'published'}})
  }
  return doc
}
