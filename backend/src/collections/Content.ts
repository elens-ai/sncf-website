import { APIError, type CollectionConfig, type Field } from 'payload'
import { contentCollection, text, area, sourceField, mediaField, statFields, imageFields, pillarField } from '../cms/fields'
import { safeColor, validateAnnualDate } from '../cms/validation'
const color=(name:string):Field=>({name,type:'text',validate:safeColor})
export const Pillars=contentCollection('pillars','Pillars',[
  text('label',true),color('accentA'),color('accentB'),text('headline',true),area('body'),text('cardImageAlt'),text('shortTagline'),
  {name:'stats',type:'array',fields:statFields},{name:'keyHighlights',type:'array',fields:[text('text',true)]},area('subText'),
])
export const Activities=contentCollection('activities','Activities & project statistics',[
  pillarField,text('title',true),text('period',true),area('blurb'),{name:'headline',type:'group',fields:statFields},
  {name:'dataPoints',type:'array',fields:statFields},{name:'images',type:'array',fields:imageFields},text('sourceNote'),sourceField('sourceURL'),
])
export const Events=contentCollection('events','Events',[
  text('title',true),{name:'kind',type:'select',required:true,options:['annual','ongoing']},
  {name:'month',type:'number',min:1,max:12},{name:'day',type:'number',min:1,max:31},text('tag'),area('blurb'),pillarField,text('location'),text('time'),sourceField('href'),
])
Events.hooks!.beforeValidate=[({data})=>{if(data){const valid=validateAnnualDate(data);if(valid!==true)throw new APIError(valid,400)}return data}]
export const Partners=contentCollection('partners','Partners',[text('name',true),area('contribution',true),area('note'),sourceField('logo'),mediaField('logoMedia'),sourceField('href')])
export const Awards=contentCollection('awards','Awards',[text('title',true),text('awardedBy',true),text('year',true),area('note'),{name:'featured',type:'checkbox'},{name:'photos',type:'array',fields:imageFields}])
export const GalleryItems=contentCollection('gallery-items','Galleries & pavilion photographs',[
  {name:'group',type:'text',required:true,index:true,admin:{description:'For example pavilion:heal or media:who-we-are. Keep the group to retain its website placement.'}},
  {name:'kind',type:'select',defaultValue:'photo',options:['photo','film','model']},...imageFields,sourceField('poster'),mediaField('posterMedia'),
  {name:'wide',type:'checkbox'},sourceField('source'),{name:'illustrative',type:'checkbox',defaultValue:false},
],'Media & artwork')
export const Pages=contentCollection('pages','Pages & sections',[
  text('slug'),text('title',true),area('description'),
  {name:'sections',type:'blocks',blocks:[
    {slug:'text',labels:{singular:'Text section',plural:'Text sections'},fields:[text('key',true),text('heading'),area('body'),{name:'enabled',type:'checkbox',defaultValue:true}]},
    {slug:'media',labels:{singular:'Media section',plural:'Media sections'},fields:[text('key',true),...imageFields,sourceField('video'),text('heading'),area('body')]},
    {slug:'cards',labels:{singular:'Cards section',plural:'Cards sections'},fields:[text('key',true),text('heading'),{name:'cards',type:'array',fields:[text('title'),area('body'),sourceField('href'),...imageFields]}]},
    {slug:'custom',labels:{singular:'Existing component',plural:'Existing components'},fields:[text('key',true),text('component'),{name:'enabled',type:'checkbox',defaultValue:true},{name:'options',type:'json'}]},
  ]},
])
export const ContentSlots=contentCollection('content-slots','Text & labels',[text('label',true),{name:'value',type:'textarea',required:true},text('context')],'Design & components')
export const AssetSlots=contentCollection('asset-slots','Asset assignments',[text('label',true),sourceField('source'),mediaField(),{name:'kind',type:'select',options:['image','video','audio','model','other']}],'Media & artwork')
export const ComponentSettings=contentCollection('component-settings','Component settings',[text('label'),{name:'enabled',type:'checkbox',defaultValue:true},{name:'options',type:'json',admin:{description:'Component-specific settings. Values are validated by the website before rendering.'}}],'Design & components')
export const contentCollections:CollectionConfig[]=[Pillars,Activities,Events,Partners,Awards,GalleryItems,Pages,ContentSlots,AssetSlots,ComponentSettings]

// Both authoring forms write to the same live figures when a value changes.
import {syncPublishedStats} from '../cms/statSync'
Activities.hooks!.afterChange!.push(syncPublishedStats)
Pillars.hooks!.afterChange!.push(syncPublishedStats)
