import type {Field} from 'payload'
import authoring from './pavilion-authoring.json'
import {safeColor,safeURL} from './validation'
/** Each property is a regular CMS input; JSON is retained only for fixed palettes with array order. */
function fields(value:Record<string,unknown>,path=''):Field[]{return Object.entries(value).map(([name,defaultValue]):Field=>{
  if(Array.isArray(defaultValue))return {name,type:'json',defaultValue,admin:{description:name==='chapters'?'Four chapter palettes in Heal, Enrich, Empower, Projects order.':'Colours in the original planter order.'}}
  if(defaultValue&&typeof defaultValue==='object')return {name,type:'group',fields:fields(defaultValue as Record<string,unknown>,`${path}.${name}`)}
  if(typeof defaultValue==='boolean')return {name,type:'checkbox',defaultValue}
  if(typeof defaultValue==='number'){const bounds=(authoring.bounds as Record<string,number[]>)[name];return {name,type:'number',defaultValue,...(bounds?{min:bounds[0],max:bounds[1]}:{})}}
  return {name,type:'text',defaultValue:defaultValue as string,validate:typeof defaultValue==='string'&&defaultValue.startsWith('#')?safeColor:path==='.models'||['texture','video','poster','logo','model'].includes(name)?safeURL:undefined}
})}
export const pavilionFields:Field[]=fields(authoring.defaults)
