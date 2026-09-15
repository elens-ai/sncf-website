/** Isolated database integration test. Never touches the author's local CMS database/accounts. */
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {randomBytes} from 'node:crypto'
import {createLocalReq,getPayload} from 'payload'
const directory=await mkdtemp(path.join(tmpdir(),'sncf-cms-access-'))
process.env.DATABASE_URI=`file:${path.join(directory,'test.db')}`
process.env.PAYLOAD_SECRET=randomBytes(48).toString('hex')
Object.assign(process.env,{NODE_ENV:'development'})
const {default:config}=await import('../src/payload.config')
const payload=await getPayload({config})
try{
  const password=randomBytes(24).toString('hex')
  const admin=await payload.create({collection:'users',overrideAccess:true,data:{name:'Isolated test administrator',email:'admin@example.invalid',password,role:'admin'}})
  const contributor=await payload.create({collection:'users',overrideAccess:true,data:{name:'Isolated test contributor',email:'contributor@example.invalid',password,role:'contributor'}})
  const authorReq=await createLocalReq({user:{...contributor,collection:'users'}},payload)
  const adminReq=await createLocalReq({user:{...admin,collection:'users'}},payload)
  await payload.create({collection:'content-slots',overrideAccess:false,req:authorReq,draft:true,data:{key:'draft-only',label:'Draft test',value:'Not public',_status:'draft'}})
  const publicRead=await payload.find({collection:'content-slots',overrideAccess:false,where:{key:{equals:'draft-only'}}})
  assert.equal(publicRead.totalDocs,0,'anonymous Local API cannot read draft documents')
  await assert.rejects(payload.create({collection:'content-slots',overrideAccess:false,req:authorReq,data:{key:'forbidden-publish',label:'Test',value:'Blocked',_status:'published'}}),/Only an editor/)
  await assert.rejects(payload.create({collection:'live-stats',overrideAccess:false,data:{key:'anonymous',label:'No',value:'0',_status:'published'}}))
  await payload.create({collection:'live-stats',overrideAccess:false,req:adminReq,data:{key:'activity:health:metric:patients',label:'Patients',value:'10',_status:'published'}})
  const activity=await payload.create({collection:'activities',overrideAccess:false,req:adminReq,data:{key:'health',pillarId:'heal',title:'Health',period:'Verified test',headline:{label:'Patients',value:'10'},dataPoints:[{label:'Patients',value:'10'}],_status:'published'}})
  await payload.update({collection:'activities',id:activity.id,overrideAccess:false,req:adminReq,data:{headline:{label:'Patients',value:'11'},_status:'published'}})
  const stat=await payload.find({collection:'live-stats',where:{key:{equals:'activity:health:metric:patients'}},overrideAccess:true})
  assert.equal(stat.docs[0].value,'11','activity editing updates its canonical live figure')
  await payload.update({collection:'live-stats',id:stat.docs[0].id,overrideAccess:false,req:adminReq,data:{value:'27',_status:'published'}})
  await payload.update({collection:'activities',id:activity.id,overrideAccess:false,req:adminReq,data:{period:'April report',_status:'published'}})
  const periodStat=await payload.findByID({collection:'live-stats',id:stat.docs[0].id,overrideAccess:true})
  assert.equal(periodStat.period,'April report','period-only publication updates the reporting period')
  assert.equal(periodStat.value,'27','period-only publication preserves an externally updated figure')
  await payload.update({collection:'activities',id:activity.id,overrideAccess:false,req:adminReq,draft:true,data:{headline:{label:'Patients',value:'42'},_status:'draft'}})
  const {getSnapshot:previewSnapshot}=await import('../src/cms/snapshot')
  const draftView=await previewSnapshot(payload,{preview:true,req:adminReq})
  assert.equal(draftView.stats['activity:health:metric:patients'].value,'42','draft activity metric is visible in authenticated preview')
  const publicView=await previewSnapshot(payload)
  assert.equal(publicView.stats['activity:health:metric:patients'].value,'27','draft preview never publishes the new figure')
  await payload.update({collection:'live-stats',id:stat.docs[0].id,overrideAccess:false,req:adminReq,draft:true,data:{value:'53',_status:'draft'}})
  const newerStatPreview=await previewSnapshot(payload,{preview:true,req:adminReq})
  assert.equal(newerStatPreview.stats['activity:health:metric:patients'].value,'53','a later separately authored statistic draft wins')
  const audit=await payload.find({collection:'stat-audit',overrideAccess:true})
  assert.ok(audit.totalDocs>=2,'published figure changes have an audit record')
  const settings={_status:'published' as const,branding:{name:'Published brand'}}
  await payload.updateGlobal({slug:'site-settings',overrideAccess:false,req:adminReq,data:settings})
  await assert.rejects(payload.updateGlobal({slug:'site-settings',overrideAccess:false,req:authorReq,data:{branding:{name:'Forbidden'}}}))
  await payload.updateGlobal({slug:'site-settings',overrideAccess:false,req:adminReq,draft:true,data:{branding:{name:'Private draft brand'},_status:'draft'}})
  const {getSnapshot}=await import('../src/cms/snapshot')
  const published=await getSnapshot(payload)
  assert.equal(published.site.branding.name,'Published brand','draft global settings must not replace published branding')
  console.log('CMS database integration passed: drafts stay private, contributors cannot publish, anonymous writes fail, global controls require editors, and live statistic synchronization is audited.')
}finally{await payload.destroy();await rm(directory,{recursive:true,force:true})}
