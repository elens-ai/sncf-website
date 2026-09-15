type Doc=Record<string,any>
const slug=(label:string)=>label.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const time=(doc:Doc|undefined)=>Date.parse(doc?.updatedAt||'')||0
/** Overlay only fields changed in an owner's draft, without hiding a newer separately authored figure. */
export function mergePreviewStats(stats:Record<string,Doc>,owners:Doc[],published:Doc[],kind:'activity'|'pillar',statDocs:Doc[]):Record<string,Doc>{
  const baseline=new Map(published.map(doc=>[doc.key,doc]))
  const authoredStats=new Map(statDocs.map(doc=>[doc.key,doc]))
  for(const owner of owners){
    if(owner._status!=='draft')continue
    const before=baseline.get(owner.key)
    const periodChanged=kind==='activity'&&owner.period!==before?.period
    const candidates:{key:string,metric:Doc,previous?:Doc}[]=[]
    if(kind==='activity'){
      if(owner.headline){
        const key=stats[`activity:${owner.key}:headline`]?`activity:${owner.key}:headline`:`activity:${owner.key}:metric:${slug(owner.headline.label)}`
        candidates.push({key,metric:owner.headline,previous:before?.headline})
      }
      for(const metric of owner.dataPoints||[])candidates.push({key:`activity:${owner.key}:metric:${slug(metric.label)}`,metric,previous:before?.dataPoints?.find((item:Doc)=>item.label===metric.label)})
    }else for(const metric of owner.stats||[])candidates.push({key:`pillar:${owner.key}:stat:${slug(metric.label)}`,metric,previous:before?.stats?.find((item:Doc)=>item.label===metric.label)})
    for(const {key,metric,previous}of candidates){
      const valueChanged=metric.value!==previous?.value||metric.label!==previous?.label
      if(!valueChanged&&!periodChanged)continue
      const separate=authoredStats.get(key)
      if(separate&&time(separate)>time(owner))continue
      stats[key]={...stats[key],...(valueChanged?{label:metric.label,value:metric.value}:{}),...(periodChanged?{period:owner.period}:{}),updatedAt:owner.updatedAt}
    }
  }
  return stats
}
