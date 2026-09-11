import { APIError, type Field, type GlobalConfig } from 'payload'
import { isEditor, isLoggedIn } from '../access/roles'
import { invalidateContent } from '../cms/cache'
import { sourceField,text,area } from '../cms/fields'
import {pavilionFields} from '../cms/pavilionFields'
function settingsGlobal(slug:string,label:string,fields:Field[]):GlobalConfig {
  return {slug,label,admin:{group:'Design & components'},access:{read:isLoggedIn,update:isEditor},versions:{drafts:true,max:20},
    hooks:{beforeChange:[({data,req})=>{if(req.user&&!['admin','editor'].includes((req.user as{role?:string}).role||''))throw new APIError('Only editors can change global settings.',403);return data}],afterChange:[({doc})=>{invalidateContent();return doc}]},fields}
}
export const SiteSettings=settingsGlobal('site-settings','Site, navigation & branding',[
  {name:'branding',type:'group',fields:[text('name'),sourceField('logo'),text('tagline')]},
  {name:'contact',type:'group',fields:[text('email'),text('telephone'),area('address')]},
  {name:'seo',type:'group',fields:[text('title'),area('description'),sourceField('image')]},
  {name:'navigation',type:'json',admin:{description:'Header navigation and nested menus, preserving the existing route structure.'}},
  {name:'coreValueGroups',type:'json'},{name:'partnerBrands',type:'json'},
  {name:'options',type:'json',admin:{description:'Additional existing-site settings.'}},
])
export const PavilionSettings=settingsGlobal('pavilion-settings','Pavilion materials, lighting & motion',[
  {name:'settings',type:'group',fields:pavilionFields},
])
