import test from 'node:test'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {safeURL,safeColor,validateAnnualDate} from '../src/cms/validation'
import {enforcePublishing} from '../src/cms/fields'
import {cached,invalidateContent} from '../src/cms/cache'
test('one-shot commands finish despite retained handles, flush logs, and preserve failures',()=>{
  const helper=new URL('./run-cms-command.ts',import.meta.url).href
  for(const fail of [false,true]){
    const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
      import {runCMSCommand} from ${JSON.stringify(helper)};
      setInterval(()=>{},10000);
      await runCMSCommand(async()=>{
        await new Promise(resolve=>setTimeout(resolve,10));
        console.log('writes completed');
        if(${fail})throw new Error('test command failure');
      },async()=>{console.log('cleanup completed')});
    `],{encoding:'utf8',timeout:10000})
    assert.equal(result.error,undefined)
    assert.equal(result.status,fail?1:0)
    assert.match(result.stdout,/writes completed/)
    assert.match(result.stdout,/cleanup completed/)
    if(fail)assert.match(result.stderr,/test command failure/)
  }
})
test('reject executable asset URLs while preserving local files and https media',()=>{
  assert.equal(safeURL('/models/amrit.glb'),true);assert.equal(safeURL('https://example.com/lake.mp4'),true)
  for(const unsafe of ['javascript:alert(1)','data:text/html,x','//unknown.test/x','https://name:password@host.test'])assert.notEqual(safeURL(unsafe),true)
  assert.equal(safeColor('#7cba91'),true);assert.notEqual(safeColor('red;background:url(x)'),true)
})
test('annual event validation rejects dates which can never occur',()=>{
  assert.equal(validateAnnualDate({kind:'annual',month:2,day:29}),true)
  assert.notEqual(validateAnnualDate({kind:'annual',month:2,day:30}),true)
  assert.equal(validateAnnualDate({kind:'ongoing'}),true)
})
test('contributors cannot publish or update a published document without a draft',()=>{
  const req={user:{role:'contributor'}}
  assert.throws(()=>enforcePublishing({data:{_status:'published'},req} as any),/Only an editor/)
  assert.throws(()=>enforcePublishing({data:{value:'bad'},originalDoc:{_status:'published'},req} as any),/Only an editor/)
  assert.deepEqual(enforcePublishing({data:{_status:'draft'},originalDoc:{_status:'published'},req} as any),{_status:'draft'})
  assert.deepEqual(enforcePublishing({data:{_status:'published'},req:{user:{role:'editor'}}} as any),{_status:'published'})
})
test('cache shares one loader and invalidates on content changes',async()=>{
  invalidateContent();let calls=0
  const loader=async()=>++calls
  assert.deepEqual(await Promise.all([cached('test',loader),cached('test',loader)]),[1,1])
  assert.equal(await cached('test',loader),1)
  invalidateContent();assert.equal(await cached('test',loader),2)
})

test('draft preview overlays only changed metrics and respects newer separate edits',async()=>{
  const {mergePreviewStats}=await import('../src/cms/previewStats')
  const key='activity:health:metric:patients'
  const base={key:'health',_status:'published',period:'March',headline:{label:'Patients',value:'10'},dataPoints:[],updatedAt:'2026-01-01T00:00:00Z'}
  const draft={...base,_status:'draft',headline:{label:'Patients',value:'11'},updatedAt:'2026-01-03T00:00:00Z'}
  const live={key,label:'Patients',value:'10',period:'March',updatedAt:'2026-01-02T00:00:00Z'}
  assert.equal(mergePreviewStats({[key]:{...live}},[draft],[base],'activity',[live])[key].value,'11')
  const newer={...live,value:'99',updatedAt:'2026-01-04T00:00:00Z'}
  assert.equal(mergePreviewStats({[key]:{...newer}},[draft],[base],'activity',[newer])[key].value,'99')
  const periodDraft={...base,_status:'draft',period:'April',updatedAt:'2026-01-05T00:00:00Z'}
  const result=mergePreviewStats({[key]:{...newer}},[periodDraft],[base],'activity',[newer])[key]
  assert.equal(result.period,'April');assert.equal(result.value,'99')
})
