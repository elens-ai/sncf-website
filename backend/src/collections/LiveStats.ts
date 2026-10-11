import type { CollectionConfig } from 'payload'
import { isAdmin, isEditor } from '../access/roles'
import { contentCollection, text, area, sourceField } from '../cms/fields'
import {invalidateContent} from '../cms/cache'
export const StatAudit:CollectionConfig={
  slug:'stat-audit',labels:{singular:'Statistic change',plural:'Statistics history'},
  admin:{group:'Statistics',useAsTitle:'label',defaultColumns:['label','previousValue','value','actor','createdAt'],description:'Every published change to a live figure: what it was, what it became, and who published it.',
    hidden:({user})=>!['admin','editor'].includes((user as {role?:string}|null)?.role||'')},
  access:{read:isEditor,create:()=>false,update:()=>false,delete:isAdmin},
  fields:[text('key',true,{label:'Statistic ID'}),text('label',false,{label:'Figure'}),text('value',false,{label:'New value'}),text('previousValue',false,{label:'Previous value'}),text('period',false,{label:'Reporting period'}),text('source',false,{label:'Source'}),text('operation',false,{label:'Change'}),{name:'actor',label:'Published by',type:'relationship',relationTo:'users'}],
}
export const LiveStats=contentCollection('live-stats',{
  singular:'Live statistic',plural:'Live statistics',group:'Statistics',title:'label',columns:['label','value','period'],search:['label','key','value'],
  description:'The published figures behind every number on the site. Programme and pillar forms update these automatically; edit here for corrections and sources.',
},[
  {type:'row',fields:[text('label',true,{label:'Figure'}),text('value',true,{label:'Value',description:'Exactly as reported.'})]},
  {type:'row',fields:[text('period',false,{label:'Reporting period'}),text('asOf',false,{label:'As of'})]},
  {type:'row',fields:[text('source',false,{label:'Source'}),sourceField('sourceURL',{label:'Source link',description:'Report or page the figure comes from.'})]},
  {type:'row',fields:[{name:'verifiedAt',label:'Verified on',type:'date'}]},area('notes',false,{label:'Internal notes',description:'Not shown on the website.'}),
])
LiveStats.hooks!.afterChange!.push(async({doc,previousDoc,req,operation})=>{
  invalidateContent(req.payload)
  // The initial import is not an edit: only record figures a person changed, or later updates.
  if(!req.user&&operation==='create')return doc
  if(doc._status==='published' && (previousDoc?._status!=='published'||doc.value!==previousDoc?.value||doc.period!==previousDoc?.period)) {
    await req.payload.create({collection:'stat-audit',overrideAccess:true,req,data:{key:doc.key,label:doc.label,value:doc.value,previousValue:previousDoc?.value??'',period:doc.period,source:doc.source,operation,actor:req.user?.id}})
  }
  return doc
})
