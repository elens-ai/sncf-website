import type { CollectionConfig } from 'payload'
import { isAdmin, isEditor } from '../access/roles'
import { contentCollection, text, sourceField } from '../cms/fields'
export const StatAudit:CollectionConfig={
  slug:'stat-audit',admin:{group:'Reporting',useAsTitle:'key',defaultColumns:['key','value','operation','createdAt']},
  access:{read:isEditor,create:()=>false,update:()=>false,delete:isAdmin},
  fields:[text('key',true),text('label'),text('value'),text('previousValue'),text('period'),text('source'),text('operation'),{name:'actor',type:'relationship',relationTo:'users'}],
}
export const LiveStats=contentCollection('live-stats','Live statistics',[
  text('label',true),text('value',true),text('period'),text('asOf'),text('source'),sourceField('sourceURL'),
  {name:'verifiedAt',type:'date'},text('notes'),
],'Reporting')
LiveStats.hooks!.afterChange!.push(async({doc,previousDoc,req,operation})=>{
  if(doc._status==='published' && (previousDoc?._status!=='published'||doc.value!==previousDoc?.value||doc.period!==previousDoc?.period)) {
    await req.payload.create({collection:'stat-audit',overrideAccess:true,req,data:{key:doc.key,label:doc.label,value:doc.value,previousValue:previousDoc?.value??'',period:doc.period,source:doc.source,operation,actor:req.user?.id}})
  }
  return doc
})
