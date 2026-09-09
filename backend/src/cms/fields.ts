import { APIError, type CollectionConfig, type Field, type CollectionBeforeChangeHook } from 'payload'
import { isEditor, isLoggedIn, publishedOrSignedIn } from '../access/roles'
import { invalidateContent } from './cache'
import { safeKey, safeURL } from './validation'
export const keyField:Field={name:'key',type:'text',required:true,unique:true,index:true,validate:safeKey,admin:{description:'Stable website identifier. Keep this unchanged for existing content.'}}
export const orderField:Field={name:'order',type:'number',defaultValue:0,index:true,admin:{position:'sidebar'}}
export const text=(name:string,required=false):Field=>({name,type:'text',required})
export const area=(name:string,required=false):Field=>({name,type:'textarea',required})
export const sourceField=(name='src'):Field=>({name,type:'text',validate:safeURL,admin:{description:'Upload in Media and choose it below, or use a /local/path or https:// URL.'}})
export const mediaField=(name='media'):Field=>({name,type:'upload',relationTo:'media'})
export const statFields:Field[]=[text('label',true),text('value',true)]
export const imageFields:Field[]=[sourceField(),mediaField(),text('alt'),text('caption'),{name:'width',type:'number',min:1},{name:'height',type:'number',min:1},text('focal')]
export const pillarField:Field={name:'pillarId',type:'select',required:true,index:true,options:['heal','enrich','empower','projects']}
export const extraField:Field={name:'record',label:'Additional fields',type:'json',admin:{description:'Advanced extension data; standard fields above take precedence.'}}
export const enforcePublishing:CollectionBeforeChangeHook=({data,req,originalDoc})=>{
  if(req.user && !['admin','editor'].includes((req.user as {role?:string}).role||'')) {
    if(data._status==='published' || (originalDoc?._status==='published' && data._status!=='draft')) throw new APIError('Only an editor or administrator can publish content. Save a draft for review.',403)
    data._status='draft'
  }
  return data
}
export function contentCollection(slug:string,title:string,fields:Field[],group='Website content'):CollectionConfig {
  return {
    slug, labels:{singular:title,plural:title}, admin:{useAsTitle:fields.some(f=>'name'in f&&f.name==='title')?'title':fields.some(f=>'name'in f&&f.name==='label')?'label':'key',group,defaultColumns:['key','_status','updatedAt'],pagination:{defaultLimit:25,limits:[25,50,100]}},
    access:{read:publishedOrSignedIn,create:isLoggedIn,update:isLoggedIn,delete:isEditor},
    versions:{drafts:{autosave:{interval:1500}},maxPerDoc:30},
    hooks:{beforeChange:[enforcePublishing],afterChange:[({doc})=>{invalidateContent();return doc}],afterDelete:[({doc})=>{invalidateContent();return doc}]},
    fields:[keyField,orderField,...fields,extraField],
  }
}
