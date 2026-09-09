const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const script = path.join(__dirname, 'bootstrap.sh');

for (const scenario of ['new', 'existing', 'wrong-oac', 'wrong-origin', 'wrong-target']) test(`bootstrap validates AWS requests (${scenario})`, () => {
  const existing = scenario !== 'new';
  const mismatch = scenario.startsWith('wrong-');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sncf-infra-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'aws'), `#!${process.execPath}
const fs=require('node:fs');
const args=process.argv.slice(2).filter((v,i,a)=>v!=='--profile'&&a[i-1]!=='--profile');
const call=args.slice(0,2).join(' '), old=process.env.MOCK_EXISTING==='true';
const docs=args.filter(x=>x.startsWith('file://')).map(x=>JSON.parse(fs.readFileSync(x.slice(7),'utf8')));
fs.appendFileSync(process.env.MOCK_LOG,JSON.stringify({call,args,docs})+'\\n');
if(['s3api head-bucket','iam get-open-id-connect-provider'].includes(call)) process.exit(old?0:1);
if(call==='iam get-role'&&!args.includes('--query')) process.exit(old?0:1);
const values={'sts get-caller-identity':'025078772718','acm describe-certificate':'ISSUED','cloudfront list-origin-access-controls':old?'OAC-ID':'None','cloudfront create-origin-access-control':'OAC-ID','cloudfront list-distributions':old?'DIST-ID':'None','cloudfront create-distribution':'DIST-ID','cloudfront get-distribution':'example.cloudfront.net','iam get-role':'arn:aws:iam::025078772718:role/sncf-website-deploy'};
if (call==='cloudfront get-distribution-config') {
  const scenario=process.env.MOCK_SCENARIO;
  process.stdout.write(JSON.stringify({DistributionConfig:{
    DefaultCacheBehavior:{TargetOriginId:scenario==='wrong-target'?'other-origin':'site'},
    Origins:{Items:[{Id:'site',DomainName:scenario==='wrong-origin'?'other.s3.amazonaws.com':'sncf-elens-in-site.s3.ap-south-1.amazonaws.com',OriginAccessControlId:scenario==='wrong-oac'?'LEGACY-OAC':'OAC-ID'}]}
  }}));
} else process.stdout.write(values[call]||'{}');
`, { mode: 0o755 });
    const log = path.join(dir, 'calls.jsonl');
    const result = spawnSync('bash', [script], { encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, MOCK_LOG: log, MOCK_EXISTING: String(existing), MOCK_SCENARIO: scenario } });
    assert.equal(result.status, mismatch ? 1 : 0, result.stderr);
    const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
    if (mismatch) {
      assert.match(result.stderr, /does not route its default behavior/);
      assert.ok(!calls.some(call => ['s3api put-bucket-policy', 'route53 change-resource-record-sets', 'iam put-role-policy'].includes(call.call)));
      return;
    }
    const trust = calls.find(c => ['iam update-assume-role-policy','iam create-role'].includes(c.call)).docs[0];
    const subjects = trust.Statement[0].Condition.StringEquals['token.actions.githubusercontent.com:sub'];
    assert.equal(subjects.length, 2);
    assert.ok(subjects.every(s => s.endsWith(':environment:production') && !s.includes('*')));
    const records = calls.filter(c => c.call === 'route53 change-resource-record-sets');
    assert.deepEqual(records.map(c => c.docs[0].Changes[0].ResourceRecordSet.Type), ['A', 'AAAA']);
    const newDistribution = calls.find(c => c.call === 'cloudfront create-distribution');
    assert.equal(Boolean(newDistribution), !existing);
    if (newDistribution) {
      const config = newDistribution.docs[0];
      assert.equal(config.IsIPV6Enabled, true);
      assert.equal(config.DefaultCacheBehavior.ViewerProtocolPolicy, 'redirect-to-https');
      assert.equal(config.Origins.Items[0].OriginAccessControlId, 'OAC-ID');
    }
    assert.equal(calls.filter(c => c.call === 'iam create-open-id-connect-provider').length, existing ? 0 : 1);
    for (const call of calls) for (const arg of call.args) if (arg.startsWith('file://')) assert.equal(fs.existsSync(arg.slice(7)), false, 'temporary policy files must be removed');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
